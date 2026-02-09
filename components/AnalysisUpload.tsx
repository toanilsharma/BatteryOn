import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { AnalysisResult, ChemistryType, CellInput, DischargeRate } from '../types';
import { analyzeBattery } from './AnalysisEngine';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface AnalysisUploadProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const AnalysisUpload: React.FC<AnalysisUploadProps> = ({ onAnalysisComplete }) => {
  const [analysisType, setAnalysisType] = useState<'health' | 'capacity' | 'impedance'>('health');
  const [chemistryType, setChemistryType] = useState<ChemistryType>(ChemistryType.LeadAcid_VRLA_AGM);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* State for Manual Entry */
  const [entryMode, setEntryMode] = useState<'upload' | 'manual'>('upload');
  const [manualCells, setManualCells] = useState<CellInput[]>([]);
  const [numCells, setNumCells] = useState<number>(10);
  const [nominalCapacity, setNominalCapacity] = useState<number>(100);
  
  // New State for C-Rate
  const [dischargeRate, setDischargeRate] = useState<DischargeRate>('C10');
  const [dischargeAmps, setDischargeAmps] = useState<number>(10);
  const [durationMins, setDurationMins] = useState<number>(600);

  /* State for rich processing animation */
  const [processingStep, setProcessingStep] = useState(0);
  /* State for Upload Mode */
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processingSteps = [
    "Reading file data...",
    "Parsing cell values...", 
    "Identify Chemistry Signature...", 
    "Analyzing Voltage Spread...", 
    "Generating Engineering Report..."
  ];

  /* Param Handlers */
  const handleRateChange = (rate: string) => {
      setDischargeRate(rate as DischargeRate);
      if (rate === 'Custom') return;

      const c = parseInt(rate.replace('C', ''));
      if (!isNaN(c)) {
          setDischargeAmps(nominalCapacity / c);
          setDurationMins(c * 60);
      }
  };

  const handleCapacityChange = (val: number) => {
      setNominalCapacity(val);
      if (dischargeRate !== 'Custom') {
          const c = parseInt(dischargeRate.replace('C', ''));
          if (!isNaN(c)) setDischargeAmps(val / c);
      }
  };


  /* Upload Handlers */
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
      processFile(files[0]);
    }
  };

  const handleManualUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  /* File Processing Logic */
  const processFile = async (file: File) => {
    setUploading(true);
    setError(null);
    setProcessingStep(0);

    try {
        let rawData: any[] = [];
        if (file.name.endsWith('.csv')) {
            rawData = await parseCSV(file);
        } else if (file.name.match(/\.xls|xlsx$/)) {
            rawData = await parseExcel(file);
        } else {
            throw new Error("Unsupported file format. Please use CSV or Excel.");
        }

        setProcessingStep(1); 

        const parsedCells: CellInput[] = rawData.map((row, index) => {
            const cellId = row['Cell ID'] || row['Cell'] || row['ID'] || row['No'] || (index + 1);
            const voltage = parseFloat(row['Voltage'] || row['V'] || row['Volts'] || row['Reading']);
            const impedance = parseFloat(row['Impedance'] || row['Internal Resistance'] || row['Res'] || row['Ohm'] || row['R'] || '0');
            const temp = parseFloat(row['Temperature'] || row['Temp'] || row['T'] || '25');
            const measuredAh = parseFloat(row['Capacity'] || row['Ah'] || row['Measured Ah'] || '0');

            if (isNaN(voltage)) return null;

            return {
                cellId: cellId,
                voltage: voltage,
                impedanceOhms: impedance > 0 ? impedance : undefined,
                temperature: temp,
                measuredAh: measuredAh > 0 ? measuredAh : undefined,
                ratedAh: 100
            } as CellInput;
        }).filter(c => c !== null) as CellInput[];

        if (parsedCells.length === 0) throw new Error("No valid cell data found.");

        setProcessingStep(3);

        const meta = {
            siteId: 'Imported Site',
            assetId: file.name.split('.')[0],
            operator: 'User',
            date: new Date().toISOString(),
            chemistryId: chemistryType,
            nominalCapacityAh: nominalCapacity,
            dischargeRate: analysisType === 'capacity' ? dischargeRate : undefined
        };
        // Add optional fields
        if (analysisType === 'capacity') {
            Object.assign(meta, {
                dischargeCurrent: dischargeAmps,
                testDurationMins: durationMins
            });
        }

        const profile = getProfile(chemistryType);
        const result = analyzeBattery(parsedCells, meta, profile);

        setProcessingStep(4);
        setTimeout(() => {
            setUploading(false);
            onAnalysisComplete(result);
        }, 1000);

    } catch (err: any) {
        setError(err.message || "Failed to process file");
        setUploading(false);
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (error) => reject(error)
        });
    });
  };

  const parseExcel = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);
                resolve(json);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsBinaryString(file);
    });
  };
    
  /* Shared Helper */
  const getProfile = (type: ChemistryType) => {
        let nominal = 2.0;
        let floatMax = 2.27; let floatMin = 2.18; let dischargeEnd = 1.75;
        if (type === ChemistryType.LFP) { nominal = 3.2; floatMax = 3.45; floatMin = 3.3; dischargeEnd = 2.5; }
        else if (type === ChemistryType.NiCd) { nominal = 1.2; floatMax = 1.45; floatMin = 1.35; dischargeEnd = 1.0; }
        
        return {
            id: type, name: type, nominalVoltage: nominal, floatMin, floatMax, dischargeEnd,
            stdDevLimit: 0.02 * nominal, allowedImbalance: 0.05, tempCoeff: -3,
            standards: ['IEEE-1188', 'USER-INPUT']
        };
  };

  /* Manual Entry Handlers */
  const initializeManualGrid = () => {
      const cells: CellInput[] = Array.from({ length: numCells }, (_, i) => ({
          cellId: i + 1,
          voltage: 2.0, // Default nominal
          temperature: 25,
          impedanceOhms: 0,
          measuredAh: 0,
          ratedAh: 100
      }));
      setManualCells(cells);
  };

  // Initialize on mount or count change
  React.useEffect(() => {
     if (manualCells.length === 0) initializeManualGrid();
  }, []);

  const handleCellChange = (index: number, field: keyof CellInput, value: string) => {
      const newCells = [...manualCells];
      if (field === 'cellId') {
          newCells[index] = { ...newCells[index], [field]: value };
      } else {
          newCells[index] = { ...newCells[index], [field]: parseFloat(value) || 0 };
      }
      setManualCells(newCells);
  };

  const handleManualAnalyze = () => {
      setUploading(true);
      setProcessingStep(0);
      
      try {
        // Validate
        const validCells = manualCells.filter(c => c.voltage > 0);
        if (validCells.length === 0) throw new Error("Please enter valid voltage data.");

        setProcessingStep(2); // Skip parsing reqs
        
        // Prepare Metadata
        const meta = {
            siteId: 'Manual Entry Site',
            assetId: 'Manual Bank 01',
            operator: 'User',
            date: new Date().toISOString(),
            chemistryId: chemistryType,
            nominalCapacityAh: nominalCapacity,
            dischargeRate: analysisType === 'capacity' ? dischargeRate : undefined,
            dischargeCurrent: analysisType === 'capacity' ? dischargeAmps : undefined,
            testDurationMins: analysisType === 'capacity' ? durationMins : undefined
        };

        const profile = getProfile(chemistryType);
        const result = analyzeBattery(validCells, meta, profile);

        setProcessingStep(4);
        setTimeout(() => {
            setUploading(false);
            onAnalysisComplete(result);
        }, 1000);

      } catch (err: any) {
          setError(err.message);
          setUploading(false);
      }
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

       {/* 3. Test Configuration (New Shared Section) */}
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">3. Test Configuration</h3>
      <div className="bg-slate-50 dark:bg-industrial-800 p-4 rounded-lg border border-slate-200 dark:border-industrial-700 mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Rated Capacity (Ah)</label>
              <input 
                type="number" 
                value={nominalCapacity} 
                onChange={(e) => handleCapacityChange(parseFloat(e.target.value) || 100)}
                className="w-full px-3 py-2 border rounded-md font-bold text-slate-700"
              />
          </div>
          
          {analysisType === 'capacity' && (
             <>
                <div>
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Test Rating (C-Rate)</label>
                   <select 
                      value={dischargeRate} 
                      onChange={(e) => handleRateChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md font-bold text-slate-700 bg-white dark:bg-industrial-700 dark:text-white"
                   >
                      <option value="C10">C10 (10 Hours)</option>
                      <option value="C8">C8 (8 Hours)</option>
                      <option value="C5">C5 (5 Hours)</option>
                      <option value="C3">C3 (3 Hours)</option>
                      <option value="C1">C1 (1 Hour)</option>
                      <option value="Custom">Custom</option>
                   </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Discharge Current (A)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={dischargeAmps} 
                      onChange={(e) => { setDischargeAmps(parseFloat(e.target.value) || 0); setDischargeRate('Custom'); }}
                      className="w-full px-3 py-2 border rounded-md font-bold text-slate-700"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Duration (min)</label>
                    <input 
                      type="number" 
                      value={durationMins} 
                      onChange={(e) => { setDurationMins(parseFloat(e.target.value) || 0); setDischargeRate('Custom'); }}
                      className="w-full px-3 py-2 border rounded-md font-bold text-slate-700"
                    />
                </div>
             </>
          )}
      </div>

      {/* Top Toggle */}
      <div className="flex justify-center mb-8">
          <div className="bg-slate-100 dark:bg-industrial-800 p-1 rounded-lg inline-flex shadow-inner">
              <button 
                onClick={() => setEntryMode('upload')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${entryMode === 'upload' ? 'bg-white dark:bg-industrial-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
              >
                  File Upload
              </button>
              <button 
                onClick={() => setEntryMode('manual')}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${entryMode === 'manual' ? 'bg-white dark:bg-industrial-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
              >
                  Manual Entry
              </button>
          </div>
      </div>

      {/* CONTENT AREA BASED ON MODE */}
      {entryMode === 'upload' ? (
        <>
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
                        {error && (
                            <div className="text-red-500 text-sm font-bold flex items-center gap-2 mt-4">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
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
        </>
      ) : (
          <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-industrial-800 p-6 rounded-xl border border-slate-200 dark:border-industrial-700">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                      <h4 className="font-bold text-slate-800 dark:text-white">Manual Data Entry</h4>
                      <div className="flex items-center gap-4 flex-wrap">
                          {/* Helper Text for Capacity */}
                           {analysisType === 'capacity' && (
                                <div className="text-xs text-slate-500 italic">
                                     * Enter <strong>End-of-Test</strong> Voltages
                                </div>
                           )}

                          <div className="flex items-center gap-2">
                              <label className="text-sm text-slate-600 dark:text-slate-400">Cells:</label>
                              <input 
                                type="number" 
                                value={numCells} 
                                onChange={(e) => setNumCells(parseInt(e.target.value) || 10)}
                                className="w-16 px-2 py-1 border rounded text-right"
                              />
                          </div>
                          <button 
                            onClick={initializeManualGrid}
                            className="text-xs bg-brand-100 hover:bg-brand-200 text-brand-700 px-3 py-1 rounded font-bold"
                          >
                              Update Grid
                          </button>
                      </div>
                  </div>

                  <div className="overflow-x-auto max-h-[500px] border border-slate-200 dark:border-industrial-600 rounded-lg">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-100 dark:bg-industrial-900 text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                              <tr>
                                  <th className="px-4 py-3">ID</th>
                                  <th className="px-4 py-3">Voltage (V)</th>
                                  <th className="px-4 py-3">Temp (°C)</th>
                                  {analysisType === 'impedance' && <th className="px-4 py-3">Impedance (mΩ)</th>}
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-industrial-700 bg-white dark:bg-industrial-800">
                              {manualCells.map((cell, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-industrial-700/50">
                                      <td className="px-4 py-2">
                                          <input 
                                            type="text" 
                                            value={cell.cellId}
                                            onChange={(e) => handleCellChange(idx, 'cellId', e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium"
                                          />
                                      </td>
                                      <td className="px-4 py-2">
                                          <input 
                                            type="number" 
                                            step="0.01"
                                            value={cell.voltage}
                                            onChange={(e) => handleCellChange(idx, 'voltage', e.target.value)}
                                            className={`w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:ring-0 p-1 ${cell.voltage < 2.0 ? 'text-red-500 font-bold' : ''}`}
                                          />
                                      </td>
                                      <td className="px-4 py-2">
                                          <input 
                                            type="number" 
                                            step="0.1"
                                            value={cell.temperature}
                                            onChange={(e) => handleCellChange(idx, 'temperature', e.target.value)}
                                            className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:ring-0 p-1"
                                          />
                                      </td>
                                      {analysisType === 'impedance' && (
                                          <td className="px-4 py-2">
                                              <input 
                                                type="number" 
                                                step="0.01"
                                                value={cell.impedanceOhms || 0}
                                                onChange={(e) => handleCellChange(idx, 'impedanceOhms', e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent focus:border-brand-500 focus:ring-0 p-1"
                                              />
                                          </td>
                                      )}
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              <div className="flex justify-end">
                   <button 
                      onClick={handleManualAnalyze}
                      disabled={uploading}
                      className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       {uploading ? 'Analyzing...' : 'Run Analysis'}
                       {!uploading && <ArrowRight className="w-5 h-5" />}
                   </button>
              </div>
              
              {error && (
                    <div className="text-red-500 text-sm font-bold flex items-center gap-2 mt-4">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
          </div>
      )}
    </div>
  );
};
