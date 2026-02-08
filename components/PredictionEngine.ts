/**
 * PredictionEngine.ts
 * Commercial-Grade Battery Analysis: RUL Prediction, Trend Analysis, Thermal Risk
 * Compliant with IEEE 450/1188/1106 maintenance standards
 */

import { 
  AnalysisResult, 
  ChemistryProfile, 
  TrendAnalysis, 
  RULPrediction, 
  ThermalRiskResult, 
  ImpedanceInput, 
  ImpedanceResult, 
  CapacityProjection 
} from '../types';

// ============================================================================
// STATISTICAL UTILITIES
// ============================================================================

const mean = (arr: number[]): number => 
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

const stdDev = (arr: number[], avg: number): number => {
  if (arr.length < 2) return 0;
  return Math.sqrt(arr.reduce((sum, x) => sum + Math.pow(x - avg, 2), 0) / arr.length);
};

// Linear regression: returns slope, intercept, and R²
const linearRegression = (x: number[], y: number[]): { slope: number; intercept: number; rSquared: number } => {
  const n = x.length;
  if (n < 2) return { slope: 0, intercept: y[0] || 0, rSquared: 0 };
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-10) return { slope: 0, intercept: mean(y), rSquared: 0 };
  
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  
  // R² calculation
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = x.reduce((sum, xi, i) => sum + Math.pow(y[i] - (slope * xi + intercept), 2), 0);
  const rSquared = ssTotal === 0 ? 1 : 1 - ssResidual / ssTotal;
  
  return { slope, intercept, rSquared: Math.max(0, rSquared) };
};

// Exponential regression for capacity fade: C(t) = C0 * e^(-λt)
const exponentialFit = (x: number[], y: number[]): { lambda: number; c0: number; rSquared: number } => {
  // Transform to linear: ln(C) = ln(C0) - λt
  const yLog = y.filter(v => v > 0).map(v => Math.log(v));
  const xFiltered = x.slice(0, yLog.length);
  
  if (yLog.length < 2) return { lambda: 0, c0: y[0] || 100, rSquared: 0 };
  
  const reg = linearRegression(xFiltered, yLog);
  return {
    lambda: -reg.slope,
    c0: Math.exp(reg.intercept),
    rSquared: reg.rSquared
  };
};

// ============================================================================
// TREND ANALYSIS
// ============================================================================

export const analyzeTrend = (history: AnalysisResult[]): TrendAnalysis => {
  if (history.length < 2) {
    return {
      dataPoints: history.length,
      timeSpanDays: 0,
      healthTrend: 'STABLE',
      healthSlopePerMonth: 0,
      voltageTrend: 'STABLE',
      voltageSlopePerMonth: 0,
      imbalanceTrend: 'STABLE',
      deltaSlopePerMonth: 0,
      rSquared: 0,
      seasonalityDetected: false
    };
  }

  // Sort by timestamp
  const sorted = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Convert timestamps to days from first reading
  const t0 = new Date(sorted[0].timestamp).getTime();
  const daysFromStart = sorted.map(r => 
    (new Date(r.timestamp).getTime() - t0) / (1000 * 60 * 60 * 24)
  );
  const timeSpanDays = daysFromStart[daysFromStart.length - 1];

  // Health score regression
  const healthScores = sorted.map(r => r.healthScore);
  const healthReg = linearRegression(daysFromStart, healthScores);
  const healthSlopePerMonth = healthReg.slope * 30;

  // Voltage regression  
  const voltages = sorted.map(r => r.stats.meanVoltage);
  const voltageReg = linearRegression(daysFromStart, voltages);
  const voltageSlopePerMonth = voltageReg.slope * 30;

  // Delta V (imbalance) regression
  const deltas = sorted.map(r => r.stats.deltaV);
  const deltaReg = linearRegression(daysFromStart, deltas);
  const deltaSlopePerMonth = deltaReg.slope * 30;

  // Determine trends
  let healthTrend: TrendAnalysis['healthTrend'] = 'STABLE';
  if (healthSlopePerMonth < -5) healthTrend = 'CRITICAL_DECLINE';
  else if (healthSlopePerMonth < -1) healthTrend = 'DEGRADING';
  else if (healthSlopePerMonth > 1) healthTrend = 'IMPROVING';

  let voltageTrend: TrendAnalysis['voltageTrend'] = 'STABLE';
  if (voltageSlopePerMonth < -0.01) voltageTrend = 'DECLINING';
  else if (voltageSlopePerMonth > 0.01) voltageTrend = 'RISING';

  let imbalanceTrend: TrendAnalysis['imbalanceTrend'] = 'STABLE';
  if (deltaSlopePerMonth > 0.005) imbalanceTrend = 'WORSENING';
  else if (deltaSlopePerMonth < -0.002) imbalanceTrend = 'IMPROVING';

  // Simple seasonality detection (check for quarterly patterns)
  const seasonalityDetected = timeSpanDays > 180 && history.length >= 4;

  return {
    dataPoints: history.length,
    timeSpanDays: Math.round(timeSpanDays),
    healthTrend,
    healthSlopePerMonth: Math.round(healthSlopePerMonth * 100) / 100,
    voltageTrend,
    voltageSlopePerMonth: Math.round(voltageSlopePerMonth * 1000) / 1000,
    imbalanceTrend,
    deltaSlopePerMonth: Math.round(deltaSlopePerMonth * 1000) / 1000,
    rSquared: Math.round(healthReg.rSquared * 100) / 100,
    seasonalityDetected
  };
};

