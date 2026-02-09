// Domain Types for Battery Analysis

export enum ChemistryType {
  LFP = 'LFP',
  NMC = 'NMC',
  NCA = 'NCA',
  LTO = 'LTO',
  LMO = 'LMO',
  SodiumIon = 'Na_Ion',
  LeadAcid_Flooded = 'Pb_Flooded',
  LeadAcid_VRLA_AGM = 'Pb_AGM',
  LeadAcid_VRLA_Gel = 'Pb_Gel',
  LeadAcid_OPzS = 'Pb_OPzS',
  LeadAcid_OPzV = 'Pb_OPzV',
  NiCd = 'NiCd',
  NiMH = 'NiMH',
  VRF = 'VRF', // Vanadium Redox Flow
  NaS = 'NaS', // Sodium Sulfur
  ZnBr = 'ZnBr', // Zinc Bromine
}

export enum HealthGrade {
  Excellent = 'Excellent', // 90-100
  Good = 'Good', // 75-89
  Warning = 'Warning', // 55-74
  Critical = 'Critical' // < 55
}

export interface ChemistryProfile {
  id: string;
  name: string;
  nominalVoltage: number;
  floatMin: number;
  floatMax: number;
  dischargeEnd: number;
  stdDevLimit: number; // Volts
  allowedImbalance: number; // % or Volts
  tempCoeff: number; // mV/°C per cell
  specificGravityNominal?: number; // e.g. 1.215
  standards: string[];
}

export interface CellInput {
  cellId: string | number;
  voltage: number;
  temperature?: number;
  measuredAh?: number; // Per-cell capacity result
  ratedAh?: number;    // Per-cell rating
  cycleCount?: number;
  impedanceOhms?: number;
  baselineOhms?: number;
  specificGravity?: number; // 1.200 - 1.300 typical for Pb-Acid
}

export type DischargeRate = 'C10' | 'C8' | 'C5' | 'C3' | 'C1' | 'Custom';

export interface AssetMetadata {
  siteId: string;
  assetId: string;
  operator: string;
  date: string;
  chemistryId: string;
  nominalCapacityAh: number; // Bank level nominal
  measuredCapacityAh?: number; // Bank level measured
  dischargeCurrent?: number; // Amps
  testDurationMins?: number; // Minutes
  dischargeRate?: DischargeRate;
}

export interface AnalysisFinding {
  severity: 'Critical' | 'Warning' | 'Info';
  finding: string;
  risk: string;
  recommendationShort: string;
  recommendationLong: string;
  standardRef: string;
  // New Expert Fields
  shortTermActions?: string[];
  longTermActions?: string[];
  precautions?: string[];
  reliabilityImpact?: string;
  globalStandards?: string[]; // E.g. ['IEEE-1188-2005', 'IEC-60896']

}

export interface AnalysisResult {
  id: string;
  assetId: string;
  siteId?: string;
  stringId?: string;
  timestamp: string;
  chemistry: string;
  stats: {
    meanVoltage: number;
    medianVoltage: number;
    minVoltage: number;
    maxVoltage: number;
    deltaV: number;
    stdDev: number;
    zScoreMax: number;
    totalVoltage: number;
    avgCapacityPct?: number;
    
    // SG Stats (if available)
    minSG?: number;
    maxSG?: number;
    avgSG?: number;
    sgSpread?: number;
  };
  cells: (CellInput & { zScore: number; status: 'OK' | 'Warn' | 'Fail' })[];
  healthScore: number; // 0-100
  grade: HealthGrade;
  findings: AnalysisFinding[];
  compliance: {
    standards: string[];
    compliant: boolean;
  };
  // New: For Capacity Discharge Tests
  dischargeCurve?: {
    timeMinutes: number;
    voltage: number;
  }[];
  // New Commercial Fields
  advancedStats?: {
    histogram: { range: string; count: number }[];
    estimatedRUL: number; // Years
    financialRisk?: number; // Value
    currency?: string; // 'USD', 'INR', etc.
    replacementDeadline: string; // ISO Date
  };
  thermal?: ThermalRiskResult;
  impedance?: ImpedanceResult;
  prediction?: RULPrediction;
  forwardPath?: ForwardPath;
}

export interface ForwardPath {
  immediate: string[];
  shortTerm: string[]; // 1-3 months
  longTerm: string[]; // 1 year
  maintenanceScheduleRef: string;
}

export interface ImpedanceInput {
  cellId: string | number;
  impedanceOhms: number;
  baselineOhms?: number;
  measuredAt?: string;
}

export interface ImpedanceResult {
  avgImpedance: number;
  maxImpedance: number;
  minImpedance: number;
  impedanceSpread: number;
  outliers: { cellId: string | number; value: number; percentChange: number }[];
  trend: 'STABLE' | 'INCREASING' | 'CRITICAL';
  healthImpact: number;
  recommendations: string[];
}

export interface ThermalRiskResult {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskScore: number;
  maxTemp: number;
  avgTemp: number;
  tempSpread: number;
  hotspots: { cellId: string | number; temp: number; deviation: number }[];
  recommendations: string[];
  standardRef: string;
}

export interface TrendDataPoint {
  timestamp: string;
  healthScore: number;
  meanVoltage: number;
  deltaV: number;
  stdDev: number;
  capacityPct?: number;
}

export interface TrendAnalysis {
  dataPoints: number;
  timeSpanDays: number;
  healthTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING' | 'CRITICAL_DECLINE';
  healthSlopePerMonth: number;
  voltageTrend: 'STABLE' | 'DECLINING' | 'RISING';
  voltageSlopePerMonth: number;
  imbalanceTrend: 'STABLE' | 'WORSENING' | 'IMPROVING';
  deltaSlopePerMonth: number;
  rSquared: number;
  seasonalityDetected: boolean;
}

export interface RULPrediction {
  estimatedEOL: string;
  remainingMonths: number;
  remainingCycles?: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  confidencePct: number;
  degradationModel: 'LINEAR' | 'EXPONENTIAL' | 'CALENDAR' | 'CYCLE';
  warningDate: string;
  criticalDate: string;
  factors: {
    factor: string;
    impact: 'MAJOR' | 'MODERATE' | 'MINOR';
    description: string;
  }[];
}

export interface CapacityProjection {
  currentCapacityPct: number;
  projectedCapacityPct: number[];
  projectionMonths: number[];
  eolDate: string;
  replacementRecommendedDate: string;
}

export interface ComplianceCheck {
  id: string;
  standard: string;
  category: 'Voltage' | 'Temperature' | 'Capacity' | 'Inspection' | 'Maintenance' | 'Safety';
  description: string;
  status: 'Pass' | 'Fail' | 'Warning' | 'Pending';
  value?: string | number;
  threshold?: string | number;
  lastChecked: string;
}

export interface MaintenanceTask {
  id: string;
  title: string;
  standardRef: string;
  frequency: 'Monthly' | 'Quarterly' | 'Annual';
  lastPerformed: string;
  nextDue: string;
  status: 'Completed' | 'Due' | 'Overdue' | 'Upcoming';
  assignedTo?: string;
}