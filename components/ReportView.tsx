import React from 'react';
import { AnalysisResult } from '../types';
import { 
  Printer, 
  ChevronLeft, 
  AlertTriangle,
  CheckCircle, 
  XCircle,
  Activity,
  User
} from 'lucide-react';

interface ReportViewProps {
  data: AnalysisResult;
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ data, onBack }) => {
  const handlePrint = () => window.print();
  const reportDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const reportId = `RPT-${new Date().getTime().toString().slice(-6)}`;

  return (
    <div className="bg-slate-100 dark:bg-industrial-900 min-h-screen pb-20 font-sans print:bg-white print:pb-0">
      
      {/* Toolbar - Screen Only */}
      <div className="print:hidden sticky top-0 z-40 bg-white/80 dark:bg-industrial-800/80 backdrop-blur-md border-b border-slate-200 dark:border-industrial-700 h-16 flex items-center justify-between px-6 shadow-sm">
         <button 
           onClick={onBack}
           className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-white transition-colors font-medium"
         >
            <ChevronLeft className="w-5 h-5" />
            Back to Analysis
         </button>
         <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider hidden sm:block">
               {reportId} • DRAFT PREVIEW
            </span>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-bold shadow-lg shadow-brand-500/20 transition-all hover:-translate-y-0.5"
            >
               <Printer className="w-4 h-4" />
               Print / Export PDF
            </button>
         </div>
      </div>

      <div className="max-w-[210mm] mx-auto my-8 print:m-0 print:w-full">
         
         {/* PAGE 1: COVER PAGE */}
         <div className="bg-white text-slate-900 shadow-2xl print:shadow-none p-[20mm] min-h-[297mm] relative flex flex-col justify-between overflow-hidden mb-8 print:mb-0 print:break-after-page">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-bl-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-100 rounded-tr-full pointer-events-none -z-10"></div>
            
            <div className="relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded bg-brand-600 flex items-center justify-center text-white shrink-0">
                        <Activity className="w-6 h-6" />
                     </div>
                     <div>
                        <h1 className="text-2xl font-bold text-slate-900">BatteryOn Analytics</h1>
                        <p className="text-sm text-slate-500">Comprehensive Engineering Assessment</p>
                     </div>
                  </div>

               <div className="mb-12">
                  <div className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-4">Engineering Report</div>
                  <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
                     Battery Health & <br/> Compliance Assessment
                  </h1>
                  <p className="text-xl text-slate-600 max-w-lg">
                     Comprehensive analysis of critical power infrastructure based on IEEE 450/1188 standards.
                  </p>
               </div>

               <div className="grid grid-cols-2 gap-8 border-t border-slate-200 pt-8 max-w-md">
                  <div>
                     <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Asset ID</div>
                     <div className="font-mono font-bold text-lg">BATT-STRING-01</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Report Date</div>
                    <div className="font-mono font-bold text-lg">{reportDate}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Assessed By</div>
                    <div className="font-bold text-lg flex items-center gap-2">
                       <User className="w-4 h-4 text-slate-400" />
                       Demo Engineer
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</div>
                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-sm font-bold border ${
                       data.grade === 'Excellent' ? 'bg-green-50 text-green-700 border-green-200' : 
                       data.grade === 'Warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                       {data.grade === 'Excellent' && <CheckCircle className="w-3 h-3" />}
                       {data.grade === 'Warning' && <AlertTriangle className="w-3 h-3" />}
                       {data.grade === 'Critical' && <XCircle className="w-3 h-3" />}
                       {data.grade}
                    </div>
                  </div>
               </div>
            </div>

            <div className="relative z-10 bottom-0">
               <div className="text-sm text-slate-500 mb-2">confidential engineering record</div>
               <div className="h-1 w-full bg-gradient-to-r from-brand-600 to-blue-500"></div>
            </div>
         </div>

         {/* PAGE 2: CONTENT */}
         <div className="bg-white text-slate-900 shadow-2xl print:shadow-none p-[15mm] min-h-[297mm] relative print:m-0">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-8">
               <div className="text-xs text-slate-400 font-mono uppercase">Ref: {reportId}</div>
               <div className="text-xs text-slate-400 font-bold uppercase">BatteryOn Analytics v2.1</div>
            </div>

            {/* 1. Executive Summary */}
            <section className="mb-10">
               <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-100 text-brand-700 text-xs">1</span>
                  Executive Summary
               </h2>
               
               <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mb-6">
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1">
                        <div className="text-sm text-slate-600 leading-relaxed text-justify">
                           <p className="mb-3">
                              A comprehensive diagnostic analysis was performed on <strong>{data.cells.length} cells</strong>. 
                              The system is currently operating at a mean voltage of <strong>{data.stats.meanVoltage.toFixed(3)}V</strong>.
                              {data.stats.avgCapacityPct ? (
                                 <>
                                    Capacity test results indicate a State of Health (SOH) of <strong>{data.stats.avgCapacityPct.toFixed(1)}%</strong>
                                    {(data.compliance.compliant && data.stats.avgCapacityPct > 80) ? ', within acceptable limits.' : ', requiring attention.'}
                                 </>
                              ) : (
                                 <>
                                    Advanced algorithmic projections indicate a Remaining Useful Life (RUL) of <strong>{data.prediction?.remainingMonths || 'N/A'} months</strong>.
                                 </>
                              )}
                           </p>
                           <p>
                              Compliance verification against {data.compliance.standards.join('/')} standards resulted in a 
                              <strong> {data.compliance.compliant ? 'PASS' : 'FAIL'}</strong> status.
                              {data.compliance.compliant 
                                 ? ' No critical deviations were detected during this assessment period.' 
                                 : ' Immediate attention is required for the highlighted deviations to ensure continued certification.'}
                           </p>
                        </div>
                     </div>
                     <div className="w-full md:w-48 shrink-0 flex flex-col gap-2">
                        <StatusMetric label="System Health" value={`${data.healthScore}/100`} score={data.healthScore} />
                        <StatusMetric label="Voltage Stab." value={data.stats.stdDev < 0.01 ? 'Good' : 'Poor'} neutral />
                        <StatusMetric label="Thermal Risk" value={data.thermal?.riskLevel || 'N/A'} inverse />
                     </div>
                  </div>
               </div>
            </section>

            {/* 2. Critical Findings */}
            <section className="mb-10">
               <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-100 text-brand-700 text-xs">2</span>
                  Actionable Findings
               </h2>

               {data.findings.length > 0 ? (
                  <table className="w-full text-sm border-collapse">
                     <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                           <th className="py-2 px-3 text-left font-bold text-slate-700 uppercase text-xs w-24">Severity</th>
                           <th className="py-2 px-3 text-left font-bold text-slate-700 uppercase text-xs">Observation</th>
                           <th className="py-2 px-3 text-left font-bold text-slate-700 uppercase text-xs w-1/3">Recommendation</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-200">
                        {data.findings.map((finding, idx) => (
                           <tr key={idx} className="break-inside-avoid">
                              <td className="py-3 px-3 align-top">
                                 <span className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                    finding.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                                    finding.severity === 'Warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                 }`}>
                                    {finding.severity}
                                 </span>
                              </td>
                              <td className="py-3 px-3 align-top">
                                 <div className="font-semibold text-slate-800">{finding.finding}</div>
                                 <div className="text-xs text-slate-500 mt-1">{finding.risk}</div>
                              </td>
                              <td className="py-3 px-3 align-top bg-slate-50/50">
                                 <div className="text-slate-700 font-medium text-xs">{finding.recommendationShort}</div>
                                 <div className="text-[10px] text-brand-600 font-mono mt-1">{finding.standardRef}</div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               ) : (
                  <div className="p-4 bg-green-50 border border-green-100 rounded text-green-800 text-sm flex items-center gap-3">
                     <CheckCircle className="w-5 h-5" />
                     <span>No actionable findings. System is operating within all design parameters.</span>
                  </div>
               )}
            </section>

            {/* 3. Visual Analytics (New Section) */}
            <section className="mb-10 page-break-inside-avoid">
               <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-100 text-brand-700 text-xs">3</span>
                  Visual Analytics
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Cell Health Map</h4>
                     <VoltageHeatmap cells={data.cells} />
                     <div className="flex justify-center gap-4 mt-4 text-[10px]">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-sm"></div>OK</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-sm"></div>Warning</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-sm"></div>Critical</div>
                     </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Voltage vs. Impedance Correlation</h4>
                     <CorrelationPlot cells={data.cells} />
                  </div>
               </div>
            </section>

            {/* 4. Detailed Technical Data (Brief) */}
            <section className="mb-8">
                <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200">
                  <span className="flex items-center justify-center w-6 h-6 rounded bg-brand-100 text-brand-700 text-xs">4</span>
                  Technical Statistics
               </h2>
               <div className="grid grid-cols-4 gap-4 text-center">
                  <StatBox label="Min Voltage" value={`${data.stats.minVoltage.toFixed(3)} V`} />
                  <StatBox label="Max Voltage" value={`${data.stats.maxVoltage.toFixed(3)} V`} />
                  <StatBox label="Avg Impedance" value={`${data.impedance?.avgImpedance.toFixed(2) || '-'} mΩ`} />
                  <StatBox label="Max Temp" value={`${data.thermal?.maxTemp.toFixed(1) || '-'} °C`} />
                  {data.stats.avgSG && (
                     <>
                        <StatBox label="Avg SG" value={data.stats.avgSG.toFixed(3)} />
                        <StatBox label="Min SG" value={data.stats.minSG?.toFixed(3) || '-'} />
                        <StatBox label="SG Spread" value={data.stats.sgSpread?.toFixed(3) || '-'} />
                        <StatBox label="Sulfation Risk" value={data.stats.avgSG < 1.210 ? 'HIGH' : 'LOW'} />
                     </>
                  )}
                  {data.stats.avgSG && (
                     <>
                        <StatBox label="Avg SG" value={data.stats.avgSG.toFixed(3)} />
                        <StatBox label="Min SG" value={data.stats.minSG?.toFixed(3) || '-'} />
                        <StatBox label="SG Spread" value={data.stats.sgSpread?.toFixed(3) || '-'} />
                        <StatBox label="Sulfation Risk" value={data.stats.avgSG < 1.200 ? 'HIGH' : 'LOW'} />
                     </>
                  )}
               </div>
            </section>

             {/* Signoff */}
             <div className="mt-auto pt-12 break-inside-avoid">
               <div className="flex gap-12">
                  <div className="flex-1">
                     <div className="h-16 border-b border-slate-300 mb-2"></div>
                     <div className="text-[10px] uppercase font-bold text-slate-500">Certified Inspector Signature</div>
                  </div>
                  <div className="flex-1">
                     <div className="h-16 border-b border-slate-300 mb-2"></div>
                     <div className="text-[10px] uppercase font-bold text-slate-500">Facility Manager Approval</div>
                  </div>
               </div>
               <div className="mt-8 text-center text-[10px] text-slate-400">
                  <p>This report is generated automatically by BatteryOn AI utilizing calibrated sensor data.</p>
                  <p>© 2026 BatteryOn. All rights reserved.</p>
               </div>
            </div>
         </div>
         
      </div>
    </div>
  );
};

const StatusMetric = ({ label, value, score, neutral, inverse }: any) => {
   let color = 'bg-slate-100 text-slate-700 border-slate-200';
   
   if (!neutral) {
      if (score) {
         if (score >= 90) color = 'bg-green-50 text-green-700 border-green-200';
         else if (score >= 70) color = 'bg-yellow-50 text-yellow-700 border-yellow-200';
         else color = 'bg-red-50 text-red-700 border-red-200';
      } else if (inverse) {
         // for risk levels (Low is good)
         if (value === 'Low') color = 'bg-green-50 text-green-700 border-green-200';
         else if (value === 'Medium') color = 'bg-yellow-50 text-yellow-700 border-yellow-200';
         else color = 'bg-red-50 text-red-700 border-red-200';
      } else {
          // Standard (High is good)
         if (value === 'Good') color = 'bg-green-50 text-green-700 border-green-200';
         else color = 'bg-red-50 text-red-700 border-red-200';
      }
   }

   return (
      <div className={`p-3 rounded border ${color} flex justify-between items-center`}>
         <span className="text-xs font-bold uppercase opacity-80">{label}</span>
         <span className="font-bold font-mono text-sm">{value}</span>
      </div>
   );
}

const StatBox = ({ label, value }: { label: string, value: string }) => (
   <div className="p-3 bg-slate-50 border border-slate-200 rounded">
      <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">{label}</div>
      <div className="text-slate-900 font-mono font-bold">{value}</div>
   </div>
);

// New Visualization Components

import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts';

const VoltageHeatmap = ({ cells }: { cells: any[] }) => {
   // Create a grid representation
   
   return (
      <div className="flex flex-wrap gap-1 justify-center">
         {cells.map((cell) => {
            const isLow = cell.status === 'Fail';
            const isWarn = cell.status === 'Warn';
            const colorClass = isLow ? 'bg-red-500' : isWarn ? 'bg-yellow-400' : 'bg-green-500';
            
            return (
               <div 
                  key={cell.cellId} 
                  className={`w-4 h-4 rounded-sm ${colorClass} hover:ring-2 ring-offset-1 ring-slate-400 cursor-help`}
                  title={`Cell ${cell.cellId}: ${cell.voltage.toFixed(2)}V`}
               />
            );
         })}
      </div>
   );
};

const CorrelationPlot = ({ cells }: { cells: any[] }) => {
   const data = cells.map(c => ({
      x: c.impedanceOhms || 0,
      y: c.voltage,
      id: c.cellId,
      status: c.status
   }));

   return (
      <div className="h-64 w-full">
         <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 20 }}>
               <XAxis type="number" dataKey="x" name="Impedance" unit="mΩ" stroke="#94a3b8" fontSize={12} tick={{fill: '#94a3b8'}} />
               <YAxis type="number" dataKey="y" name="Voltage" unit="V" stroke="#94a3b8" fontSize={12} tick={{fill: '#94a3b8'}} domain={['auto', 'auto']} />
               <ZAxis type="number" range={[50, 50]} />
               <ReTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                     const d = payload[0].payload;
                     return (
                        <div className="bg-slate-800 text-white text-xs p-2 rounded shadow-lg">
                           <p className="font-bold">Cell {d.id}</p>
                           <p>Imp: {d.x.toFixed(3)} mΩ</p>
                           <p>Volt: {d.y.toFixed(3)} V</p>
                        </div>
                     );
                  }
                  return null;
               }} />
               <Scatter name="Cells" data={data} fill="#8884d8">
                  {data.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.status === 'Fail' ? '#ef4444' : entry.status === 'Warn' ? '#eab308' : '#3b82f6'} />
                  ))}
               </Scatter>
            </ScatterChart>
         </ResponsiveContainer>
      </div>
   );
};