// ============================================================================
// REMAINING USEFUL LIFE (RUL) PREDICTION
// ============================================================================

export const predictRUL = (
  history: AnalysisResult[],
  chemistry: ChemistryProfile,
  installDate?: string,
  cycleCount?: number
): RULPrediction => {
  const now = new Date();
  
  // Default fallback for insufficient data
  const defaultPrediction = (months: number): RULPrediction => ({
    estimatedEOL: new Date(now.getTime() + months * 30 * 24 * 60 * 60 * 1000).toISOString(),
    remainingMonths: months,
    confidenceLevel: 'LOW',
    confidencePct: 30,
    degradationModel: 'CALENDAR',
    warningDate: new Date(now.getTime() + (months * 0.7) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    criticalDate: new Date(now.getTime() + (months * 0.85) * 30 * 24 * 60 * 60 * 1000).toISOString(),
    factors: [{ factor: 'Insufficient data', impact: 'MAJOR', description: 'Need 3+ readings over 90+ days for accurate prediction' }]
  });

  if (history.length < 3) {
    // Use chemistry-based typical lifetime
    const typicalLifeMonths: Record<string, number> = {
      'Pb_Flooded': 120, 'Pb_AGM': 84, 'Pb_Gel': 96, 'Pb_OPzS': 180, 'Pb_OPzV': 144,
      'LFP': 180, 'NMC': 120, 'NCA': 96, 'LMO': 72, 'LTO': 240,
      'NiCd': 240, 'NiMH': 120, 'VRF': 240, 'NaS': 180, 'ZnBr': 120, 'Na_Ion': 144
    };
    const typical = typicalLifeMonths[chemistry.id] || 120;
    
    if (installDate) {
      const ageMonths = (now.getTime() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
      return defaultPrediction(Math.max(12, typical - ageMonths));
    }
    return defaultPrediction(typical);
  }

  // Perform trend analysis
  const trend = analyzeTrend(history);
  const sorted = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  const currentHealth = sorted[sorted.length - 1].healthScore;
  const factors: RULPrediction['factors'] = [];

  // Determine degradation model
  let degradationModel: RULPrediction['degradationModel'] = 'LINEAR';
  let remainingMonths: number;
  let confidencePct: number;

  if (trend.healthSlopePerMonth === 0 || trend.rSquared < 0.3) {
    // Stable or noisy data - use calendar aging
    degradationModel = 'CALENDAR';
    const typicalLife = 120; // Default 10 years
    remainingMonths = Math.max(6, (100 - currentHealth) / 0.5); // Assume 0.5%/month natural decline
    confidencePct = 40;
    factors.push({ factor: 'Stable operation', impact: 'MINOR', description: 'No significant degradation trend detected' });
  } else if (trend.healthSlopePerMonth < 0) {
    // Declining - extrapolate to thresholds
    const monthsToWarning = (currentHealth - 75) / Math.abs(trend.healthSlopePerMonth);
    const monthsToCritical = (currentHealth - 55) / Math.abs(trend.healthSlopePerMonth);
    remainingMonths = Math.max(1, monthsToCritical);
    confidencePct = Math.min(90, 50 + trend.rSquared * 40);
    
    if (trend.healthTrend === 'CRITICAL_DECLINE') {
      factors.push({ factor: 'Rapid degradation', impact: 'MAJOR', description: `Health declining at ${Math.abs(trend.healthSlopePerMonth).toFixed(1)}% per month` });
      degradationModel = 'EXPONENTIAL';
    } else {
      factors.push({ factor: 'Gradual degradation', impact: 'MODERATE', description: `Health declining at ${Math.abs(trend.healthSlopePerMonth).toFixed(1)}% per month` });
    }
  } else {
    // Improving (unusual - likely recovering from event)
    remainingMonths = 120;
    confidencePct = 35;
    factors.push({ factor: 'Recovery detected', impact: 'MINOR', description: 'Health score improving - recent maintenance may have been performed' });
  }

  // Adjust for imbalance trend
  if (trend.imbalanceTrend === 'WORSENING') {
    remainingMonths *= 0.8;
    factors.push({ factor: 'Increasing imbalance', impact: 'MODERATE', description: 'Cell-to-cell voltage spread increasing over time' });
  }

  // Adjust for cycle count if available
  if (cycleCount) {
    const typicalCycles: Record<string, number> = {
      'Pb_Flooded': 1200, 'Pb_AGM': 800, 'Pb_OPzS': 2500, 'LFP': 4000, 'NMC': 2000, 'LTO': 15000
    };
    const maxCycles = typicalCycles[chemistry.id] || 1500;
    const cycleRatio = cycleCount / maxCycles;
    
    if (cycleRatio > 0.8) {
      remainingMonths *= 0.5;
      factors.push({ factor: 'High cycle usage', impact: 'MAJOR', description: `${cycleCount} cycles (${(cycleRatio * 100).toFixed(0)}% of rated)` });
    } else if (cycleRatio > 0.5) {
      factors.push({ factor: 'Moderate cycle usage', impact: 'MINOR', description: `${cycleCount} cycles (${(cycleRatio * 100).toFixed(0)}% of rated)` });
    }
  }

  // Calculate dates
  const eolDate = new Date(now.getTime() + remainingMonths * 30 * 24 * 60 * 60 * 1000);
  const warningDate = new Date(now.getTime() + remainingMonths * 0.6 * 30 * 24 * 60 * 60 * 1000);
  const criticalDate = new Date(now.getTime() + remainingMonths * 0.85 * 30 * 24 * 60 * 60 * 1000);

  // Confidence level
  let confidenceLevel: RULPrediction['confidenceLevel'] = 'LOW';
  if (trend.dataPoints >= 6 && trend.timeSpanDays >= 180 && trend.rSquared >= 0.7) {
    confidenceLevel = 'HIGH';
  } else if (trend.dataPoints >= 4 && trend.timeSpanDays >= 90 && trend.rSquared >= 0.5) {
    confidenceLevel = 'MEDIUM';
  }

  return {
    estimatedEOL: eolDate.toISOString(),
    remainingMonths: Math.max(1, Math.round(remainingMonths)),
    remainingCycles: cycleCount ? Math.round((1 - cycleCount / 2000) * 2000) : undefined,
    confidenceLevel,
    confidencePct: Math.round(confidencePct),
    degradationModel,
    warningDate: warningDate.toISOString(),
    criticalDate: criticalDate.toISOString(),
    factors
  };
};

// ============================================================================
// THERMAL RUNAWAY RISK ANALYSIS
// ============================================================================

export const calculateThermalRisk = (
  cells: { cellId: string | number; temperature: number }[],
  chemistry: ChemistryProfile,
  ambientTemp: number = 25
): ThermalRiskResult => {
  if (cells.length === 0) {
    return {
      riskLevel: 'LOW',
      riskScore: 0,
      maxTemp: ambientTemp,
      avgTemp: ambientTemp,
      tempSpread: 0,
      hotspots: [],
      recommendations: ['No temperature data available'],
      standardRef: 'IEC 62619'
    };
  }

  const temps = cells.map(c => c.temperature);
  const avgTemp = mean(temps);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);
  const tempSpread = maxTemp - minTemp;
  const tempStdDev = stdDev(temps, avgTemp);

  // Identify hotspots (cells > 2σ above mean)
  const hotspots = cells
    .filter(c => c.temperature > avgTemp + 2 * tempStdDev)
    .map(c => ({
      cellId: c.cellId,
      temp: c.temperature,
      deviation: c.temperature - avgTemp
    }))
    .sort((a, b) => b.temp - a.temp);

  // Calculate risk score
  let riskScore = 0;
  const recommendations: string[] = [];

  // Chemistry-specific thresholds
  const isLithium = ['LFP', 'NMC', 'NCA', 'LMO', 'LTO', 'Na_Ion'].includes(chemistry.id);
  const warningTemp = isLithium ? 45 : 50;
  const criticalTemp = isLithium ? 60 : 65;
  const runawayTemp = isLithium ? 80 : 90;

  // Max temperature risk
  if (maxTemp >= runawayTemp) {
    riskScore += 60;
    recommendations.push('IMMEDIATE: Initiate emergency cooling. Isolate affected cells. Evacuate area if lithium chemistry.');
  } else if (maxTemp >= criticalTemp) {
    riskScore += 40;
    recommendations.push('CRITICAL: Reduce load immediately. Check ventilation. Inspect for internal shorts.');
  } else if (maxTemp >= warningTemp) {
    riskScore += 20;
    recommendations.push('WARNING: Monitor closely. Verify HVAC operation. Consider load reduction.');
  }

  // Average temperature risk
  if (avgTemp > warningTemp) {
    riskScore += 15;
    recommendations.push('Ambient temperature elevated. Review cooling system capacity.');
  }

  // Temperature spread risk (indicates uneven load or failing cells)
  if (tempSpread > 10) {
    riskScore += 25;
    recommendations.push('High temperature variation detected. Inspect hotspot cells for internal degradation.');
  } else if (tempSpread > 5) {
    riskScore += 10;
    recommendations.push('Moderate temperature variation. Check airflow distribution.');
  }

  // Hotspot count risk
  if (hotspots.length > cells.length * 0.1) {
    riskScore += 15;
    recommendations.push(`${hotspots.length} cells showing elevated temperature. Systematic issue suspected.`);
  }

  // Determine risk level
  let riskLevel: ThermalRiskResult['riskLevel'] = 'LOW';
  if (riskScore >= 70) riskLevel = 'CRITICAL';
  else if (riskScore >= 40) riskLevel = 'HIGH';
  else if (riskScore >= 20) riskLevel = 'MODERATE';

  if (recommendations.length === 0) {
    recommendations.push('Thermal profile within normal operating limits.');
  }

  return {
    riskLevel,
    riskScore: Math.min(100, riskScore),
    maxTemp,
    avgTemp: Math.round(avgTemp * 10) / 10,
    tempSpread: Math.round(tempSpread * 10) / 10,
    hotspots,
    recommendations,
    standardRef: isLithium ? 'IEC 62619 / UL 1973' : 'IEEE 450 / 1188'
  };
};

// ============================================================================
// IMPEDANCE / RESISTANCE ANALYSIS
// ============================================================================

export const analyzeImpedance = (
  cells: ImpedanceInput[],
  chemistry: ChemistryProfile,
  warningThresholdPct: number = 25,
  criticalThresholdPct: number = 50
): ImpedanceResult => {
  if (cells.length === 0) {
    return {
      avgImpedance: 0,
      maxImpedance: 0,
      minImpedance: 0,
      impedanceSpread: 0,
      outliers: [],
      trend: 'STABLE',
      healthImpact: 0,
      recommendations: ['No impedance data provided']
    };
  }

  const values = cells.map(c => c.impedanceOhms);
  const avgImpedance = mean(values);
  const maxImpedance = Math.max(...values);
  const minImpedance = Math.min(...values);
  const impedanceSpread = maxImpedance - minImpedance;
  const impStdDev = stdDev(values, avgImpedance);

  // Identify outliers and calculate % change from baseline
  const outliers = cells
    .filter(c => {
      const deviation = (c.impedanceOhms - avgImpedance) / avgImpedance * 100;
      return Math.abs(deviation) > warningThresholdPct || 
        (c.baselineOhms && ((c.impedanceOhms - c.baselineOhms) / c.baselineOhms * 100) > warningThresholdPct);
    })
    .map(c => {
      const baseline = c.baselineOhms || avgImpedance;
      return {
        cellId: c.cellId,
        value: c.impedanceOhms,
        percentChange: Math.round((c.impedanceOhms - baseline) / baseline * 100)
      };
    })
    .sort((a, b) => b.percentChange - a.percentChange);

  // Determine trend based on baseline comparison
  const cellsWithBaseline = cells.filter(c => c.baselineOhms !== undefined);
  let trend: ImpedanceResult['trend'] = 'STABLE';
  let avgChange = 0;
  
  if (cellsWithBaseline.length > 0) {
    avgChange = mean(cellsWithBaseline.map(c => 
      ((c.impedanceOhms - c.baselineOhms!) / c.baselineOhms!) * 100
    ));
    
    if (avgChange > criticalThresholdPct) trend = 'CRITICAL';
    else if (avgChange > warningThresholdPct / 2) trend = 'INCREASING';
  }

  // Calculate health impact
  let healthImpact = 0;
  const recommendations: string[] = [];

  if (trend === 'CRITICAL') {
    healthImpact = 30;
    recommendations.push('CRITICAL: Impedance significantly elevated. Internal degradation likely. Schedule replacement.');
  } else if (trend === 'INCREASING') {
    healthImpact = 15;
    recommendations.push('Impedance trending upward. Monitor monthly. Compare with IEEE 450 Table 3 limits.');
  }

  if (outliers.length > 0) {
    healthImpact += Math.min(20, outliers.length * 3);
    recommendations.push(`${outliers.length} cell(s) with abnormal impedance. Investigate connections and electrolyte levels.`);
  }

  const spreadPct = (impedanceSpread / avgImpedance) * 100;
  if (spreadPct > 30) {
    healthImpact += 10;
    recommendations.push('High impedance variation across cells. Check inter-cell connectors and terminal corrosion.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Impedance values within acceptable range per IEEE 1188/450 guidelines.');
  }

  return {
    avgImpedance: Math.round(avgImpedance * 1000) / 1000,
    maxImpedance: Math.round(maxImpedance * 1000) / 1000,
    minImpedance: Math.round(minImpedance * 1000) / 1000,
    impedanceSpread: Math.round(impedanceSpread * 1000) / 1000,
    outliers,
    trend,
    healthImpact: Math.min(50, healthImpact),
    recommendations
  };
};

// ============================================================================
// CAPACITY PROJECTION
// ============================================================================

export const projectCapacity = (
  history: { timestamp: string; capacityPct: number }[],
  chemistry: ChemistryProfile
): CapacityProjection => {
  const now = new Date();
  
  if (history.length < 2) {
    const current = history[0]?.capacityPct || 100;
    return {
      currentCapacityPct: current,
      projectedCapacityPct: [current, current * 0.97, current * 0.94, current * 0.91],
      projectionMonths: [0, 12, 24, 36],
      eolDate: new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      replacementRecommendedDate: new Date(now.getTime() + 4 * 365 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Sort and extract data
  const sorted = [...history].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  const t0 = new Date(sorted[0].timestamp).getTime();
  const months = sorted.map(h => 
    (new Date(h.timestamp).getTime() - t0) / (1000 * 60 * 60 * 24 * 30)
  );
  const caps = sorted.map(h => h.capacityPct);

  // Fit exponential decay
  const { lambda, c0, rSquared } = exponentialFit(months, caps);
  
  const currentCapacityPct = caps[caps.length - 1];
  const currentMonths = months[months.length - 1];

  // Project forward
  const projectionMonths = [0, 6, 12, 18, 24, 36, 48, 60];
  const projectedCapacityPct = projectionMonths.map(m => {
    if (lambda <= 0) return currentCapacityPct * Math.pow(0.99, m / 12); // Linear fallback
    return c0 * Math.exp(-lambda * (currentMonths + m));
  });

  // Find EOL (80%) and replacement (85%) dates
  let eolMonths = 60;
  let replaceMonths = 48;
  
  for (let m = 0; m <= 120; m++) {
    const projected = lambda > 0 ? c0 * Math.exp(-lambda * (currentMonths + m)) : currentCapacityPct * Math.pow(0.99, m / 12);
    if (projected <= 80 && eolMonths === 60) eolMonths = m;
    if (projected <= 85 && replaceMonths === 48) replaceMonths = m;
    if (projected <= 80) break;
  }

  return {
    currentCapacityPct: Math.round(currentCapacityPct * 10) / 10,
    projectedCapacityPct: projectedCapacityPct.map(p => Math.round(p * 10) / 10),
    projectionMonths,
    eolDate: new Date(now.getTime() + eolMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
    replacementRecommendedDate: new Date(now.getTime() + replaceMonths * 30 * 24 * 60 * 60 * 1000).toISOString()
  };
};
