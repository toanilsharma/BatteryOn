import { ChemistryProfile, ChemistryType } from './types';

export const CHEMISTRY_PROFILES: Record<string, ChemistryProfile> = {
  // --- LEAD ACID FAMILY ---
  [ChemistryType.LeadAcid_Flooded]: {
    id: ChemistryType.LeadAcid_Flooded,
    name: 'Lead-Acid (Flooded/Vented)',
    nominalVoltage: 2.0,
    floatMin: 2.15,
    floatMax: 2.25,
    dischargeEnd: 1.75,
    stdDevLimit: 0.05,
    allowedImbalance: 0.10,
    tempCoeff: -3.0,
    standards: ['IEC 60896-11', 'IEEE 450', 'EN 50272']
  },
  [ChemistryType.LeadAcid_VRLA_AGM]: {
    id: ChemistryType.LeadAcid_VRLA_AGM,
    name: 'Lead-Acid (VRLA AGM)',
    nominalVoltage: 2.0,
    floatMin: 2.25,
    floatMax: 2.30,
    dischargeEnd: 1.75,
    stdDevLimit: 0.03, 
    allowedImbalance: 0.08,
    tempCoeff: -3.0,
    standards: ['IEC 60896-21/22', 'IEEE 1188']
  },
  [ChemistryType.LeadAcid_VRLA_Gel]: {
    id: ChemistryType.LeadAcid_VRLA_Gel,
    name: 'Lead-Acid (VRLA Gel)',
    nominalVoltage: 2.0,
    floatMin: 2.25,
    floatMax: 2.30,
    dischargeEnd: 1.80,
    stdDevLimit: 0.04,
    allowedImbalance: 0.08,
    tempCoeff: -3.0,
    standards: ['IEC 60896-21/22', 'IEEE 1188']
  },
  [ChemistryType.LeadAcid_OPzS]: {
    id: ChemistryType.LeadAcid_OPzS,
    name: 'Lead-Acid (OPzS Tubular)',
    nominalVoltage: 2.0,
    floatMin: 2.23,
    floatMax: 2.25,
    dischargeEnd: 1.80,
    stdDevLimit: 0.05,
    allowedImbalance: 0.10,
    tempCoeff: -3.0,
    standards: ['DIN 40736', 'IEC 60896-11']
  },
  [ChemistryType.LeadAcid_OPzV]: {
    id: ChemistryType.LeadAcid_OPzV,
    name: 'Lead-Acid (OPzV Tubular Gel)',
    nominalVoltage: 2.0,
    floatMin: 2.25,
    floatMax: 2.28,
    dischargeEnd: 1.80,
    stdDevLimit: 0.04,
    allowedImbalance: 0.08,
    tempCoeff: -3.0,
    standards: ['DIN 40742', 'IEC 60896-21/22']
  },

  // --- LITHIUM FAMILY ---
  [ChemistryType.LFP]: {
    id: ChemistryType.LFP,
    name: 'Lithium Iron Phosphate (LFP)',
    nominalVoltage: 3.2,
    floatMin: 3.35,
    floatMax: 3.65,
    dischargeEnd: 2.50,
    stdDevLimit: 0.02,
    allowedImbalance: 0.05,
    tempCoeff: 0,
    standards: ['IEC 62619', 'UL 1973', 'UN 38.3']
  },
  [ChemistryType.NMC]: {
    id: ChemistryType.NMC,
    name: 'Lithium NMC',
    nominalVoltage: 3.7,
    floatMin: 4.10,
    floatMax: 4.20,
    dischargeEnd: 3.00,
    stdDevLimit: 0.025,
    allowedImbalance: 0.05,
    tempCoeff: 0,
    standards: ['IEC 62619', 'IEC 62133']
  },
  [ChemistryType.NCA]: {
    id: ChemistryType.NCA,
    name: 'Lithium NCA',
    nominalVoltage: 3.6,
    floatMin: 4.10,
    floatMax: 4.20,
    dischargeEnd: 3.00,
    stdDevLimit: 0.025,
    allowedImbalance: 0.05,
    tempCoeff: 0,
    standards: ['IEC 62619', 'UL 1642']
  },
  [ChemistryType.LMO]: {
    id: ChemistryType.LMO,
    name: 'Lithium Manganese Oxide (LMO)',
    nominalVoltage: 3.8,
    floatMin: 4.15,
    floatMax: 4.25,
    dischargeEnd: 3.00,
    stdDevLimit: 0.03,
    allowedImbalance: 0.05,
    tempCoeff: 0,
    standards: ['IEC 62619']
  },
  [ChemistryType.LTO]: {
    id: ChemistryType.LTO,
    name: 'Lithium Titanate (LTO)',
    nominalVoltage: 2.4,
    floatMin: 2.70,
    floatMax: 2.85,
    dischargeEnd: 1.60,
    stdDevLimit: 0.03,
    allowedImbalance: 0.05,
    tempCoeff: 0,
    standards: ['IEC 62619']
  },
  [ChemistryType.SodiumIon]: {
    id: ChemistryType.SodiumIon,
    name: 'Sodium-Ion',
    nominalVoltage: 3.0,
    floatMin: 3.8,
    floatMax: 4.0,
    dischargeEnd: 1.5,
    stdDevLimit: 0.05,
    allowedImbalance: 0.10,
    tempCoeff: 0,
    standards: ['UL 1973 (Draft)', 'IEC TC21']
  },

  // --- NICKEL FAMILY ---
  [ChemistryType.NiCd]: {
    id: ChemistryType.NiCd,
    name: 'Nickel Cadmium (Industrial)',
    nominalVoltage: 1.2,
    floatMin: 1.40,
    floatMax: 1.45,
    dischargeEnd: 1.00,
    stdDevLimit: 0.06,
    allowedImbalance: 0.15,
    tempCoeff: -2.0,
    standards: ['IEC 60623', 'IEEE 1106']
  },
  [ChemistryType.NiMH]: {
    id: ChemistryType.NiMH,
    name: 'Nickel Metal Hydride',
    nominalVoltage: 1.2,
    floatMin: 1.35,
    floatMax: 1.45,
    dischargeEnd: 1.00,
    stdDevLimit: 0.05,
    allowedImbalance: 0.10,
    tempCoeff: -1.5,
    standards: ['IEC 62133', 'IEC 61951']
  },

  // --- FLOW & HIGH TEMP ---
  [ChemistryType.VRF]: {
    id: ChemistryType.VRF,
    name: 'Vanadium Redox Flow',
    nominalVoltage: 1.35,
    floatMin: 1.4,
    floatMax: 1.6,
    dischargeEnd: 1.15,
    stdDevLimit: 0.10, 
    allowedImbalance: 0.20,
    tempCoeff: 0,
    standards: ['IEC 62932']
  },
  [ChemistryType.NaS]: {
    id: ChemistryType.NaS,
    name: 'Sodium Sulfur',
    nominalVoltage: 2.08,
    floatMin: 2.25, // Effective charge limit
    floatMax: 2.35,
    dischargeEnd: 1.78,
    stdDevLimit: 0.08,
    allowedImbalance: 0.15,
    tempCoeff: 0, // Heated system, internal temp stable
    standards: ['IEC 61427', 'IEEE 1679.1']
  },
  [ChemistryType.ZnBr]: {
    id: ChemistryType.ZnBr,
    name: 'Zinc-Bromine Flow',
    nominalVoltage: 1.82,
    floatMin: 1.9,
    floatMax: 2.0,
    dischargeEnd: 1.2,
    stdDevLimit: 0.15,
    allowedImbalance: 0.25,
    tempCoeff: 0,
    standards: ['IEC 62932']
  }
};

export const STANDARDS_INFO: Record<string, string> = {
  'IEC 60896': 'Stationary Lead-Acid',
  'IEEE 450': 'Flooded Pb Maintenance',
  'IEEE 1188': 'VRLA Maintenance',
  'IEEE 1106': 'Ni-Cd Maintenance',
  'IEC 62619': 'Industrial Lithium Safety',
  'IEC 62932': 'Flow Battery Performance',
  'IEEE 485': 'Lead-Acid Sizing',
};
