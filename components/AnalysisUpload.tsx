import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { AnalysisResult, HealthGrade, ChemistryType } from '../types';

interface AnalysisUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const AnalysisUpload: React.FC<AnalysisUploadProps> = ({ onAnalysisComplete }) => {
  const [analysisType, setAnalysisType] = useState<'health' | 'capacity' | 'impedance'>('health');
  const [chemistryType, setChemistryType] = useState<ChemistryType>(ChemistryType.LeadAcid_VRLA_AGM);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  /* State for rich processing animation */
  const [processingStep, setProcessingStep] = useState(0);
  const processingSteps = [
    "Uploading data...",
    "Identify Chemistry Signature...", 
    "Analyzing Voltage Spread...", 
    "Correlating Impedance Data...",
    "Generating Engineering Report..."
  ];

  /* Handlers (Drag/Drop/File) remain the same, just calling simulateProcessing */
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      simulateProcessing(files[0]);
    }
  };

  const handleManualUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateProcessing(files[0]);
    }
  };

  const simulateProcessing = (file?: File) => {
    setUploading(true);
    setProcessingStep(0);

    // Simulate progress steps
    const interval = setInterval(() => {
       setProcessingStep(prev => {
         if (prev >= processingSteps.length - 1) {
            clearInterval(interval);
            return prev;
         }
         return prev + 1;
       });
    }, 800);

    setTimeout(() => {
        clearInterval(interval);
        const isCapacity = analysisType === 'capacity';
        const isImpedance = analysisType === 'impedance';
        
        let nominalVoltage = 2.0;
        let floatVoltage = 2.25;
        let baseImpedance = 0.35;
        
        // Chemistry Specific Logic
        if (chemistryType === ChemistryType.LFP) {
           nominalVoltage = 3.2;
           floatVoltage = 3.35;
           baseImpedance = 0.25; // Lower internal resistance usually
        } else if (chemistryType === ChemistryType.NMC) {
           nominalVoltage = 3.7;
           floatVoltage = 4.2;
           baseImpedance = 0.20;
        } else if (chemistryType === ChemistryType.NiCd) {
           nominalVoltage = 1.2;
           floatVoltage = 1.4;
           baseImpedance = 0.5;
        }

        // Generate Mock Discharge Curve for Capacity Tests
        let dischargeCurve: { timeMinutes: number; voltage: number }[] | undefined;
        
        if (isCapacity) {
           dischargeCurve = [];
           const duration = 180; // 3 hours
           const points = 20;
           for (let i = 0; i <= points; i++) {
              const time = Math.round((i / points) * duration);
              // Simulation: Slow drop then "knee" drop at the end
              const progress = i / points;
              const drop = progress < 0.8 
                 ? progress * 0.1  // Slow drop
                 : 0.1 + ((progress - 0.8) * 1.5); // Fast drop (Coupe de Fouet / Knee)
              
              dischargeCurve.push({
                 timeMinutes: time,
                 voltage: nominalVoltage * 40 * (1 - drop) // String voltage
              });
           }
        }

        // 1. Generate Cells First
        const cells = Array.from({ length: 40 }, (_, i) => {
            const targetVoltage = isCapacity ? (nominalVoltage - 0.2) : floatVoltage; 
            let voltage = targetVoltage + (Math.random() * 0.05 - 0.025);
            let impedance = baseImpedance + (Math.random() * (baseImpedance * 0.4)); // 40% variance
            
            // Simulation: Force some specific failures to demonstrate the UI
            if (i === 12 || i === 29) { // Critical Cells
               voltage = isCapacity ? nominalVoltage * 0.7 : floatVoltage - 0.5; // Collapsed cell
               impedance = baseImpedance * 3.5; // High resistance (Open/Dry)
            }
            if (i === 5 || i === 33) { // Warning Cells
               voltage = isCapacity ? nominalVoltage * 0.85 : floatVoltage - 0.15;
               impedance = baseImpedance * 1.6; 
            }

            // Determine Status (Logic applies to ALL modes now)
            let status: 'OK' | 'Warn' | 'Fail' = 'OK';
            
            if (isImpedance) {
                if (impedance > baseImpedance * 2.0) status = 'Fail';
                else if (impedance > baseImpedance * 1.5) status = 'Warn';
            } else if (isCapacity) {
                if (voltage < nominalVoltage * 0.8) status = 'Fail';
                else if (voltage < nominalVoltage * 0.9) status = 'Warn';
            } else {
                // Standard Health Mode
                if (voltage < floatVoltage - 0.25) status = 'Fail';
                else if (voltage < floatVoltage - 0.1) status = 'Warn';
            }

            return {
                cellId: i + 1,
                voltage: voltage,
                impedanceOhms: isImpedance ? impedance : undefined, 
                temperature: 24 + (Math.random() * 3),
                measuredAh: isCapacity ? (85 + Math.random() * 10) : undefined, 
                ratedAh: 100,
                status: status,
                zScore: status === 'OK' ? (Math.random() * 1.5 - 0.75) : (status === 'Fail' ? -3.5 : -1.8)
            };
        });

        // 2. Calculate Advanced Stats
        const voltages = cells.map(c => c.voltage);
        const minV = Math.min(...voltages);
        const maxV = Math.max(...voltages);
        const step = (maxV - minV) / 5;
        const histogram = Array.from({length: 5}, (_, i) => {
           const start = minV + (i * step);
           const end = start + step;
           const count = voltages.filter(v => v >= start && v < end).length;
           return { range: `${start.toFixed(2)}-${end.toFixed(2)}V`, count };
        });

        let rul = 5.0; // Years
        if (isCapacity) {
           const avgCap = cells.reduce((a, b) => a + (b.measuredAh || 0), 0) / cells.length;
           const healthPct = avgCap / 100; 
           rul = Math.max(0, (healthPct - 0.8) * 25); 
        } else {
            const badCount = cells.filter(c => c.status !== 'OK').length;
            rul = Math.max(0, 5 - (badCount * 0.5));
        }

        // 3. Financial Risk (Calculations Removed)
        // const failCount = cells.filter(c => c.status === 'Fail').length;
        // const warnCount = cells.filter(c => c.status === 'Warn').length;

        // 4. Construct Final Object
        const mockResult: AnalysisResult = {
            id: 'AN-2024-' + Math.floor(Math.random() * 1000), 
            assetId: file ? file.name.split('.')[0] : 'UPS-Bank-Alpha',
            timestamp: new Date().toISOString(),

            siteId: 'DataCenter-NYC-01',
            stringId: 'String-A',
            chemistry: chemistryType, // Use selected chemistry
            healthScore: isCapacity ? 72 : (isImpedance ? 65 : 85),
            grade: isCapacity ? HealthGrade.Warning : (isImpedance ? HealthGrade.Warning : HealthGrade.Good), 
            dischargeCurve: dischargeCurve, // Add the curve data
            cells: cells,
            stats: {
                meanVoltage: floatVoltage,
                medianVoltage: floatVoltage,
                stdDev: 0.008,
                minVoltage: floatVoltage - 0.1,
                maxVoltage: floatVoltage + 0.1,
                deltaV: 0.08,
                totalVoltage: floatVoltage * 40,
                zScoreMax: 2.5
            },
            compliance: {
                standards: ['IEEE-1188', 'NERC PRC-005'],
                compliant: !isCapacity && !isImpedance 
            },
            advancedStats: {
                histogram,
                estimatedRUL: Number(rul.toFixed(1)),
                // financialRisk removed
                // currency removed
                replacementDeadline: new Date(Date.now() + (rul * 365 * 24 * 60 * 60 * 1000)).toISOString()
            },
            findings: []
        };

        
        // Analysis Logic: Expert Findings Generation
        if (isCapacity) {
             const chemStandards = chemistryType.includes('Lead') ? ['IEEE-1188-2005 (VRLA)', 'NERC PRC-005-6'] 
                : chemistryType.includes('Li') ? ['NFPA 855', 'UL 1973'] 
                : ['IEEE-1106-2015 (Ni-Cd)'];

            mockResult.findings.push({
                severity: 'Critical',
                finding: 'String capacity at 82% of rated (Failed)',
                risk: 'Backup time reduced by 15 minutes. System cannot support full load duration.',
                recommendationShort: 'Schedule battery replacement',
                recommendationLong: 'Capacity test indicates entire string has degraded below 85% threshold. IEEE recommendation is immediate replacement planning.',
                standardRef: 'IEEE-1188 Sec 6.3',
                // Expert Fields
                shortTermActions: [
                   "Reduce load on UPS String A instantly if possible.",
                   "Verify generator start reliability (10-second crank test).",
                   "Increase room cooling to 20°C to slow further degradation."
                ],
                longTermActions: [
                   "Procure replacement string (Lead-Time: 4-6 weeks).",
                   "Budget for full bank replacement ($45k est).",
                   "Review sizing calculations for future load growth."
                ],
                precautions: [
                   "DO NOT boost charge - risk of thermal runaway in aged cells.",
                   "High internal resistance present - arc flash energy elevated."
                ],
                reliabilityImpact: "CRITICAL: n-1 redundancy lost. Site is vulnerable to utility outage > 10 mins.",
                globalStandards: chemStandards
            });
        } else if (isImpedance) {
             const isLead = chemistryType.includes('Lead');
             const isLi = chemistryType.includes('Li');
             
             const specificFinding = isLead 
                ? 'High internal resistance (>50% baseline) indicates advanced sulfation or dry-out.' 
                : isLi 
                ? 'Cell impedance mismatch signals individual cell aging or BMS balancing failure.'
                : 'Carbonation of electrolyte likely causing high resistance.';

             mockResult.findings.push({
                severity: 'Warning',
                finding: 'High Impedance detected in Block 3 (Cells 12, 29)',
                risk: 'Potential open-circuit failure under load (High V-drop).',
                recommendationShort: isLead ? 'Check connection torque & retorque' : 'Check BMS balancing cables',
                recommendationLong: `Cells show significant deviation. ${specificFinding}`,
                standardRef: isLead ? 'IEEE-1188 Sec 5' : 'OEM Manual',
                shortTermActions: [
                   "Verify torque on inter-cell connectors (11 Nm).",
                   "Perform micro-ohm resistance test on connections.",
                   "Check for visible corrosion or post-seal leaks."
                ],
                longTermActions: [
                   "Perform partial discharge test (1 min) to verify load handling.",
                   "Schedule specific cell replacement if re-torque fails."
                ],
                precautions: [
                   "Use insulated tools (1000V rated).",
                   "Wear Arc Flash PPE (Cat 2 minimum)."
                ],
                reliabilityImpact: "MODERATE: String can support load but voltage dip may trip inverter early.",
                globalStandards: isLead ? ['IEEE-1188', 'IEC-60896'] : ['UL-1973']
            });
        } else {
             // Standard Health Findings
             mockResult.findings.push({
                severity: 'Warning',
                finding: 'Voltage Spread Exceeds Limits (>50mV)',
                risk: 'Uneven charging - some cells undercharged (sulfation), others overcharged (gassing).',
                recommendationShort: 'Perform Equalize Charge',
                recommendationLong: 'Identify pilot cells and perform 24h equalize charge at 2.35Vpc (Lead-Acid) or check BMS balancing (Li-Ion).',
                standardRef: 'NERC PRC-005',
                shortTermActions: ["Initiate 24-hour equalize charge cycle.", "Check HVAC output near Rack 3 (thermal gradient?)."],
                longTermActions: ["Install continuous battery monitoring system (BMS)."],
                precautions: ["Ensure H2 gas detection system is functional during equalize."],
                reliabilityImpact: "LOW: Long term life reduction if untreated.",
                globalStandards: ['IEEE-450', 'NERC PRC-005']
             });
        }

        setUploading(false);
        onAnalysisComplete(mockResult as unknown as AnalysisResult); 
    }, 4000); 
  };

  return (
    <div className="space-y-6">
      {/* 1. Analysis Mode Selector */}
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">1. Select Analysis Mode</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button onClick={() => setAnalysisType('health')} className={`p-4 rounded-lg border-2 text-left transition-all ${analysisType === 'health' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500' : 'border-slate-200 dark:border-industrial-700 hover:border-brand-300'}`}>
           <div className={`font-bold ${analysisType === 'health' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>Standard Health</div>
           <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Voltage, Temp, Visual</div>
        </button>
        <button onClick={() => setAnalysisType('capacity')} className={`p-4 rounded-lg border-2 text-left transition-all ${analysisType === 'capacity' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500' : 'border-slate-200 dark:border-industrial-700 hover:border-brand-300'}`}>
           <div className={`font-bold ${analysisType === 'capacity' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>Capacity Test</div>
           <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Discharge, Ah, Runtime</div>
        </button>
        <button onClick={() => setAnalysisType('impedance')} className={`p-4 rounded-lg border-2 text-left transition-all ${analysisType === 'impedance' ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 ring-1 ring-brand-500' : 'border-slate-200 dark:border-industrial-700 hover:border-brand-300'}`}>
           <div className={`font-bold ${analysisType === 'impedance' ? 'text-brand-700 dark:text-brand-400' : 'text-slate-700 dark:text-slate-300'}`}>Internal Resistance</div>
           <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">Ohmic Value, Conductance</div>
        </button>
      </div>

      {/* 2. Chemistry Selector */}
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">2. Select Battery Chemistry</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { id: ChemistryType.LeadAcid_VRLA_AGM, label: 'VRLA (AGM)', sub: 'UPS / Telecom' },
          { id: ChemistryType.LeadAcid_Flooded, label: 'Flooded (VLA)', sub: 'Utility / Switchgear' },
          { id: ChemistryType.LFP, label: 'Li-Ion (LFP)', sub: 'ESS / Solar' },
          { id: ChemistryType.NiCd, label: 'Ni-Cd', sub: 'Industrial' },
        ].map((chem) => (
           <button 
             key={chem.id}
             onClick={() => setChemistryType(chem.id)}
             className={`px-3 py-2 rounded border text-left transition-all ${
               chemistryType === chem.id
                 ? 'bg-slate-800 text-white border-slate-900 dark:bg-white dark:text-slate-900' 
                 : 'bg-white dark:bg-industrial-800 border-slate-200 dark:border-industrial-600 text-slate-600 dark:text-slate-300 hover:border-brand-400'
             }`}
           >
              <div className="font-bold text-sm">{chem.label}</div>
              <div className="text-[10px] opacity-70">{chem.sub}</div>
           </button>
        ))}
      </div>

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
          isDragOver 
            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
            : 'border-slate-300 dark:border-industrial-600 hover:border-brand-400'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-4">
           {uploading ? (
             <div className="space-y-4 animate-fade-in w-full max-w-xs mx-auto">
               <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span>Processing...</span>
                  <span>{Math.round(((processingStep + 1) / processingSteps.length) * 100)}%</span>
               </div>
               <div className="w-full bg-slate-200 dark:bg-industrial-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
                  ></div>
               </div>
               <div className="text-sm font-medium text-slate-700 dark:text-slate-300 h-6">
                  {processingSteps[processingStep]}
               </div>
             </div>
           ) : (
             <>
               <div className="p-4 bg-slate-100 dark:bg-industrial-800 rounded-full">
                  <Upload className="w-8 h-8 text-slate-400 dark:text-slate-300" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Battery Data</h3>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 font-medium">Drag and drop your .csv, .xls, or .fluke files here</p>
               </div>
               <button 
                 onClick={handleManualUpload}
                 className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold transition-colors shadow-lg shadow-brand-900/20"
               >
                 Browse Files
               </button>
             </>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div>
               <h4 className="font-bold text-orange-900 dark:text-orange-300 text-sm">Requirements</h4>
               <p className="text-xs text-orange-800 dark:text-orange-400 mt-1">
                  • Required: Cell ID, Voltage (V)<br/>
                  {analysisType === 'capacity' && <span>• Required: Discharge Current, Start/End Time<br/></span>}
                  {analysisType === 'impedance' && <span>• Required: Ohmic Value (mΩ/µΩ)<br/></span>}
                  • Max file size: 25MB
               </p>
            </div>
         </div>
         <div className="p-4 rounded-lg bg-slate-50 dark:bg-industrial-800 border border-slate-200 dark:border-industrial-700 flex items-center justify-between group cursor-pointer hover:border-brand-500 transition-colors">
            <div className="flex items-center gap-3">
               <FileText className="w-5 h-5 text-slate-400" />
               <div className="text-sm">
                  <p className="font-bold text-slate-700 dark:text-slate-200">Download Template</p>
                  <p className="text-slate-500 text-xs">Excel Spreadsheet (.xlsx)</p>
               </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500" />
         </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
        accept=".csv,.xls,.xlsx,.fluke"
      />
    </div>
  );
};
