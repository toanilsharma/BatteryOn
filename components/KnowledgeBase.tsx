import React, { useState } from 'react';
import { BookOpen, AlertTriangle, ExternalLink, Battery, ChevronRight, ArrowLeft, CheckCircle2, ShieldAlert, History, Award, Wrench } from 'lucide-react';

type ViewMode = 'HUB' | 'VRLA' | 'VLA' | 'NICD' | 'LIION' | 'FLOW' | 'SODIUM';

// Content Database
// Expert Content Database
interface TechDetail {
  title: string;
  desc: string;
  image: string; // Synced with local assets
  color: string;
  history: string;
  bestPractices: string[];
  standards: { code: string; title: string, link?: string }[];
  maintenance: { title: string; interval: string; procedures: string[]; skillLevel: 'Entry' | 'Expert' }[];
  safety: { hazard: string; riskLevel: 'Critical' | 'High' | 'Moderate'; mitigation: string }[];
  training: string[]; // Required certifications/skills
  precautions: string[]; // Operational Do's and Don'ts
}

const TECH_DETAILS: Record<string, TechDetail> = {
  'VRLA': {
    title: 'Valve-Regulated Lead-Acid (VRLA)',
    desc: 'Maintenance-free, sealed lead-acid batteries optimized for UPS, Telecom, and Data Centers.',
    image: '/assets/images/tech-vrla.jpg',
    color: 'blue',
    history: 'Developed in the 1970s, VRLA technology utilizes an "Oxygen Recombination Cycle" (~99% efficiency) to minimize water loss. A glass mat (AGM) or silica gel immobilizes the electrolyte, allowing installation in any orientation (except inverted) and removing the need for diverse spill containment systems. It revolutionized the IT industry by allowing batteries to sit directly next to servers.',
    bestPractices: [
      'Thermal Management: Arrhenius Law applies - every 10°C (18°F) rise above 25°C cuts battery life in half.',
      'Float Voltage Precision: Must be maintained at 2.25-2.27 Vpc (±1%). Higher leads to dry-out (thermal runaway risk); lower leads to sulfation.',
      'Ripple Current Limit: AC ripple must be <0.5% RMS (C/20) to prevent internal heating.',
      'Torque Verification: High-resistance connections are the #1 cause of thermal events. Re-torque annually.'
    ],
    standards: [
      { code: 'IEEE 1188-2005', title: 'Recommended Practice for Maintenance, Testing, and Replacement of VRLA Batteries' },
      { code: 'IEEE 1187-2013', title: 'Guide for Installation Design of VRLA Batteries' },
      { code: 'IEC 60896-21/22', title: 'Stationary Lead-Acid Batteries - Valve Regulated Types' }
    ],
    maintenance: [
      {
        title: 'Monthly Operational Checks',
        interval: 'Monthly',
        skillLevel: 'Entry',
        procedures: [
            'Measure float voltage at battery terminals (Bank Level).', 
            'Verify charger output current/voltage stability.', 
            'Visual inspection for container swelling, cracks, or leakage.', 
            'Measure ambient and pilot cell negative-post temperatures.'
        ]
      },
      {
        title: 'Quarterly Diagnostic Inspection',
        interval: 'Quarterly',
        skillLevel: 'Expert',
        procedures: [
            'Measure individual block/cell voltages.', 
            'Measure internal Ohmic values (Impedance/Conductance/Resistance).', 
            'Analyze trend of internal resistance (increase >30% from baseline = Warning).',
            'Check ripple current and ripple voltage.'
        ]
      },
      {
        title: 'Annual Comprehensive Maintenance',
        interval: 'Yearly',
        skillLevel: 'Expert',
        procedures: [
            'Re-torque all inter-cell and inter-tier connections to OEM spec.', 
            'Perform thermographic (IR) scan of all connections under load.', 
            'Clean accessible surfaces/terminals to prevent tracking paths.',
            'Perform capacity discharge test (if due per IEEE 1188 guidance).'
        ]
      }
    ],
    safety: [
      { hazard: 'Thermal Runaway', riskLevel: 'Critical', mitigation: 'Install temperature-compensated charging. Ensure charger has "high temp cutoff" logic.' },
      { hazard: 'Hydrogen Off-gassing', riskLevel: 'High', mitigation: 'Ensure room ventilation allows 2 air changes/hour. Vents open only at pressure (3-5 psi).' },
      { hazard: 'Arc Flash / Shock', riskLevel: 'Critical', mitigation: 'DC strings are always live. Use Class 0/00 insulated gloves and tools (ASTM F1505).' }
    ],
    training: [
        'IEEE 1657: Personnel Qualifications for Installation and Maintenance of Stationary Batteries',
        'NFPA 70E: Standard for Electrical Safety in the Workplace',
        'HazMat Awareness: Handling of lead and sulfuric acid.'
    ],
    precautions: [
        'DO NOT use "Boost" or "Equalize" modes on aged VRLA batteries (Thermal Runaway risk).',
        'DO NOT mix batteries of different ages, manufacturers, or capacities in the same string.',
        'ALWAYS neutralize spills with baking soda (Sodium Bicarbonate).'
    ]
  },
  'VLA': {
    title: 'Vented Lead-Acid (VLA / Flooded)',
    desc: 'Traditional liquid electrolyte batteries offering maximum reliability (20+ years) for Utilities and Industrial Plants.',
    image: '/assets/images/tech-vla.jpg',
    color: 'cyan',
    history: 'Invented by Gaston Planté in 1859, this is the most mature battery technology. "Flooded" refers to the liquid sulfuric acid electrolyte comprising ~35% of volume. Their clear jars allow visual inspection of internal components (plates, sediment, electrolyte), making them the "Gold Standard" for high-stakes reliability in substations and nuclear plants.',
    bestPractices: [
      'Electrolyte Level: Maintain between High/Low level lines. Plates must NEVER be exposed to air (rapid oxidization).',
      'Specific Gravity (SG): The only true measure of State of Charge. Reference is 1.215 at 25°C.',
      'Equalization: Periodic freshening charges (2.33-2.40 Vpc) are required to mix electrolyte and reverse stratification.',
      'Visual Inspection: Monitor color of positive plates (Dark Brown = Healthy; Light Gray = Sulfated).'
    ],
    standards: [
      { code: 'IEEE 450-2020', title: 'Maintenance, Testing, and Replacement of Vented Lead-Acid Batteries' },
      { code: 'IEEE 484-2019', title: 'Installation Design and Implementation of VLA Batteries' },
      { code: 'OSHA 1910.178(g)', title: 'Battery Charging and Changing Operations' }
    ],
    maintenance: [
      {
        title: 'Monthly Visual & Voltage',
        interval: 'Monthly',
        skillLevel: 'Entry',
        procedures: [
            'Check electrolyte levels in all jars.', 
            'Measure pilot cell voltages and specific gravity.', 
            'Verify float voltage and charger ground-fault status.',
            'Inspect jars for cracks or acid creepage at posts.'
        ]
      },
      {
        title: 'Quarterly Detailed',
        interval: 'Quarterly',
        skillLevel: 'Expert',
        procedures: [
            'Measure specific gravity of 10% of cells.', 
            'Measure voltage of all cells.', 
            'Measure electrolyte temperature.',
            'Correct all SG readings for temperature (±1 point per 3°F).'
        ]
      },
      {
        title: 'Annual Major Maintenance',
        interval: 'Yearly',
        skillLevel: 'Expert',
        procedures: [
            'Detailed visual of plate growth and sediment levels.', 
            'Measure specific gravity of ALL cells.', 
            'Perform connection resistance tests (Micro-ohm).',
            'Neutralize and clean battery rack/stand.'
        ]
      }
    ],
    safety: [
      { hazard: 'Acid Splash/Burns', riskLevel: 'High', mitigation: 'Full PPE required: Acid-resistant apron, face shield, goggles, and gloves.' },
      { hazard: 'Hydrogen Explosion', riskLevel: 'Critical', mitigation: 'Strict ventilation (1% max H2 conc). No spark/flame sources. Explosion-proof fans.' },
      { hazard: 'Exposed Live Parts', riskLevel: 'High', mitigation: 'Most VLA racks have exposed buswork. Maintain MAD (Minimum Approach Distance).' }
    ],
    training: [
        'Acid Handling & Spill Response (OSHA)',
        'Hydrometer Reading & Correction Techniques',
        'Substation Entry / Electrical Safety Qualified'
    ],
    precautions: [
        'ONLY add Distilled or Deionized water. Tap water poisons the cell (Iron/Chlorine).',
        'Water AFTER charging, never before (unless plates are dry), to prevent overflow during expansion.',
        'Use only insulated tools. Dropping a wrench across exposed busbars causes Arc Flash.'
    ]
  },
  'LIION': {
    title: 'Lithium-Ion (Li-Ion / LFP / NMC)',
    desc: 'The modern standard for Energy Storage Systems (ESS) and Hyperscale Data Centers. High Energy Density.',
    image: '/assets/images/tech-liion.jpg',
    color: 'green',
    history: 'Commercialized in 1991. For stationary storage, Lithium Iron Phosphate (LFP) is preferred for safety/life, while Nickel Manganese Cobalt (NMC) is used where density is key. Unlike Lead-Acid, Li-Ion is a system, not just a battery—reliant on a BMS (Battery Management System) for safety, balancing, and operation.',
    bestPractices: [
      'BMS Integrity: The BMS is the safety gatekeeper. Never bypass it. Ensure heartbeat/comms are active.',
      'Temperature Control: Optimal 15-25°C. Degradation accelerates non-linearly >30°C. Low temp charging causes Lithium Plating (dendrites).',
      'State of Charge (SoC): Avoid sitting at 100% SoC for long periods. 50-80% is optimal for standby life.',
      'C-Rate Management: Discharge rates >1C generate significant heat. Ensure cooling system scales with load.'
    ],
    standards: [
      { code: 'NFPA 855', title: 'Standard for the Installation of Stationary Energy Storage Systems' },
      { code: 'UL 9540A', title: 'Test Method for Evaluating Thermal Runaway Fire Propagation' },
      { code: 'UL 1973', title: 'Standard for Batteries for Use in Stationary Applications' }
    ],
    maintenance: [
      {
        title: 'Continuous Monitoring',
        interval: '24/7 (BMS)',
        skillLevel: 'Entry',
        procedures: [
            'Monitor Cell Voltage Spread (Delta V).', 
            'Monitor Module/Rack Temperatures.', 
            'Verify "Keep-Alive" signals to UPS/Inverter.'
        ]
      },
      {
        title: 'Quarterly System Check',
        interval: 'Quarterly',
        skillLevel: 'Expert',
        procedures: [
            'Download and analyze BMS logs for outlier cell behavior.', 
            'Check HVAC/Liquid Cooling filters and fluid levels.', 
            'Verify operation of Shunt Trips and DC Breakers.',
            'Inspect communication cabling (CANBus/Modbus) for wear.'
        ]
      },
      {
        title: 'Annual Certification',
        interval: 'Yearly',
        skillLevel: 'Expert',
        procedures: [
            'Verify firmware versions (BMS/Gateway). Update if critical patches exist.', 
            'Clean intake/exhaust plenums.', 
            'Test Fire Suppression System integration (dry run).'
        ]
      }
    ],
    safety: [
      { hazard: 'Thermal Runaway', riskLevel: 'Critical', mitigation: 'Uncontrollable fire (oxygen source). Strategy is "Containment" not "Extinguishment".' },
      { hazard: 'Stranded Energy', riskLevel: 'High', mitigation: 'Damaged modules can retain charge even if terminals read 0V. Handle as live.' },
      { hazard: 'Toxic Off-Gassing', riskLevel: 'High', mitigation: 'Vent gases (HF, CO, H2) immediately. Do not enter without SCBA.' }
    ],
    training: [
        'NFPA 855 / First Responder ESS Safety',
        'OEM Certified Technician Training (Proprietary)',
        'High Voltage DC Safety (NFPA 70E)'
    ],
    precautions: [
        'NEVER attempt to open a Li-Ion module or cell. There are no user-serviceable parts inside.',
        'If a module is dropped, QUARANTINE it immediately. Internal short circuits may develop hours later.',
        'Ensure rigorous cybersecurity on BMS network interfaces.'
    ]
  },
  'NICD': {
    title: 'Nickel-Cadmium (Ni-Cd)',
    desc: 'The rugged "Survivor" of batteries. Performing in extreme temps (-40°C to +50°C) and high-cycling regimes.',
    image: '/assets/images/tech-nicd.jpg',
    color: 'orange',
    history: 'Invented by Waldemar Jungner in 1899. NiCd uses Nickel Oxide Hydroxide and Metallic Cadmium with an alkaline Potassium Hydroxide (KOH) electrolyte. Unlike Lead-Acid, the electrolyte density does not change with charge state. It is legendary for surviving abuse, deep discharges, and harsh environments (locomotives, oil & gas platforms).',
    bestPractices: [
      'Electrolyte Level: KOH levels fluctuate significantly with charge. ONLY top up when fully charged to prevent overflow.',
      'Carbonation Mitigation: KOH absorbs CO2 from air to form Potassium Carbonate (reduces performance). Keep vents closed.',
      'Regular Cycling: Susceptible to "Memory Effect" (voltage depression) if constantly shallow cycled. Periodic deep discharge restores capacity.',
      'Charging: Can accept very high charge rates (fast charging) without damage.'
    ],
    standards: [
      { code: 'IEEE 1106-2015', title: 'Maintenance, Testing, and Replacement of Ni-Cd Batteries' },
      { code: 'IEEE 1115-2014', title: 'Recommended Practice for Sizing Ni-Cd Batteries' },
      { code: 'IEC 60623', title: 'Vented Nickel-Cadmium Prismatic Rechargeable Single Cells' }
    ],
    maintenance: [
      {
        title: 'Semi-Annual Inspection',
        interval: '6 Months',
        skillLevel: 'Entry',
        procedures: [
            'Check electrolyte levels.', 
            'Measure pilot cell voltages.', 
            'Inspect vents for white crystalline deposits (Carbonation).',
            'Verify room temperature and ventilation.'
        ]
      },
      {
        title: 'Annual Maintenance',
        interval: 'Yearly',
        skillLevel: 'Expert',
        procedures: [
            'Torque verification of inter-cell connectors.', 
            'Measure voltage of ALL cells.', 
            'Clean cell tops to remove conductive films/dirt.',
            'Perform high-rate discharge test if required.'
        ]
      },
      {
        title: 'Electrolyte Renewal',
        interval: '5-10 Years',
        skillLevel: 'Expert',
        procedures: [
            'Analyze carbonate content in electrolyte.', 
            'Perform electrolyte replacement if Carbonate >10%.'
        ]
      }
    ],
    safety: [
      { hazard: 'Cadmium Toxicity', riskLevel: 'Critical', mitigation: 'Cadmium is a carcinogen. Disposal requires strict HazMat compliance.' },
      { hazard: 'Chemical Burns', riskLevel: 'High', mitigation: 'KOH is a strong caustic base. Causes deep tissue burns. Eye protection is mandatory.' },
      { hazard: 'Shock Hazard', riskLevel: 'Moderate', mitigation: 'Often used in high voltage (110V/220V) control strings.' }
    ],
    training: [
        'Hazardous Material Handling (Cadmium)',
        'Alkaline Electrolyte Safety (Neutralization with Boric Acid)',
        'IEEE 1106 Maintenance Practices'
    ],
    precautions: [
        'Neutralize spills with BORIC ACID or VINEGAR (Mild Acid). NEVER use Baking Soda (Base on Base).',
        'Use tools dedicated to NiCd. Lead-acid tools (sulfuric acid) will contaminate and destroy NiCd cells.',
        'Do not mix NiCd and Lead-Acid charging profiles. Voltages are completely different.'
    ]
  },
  'FLOW': {
    title: 'Flow Batteries (VRFB)',
    desc: 'Long-duration storage (4-12+ hours) where energy is stored in external electrolyte tanks, decoupled from power.',
    image: '/assets/images/tech-flow.jpg',
    color: 'purple',
    history: 'Vanadium Redox Flow Batteries (VRFB) differ fundamentally from conventional batteries. Energy is stored in liquid manganese/vanadium electrolyte in large tanks, modifying valence states. Power is determined by the "stack" size, energy by the "tank" size. This allows theoretical unlimited cycling and deep discharge without degradation.',
    bestPractices: [
      'Electrolyte Balance: Anolyte and Catholyte volumes must remain balanced. Cross-membrane transfer happens over time.',
      'Thermal Stability: Electrolyte must stay within temp window (typically 10-40°C) to prevent precipitation of solids.',
      'Pump Health: The entire system relies on mechanical pumps. Vibration and flow monitoring is key.',
      'Leak Prevention: Thousands of gallons of acidic electrolyte. Double-containment plumbing is standard.'
    ],
    standards: [
      { code: 'IEEE P2030.2', title: 'Guide for Interoperability of Energy Storage Systems (ESS)' },
      { code: 'IEC 62932', title: 'Flow Battery Energy Storage Systems - Safety' }
    ],
    maintenance: [
      {
        title: 'Monthly System Check',
        interval: 'Monthly',
        skillLevel: 'Entry',
        procedures: [
            'Visual inspection of pumps, valves, and piping for leaks.', 
            'Verify stack voltages and flow rates.', 
            'Check state of charge (OCV cell) readings.'
        ]
      },
      {
        title: 'Annual Mechanical/Chemical',
        interval: 'Yearly',
        skillLevel: 'Expert',
        procedures: [
            'Chemical analysis of electrolyte (Vanadium concentration).', 
            'Rebalancing of electrolyte volumes (pumping back/forth).', 
            'Pump servicing (seal replacement).', 
            'Inverter/PCS maintenance.'
        ]
      }
    ],
    safety: [
      { hazard: 'Chemical Spill', riskLevel: 'High', mitigation: 'Large volume acidic electrolyte. Secondary containment berms are required.' },
      { hazard: 'Pressurized Lines', riskLevel: 'Moderate', mitigation: 'Piping under pressure. Lockout/Tagout (LOTO) for pumps before service.' },
      { hazard: 'Gas Generation', riskLevel: 'Low', mitigation: 'Side reactions can generate minimal H2/Cl2. Venting required.' }
    ],
    training: [
        'Chemical Process Safety / Pump Mechanics',
        'Spill Response for Large Volumes',
        'Flow Battery Control Systems'
    ],
    precautions: [
        'Ensure electrolyte does not freeze or overheat (precipitation risk).',
        'Do not allow pumps to run dry (cavitation damage).',
        'Maintain inert gas blanket (Nitrogen) in headspace if required by OEM.'
    ]
  },
  'SODIUM': {
    title: 'Sodium-Based (NaS / Na-Ion)',
    desc: 'The "Earth Abundant" alternative. High-Temperature NaS for grid scale, or Na-Ion for cost-effective general use.',
    image: '/assets/images/tech-sodium.jpg',
    color: 'red',
    history: 'Sodium-Sulfur (NaS) batteries (operating at ~300°C) have supported the grid for decades (NGK). Sodium-Ion (Na-Ion) is the emerging ambient-temperature rival to LFP. Using abundant sodium (soda ash) instead of lithium, it breaks geopolitical supply chain constraints while offering performance similar to LFP, with superior extreme-cold performance.',
    bestPractices: [
      'Thermal Containment (NaS): Molten sodium/sulfur requires strict vacuum insulation and heater circuits.',
      'Discharge Limits: Na-Ion can be discharged to 0V without damage (unlike Li-Ion), aiding safe transport.',
      'Cycle Life: Na-Ion offers 3000-5000 cycles, competitive with LFP.',
      'Compatibility: Voltage window is lower than Li-Ion; requires specific inverters.'
    ],
    standards: [
      { code: 'IEEE 1679.1', title: 'Characterization and Evaluation of Sodium-Beta Batteries' },
      { code: 'UL 1973', title: 'batteries for Use in Stationary Applications' }
    ],
    maintenance: [
      {
        title: 'Continuous (NaS)',
        interval: 'Real-time',
        skillLevel: 'Expert',
        procedures: [
            'Monitor heater circuit integrity (Critical).', 
            'Monitor block voltages and insulation resistance.', 
            'Check vacuum enclosure pressure (if sensors available).'
        ]
      },
      {
        title: 'Annual Inspection (Na-Ion)',
        interval: 'Yearly',
        skillLevel: 'Entry',
        procedures: [
            'Similar to Li-Ion: Check comms, verify BMS logs.', 
            'Visual inspection of modules.', 
            'Torque check of DC connections.'
        ]
      }
    ],
    safety: [
      { hazard: 'Fire (NaS)', riskLevel: 'Critical', mitigation: 'Metallic Sodium is water-reactive. NO WATER SPRINKLERS. Use inert gas/powder.' },
      { hazard: 'Thermal Burns', riskLevel: 'High', mitigation: 'Modules operate at 300°C. Do not touch boundaries.' },
      { hazard: 'Toxic Fumes', riskLevel: 'High', mitigation: 'Sulfur dioxide (SO2) release in failure.' }
    ],
    training: [
        'Class D Fire Suppression (Metal Fires)',
        'High Temperature Safety Awareness',
        'Na-Ion specific BMS Training'
    ],
    precautions: [
        'For NaS: Ensure backup power for heaters. If frozen, revival is complex/risky.',
        'For Na-Ion: Use correct charging algorithm. Do not charge with Li-Ion profile.',
        'Never breach the hermetic seal of a Sodium cell.'
    ]
  }
};

