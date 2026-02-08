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

  // --- 1. Voltage Analysis ---
  
  // Statistical outliers check
  if (deltaV > profile.stdDevLimit * 4) { 
    healthPoints -= 15;
    findings.push({
      severity: 'Warning',
      finding: `Excessive Voltage Spread (Δ ${deltaV.toFixed(3)}V)`,
      risk: 'Severe imbalance indicating weak cells or interconnection issues.',
      recommendationShort: 'Check inter-cell connector torques.',
      recommendationLong: 'Perform detailed impedance test. Equalize if Lead-Acid. Balance if Lithium.',
      standardRef: profile.standards.join(', ')
    });
    complianceStats.compliant = false;
  }

  // --- 2. Individual Cell Analysis (Z-Score & Absolute Limits) ---
  const cellResults = cells.map(cell => {
    // Prevent division by zero if all cells are perfectly balanced
    const zScore = stdDev < 0.0001 ? 0 : (cell.voltage - meanV) / stdDev;
    let status: 'OK' | 'Warn' | 'Fail' = 'OK';
    
    // Critical Low Voltage
    if (cell.voltage < profile.dischargeEnd) {
      status = 'Fail';
      healthPoints -= 5;
      findings.push({
        severity: 'Critical',
        finding: `Cell ${cell.cellId} Deeply Discharged (${cell.voltage.toFixed(2)}V)`,
        risk: 'Irreversible chemical damage (sulfation/plating).',
        recommendationShort: 'Isolate and charge immediately.',
        recommendationLong: 'Perform load test after recharge. Replace if capacity < 80%.',
        standardRef: 'Manufacturer End-of-Discharge Limit'
      });
      complianceStats.compliant = false;
    } 
    // High Voltage (Overcharge)
    else if (cell.voltage > profile.floatMax + 0.1) {
       status = 'Warn';
       healthPoints -= 2;
    }
    // Statistical Deviation
    else if (Math.abs(zScore) > 3.5) {
      status = 'Warn';
      healthPoints -= 2;
      findings.push({
        severity: 'Warning',
        finding: `Cell ${cell.cellId} Statistical Outlier (Z=${zScore.toFixed(1)})`,
        risk: 'Cell behaving divergently from bank average.',
        recommendationShort: 'Monitor during next discharge.',
        recommendationLong: 'Check for high resistance connection.',
        standardRef: 'IEEE 450/1188 Annex'
      });
    }

    return { ...cell, zScore, status };
  });

  // --- 3. Float Voltage Check ---
  // Heuristic: If mean is near float range
  const isFloatRange = meanV > profile.nominalVoltage * 1.02; 
  if (isFloatRange) {
    if (meanV > profile.floatMax) {
      healthPoints -= 10;
      findings.push({
        severity: 'Warning',
        finding: 'High Float Voltage',
        risk: 'Thermal runaway, electrolyte dry-out, grid corrosion.',
        recommendationShort: 'Adjust rectifier settings.',
        recommendationLong: 'Verify voltmeter calibration. Check temp compensation.',
        standardRef: 'IEEE 450 / 1188'
      });
    } else if (meanV < profile.floatMin) {
      healthPoints -= 10;
      findings.push({
        severity: 'Warning',
        finding: 'Low Float Voltage',
        risk: 'Sulfation, self-discharge, capacity loss.',
        recommendationShort: 'Increase float voltage.',
        recommendationLong: 'Check for load currents exceeding charger limits.',
        standardRef: 'IEEE 450 / 1188'
      });
    }
  }

  // --- 4. Capacity Analysis (Global & Per-Cell) ---
  let avgCapacityPct = 0;
  
  // A. Global Bank Capacity
  if (meta.measuredCapacityAh && meta.nominalCapacityAh) {
    const soh = (meta.measuredCapacityAh / meta.nominalCapacityAh) * 100;
    avgCapacityPct = soh;
    if (soh < 80) {
      healthPoints = Math.min(healthPoints, 40); // Force critical
      findings.push({
        severity: 'Critical',
        finding: `Bank Capacity Failure (SOH: ${soh.toFixed(1)}%)`,
        risk: 'End of Life (EOL). System cannot support load for rated duration.',
        recommendationShort: 'Replace Battery Bank.',
        recommendationLong: 'Plan immediate replacement. Test load reduction.',
        standardRef: 'IEEE 450 Rec: Replace < 80%'
      });
      complianceStats.compliant = false;
    } else if (soh < 90) {
      healthPoints -= 20;
      findings.push({
        severity: 'Warning',
        finding: `Capacity Degradation (SOH: ${soh.toFixed(1)}%)`,
        risk: 'Aging detected.',
        recommendationShort: 'Annual capacity testing.',
        recommendationLong: 'Trend future tests to predict EOL.',
        standardRef: 'IEEE 450/1188'
      });
    }
  }

  // B. Per-Cell Capacity Analysis (Weak Cell Detection)
  const capacityCells = cells.filter(c => c.measuredAh !== undefined && c.ratedAh !== undefined);
  if (capacityCells.length > 0) {
     const caps = capacityCells.map(c => (c.measuredAh! / c.ratedAh!) * 100);
     const minCap = Math.min(...caps);
     const avgCap = calculateMean(caps);
     if (avgCapacityPct === 0) avgCapacityPct = avgCap;

     capacityCells.forEach(c => {
       const capPct = (c.measuredAh! / c.ratedAh!) * 100;
       if (capPct < 80) {
         healthPoints = Math.min(healthPoints, 45);
         findings.push({
            severity: 'Critical',
            finding: `Cell ${c.cellId} Capacity Failure (${capPct.toFixed(1)}%)`,
            risk: 'Weakest link limits entire string duration.',
            recommendationShort: 'Replace cell or bypass.',
            recommendationLong: 'If >10% of cells failed, replace entire bank.',
            standardRef: 'IEEE 450/1188'
         });
         complianceStats.compliant = false;
       }
     });

     const capSpread = Math.max(...caps) - minCap;
     if (capSpread > 15) {
       findings.push({
         severity: 'Warning',
         finding: `High Capacity Imbalance (${capSpread.toFixed(1)}%)`,
         risk: 'Uneven aging. Strong cells will overcharge, weak cells over-discharge.',
         recommendationShort: 'Review history.',
         recommendationLong: 'Plan for bank replacement.',
         standardRef: 'IEEE 1188'
       });
     }
  }

  // --- 5. Temperature Deviation ---
  const tempCells = cells.filter(c => c.temperature !== undefined);
  if (tempCells.length > 0) {
    const temps = tempCells.map(c => c.temperature!);
    const meanT = calculateMean(temps);
    tempCells.forEach(c => {
      if (c.temperature! > meanT + 3) {
        healthPoints -= 5;
        findings.push({
          severity: 'Warning',
          finding: `Cell ${c.cellId} Over-temp (+${(c.temperature! - meanT).toFixed(1)}°C)`,
          risk: 'Internal short circuit or high resistance connection.',
          recommendationShort: 'Inspect physical connections.',
          recommendationLong: 'Check torque. IR scan for hotspots.',
          standardRef: 'IEEE 450'
        });
      }
    });
  }

  // --- 6. Thermal Analysis (Commercial Grade) ---
  const thermalCells = cells
    .filter(c => c.temperature !== undefined)
    .map(c => ({ cellId: c.cellId, temperature: c.temperature! }));
  
  const thermalResult = calculateThermalRisk(thermalCells, profile);
  
  if (thermalResult.riskLevel !== 'LOW') {
    healthPoints -= thermalResult.riskScore * 0.5; // Weight thermal risk
    if (thermalResult.riskLevel === 'CRITICAL') {
       healthPoints = Math.min(healthPoints, 40); // Force critical
    }
    thermalResult.recommendations.forEach(rec => {
       findings.push({
          severity: thermalResult.riskLevel === 'CRITICAL' ? 'Critical' : 'Warning',
          finding: `Thermal Issue: ${thermalResult.riskLevel}`,
          risk: 'Thermal runaway or accelerated degradation',
          recommendationShort: 'Check thermal management',
          recommendationLong: rec,
          standardRef: thermalResult.standardRef
       });
    });
  }

  // --- 7. Impedance Analysis (Commercial Grade) ---
  let impedanceResult: ImpedanceResult | undefined;
  
  // Check if any cell has impedance data
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
                finding: 'Impedance Anomaly',
                risk: 'Internal cell degradation',
                recommendationShort: 'Review impedance trend',
                recommendationLong: rec,
                standardRef: 'IEEE 1188'
             });
           }
        });
     }
  }

  // Final Grade Calculation
  healthPoints = Math.max(0, Math.min(100, healthPoints));

  let grade: HealthGrade = HealthGrade.Excellent;
  if (healthPoints < 55) grade = HealthGrade.Critical;
  else if (healthPoints < 75) grade = HealthGrade.Warning;
  else if (healthPoints < 90) grade = HealthGrade.Good;

  // --- 8. Forward Path Generation (IEEE 1188) ---
  const forwardPath: { immediate: string[]; shortTerm: string[]; longTerm: string[]; maintenanceScheduleRef: string } = {
    immediate: [],
    shortTerm: [],
    longTerm: [],
    maintenanceScheduleRef: 'IEEE-1188-2005 Sec 6'
  };

  if (grade === HealthGrade.Critical || thermalResult.riskLevel === 'CRITICAL' || (impedanceResult && impedanceResult.trend === 'CRITICAL')) {
    forwardPath.immediate.push('Isolate affected strings/cells immediately.');
    forwardPath.immediate.push('Schedule replacement of critical cells within 72 hours.');
    forwardPath.shortTerm.push('Perform full capacity test on remaining strings.');
  } 

  if (grade === HealthGrade.Warning || (impedanceResult && impedanceResult.trend === 'INCREASING')) {
     forwardPath.shortTerm.push('Reduce inspection interval to Monthly.');
     forwardPath.shortTerm.push('Plan for bank replacement (Budgetary phase).');
     forwardPath.longTerm.push('Complete system replacement within 12 months.');
  } else {
     forwardPath.shortTerm.push('Continue Quarterly maintenance per IEEE-1188.');
     forwardPath.longTerm.push('Annual Performance Test.');
  }

  // Add findings recommendations to appropriate buckets
  findings.forEach(f => {
    if (f.severity === 'Critical') forwardPath.immediate.push(f.recommendationShort);
    else if (f.severity === 'Warning') forwardPath.shortTerm.push(f.recommendationShort);
  });

  // Deduplicate
  forwardPath.immediate = [...new Set(forwardPath.immediate)];
  forwardPath.shortTerm = [...new Set(forwardPath.shortTerm)];

  return {
    assetId: meta.assetId,
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
      avgCapacityPct
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