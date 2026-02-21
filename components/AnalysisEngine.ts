import { CellInput, AssetMetadata, AnalysisResult, ChemistryProfile, HealthGrade, AnalysisFinding, ImpedanceResult } from '../types';
import { calculateThermalRisk, analyzeImpedance } from './PredictionEngine';

// Statistical helpers
const calculateMean = (values: number[]) => {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const calculateStdDev = (values: number[], mean: number) => {
  if (values.length < 2) return 0;
  return Math.sqrt(values.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / values.length);
};

const calculateMedian = (values: number[]) => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

export const analyzeBattery = (cells: CellInput[], meta: AssetMetadata, profile: ChemistryProfile): AnalysisResult => {
  if (cells.length === 0) {
    throw new Error("No cell data provided for analysis.");
  }

  const voltages = cells.map(c => c.voltage);
  const meanV = calculateMean(voltages);
  const medianV = calculateMedian(voltages);
  const minV = Math.min(...voltages);
  const maxV = Math.max(...voltages);
  const stdDev = calculateStdDev(voltages, meanV);
  const deltaV = maxV - minV;

  // Scoring Factors
  let healthPoints = 100;
  const findings: AnalysisFinding[] = [];
  const complianceStats = { standards: profile.standards, compliant: true };

  // ═══════════════════════════════════════════════════════════
  // 1. VOLTAGE SPREAD ANALYSIS (IEEE 450-2010 Sec 7.4 / IEEE 1188-2005 Sec 6.3)
  // ═══════════════════════════════════════════════════════════

  // IEEE 450-2010, Table 1: Cell-to-cell voltage deviation during float
  // shall not exceed ±0.04V for VRLA or ±0.03V for VLA
  const allowedCellDeviation = profile.id.includes('Pb_AGM') || profile.id.includes('Pb_Gel') ? 0.04 : 0.03;

  if (deltaV > profile.stdDevLimit * 4) {
    healthPoints -= 15;
    findings.push({
      severity: 'Warning',
      finding: `Excessive Voltage Spread (Δ ${deltaV.toFixed(3)}V) — Exceeds IEEE Limit of ±${allowedCellDeviation}V`,
      risk: 'Severe cell imbalance indicating degraded cells, faulty inter-cell connectors, or unequal charge distribution. Can lead to cascading failure during discharge.',
      recommendationShort: 'Immediate inter-cell connector torque verification and equalization charge.',
      recommendationLong: 'Perform detailed impedance/conductance test on all cells. Equalize charge per IEEE 450-2010 Sec 7.2.3 for flooded cells or investigate per IEEE 1188-2005 Sec 6.3.2 for VRLA. Balance if Lithium-Ion per IEC 62619.',
      standardRef: 'IEEE 450-2010 Sec 7.4, Table 1 | IEEE 1188-2005 Sec 6.3 | IEC 60896-11 Sec 16',
      shortTermActions: [
        'Verify inter-cell connector torque values per OEM specification',
        'Perform equalization charge (flooded: 2.33-2.40 VPC for 8-24 hrs)',
        'Re-measure all cell voltages after 24-hour stabilization',
        'Check charger output regulation and ripple current'
      ],
      longTermActions: [
        'Implement monthly voltage monitoring program per IEEE 450 Sec 5.4',
        'Trend individual cell voltages to identify degradation pattern',
        'Plan capacity test within 6 months per IEEE 450 Sec 7.3',
        'Evaluate replacement of deviant cells if spread persists after equalization'
      ],
      precautions: [
        'Do not exceed OEM maximum equalization voltage',
        'Monitor cell temperatures during equalization — abort if >50°C',
        'Ensure adequate ventilation during equalization (hydrogen generation)'
      ],
      reliabilityImpact: 'Voltage imbalance reduces effective battery autonomy by 15-40%. During a power failure, the weakest cell determines string cutoff, resulting in premature load transfer failure.',
      globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEC 60896-11', 'IEC 60896-21', 'IS 1651:2013']
    });
    complianceStats.compliant = false;
  }

  // ═══════════════════════════════════════════════════════════
  // 2. INDIVIDUAL CELL ANALYSIS (Z-Score & Absolute Limits)
  // IEEE 450-2010 Sec 7.4 / IEEE 1188-2005 Sec 6.3.2
  // ═══════════════════════════════════════════════════════════
  const cellResults = cells.map(cell => {
    const zScore = stdDev < 0.0001 ? 0 : (cell.voltage - meanV) / stdDev;
    let status: 'OK' | 'Warn' | 'Fail' = 'OK';

    // Critical Low Voltage — Below discharge end voltage
    // IEEE 450-2010, Sec 7.3.4: End-of-discharge voltage defines cell failure
    if (cell.voltage < profile.dischargeEnd) {
      status = 'Fail';
      healthPoints -= 5;
      findings.push({
        severity: 'Critical',
        finding: `Cell ${cell.cellId} Deeply Discharged at ${cell.voltage.toFixed(3)}V (Limit: ${profile.dischargeEnd}V per OEM/IEEE)`,
        risk: 'Irreversible sulfation (lead-acid) or lithium plating (Li-ion). Cell may have internal short circuit or permanently reduced capacity. Continued use in this state accelerates damage to adjacent cells.',
        recommendationShort: 'Isolate cell immediately. Controlled recharge per OEM procedure.',
        recommendationLong: 'Perform controlled recharge at C/20 rate. After 72-hour stabilization, conduct individual cell capacity test per IEEE 450-2010 Sec 7.3. Replace if measured capacity <80% of rated.',
        standardRef: 'IEEE 450-2010 Sec 7.3.4 | IEEE 1188-2005 Sec 6.4 | IEC 60896-11 Sec 18 | OEM End-of-Discharge Specification',
        shortTermActions: [
          'Disconnect cell from string if voltage < 1.75 VPC',
          'Apply controlled trickle charge at C/20 rate for 24-48 hours',
          'Monitor cell temperature continuously during recovery charge',
          'Test individual cell capacity after voltage recovery'
        ],
        longTermActions: [
          'If capacity <80% rated, schedule cell replacement per IEEE 450-2010 Sec 8',
          'Investigate root cause (charger failure, excessive load, connection fault)',
          'Review UPS/charger alarm settings and transfer thresholds',
          'Document incident for reliability trending'
        ],
        precautions: [
          'Risk of hydrogen evolution during recovery — ensure ventilation per IEC 62485-2',
          'Do not boost-charge deeply discharged VRLA cells — risk of thermal runaway',
          'Wear PPE (acid-resistant gloves, safety glasses) per OSHA 1910.178'
        ],
        reliabilityImpact: 'A single deeply discharged cell can reduce entire string voltage below inverter cutoff. This cell is a single point of failure for the critical power system.',
        globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEC 60896-11', 'IEC 62485-2', 'IS 1651:2013', 'IS 15549']
      });
      complianceStats.compliant = false;
    }
    // High Voltage — Overcharge condition
    // IEEE 1188-2005 Sec 6.2: Float voltage shall not exceed manufacturer limit
    else if (cell.voltage > profile.floatMax + 0.1) {
      status = 'Warn';
      healthPoints -= 2;
      findings.push({
        severity: 'Warning',
        finding: `Cell ${cell.cellId} Overcharged at ${cell.voltage.toFixed(3)}V (Float Max: ${profile.floatMax.toFixed(3)}V)`,
        risk: 'Excessive gassing, electrolyte dry-out, grid corrosion. In VRLA: risk of thermal runaway per IEC 62485-2 Sec 5.3.',
        recommendationShort: 'Verify charger float voltage setting. Check temperature compensation.',
        recommendationLong: 'Calibrate rectifier output per IEEE 1188-2005 Sec 6.2.1. Verify temperature compensation is functioning (-3mV/°C/cell typical). Check for shorted pilot cell causing higher charge to remaining cells.',
        standardRef: 'IEEE 1188-2005 Sec 6.2 | IEEE 450-2010 Sec 7.2 | IEC 60896-21 Sec 14',
        shortTermActions: [
          'Reduce charger float voltage to manufacturer specification',
          'Verify ambient temperature and temperature compensation function',
          'Check for pilot cell failure skewing charger regulation'
        ],
        longTermActions: [
          'Calibrate charger annually per IEEE 1188 recommendations',
          'Install cell-level voltage monitoring for early detection'
        ],
        precautions: [
          'Overcharged VRLA cells can enter thermal runaway — monitor temperature',
          'Excessive gassing in flooded cells — verify ventilation per IEC 62485-2'
        ],
        reliabilityImpact: 'Chronic overcharge reduces battery design life by 30-50% due to accelerated positive grid corrosion.',
        globalStandards: ['IEEE 1188-2005', 'IEEE 450-2010', 'IEC 60896-21', 'IEC 62485-2']
      });
    }
    // Statistical Outlier — Z-Score > 3.5σ
    // IEEE 450-2010 Annex B: Statistical methods for cell evaluation
    else if (Math.abs(zScore) > 3.5) {
      status = 'Warn';
      healthPoints -= 2;
      findings.push({
        severity: 'Warning',
        finding: `Cell ${cell.cellId} Statistical Outlier (Z-Score: ${zScore.toFixed(2)}, |Z| > 3.5σ)`,
        risk: 'Cell behavior deviates significantly from bank average — indicates developing internal fault, high-resistance connection, or early capacity degradation.',
        recommendationShort: 'Perform impedance test on this cell. Check connection resistance.',
        recommendationLong: 'Measure inter-cell connection resistance per IEEE 1188-2005 Sec 6.3.3 (must be <50µΩ). If connection is good, perform individual cell capacity test. Trend this cell voltage monthly.',
        standardRef: 'IEEE 450-2010 Annex B | IEEE 1188-2005 Sec 6.3.2 | IEC 60896-11 Sec 16.3',
        shortTermActions: [
          'Verify inter-cell and terminal connection torque',
          'Perform individual cell impedance/conductance test',
          'Compare impedance to baseline value (per IEEE 1188 trending)'
        ],
        longTermActions: [
          'If impedance >50% above baseline, plan cell replacement per IEEE 1188-2005 Sec 7',
          'Add this cell to enhanced monthly monitoring program'
        ],
        reliabilityImpact: 'Statistical outlier cells are leading indicators of impending failure. Without corrective action, this cell may fail within 6-12 months.',
        globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEC 60896-11']
      });
    }

    return { ...cell, zScore, status };
  });

  // ═══════════════════════════════════════════════════════════
  // 3. FLOAT VOLTAGE ANALYSIS
  // IEEE 450-2010 Sec 7.2 / IEEE 1188-2005 Sec 6.2 / IEC 60896-21 Sec 14
  // ═══════════════════════════════════════════════════════════
  const isFloatRange = meanV > profile.nominalVoltage * 1.02;
  if (isFloatRange) {
    if (meanV > profile.floatMax) {
      healthPoints -= 10;
      findings.push({
        severity: 'Warning',
        finding: `High Float Voltage (${meanV.toFixed(3)} VPC vs Max ${profile.floatMax.toFixed(3)} VPC)`,
        risk: 'Elevated float voltage causes: grid corrosion (reduces life by 50% per 15mV excess per IEC 60896), excessive gassing/water loss, thermal runaway risk in VRLA cells.',
        recommendationShort: 'Reduce charger float voltage to OEM specification immediately.',
        recommendationLong: 'Calibrate rectifier per manufacturer guidelines. Verify temperature compensation sensor is functional and correctly placed (-3 to -4 mV/°C/cell is typical per IEEE 1188-2005 Annex C). Check for single-cell failure pulling charger higher.',
        standardRef: 'IEEE 450-2010 Sec 7.2.1 | IEEE 1188-2005 Sec 6.2 | IEC 60896-21 Sec 14.2 | IS 15549 Sec 8.3',
        shortTermActions: [
          `Adjust charger float voltage to ${profile.floatMin.toFixed(3)}-${profile.floatMax.toFixed(3)} VPC range`,
          'Verify charger temperature compensation is active and calibrated',
          'Check electrolyte levels (flooded cells) — top up with distilled water if low',
          'Record rectifier output voltage, current, and ripple'
        ],
        longTermActions: [
          'Implement semi-annual charger calibration procedure',
          'Install high-voltage alarm on battery monitoring system',
          'Evaluate charger replacement if persistent regulation issues'
        ],
        precautions: [
          'High float voltage increases hydrogen generation rate — verify room ventilation per IEC 62485-2 Sec 5',
          'VRLA thermal runaway risk — install thermal sensors per IEEE 1188 Sec 4.3'
        ],
        reliabilityImpact: 'Per IEC 60896-11 Annex A, every 15mV above recommended float voltage reduces design life by approximately 50%. Current excess may reduce expected 10-year life to 5-7 years.',
        globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEC 60896-21', 'IEC 62485-2', 'IS 15549']
      });
    } else if (meanV < profile.floatMin) {
      healthPoints -= 10;
      findings.push({
        severity: 'Warning',
        finding: `Low Float Voltage (${meanV.toFixed(3)} VPC vs Min ${profile.floatMin.toFixed(3)} VPC)`,
        risk: 'Insufficient float voltage leads to progressive sulfation (lead-acid), self-discharge, and capacity loss. Battery may not reach full charge, reducing available autonomy during power failure.',
        recommendationShort: 'Increase charger float voltage to OEM specification.',
        recommendationLong: 'Verify rectifier is operating within regulation tolerance per IEEE 1188-2005 Sec 6.2.1. Check for voltage drop in DC distribution cables. Inspect charger current-limiting — ensure battery bank is receiving adequate charge current.',
        standardRef: 'IEEE 450-2010 Sec 7.2.2 | IEEE 1188-2005 Sec 6.2 | IEC 60896-11 Sec 16.1 | IS 1651:2013 Sec 12',
        shortTermActions: [
          `Increase float voltage to ${profile.floatMin.toFixed(3)}-${profile.floatMax.toFixed(3)} VPC range`,
          'Perform equalization charge to recover sulfated plates',
          'Verify charger output current capacity vs battery bank size',
          'Check DC distribution cable voltage drop'
        ],
        longTermActions: [
          'Conduct capacity test within 3 months to assess sulfation damage',
          'If capacity <80% after equalization, plan replacement per IEEE 450 Sec 8',
          'Review charger sizing calculation for the battery bank'
        ],
        reliabilityImpact: 'Chronic undercharge at 50mV below float minimum can cause 20-30% capacity loss within 12 months due to sulfation per IEEE 450 Annex C.',
        globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEC 60896-11', 'IS 1651:2013']
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 4. CAPACITY ANALYSIS — IEEE 450-2010 Sec 7.3 / IEC 60896-11 Sec 18
  // ═══════════════════════════════════════════════════════════
  let avgCapacityPct = 0;

  if (meta.dischargeCurrent && meta.testDurationMins && meta.nominalCapacityAh) {
    let dischargeEndVoltage = profile.dischargeEnd;
    if (meta.dischargeRate === 'C10') dischargeEndVoltage = 1.80;
    else if (meta.dischargeRate === 'C8') dischargeEndVoltage = 1.75;
    else if (meta.dischargeRate === 'C5') dischargeEndVoltage = 1.75;
    else if (meta.dischargeRate === 'C3') dischargeEndVoltage = 1.75;
    else if (meta.dischargeRate === 'C1') dischargeEndVoltage = 1.70;

    const measuredAh = (meta.dischargeCurrent * meta.testDurationMins) / 60;
    const soh = (measuredAh / meta.nominalCapacityAh) * 100;
    avgCapacityPct = soh;

    // IEEE 450-2010, Sec 8: "Batteries that show capacity less than 80% of rated shall be replaced"
    if (soh < 80) {
      healthPoints = Math.min(healthPoints, 40);
      findings.push({
        severity: 'Critical',
        finding: `Battery Bank Capacity FAILURE — SOH: ${soh.toFixed(1)}% (IEEE Replacement Threshold: 80%)`,
        risk: 'Battery has reached End of Life (EOL) per IEEE criteria. System cannot support rated load for designed backup duration. Risk of complete system failure during utility outage.',
        recommendationShort: 'REPLACE BATTERY BANK — Per IEEE 450-2010 Section 8.',
        recommendationLong: `Measured capacity: ${measuredAh.toFixed(1)}Ah vs Rated: ${meta.nominalCapacityAh}Ah (${soh.toFixed(1)}% SOH). Per IEEE 450-2010 Section 8: "When the battery capacity drops to 80% of its rated capacity, the battery should be replaced." Begin procurement process immediately. Maintain enhanced monitoring until replacement is complete.`,
        standardRef: 'IEEE 450-2010 Sec 8.1 | IEEE 1188-2005 Sec 7 | IEC 60896-11 Sec 18.3 | IS 1651:2013 Sec 14',
        shortTermActions: [
          'Initiate battery replacement procurement process',
          'Reduce inspection interval to weekly until replacement',
          'Verify backup generator/alternate power source readiness',
          'Notify facility management of reduced battery autonomy',
          'Consider temporary load reduction to extend available backup time'
        ],
        longTermActions: [
          'Complete battery replacement within 90 days maximum',
          'Select replacement batteries per IEEE 485 sizing methodology',
          'Implement battery monitoring system for new installation',
          'Establish baseline impedance readings on new batteries'
        ],
        precautions: [
          'Battery at EOL may exhibit sudden failure without warning',
          'Do not attempt to extend life through equalization on <80% SOH batteries',
          'During replacement, follow arc-flash safety per NFPA 70E'
        ],
        reliabilityImpact: `Critical single point of failure. Current autonomy is reduced to approximately ${(soh / 100 * (meta.testDurationMins / 60)).toFixed(1)} hours vs designed ${(meta.testDurationMins / 60).toFixed(1)} hours.`,
        globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEEE 485', 'IEC 60896-11', 'IS 1651:2013']
      });
      complianceStats.compliant = false;
    } else if (soh < 90) {
      healthPoints -= 20;
      findings.push({
        severity: 'Warning',
        finding: `Capacity Degradation Detected — SOH: ${soh.toFixed(1)}% (Warning: <90%, Critical: <80%)`,
        risk: 'Battery is in accelerated aging phase. Capacity degradation is typically non-linear — rate of decline may increase. Per IEEE 450, annual testing is mandatory below 90%.',
        recommendationShort: 'Increase test frequency to annual. Begin replacement budget planning.',
        recommendationLong: 'Per IEEE 450-2010 Sec 7.3.1, perform capacity test annually when SOH drops below 90%. Trend results to project EOL date. Begin financial planning for replacement. Consider partial string replacement if individual cells show rapid decline.',
        standardRef: 'IEEE 450-2010 Sec 7.3.1 | IEEE 1188-2005 Sec 7 | IEC 60896-11 Sec 18.2',
        shortTermActions: [
          'Schedule next capacity test within 12 months',
          'Perform impedance test to identify weakest cells',
          'Verify charger operation and float voltage settings',
          'Submit capital budget request for battery replacement'
        ],
        longTermActions: [
          'Project EOL date using capacity trend analysis',
          'Plan replacement 6 months before projected 80% SOH date',
          'Evaluate modern battery technologies for replacement (VRLA → Li-ion if applicable)'
        ],
        reliabilityImpact: 'System autonomy is reduced to approximately ' + soh.toFixed(0) + '% of design. If utility outage exceeds ' + ((soh / 100) * (meta.testDurationMins / 60)).toFixed(1) + ' hours, load may be lost.',
        globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEC 60896-11', 'IS 1651:2013']
      });
    }

    // Cell voltage at end of capacity test
    cells.forEach(c => {
      if (c.voltage < dischargeEndVoltage) {
        findings.push({
          severity: 'Critical',
          finding: `Cell ${c.cellId} Failed Capacity Test — ${c.voltage.toFixed(3)}V < ${dischargeEndVoltage.toFixed(2)}V (${meta.dischargeRate || 'Custom Rate'} end-voltage)`,
          risk: 'This cell reached cutoff voltage before rated test duration, limiting the entire string. Per IEEE 450-2010 Sec 7.3.4, any cell below end voltage at test conclusion is considered failed.',
          recommendationShort: 'Replace this cell per IEEE 450-2010 Section 8.',
          recommendationLong: 'Individual cell failure during capacity test indicates internal degradation. Per IEEE 450-2010 Sec 8: Replace cell and re-test string. If >10% of cells fail, replace entire string.',
          standardRef: 'IEEE 450-2010 Sec 7.3.4, Sec 8 | IEC 60896-11 Sec 18.3',
          globalStandards: ['IEEE 450-2010', 'IEC 60896-11', 'IS 1651:2013']
        });
        complianceStats.compliant = false;
      }
    });

  } else if (meta.measuredCapacityAh && meta.nominalCapacityAh) {
    const soh = (meta.measuredCapacityAh / meta.nominalCapacityAh) * 100;
    avgCapacityPct = soh;
  }

  // ═══════════════════════════════════════════════════════════
  // 5. TEMPERATURE ANALYSIS — IEEE 450-2010 Sec 7.4.6 / IEC 60896-21 Sec 14.5
  // ═══════════════════════════════════════════════════════════
  const tempCells = cells.filter(c => c.temperature !== undefined);
  if (tempCells.length > 0) {
    const temps = tempCells.map(c => c.temperature!);
    const meanT = calculateMean(temps);

    // IEEE 450-2010: Battery room temperature should be 20-25°C (68-77°F)
    // IEC 60896: Design life is specified at 20°C. Life halves for every 8-10°C above 20°C
    if (meanT > 35) {
      healthPoints -= 10;
      findings.push({
        severity: 'Warning',
        finding: `Elevated Battery Room Temperature (${meanT.toFixed(1)}°C) — Exceeds IEEE/IEC Limit of 25°C`,
        risk: 'Per IEC 60896 Annex A (Arrhenius equation), battery life halves for every 8-10°C above reference temperature of 20°C. At ' + meanT.toFixed(0) + '°C, estimated life reduction is ' + ((meanT - 20) / 10 * 50).toFixed(0) + '%.',
        recommendationShort: 'Improve HVAC/cooling in battery room. Verify charger temperature compensation.',
        recommendationLong: 'Per IEEE 450-2010 Sec 4.3, maintain battery room temperature between 20-25°C. Install dedicated cooling if ambient cannot be controlled. Verify charger temperature compensation per IEEE 1188 Annex C (-3mV/°C/cell).',
        standardRef: 'IEEE 450-2010 Sec 4.3, 7.4.6 | IEC 60896-11 Annex A | IEC 62485-2 Sec 5.4 | IS 1651 Sec 6.2',
        globalStandards: ['IEEE 450-2010', 'IEC 60896-11', 'IEC 62485-2', 'IS 1651:2013']
      });
    }

    tempCells.forEach(c => {
      if (c.temperature! > meanT + 3) {
        healthPoints -= 5;
        findings.push({
          severity: 'Warning',
          finding: `Cell ${c.cellId} Temperature Anomaly: ${c.temperature!.toFixed(1)}°C (+${(c.temperature! - meanT).toFixed(1)}°C above bank average)`,
          risk: 'Localized heat indicates high-resistance connection, internal short circuit, or cell-level thermal issue. Per IEEE 1188-2005, temperature differential >3°C requires investigation.',
          recommendationShort: 'Inspect physical connections and check for internal short.',
          recommendationLong: 'Per IEEE 1188-2005 Sec 6.3.4: Check inter-cell connector torque, measure connection resistance (must be <50µΩ per IEEE 450 Table 3). Perform infrared thermography scan per IEC 62485-2. If connection is good, perform impedance test on this cell.',
          standardRef: 'IEEE 1188-2005 Sec 6.3.4 | IEEE 450-2010 Sec 7.4.6 | IEC 62485-2 Sec 5.4',
          shortTermActions: [
            'IR thermography scan of the specific cell and connections',
            'Measure inter-cell connection resistance (limit: <50µΩ)',
            'Re-torque connections per OEM specification'
          ],
          longTermActions: [
            'Monitor this cell temperature weekly',
            'If anomaly persists after retorque, replace cell'
          ],
          precautions: [
            'Thermal anomaly in VRLA can precede thermal runaway',
            'Do not open VRLA cells — risk of acid exposure and warranty void'
          ],
          reliabilityImpact: 'Localized hot spots reduce individual cell life and can propagate to adjacent cells through radiant heat.',
          globalStandards: ['IEEE 1188-2005', 'IEEE 450-2010', 'IEC 62485-2']
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 6. THERMAL RISK ANALYSIS — IEC 62485-2 / IEEE 1188-2005
  // ═══════════════════════════════════════════════════════════
  const thermalCells = cells
    .filter(c => c.temperature !== undefined)
    .map(c => ({ cellId: c.cellId, temperature: c.temperature! }));

  const thermalResult = calculateThermalRisk(thermalCells, profile);

  if (thermalResult.riskLevel !== 'LOW') {
    healthPoints -= thermalResult.riskScore * 0.5;
    if (thermalResult.riskLevel === 'CRITICAL') {
      healthPoints = Math.min(healthPoints, 40);
    }
    thermalResult.recommendations.forEach(rec => {
      findings.push({
        severity: thermalResult.riskLevel === 'CRITICAL' ? 'Critical' : 'Warning',
        finding: `Thermal Risk Assessment: ${thermalResult.riskLevel} (Score: ${thermalResult.riskScore}/100)`,
        risk: 'Elevated thermal risk per IEC 62485-2 safety assessment. Risk of thermal runaway (VRLA), accelerated corrosion, and reduced design life.',
        recommendationShort: 'Review thermal management and cooling systems.',
        recommendationLong: rec,
        standardRef: thermalResult.standardRef + ' | IEC 62485-2 Sec 5.3-5.4',
        globalStandards: ['IEEE 1188-2005', 'IEC 62485-2', 'IEC 60896-21']
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 7. IMPEDANCE/RESISTANCE ANALYSIS
  // IEEE 1188-2005 Sec 6.3.2 | IEC 60896-21 Sec 14.4
  // ═══════════════════════════════════════════════════════════
  let impedanceResult: ImpedanceResult | undefined;
  const hasImpedance = cells.some(c => c.impedanceOhms !== undefined);

  if (hasImpedance) {
    const impCells = cells.map(c => ({
      cellId: c.cellId,
      impedanceOhms: c.impedanceOhms || 0,
      baselineOhms: c.baselineOhms
    }));
    impedanceResult = analyzeImpedance(impCells, profile);

    if (impedanceResult.healthImpact > 0) {
      healthPoints -= impedanceResult.healthImpact;
      impedanceResult.recommendations.forEach(rec => {
        if (!rec.includes('within acceptable range')) {
          findings.push({
            severity: impedanceResult!.trend === 'CRITICAL' ? 'Critical' : 'Warning',
            finding: `Internal Resistance/Impedance Anomaly Detected (Trend: ${impedanceResult!.trend})`,
            risk: 'Internal impedance increase per IEEE 1188-2005 Sec 6.3.2: >20% increase from baseline requires investigation, >50% increase from baseline requires cell replacement. Impedance spread >20% indicates cell mismatch.',
            recommendationShort: 'Compare impedance to baseline values. Plan replacement if >50% increase.',
            recommendationLong: rec + ' Per IEEE 1188-2005 Sec 6.3.2, the impedance/conductance test is the primary predictive tool for VRLA battery health. Cells showing >50% increase from baseline have reached end of useful life.',
            standardRef: 'IEEE 1188-2005 Sec 6.3.2 | IEEE 450-2010 Sec 7.5 | IEC 60896-21 Sec 14.4',
            shortTermActions: [
              'Record baseline impedance values if not already established',
              'Identify cells with impedance >20% above baseline — flag for monitoring',
              'Identify cells with impedance >50% above baseline — schedule replacement',
              'Check inter-cell connection resistance (confounding factor)'
            ],
            longTermActions: [
              'Implement quarterly impedance trending per IEEE 1188-2005',
              'Maintain impedance database for predictive analysis',
              'Replace individual cells showing >50% impedance increase per IEEE 1188 Sec 7'
            ],
            precautions: [
              'Impedance readings are temperature-dependent — normalize to 25°C',
              'Ensure measurement equipment calibration is current'
            ],
            reliabilityImpact: 'Cells with elevated impedance deliver reduced power during high-rate discharge. String capacity is limited by the highest-impedance cell.',
            globalStandards: ['IEEE 1188-2005', 'IEEE 450-2010', 'IEC 60896-21', 'IS 15549']
          });
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 7.5 SPECIFIC GRAVITY ANALYSIS — IEEE 450-2010 Sec 7.4.3 / IS 1651
  // ═══════════════════════════════════════════════════════════
  const sgCells = cells.filter(c => c.specificGravity !== undefined);
  let sgStats = undefined;

  if (sgCells.length > 0 && profile.specificGravityNominal) {
    const sgs = sgCells.map(c => c.specificGravity!);
    const meanSG = calculateMean(sgs);
    const minSG = Math.min(...sgs);
    const maxSG = Math.max(...sgs);
    const sgSpread = maxSG - minSG;

    sgStats = { minSG, maxSG, avgSG: meanSG, sgSpread };

    // IEEE 450-2010, Sec 7.4.3: SG should be within ±0.010 of manufacturer nominal
    if (meanSG < profile.specificGravityNominal - 0.010) {
      healthPoints -= 10;
      findings.push({
        severity: 'Warning',
        finding: `Low Electrolyte Specific Gravity (Average: ${meanSG.toFixed(3)} vs Nominal: ${profile.specificGravityNominal.toFixed(3)})`,
        risk: 'Low SG indicates chronic undercharging and sulfation per IEEE 450-2010 Sec 7.4.3. Capacity may be significantly reduced.',
        recommendationShort: 'Perform equalization charge per IEEE 450-2010 Sec 7.2.3.',
        recommendationLong: 'Per IEEE 450, maintain SG within ±0.010 of nominal. Equalize at 2.33-2.40 VPC for 8-24 hours. After equalization, allow 72-hour stabilization and re-measure. If SG does not recover, sulfation damage may be permanent.',
        standardRef: 'IEEE 450-2010 Sec 7.4.3 | IS 1651:2013 Table 2 | IEC 60896-11 Sec 16.2',
        globalStandards: ['IEEE 450-2010', 'IS 1651:2013', 'IEC 60896-11']
      });
    }

    // IEEE 450: Cell-to-cell SG spread should not exceed 0.020
    if (sgSpread > 0.020) {
      healthPoints -= 15;
      findings.push({
        severity: 'Warning',
        finding: `High Specific Gravity Spread (${sgSpread.toFixed(3)} — IEEE Limit: 0.020)`,
        risk: 'Acid stratification or individual cell degradation per IEEE 450-2010 Sec 7.4.3. Cells with low SG will limit string capacity.',
        recommendationShort: 'Equalize charge and verify water levels per IS 1651.',
        recommendationLong: 'Per IEEE 450-2010, cell-to-cell SG deviation >0.020 indicates non-uniform aging. Equalize, top up electrolyte with distilled water per IS 1651:2013, and re-measure after 72 hours. Cells that do not recover should be capacity-tested individually.',
        standardRef: 'IEEE 450-2010 Sec 7.4.3 | IS 1651:2013 Sec 12 | IEC 60896-11 Sec 16.2',
        globalStandards: ['IEEE 450-2010', 'IS 1651:2013', 'IEC 60896-11']
      });
    }

    sgCells.forEach(c => {
      if (c.specificGravity! < meanSG - 0.015) {
        findings.push({
          severity: 'Warning',
          finding: `Cell ${c.cellId} Low Specific Gravity (${c.specificGravity!.toFixed(3)} — ${(meanSG - c.specificGravity!).toFixed(3)} below average)`,
          risk: 'Local sulfation, internal short circuit, or electrolyte loss per IEEE 450-2010 Sec 7.4.3.',
          recommendationShort: 'Boost charge and inspect cell for physical damage.',
          recommendationLong: 'Per IS 1651:2013 Table 2, verify electrolyte level and top up if needed. Equalize charge. If SG does not recover, this cell has permanent sulfation damage and should be replaced per IEEE 450 Sec 8.',
          standardRef: 'IEEE 450-2010 Sec 7.4.3 | IS 1651:2013 Table 2 | IEC 60896-11',
          globalStandards: ['IEEE 450-2010', 'IS 1651:2013', 'IEC 60896-11']
        });
      }
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 8. COMPLIANCE SUMMARY — Add if everything is OK
  // ═══════════════════════════════════════════════════════════
  if (findings.length === 0) {
    findings.push({
      severity: 'Info',
      finding: 'All Parameters Within Acceptable Limits',
      risk: 'No immediate concerns identified. Battery bank is operating within manufacturer and industry standard limits.',
      recommendationShort: 'Continue standard maintenance schedule per IEEE 450/1188.',
      recommendationLong: 'Per IEEE 450-2010 Sec 5.4 and IEEE 1188-2005 Sec 5.3, maintain quarterly inspection schedule including: float voltage verification, visual inspection, temperature check, connection resistance (annually), impedance test (annually), capacity test (every 1-3 years based on age).',
      standardRef: 'IEEE 450-2010 Sec 5.4 | IEEE 1188-2005 Sec 5.3 | IEC 60896 | IS 1651',
      shortTermActions: [
        'Continue quarterly visual inspection and float voltage check',
        'Record all measurements for trending analysis'
      ],
      longTermActions: [
        'Perform capacity test per IEEE 450-2010 schedule (annually after year 5)',
        'Maintain impedance baseline database for predictive maintenance'
      ],
      reliabilityImpact: 'Battery system is operating as designed. Expected reliability is consistent with manufacturer warranty.',
      globalStandards: ['IEEE 450-2010', 'IEEE 1188-2005', 'IEC 60896-11', 'IEC 60896-21', 'IS 1651:2013']
    });
  }

  // Final Grade Calculation
  healthPoints = Math.max(0, Math.min(100, healthPoints));

  let grade: HealthGrade = HealthGrade.Excellent;
  if (healthPoints < 55) grade = HealthGrade.Critical;
  else if (healthPoints < 75) grade = HealthGrade.Warning;
  else if (healthPoints < 90) grade = HealthGrade.Good;

  // ═══════════════════════════════════════════════════════════
  // 9. FORWARD PATH — IEEE 1188-2005 Sec 6 / IEEE 450-2010 Sec 5
  // ═══════════════════════════════════════════════════════════
  const forwardPath: { immediate: string[]; shortTerm: string[]; longTerm: string[]; maintenanceScheduleRef: string } = {
    immediate: [],
    shortTerm: [],
    longTerm: [],
    maintenanceScheduleRef: 'IEEE 1188-2005 Sec 6 | IEEE 450-2010 Sec 5 | IEC 60896-11 Sec 16'
  };

  if (grade === HealthGrade.Critical || thermalResult.riskLevel === 'CRITICAL' || (impedanceResult && impedanceResult.trend === 'CRITICAL')) {
    forwardPath.immediate.push('CRITICAL: Isolate affected strings/cells immediately per IEEE 450 Sec 8.');
    forwardPath.immediate.push('Schedule replacement of critical cells within 72 hours.');
    forwardPath.immediate.push('Notify facility management of reduced battery reliability.');
    forwardPath.immediate.push('Verify backup generator readiness as alternate power source.');
    forwardPath.shortTerm.push('Perform full capacity test on remaining strings per IEEE 450 Sec 7.3.');
    forwardPath.shortTerm.push('Complete replacement procurement within 30 days.');
  }

  if (grade === HealthGrade.Warning || (impedanceResult && impedanceResult.trend === 'INCREASING')) {
    forwardPath.shortTerm.push('Reduce inspection interval to Monthly per IEEE 450-2010 Sec 5.4.');
    forwardPath.shortTerm.push('Perform impedance/conductance test per IEEE 1188-2005 Sec 6.3.2.');
    forwardPath.shortTerm.push('Submit capital budget request for bank replacement.');
    forwardPath.longTerm.push('Complete system replacement within 12-18 months.');
    forwardPath.longTerm.push('Evaluate modern battery technologies (Li-Ion ESS per IEC 62619 if applicable).');
  } else if (grade === HealthGrade.Excellent || grade === HealthGrade.Good) {
    forwardPath.shortTerm.push('Continue Quarterly maintenance per IEEE 1188-2005 / IEEE 450-2010.');
    forwardPath.shortTerm.push('Record all measurements for trend analysis database.');
    forwardPath.longTerm.push('Annual Performance Test per IEEE 450-2010 Sec 7.3.');
    forwardPath.longTerm.push('5-Year comprehensive capacity test per IEC 60896-11 Sec 18.');
  }

  // Add findings recommendations
  findings.forEach(f => {
    if (f.severity === 'Critical') forwardPath.immediate.push(f.recommendationShort);
    else if (f.severity === 'Warning') forwardPath.shortTerm.push(f.recommendationShort);
  });

  // Deduplicate
  forwardPath.immediate = [...new Set(forwardPath.immediate)];
  forwardPath.shortTerm = [...new Set(forwardPath.shortTerm)];
  forwardPath.longTerm = [...new Set(forwardPath.longTerm)];

  return {
    id: meta.assetId + '-' + new Date().getTime(),
    assetId: meta.assetId,
    siteId: meta.siteId,
    timestamp: new Date().toISOString(),
    chemistry: profile.name,
    stats: {
      meanVoltage: meanV,
      medianVoltage: medianV,
      minVoltage: minV,
      maxVoltage: maxV,
      deltaV,
      stdDev,
      zScoreMax: cellResults.length > 0 ? Math.max(...cellResults.map(c => Math.abs(c.zScore))) : 0,
      totalVoltage: cells.reduce((sum, c) => sum + c.voltage, 0),
      avgCapacityPct,
      ...sgStats
    },
    cells: cellResults,
    healthScore: Math.floor(healthPoints),
    grade,
    findings,
    compliance: complianceStats,
    thermal: thermalResult,
    impedance: impedanceResult,
    forwardPath
  };
};