const ReferenceCard = ({ code, title }: { code: string, title: string }) => (
  <div className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-industrial-700 hover:border-brand-500 dark:hover:border-brand-500 transition-colors bg-slate-50 dark:bg-industrial-900/50">
     <div className="font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">{code}</div>
     <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{title}</div>
     <ExternalLink className="w-4 h-4 text-slate-400 ml-auto" />
  </div>
);

interface KnowledgeBaseProps {
  initialTab?: ViewMode;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ initialTab }) => {
  const [currentView, setCurrentView] = useState<ViewMode>(initialTab || 'HUB');
  const [selectedImage, setSelectedImage] = useState<{ src: string, alt: string } | null>(null);

  // React to prop changes (deep linking)
  React.useEffect(() => {
    if (initialTab) {
        setCurrentView(initialTab);
    }
  }, [initialTab]);

  const handleBack = () => setCurrentView('HUB');

  // Image Modal Component
  const ImageModal = () => {
    if (!selectedImage) return null;
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-4"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
                <img 
                    src={selectedImage.src} 
                    alt={selectedImage.alt} 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10"
                />
                <p className="text-white/80 mt-4 text-sm font-mono">{selectedImage.alt}</p>
                <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-12 right-0 text-white/50 hover:text-white p-2"
                >
                    Close [Esc]
                </button>
            </div>
        </div>
    );
  };

  // Close on Esc
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedImage(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // HUB VIEW
  if (currentView === 'HUB') {
    return (
      <div className="animate-fade-in pb-20 space-y-8">
        <ImageModal />
        {/* Header */}
        <div className="bg-white dark:bg-industrial-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-industrial-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
                <div className="bg-brand-100 dark:bg-brand-900/30 p-2 rounded-lg">
                   <BookOpen className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                   <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">Knowledge Hub</h1>
                   <p className="text-slate-500 dark:text-slate-400 mt-1">
                      Comprehensive guides for all stationary battery technologies.
                   </p>
                </div>
             </div>
          </div>
        </div>

        {/* Tech Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {/* Card Helper with HD Images */}
           {[
             { 
                id: 'VRLA', 
                title: 'VRLA (Lead-Acid)', 
                desc: 'Maintenance-free, sealed lead-acid batteries common in UPS and Telecom.',
                image: '/assets/images/tech-vrla.jpg', // Server rack / tech look
                color: 'blue' 
             },
             { 
                id: 'VLA', 
                title: 'Vented Lead-Acid', 
                desc: 'Traditional liquid electrolyte batteries. High reliability, long life.',
                image: '/assets/images/tech-vla.jpg', // Industrial / Manufacturing
                color: 'cyan' 
             },
             { 
                id: 'LIION', 
                title: 'Lithium-Ion', 
                desc: 'High energy density, low weight. Dominating ESS and modern Data Centers.',
                image: '/assets/images/tech-liion.jpg', // Circuit / BMS look
                color: 'green' 
             },
             { 
                id: 'NICD', 
                title: 'Nickel-Cadmium', 
                desc: 'Extremely robust, wide temp range. Used in Genset starting and O&G.',
                image: '/assets/images/tech-nicd.jpg', // Rugged industrial
                color: 'orange' 
             },
             { 
                id: 'FLOW', 
                title: 'Flow Batteries', 
                desc: 'Long duration storage. Electrolyte stored in external tanks.',
                image: '/assets/images/tech-flow.jpg', // Pipes / Fluid
                color: 'purple' 
             },
             { 
                id: 'SODIUM', 
                title: 'Sodium-Based', 
                desc: 'High temperature (NaS) or emerging ambient (Na-Ion).',
                image: '/assets/images/tech-sodium.jpg', // Chemical / Future
                color: 'red' 
             },
           ].map(tech => (
             <button 
                key={tech.id}
                onClick={() => setCurrentView(tech.id as ViewMode)}
                className="group relative overflow-hidden bg-white dark:bg-industrial-800 border border-slate-200 dark:border-industrial-700 rounded-xl h-64 text-left shadow-lg hover:shadow-2xl transition-all hover:scale-[1.02]"
             >
                {/* Background Image */}
                <div className="absolute inset-0">
                   <img 
                      src={tech.image} 
                      alt={tech.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                   <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      {tech.title}
                      <ChevronRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-400" />
                   </h3>
                   <p className="text-slate-300 text-sm line-clamp-2 leading-relaxed">
                      {tech.desc}
                   </p>
                </div>
             </button>
           ))}
        </div>
      </div>
    );
  }

  // DETAIL VIEW
  const data = TECH_DETAILS[currentView];
  
  return (
     <div className="animate-fade-in pb-20 space-y-6">
        {/* Nav */}
        <button onClick={handleBack} className="flex items-center text-slate-500 hover:text-brand-600 transition-colors">
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
        </button>

        {/* Hero */}
        <div className="bg-white dark:bg-industrial-800 rounded-2xl p-8 shadow-xl border border-slate-200 dark:border-industrial-700">
           <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20">
                 <Battery className="w-8 h-8 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                 <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{data.title}</h1>
                 <p className="text-slate-500 dark:text-slate-400">{data.desc}</p>
              </div>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="col-span-2 space-y-8">
                 {/* History */}
                 <section>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                       <History className="w-5 h-5 text-slate-400" /> History & Development
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-industrial-900/50 p-4 rounded-lg">
                       {data.history}
                    </p>
                 </section>

                 {/* Best Practices */}
                 <section>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                       <Award className="w-5 h-5 text-slate-400" /> Best Practices & Operation
                    </h3>
                    <ul className="grid gap-3">
                       {data.bestPractices.map((bp, i) => (
                          <li key={i} className="flex gap-3 text-slate-700 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-md border border-emerald-100 dark:border-emerald-900/20">
                             <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                             <span>{bp}</span>
                          </li>
                       ))}
                    </ul>
                 </section>

                  {/* Maintenance */}
                  <section>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-slate-400" /> Maintenance Strategy
                     </h3>
                     <div className="space-y-4">
                        {data.maintenance.map((m, i) => (
                           <div key={i} className="border border-slate-200 dark:border-industrial-700 rounded-lg p-4 bg-white dark:bg-industrial-800">
                              <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-bold text-slate-900 dark:text-white">{m.title}</h4>
                                 <div className="flex gap-2">
                                    <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-industrial-700 rounded text-slate-600 dark:text-slate-300 uppercase">{m.interval}</span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${m.skillLevel === 'Expert' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                                        {m.skillLevel} Only
                                    </span>
                                 </div>
                              </div>
                              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                 {m.procedures.map((proc, j) => (
                                    <li key={j}>{proc}</li>
                                 ))}
                              </ul>
                           </div>
                        ))}
                     </div>
                  </section>
               </div>

               {/* Sidebar: Standards & Safety */}
               <div className="space-y-6">
                  {/* Safety Hazards (Enriched) */}
                  <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-5 border border-red-200 dark:border-red-900/20">
                     <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4" /> Safety Hazards
                     </h3>
                     <div className="space-y-4">
                        {data.safety.map((safe, i) => (
                           <div key={i} className="text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-red-900 dark:text-red-300 flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3" /> {safe.hazard}
                                </span>
                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                    safe.riskLevel === 'Critical' ? 'bg-red-200 text-red-800' : safe.riskLevel === 'High' ? 'bg-orange-200 text-orange-800' : 'bg-yellow-200 text-yellow-800'
                                }`}>
                                    {safe.riskLevel}
                                </span>
                              </div>
                              <p className="text-red-800/80 dark:text-red-300/80 text-xs pl-5 leading-relaxed">
                                 {safe.mitigation}
                              </p>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Operational Precautions (New) */}
                  <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-200 dark:border-amber-900/20">
                     <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Critical Precautions
                     </h3>
                     <ul className="space-y-3">
                        {data.precautions.map((item, i) => (
                           <li key={i} className="text-sm text-amber-900 dark:text-amber-200 flex gap-2 leading-snug">
                              <span className="text-amber-500 font-bold">•</span>
                              {item}
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Required Training (New) */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-5 border border-blue-200 dark:border-blue-900/20">
                     <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Award className="w-4 h-4" /> Required Training
                     </h3>
                     <ul className="space-y-2">
                        {data.training.map((t, i) => (
                           <li key={i} className="text-sm text-blue-800 dark:text-blue-200 flex gap-2">
                              <span className="text-blue-500">✓</span>
                              {t}
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Standards */}
                  <div className="bg-slate-50 dark:bg-industrial-900/50 rounded-xl p-5 border border-slate-200 dark:border-industrial-700">
                     <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Applicable Standards</h3>
                     <div className="space-y-3">
                        {data.standards.map((std, i) => (
                           <ReferenceCard key={i} code={std.code} title={std.title} />
                        ))}
                     </div>
                  </div>

               </div>
            </div>
         </div>
      </div>
   );
};
