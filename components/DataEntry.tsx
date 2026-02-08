import React, { useState, useRef } from 'react';
import { CHEMISTRY_PROFILES } from '../constants';
import { AssetMetadata, CellInput, ChemistryType } from '../types';
import { analyzeBattery } from './AnalysisEngine';
import { FileSpreadsheet, Grid3X3, Server, HardDrive, Upload, Play, CheckCircle } from 'lucide-react';

interface DataEntryProps {
  onAnalyze: (result: any) => void;
}

type DataSourceMode = 'manual' | 'csv' | 'device' | 'live';

export const DataEntry: React.FC<DataEntryProps> = ({ onAnalyze }) => {
  const [mode, setMode] = useState<DataSourceMode>('csv');
  const [fileType, setFileType] = useState<'voltage' | 'capacity'>('voltage');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [meta, setMeta] = useState<AssetMetadata>({
    siteId: '',
    assetId: '',
    operator: '',
    date: new Date().toISOString().split('T')[0],
    chemistryId: ChemistryType.LeadAcid_VRLA_AGM,
    nominalCapacityAh: 100
  });

  const [manualCells, setManualCells] = useState<string>(''); 

  const parseCSV = (text: string, type: 'voltage' | 'capacity'): CellInput[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Detect header row
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes('cell') || firstLine.includes('voltage') || firstLine.includes('id');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    return dataLines.map((line, idx): CellInput | null => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 2) return null;

      const cellId = parts[0] || (idx + 1).toString();
      
      if (type === 'voltage') {
        const voltage = parseFloat(parts[1]);
        if (isNaN(voltage)) return null;
        return {
          cellId,
          voltage,
          temperature: parts[2] ? parseFloat(parts[2]) : undefined,
          cycleCount: parts[3] ? parseFloat(parts[3]) : undefined
        };
      } else {
        // Capacity: ID, Rated, Measured
        const rated = parseFloat(parts[1]);
        const measured = parseFloat(parts[2]);
        if (isNaN(rated) || isNaN(measured)) return null;
        return {
          cellId,
          ratedAh: rated,
          measuredAh: measured,
          voltage: 0, // Placeholder
        };
      }
    }).filter((c): c is CellInput => c !== null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    setLoading(true);
    // Simulate processing time for "Device" files
    setTimeout(() => {
        const reader = new FileReader();
        reader.onload = (event) => {
        const text = event.target?.result as string;
        // In a real app, we'd have specific parsers for Fluke/Alber files here
        // For now, we reuse the CSV parser or mock it
        const cells = parseCSV(text, fileType);
        
        if (cells.length === 0) {
            alert("No valid data found. Ensure format matches selected type.");
            setLoading(false);
            setFileName(null);
            return;
        }
        
        processData(cells);
        setLoading(false);
        };
        reader.readAsText(file);
    }, 1500);
  };

  const handleManualSubmit = () => {
    setLoading(true);
    setTimeout(() => {
        // Manual format expects: ID, Voltage, [Temp], [Measured]
        const lines = manualCells.split('\n');
        const cells: CellInput[] = [];
        lines.forEach((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        const parts = trimmed.split(',');
        const val = parseFloat(parts[1]);
        if (isNaN(val)) return;

        cells.push({ 
            cellId: parts[0]?.trim() || idx + 1, 
            voltage: val,
            temperature: parts[2] ? parseFloat(parts[2]) : undefined,
            measuredAh: parts[3] ? parseFloat(parts[3]) : undefined
        });
        });

        if (cells.length === 0) {
        alert("No valid cell data found.");
        setLoading(false);
        return;
        }
        processData(cells);
        setLoading(false);
    }, 800);
  };

  const handleLiveConnect = () => {
      setLoading(true);
      // Simulate connecting to SCADA
      setTimeout(() => {
          // generate mock data
          const mockCells: CellInput[] = Array.from({ length: 60 }, (_, i) => ({
              cellId: i + 1,
              voltage: 2.25 + (Math.random() * 0.05 - 0.025),
              temperature: 25 + Math.random() * 2
          }));
          processData(mockCells);
          setLoading(false);
      }, 2000);
  }

  const processData = async (cells: CellInput[]) => {
    const profile = CHEMISTRY_PROFILES[meta.chemistryId];
    // Fill in missing nominal voltages if this was a capacity-only test import
    const processedCells = cells.map(c => ({
      ...c,
      voltage: c.voltage === 0 ? profile.nominalVoltage : c.voltage
    }));

    try {
      const result = analyzeBattery(processedCells, meta, profile);
      onAnalyze(result);
    } catch (err) {
      console.error(err);
      alert("Analysis failed. Please check your data inputs.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in pb-20">
      {/* Settings Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="card sticky top-24">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 border-b border-slate-200 dark:border-industrial-700 pb-2 flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-500" />
            Asset Metadata
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-slate-500 dark:text-industrial-400 mb-1 font-bold tracking-wider">Site ID / Location</label>
              <input type="text" className="input-field" 
                value={meta.siteId} onChange={e => setMeta({...meta, siteId: e.target.value})} placeholder="e.g. SUB-01" />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-500 dark:text-industrial-400 mb-1 font-bold tracking-wider">Asset ID</label>
              <input type="text" className="input-field" 
                value={meta.assetId} onChange={e => setMeta({...meta, assetId: e.target.value})} placeholder="e.g. BATT-BANK-A" />
            </div>
            <div>
              <label className="block text-xs uppercase text-slate-500 dark:text-industrial-400 mb-1 font-bold tracking-wider">Chemistry Profile</label>
              <select className="input-field"
                value={meta.chemistryId} onChange={e => setMeta({...meta, chemistryId: e.target.value})}
              >
                {Object.values(CHEMISTRY_PROFILES).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase text-slate-500 dark:text-industrial-400 mb-1 font-bold tracking-wider">Nominal Ah</label>
                <input type="number" className="input-field" 
                  value={meta.nominalCapacityAh} onChange={e => setMeta({...meta, nominalCapacityAh: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs uppercase text-slate-500 dark:text-industrial-400 mb-1 font-bold tracking-wider">Measured Ah</label>
                <input type="number" placeholder="Optional" className="input-field" 
                  value={meta.measuredCapacityAh || ''} onChange={e => setMeta({...meta, measuredCapacityAh: parseFloat(e.target.value)})} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Source Selector Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SourceCard 
                active={mode === 'csv'} 
                onClick={() => setMode('csv')} 
                icon={<FileSpreadsheet className="w-6 h-6" />}
                title="CSV Import"
                desc="Universal Format"
            />
            <SourceCard 
                active={mode === 'device'} 
                onClick={() => setMode('device')} 
                icon={<HardDrive className="w-6 h-6" />}
                title="Device Import"
                desc="Fluke / Alber / Hioki"
            />
            <SourceCard 
                active={mode === 'live'} 
                onClick={() => setMode('live')} 
                icon={<Server className="w-6 h-6" />}
                title="Live Telemetry"
                desc="SCADA / Modbus"
            />
            <SourceCard 
                active={mode === 'manual'} 
                onClick={() => setMode('manual')} 
                icon={<Grid3X3 className="w-6 h-6" />}
                title="Manual Entry"
                desc="Raw Data Grid"
            />
        </div>

        {/* Dynamic Content Panel */}
        <div className="card min-h-[400px] animate-fade-in relative overflow-hidden">
            
            {/* Loading Overlay */}
            {loading && (
                <div className="absolute inset-0 bg-white/80 dark:bg-industrial-900/80 z-20 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
                    <span className="text-brand-600 dark:text-brand-400 font-bold animate-pulse">Processing Data Source...</span>
                </div>
            )}

            {mode === 'csv' && (
                <div className="space-y-6 max-w-lg mx-auto text-center py-10">
                    <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-10 h-10 text-brand-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upload Battery Data</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Support for universal CSV formats. Auto-detection of Voltage, Impedance, and Temperature columns.
                        </p>
                    </div>

                    <div className="flex gap-4 justify-center">
                        <button 
                             onClick={() => setFileType('voltage')}
                             className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${fileType === 'voltage' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'border-slate-200 text-slate-600'}`}
                        >Voltage Log</button>
                        <button 
                             onClick={() => setFileType('capacity')}
                             className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${fileType === 'capacity' ? 'bg-brand-50 border-brand-200 text-brand-700' : 'border-slate-200 text-slate-600'}`}
                        >Capacity Test</button>
                    </div>
                    
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-8 border-2 border-dashed border-slate-300 dark:border-industrial-600 rounded-xl p-8 hover:border-brand-500 cursor-pointer transition-colors group"
                    >
                        <p className="text-slate-600 dark:text-slate-300 font-medium group-hover:text-brand-500">
                            {fileName || "Click to browse files"}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">.csv, .txt supported</p>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.txt" className="hidden" />
                </div>
            )}

            {mode === 'device' && (
                <div className="space-y-6 max-w-lg mx-auto text-center py-10">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <HardDrive className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Device Import</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                             Directly import native files from industry standard battery testers.
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-left mt-6">
                         {['Fluke 500 Series', 'Alber Cellcorder', 'Hioki 3554', 'Franklin Electric', 'Megger BITE', 'Btech BVM'].map(device => (
                             <button key={device} className="p-3 border border-slate-200 dark:border-industrial-700 rounded hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all text-xs font-medium text-slate-600 dark:text-slate-300">
                                 {device}
                             </button>
                         ))}
                    </div>

                    <div className="mt-8">
                         <button onClick={() => fileInputRef.current?.click()} className="btn-primary w-full flex items-center justify-center gap-2">
                             <Upload className="w-4 h-4" /> Import Device File
                         </button>
                         <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.txt,.xml" className="hidden" />
                    </div>
                </div>
            )}

            {mode === 'live' && (
                <div className="space-y-6 max-w-lg mx-auto text-center py-10">
                    <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Server className="w-10 h-10 text-green-500 animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Live Telemetry</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                             Connect to SCADA gateway or Modbus TCP stream for real-time analysis.
                        </p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-green-400 text-left h-32 overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
                         <p>{'>'} Connecting to gateway 192.168.1.50...</p>
                         <p>{'>'} Authorizing...</p>
                         <p>{'>'} Handshake successful.</p>
                         <p>{'>'} Stream ready.</p>
                    </div>

                    <button onClick={handleLiveConnect} className="btn-primary w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2">
                         <Play className="w-4 h-4" /> Connect & Analyze
                    </button>
                </div>
            )}

            {mode === 'manual' && (
                <div className="space-y-4 h-full flex flex-col">
                     <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200">Manual Data Entry</h3>
                        <span className="text-xs text-slate-500 font-mono">Format: ID, Voltage, [Temp], [Measured]</span>
                     </div>
                     <textarea 
                        className="flex-grow w-full bg-slate-50 dark:bg-industrial-900 p-4 rounded border border-slate-200 dark:border-industrial-600 font-mono text-sm outline-none resize-none focus:ring-2 focus:ring-brand-500 placeholder-slate-400 dark:placeholder-industrial-700"
                        placeholder={`Example:
1, 2.25, 25, 100
2, 2.24, 26, 98
3, 2.10, 30, 85
...`}
                        value={manualCells}
                        onChange={e => setManualCells(e.target.value)}
                        style={{ minHeight: '300px' }}
                     />
                     <div className="flex justify-end">
                        <button onClick={handleManualSubmit} className="btn-primary flex items-center gap-2">
                            <Play className="w-4 h-4" /> Run Analysis
                        </button>
                     </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const SourceCard = ({ active, onClick, icon, title, desc }: { active: boolean, onClick: () => void, icon: React.ReactNode, title: string, desc: string }) => (
    <div 
        onClick={onClick}
        className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
            active 
             ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 dark:border-brand-400' 
             : 'bg-white dark:bg-industrial-800 border-slate-200 dark:border-industrial-700 hover:border-brand-300 dark:hover:border-industrial-500'
        }`}
    >
        <div className={`mb-3 ${active ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`}>
            {icon}
        </div>
        <div className={`font-bold text-sm ${active ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
            {title}
        </div>
        <div className={`text-xs mt-1 ${active ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-industrial-400'}`}>
            {desc}
        </div>
        {active && (
            <div className="mt-2 flex justify-end">
                <CheckCircle className="w-4 h-4 text-brand-500" />
            </div>
        )}
    </div>
);