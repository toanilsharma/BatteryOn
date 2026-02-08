import React from 'react';
import { AnalysisResult, HealthGrade } from '../types';
import { BarChart, Bar, ScatterChart, Scatter, LineChart, Line, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell, Legend, LabelList } from 'recharts';
import { Activity, FileText, Plus, Clock } from 'lucide-react';

interface DashboardProps {
  data?: AnalysisResult | null;
  onAnalyze?: () => void;
  onViewReports?: () => void;
  onGenerateReport?: () => void;
}

// Helper for color logic
const getCellColor = (status: 'OK' | 'Warn' | 'Fail', valuePct: number = 100) => {
  if (status === 'Fail') return '#ef4444'; // Red
  if (status === 'Warn') return '#eab308'; // Yellow
  
  // Healthy Gradient Logic (User Request)
  if (valuePct >= 100) return '#15803d'; // green-700 (Full Dark Green)
  if (valuePct >= 95) return '#16a34a'; // green-600
  if (valuePct >= 90) return '#22c55e'; // green-500
  return '#4ade80'; // green-400 (Lighter green)
};

const GradeBadge = ({ grade }: { grade: HealthGrade }) => {
  const colors = {
    [HealthGrade.Excellent]: 'bg-green-500/20 text-green-400 border-green-500/50',
    [HealthGrade.Good]: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    [HealthGrade.Warning]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    [HealthGrade.Critical]: 'bg-red-500/20 text-red-400 border-red-500/50',
  };
  return (
    <span className={`px-4 py-1 rounded-full border text-sm font-bold uppercase tracking-wider ${colors[grade]}`}>
      {grade}
    </span>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ 
  data, 
  onAnalyze, 
  onViewReports, 
  onGenerateReport 
}) => {
  
  // EMPTY STATE / OVERVIEW MODE
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-8 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-brand-500/10 p-6 rounded-full inline-block mb-4">
             <Activity className="w-16 h-16 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Analysis Dashboard</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            No active analysis session found. Start a new diagnostics run or view historical reports.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto mt-8">
            <button 
              onClick={onAnalyze}
              className="group flex flex-col items-center p-6 bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700 shadow-lg hover:shadow-xl hover:border-brand-500 transition-all duration-300"
            >
               <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                 <Plus className="w-8 h-8 text-brand-600 dark:text-brand-400" />
               </div>
               <span className="font-bold text-lg text-slate-900 dark:text-white">New Analysis</span>
               <span className="text-sm text-slate-500 mt-2">Upload CSV or manual entry</span>
            </button>

            <button 
              onClick={onViewReports}
              className="group flex flex-col items-center p-6 bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700 shadow-lg hover:shadow-xl hover:border-blue-500 transition-all duration-300"
            >
               <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg mb-4 group-hover:scale-110 transition-transform">
                 <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
               </div>
               <span className="font-bold text-lg text-slate-900 dark:text-white">View Reports</span>
               <span className="text-sm text-slate-500 mt-2">Access past diagnostics</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DATA VISUALIZATION MODE
  const hasCapacityData = data.cells.some(c => c.measuredAh !== undefined);
  const hasImpedanceData = data.cells.some(c => c.impedanceOhms !== undefined);
  
  const chartData = data.cells.map(c => {
    // Calculate Health % for Color Scaling
    let healthPct = 100;
    if (hasCapacityData && c.measuredAh && c.ratedAh) {
        healthPct = (c.measuredAh / c.ratedAh) * 100;
    } else {
        // Voltage deviation proxy (Rough estimation for color coding)
        const deviation = Math.abs(c.voltage - data.stats.meanVoltage);
        if (deviation < 0.01) healthPct = 100;
        else if (deviation < 0.05) healthPct = 95;
        else healthPct = 90;
    }

    return {
        id: c.cellId,
        voltage: c.voltage,
        measuredAh: c.measuredAh || 0,
        ratedAh: c.ratedAh || 0,
        impedanceOhms: c.impedanceOhms || 0,
        zScore: c.zScore,
        status: c.status,
        color: getCellColor(c.status, healthPct)
    };
  });

  // Dynamic width for scrolling charts
  const minChartWidth = Math.max(100, chartData.length * 45); 
  
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16 text-brand-600 dark:text-white" />
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Health Score</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-5xl font-mono font-bold ${data.healthScore < 75 ? 'text-red-500 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>{data.healthScore}</span>
            <span className="text-sm text-slate-400 dark:text-industrial-500">/ 100</span>
          </div>
          <div className="mt-4"><GradeBadge grade={data.grade} /></div>
        </div>
        
        <div className="card">
          <p className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Avg Voltage</p>
          <div className="mt-2 text-3xl font-mono font-bold text-slate-900 dark:text-white">{data.stats.meanVoltage.toFixed(3)} <span className="text-sm text-slate-400 font-normal">V</span></div>
          <p className="text-xs text-slate-500 dark:text-industrial-500 mt-2 flex justify-between">
             <span>Min: {data.stats.minVoltage.toFixed(3)}</span>
             <span>Max: {data.stats.maxVoltage.toFixed(3)}</span>
          </p>
        </div>

        <div className="card">
          <p className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Imbalance (ΔV)</p>
          <div className={`mt-2 text-3xl font-mono font-bold ${data.stats.deltaV > 0.1 ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
            {data.stats.deltaV.toFixed(3)} <span className="text-sm text-slate-400 font-normal">V</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-industrial-500 mt-2">StdDev: σ {data.stats.stdDev.toFixed(4)}</p>
        </div>

        <div className="card flex flex-col justify-between">
           <div>
             <p className="text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider">Standards Compliance</p>
             <p className={`mt-2 text-xl font-bold flex items-center gap-2 ${data.compliance.compliant ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
               {data.compliance.compliant ? (
                 <><span className="text-green-500">✔</span> COMPLIANT</>
               ) : (
                 <><span className="text-red-500">✖</span> NON-COMPLIANT</>
               )}
             </p>
           </div>
           {onGenerateReport && (
             <button onClick={onGenerateReport} className="btn-primary w-full mt-2 flex items-center justify-center gap-2">
               <FileText className="w-4 h-4" />
               Generate Report
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Voltage Chart */}
          <div className="card">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                 <span className="w-2 h-6 bg-brand-500 rounded-sm"></span>
                 Voltage Profile
               </h3>
               <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-industrial-900 px-2 py-1 rounded border border-slate-200 dark:border-industrial-700 font-medium">
                 Scroll to view all {chartData.length} cells
               </span>
            </div>
            
            <div className="h-80 w-full overflow-x-auto bg-slate-50 dark:bg-industrial-900/30 rounded border border-slate-200 dark:border-industrial-700/50 p-2 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-industrial-600">
              <div style={{ width: `${minChartWidth}px`, height: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                    <XAxis 
                      dataKey="id" 
                      stroke="#94a3b8" 
                      tick={{fontSize: 10}} 
                      interval={0}
                      label={{ value: 'Cell ID', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      domain={['auto', 'auto']} 
                      stroke="#94a3b8" 
                      tick={{fontSize: 11}}
                    />
                    <Tooltip 
                      cursor={{fill: 'transparent', stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3'}}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-industrial-800 border border-slate-200 dark:border-industrial-600 p-3 rounded shadow-xl text-xs">
                              <p className="font-bold text-slate-900 dark:text-white mb-1">Cell {label}</p>
                              <p className="text-slate-600 dark:text-industrial-300">Voltage: <span className="font-mono font-bold">{item.voltage.toFixed(3)} V</span></p>
                              <p className="text-slate-600 dark:text-industrial-300">Z-Score: <span className={`${Math.abs(item.zScore) > 2 ? 'text-yellow-600 dark:text-yellow-400' : ''} font-mono`}>{item.zScore.toFixed(2)}</span></p>
                              <p className="text-slate-600 dark:text-industrial-300">Status: <span className={item.status === 'OK' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>{item.status}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={data.stats.meanVoltage} stroke="#3b82f6" strokeDasharray="5 5" />
                    <Bar dataKey="voltage" name="Voltage (V)" radius={[2, 2, 0, 0]}>
                      <LabelList dataKey="voltage" position="top" fontSize={10} formatter={(val: number) => val.toFixed(2)} />
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Capacity Chart (Conditional) */}
          {hasCapacityData && (
            <div className="card">
              <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                 <span className="w-2 h-6 bg-green-500 rounded-sm"></span>
                 Capacity Test Results (Ah)
              </h3>
              <div className="h-80 w-full overflow-x-auto bg-slate-50 dark:bg-industrial-900/30 rounded border border-slate-200 dark:border-industrial-700/50 p-2 scrollbar-thin">
                <div style={{ width: `${minChartWidth}px`, height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                      <XAxis dataKey="id" stroke="#94a3b8" tick={{fontSize: 10}} interval={0} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                         cursor={{fill: 'transparent', stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3'}}
                         contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.5rem' }}
                      />
                      <ReferenceLine y={chartData[0].ratedAh * 0.8} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: '80% EOL', fill: '#ef4444', fontSize: 10 }} />
                      <Bar dataKey="measuredAh" name="Measured (Ah)" radius={[2, 2, 0, 0]}>
                          <LabelList dataKey="measuredAh" position="top" fontSize={10} formatter={(val: number) => val.toFixed(1)} />
                          {chartData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Bar>
                      <Bar dataKey="ratedAh" fill="#64748b" name="Rated (Ah)" opacity={0.2} radius={[2, 2, 0, 0]} />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Discharge Curve (Added Feature) */}
              {data.dischargeCurve && (
                 <div className="mt-6 border-t border-slate-200 dark:border-industrial-700 pt-6">
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Discharge Performance Curve</h4>
                    <div className="h-64 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.dischargeCurve}>
                             <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                             <XAxis dataKey="timeMinutes" label={{ value: 'Time (min)', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                             <YAxis domain={['auto', 'auto']} label={{ value: 'String Voltage (V)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                             <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
                                formatter={(value: number) => [`${value.toFixed(1)} V`, 'Voltage']}
                                labelFormatter={(label) => `${label} min`}
                             />
                             <Line type="monotone" dataKey="voltage" stroke="#2563eb" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              )}
            </div>
          )}

          {/* Impedance Chart (Conditional) */}
          {hasImpedanceData && (
            <div className="card">
              <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                 <span className="w-2 h-6 bg-purple-500 rounded-sm"></span>
                 Internal Resistance Profile (mΩ)
              </h3>
              <div className="h-80 w-full overflow-x-auto bg-slate-50 dark:bg-industrial-900/30 rounded border border-slate-200 dark:border-industrial-700/50 p-2 scrollbar-thin">
                <div style={{ width: `${minChartWidth}px`, height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} vertical={false} />
                      <XAxis dataKey="id" stroke="#94a3b8" tick={{fontSize: 10}} interval={0} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                         cursor={{fill: 'transparent', stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3'}}
                         contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '0.5rem' }}
                      />
                      <ReferenceLine y={chartData.reduce((acc, curr) => acc + (curr.impedanceOhms || 0), 0) / chartData.length * 1.5} stroke="#ef4444" strokeWidth={2} strokeDasharray="3 3" label={{ value: '+50% Limit', fill: '#ef4444', fontSize: 10 }} />
                      <Bar dataKey="impedanceOhms" fill="#8b5cf6" name="Impedance (mΩ)" radius={[2, 2, 0, 0]}>
                          <LabelList dataKey="impedanceOhms" position="top" fontSize={10} formatter={(val: number) => val.toFixed(2)} />
                      </Bar>
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Ohmic Correlation Plot (Advanced Analysis) */}
          {hasImpedanceData && (
            <div className="card">
              <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2">
                 <span className="w-2 h-6 bg-blue-600 rounded-sm"></span>
                 Ohmic Correlation Analysis (V/R)
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Classic "Bathtub Curve" analysis. Cells with <strong>High Impedance AND Low Voltage</strong> (bottom-right) are critical replacement targets.
              </p>
              <div className="h-80 w-full bg-slate-50 dark:bg-industrial-900/30 rounded border border-slate-200 dark:border-industrial-700/50 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.2} />
                    <XAxis type="number" dataKey="impedanceOhms" name="Impedance" unit="mΩ" stroke="#94a3b8" label={{ value: 'Internal Resistance (mΩ)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis type="number" dataKey="voltage" name="Voltage" unit="V" domain={['auto', 'auto']} stroke="#94a3b8" label={{ value: 'Voltage (V)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }} />
                    <ZAxis type="number" range={[100, 100]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                       content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             const data = payload[0].payload;
                             return (
                                <div className="bg-white dark:bg-industrial-800 border border-slate-200 dark:border-industrial-600 p-2 rounded shadow text-xs">
                                   <div className="font-bold">Cell {data.id}</div>
                                   <div>{data.voltage.toFixed(3)} V</div>
                                   <div>{data.impedanceOhms.toFixed(2)} mΩ</div>
                                   <div className={`font-bold mt-1 ${data.status === 'Fail' ? 'text-red-500' : 'text-green-500'}`}>{data.status}</div>
                                </div>
                             );
                          }
                          return null;
                       }}
                    />
                    <Legend />
                    {/* Quadrant Lines (approximate mean) */}
                    <ReferenceLine x={data.stats.meanVoltage} stroke="#9ca3af" strokeDasharray="3 3" />
                    <ReferenceLine y={data.cells.reduce((acc, c) => acc + (c.impedanceOhms||0), 0) / data.cells.length} stroke="#9ca3af" strokeDasharray="3 3" />
                    
                    <Scatter name="Healthy Cells" data={chartData.filter(c => c.status === 'OK')} fill="#10b981" />
                    <Scatter name="Warning" data={chartData.filter(c => c.status === 'Warn')} fill="#eab308" />
                    <Scatter name="Critical" data={chartData.filter(c => c.status === 'Fail')} fill="#ef4444" shape="square" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Cell Map */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-slate-900 dark:text-white font-bold">Cell Health Map</h3>
              <div className="flex gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-600 rounded"></div> Excellent</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded"></div> Good</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded"></div> Warn</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded"></div> Fail</div>
              </div>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 xl:grid-cols-20 gap-1.5 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {chartData.map((c) => (
                <div 
                  key={c.id} 
                  title={`Cell ${c.id}: ${c.voltage.toFixed(3)}V | ${c.measuredAh ? c.measuredAh.toFixed(1)+'Ah' : ''} | ${c.status}`}
                  className="aspect-square rounded flex items-center justify-center text-[10px] font-mono font-bold cursor-help transition-all hover:scale-110 border border-transparent shadow-sm hover:shadow-md text-white border-white/20"
                  style={{ backgroundColor: c.color }}
                >
                  {c.id}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Statistics & Risk Panel (Phase 15) */}
        {data.advancedStats && (
           <div className="lg:col-span-1 border-t pt-4 lg:pt-0 lg:border-t-0 card bg-slate-50 dark:bg-industrial-900 border-l border-slate-200 dark:border-industrial-700">
              <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-industrial-700 pb-3 px-2">
                 <Activity className="w-5 h-5 text-purple-600" />
                 Predictive Analytics
              </h3>

              <div className="space-y-6 px-2">
                 {/* 1. RUL Gauge */}
                 <div className="bg-white dark:bg-industrial-800 rounded-lg p-4 border border-slate-200 dark:border-industrial-700 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                       <Clock className="w-12 h-12 text-blue-500" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-500 dark:text-industrial-400 uppercase tracking-wider mb-1">Estimated RUL</h4>
                    <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white">
                       {data.advancedStats.estimatedRUL} <span className="text-sm font-sans font-normal text-slate-500">Years</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                       Replacement Due: <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(data.advancedStats.replacementDeadline).toLocaleDateString()}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-industrial-700 h-1.5 rounded-full mt-3 overflow-hidden">
                       <div 
                          className={`h-full rounded-full ${data.advancedStats.estimatedRUL < 1 ? 'bg-red-500' : data.advancedStats.estimatedRUL < 3 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                          style={{ width: `${(data.advancedStats.estimatedRUL / 10) * 100}%` }}
                       ></div>
                    </div>
                 </div>

                 {/* 2. Financial Risk */}



                 {/* 3. Histogram */}
                 <div className="bg-white dark:bg-industrial-800 rounded-lg p-2 border border-slate-200 dark:border-industrial-700 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-industrial-400 uppercase tracking-wider mb-2 px-2">Voltage Distribution</h4>
                    <div className="h-40 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.advancedStats.histogram}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                             <XAxis dataKey="range" tick={{fontSize: 9}} interval={0} angle={-15} textAnchor="end" height={40} stroke="#94a3b8" />
                             <YAxis tick={{fontSize: 10}} stroke="#94a3b8" />
                             <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{fontSize: '12px', borderRadius: '4px'}}
                             />
                             <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey="count" position="top" fontSize={10} fill="#64748b" />
                             </Bar>
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {/* Expert Reliability Analysis Panel */}
        <div className="lg:col-span-1 card flex flex-col h-full max-h-[800px] overflow-hidden bg-slate-50 dark:bg-industrial-900 border-l border-slate-200 dark:border-industrial-700">
          <h3 className="text-slate-900 dark:text-white font-bold mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-industrial-700 pb-3 px-2">
            <Activity className="w-5 h-5 text-brand-600" />
            Expert Reliability Analysis
            <span className="bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 text-xs px-2 py-0.5 rounded-full ml-auto">{data.findings.length} Issues</span>
          </h3>
          
          <div className="overflow-y-auto pr-2 space-y-4 custom-scrollbar flex-1 px-2 pb-2">
            {data.findings.length === 0 && (
              <div className="text-center py-12 opacity-60">
                 <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-full inline-block mb-3">
                    <Activity className="w-12 h-12 text-green-500" />
                 </div>
                 <p className="text-slate-900 dark:text-white font-bold">System Nominal</p>
                 <p className="text-sm text-slate-500">No reliability risks detected.</p>
              </div>
            )}
            
            {data.findings.map((f, i) => (
              <div key={i} className="bg-white dark:bg-industrial-800 rounded-lg shadow-sm border border-slate-200 dark:border-industrial-700 overflow-hidden group hover:shadow-md transition-shadow">
                {/* 1. Header */}
                <div className={`p-3 flex justify-between items-start border-b ${f.severity === 'Critical' ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30'}`}>
                   <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 ${f.severity === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                         {f.severity === 'Critical' ? <Activity className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                         {f.severity} Risk
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{f.finding}</h4>
                   </div>
                </div>

                <div className="p-4 space-y-4">
                   {/* 2. Reliability Impact */}
                   {f.reliabilityImpact && (
                      <div className="text-xs text-slate-600 dark:text-industrial-300 bg-slate-50 dark:bg-industrial-700/30 p-2 rounded border border-slate-100 dark:border-industrial-600 italic">
                         <strong className="text-slate-800 dark:text-slate-200 not-italic">Impact:</strong> {f.reliabilityImpact}
                      </div>
                   )}

                   {/* 3. Safety Precautions (If Critical) */}
                   {f.precautions && f.precautions.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded p-2">
                         <h5 className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            ⚠️ Safety Precautions
                         </h5>
                         <ul className="list-disc list-inside text-xs text-red-800 dark:text-red-300 space-y-0.5">
                            {f.precautions.map((p, idx) => <li key={idx}>{p}</li>)}
                         </ul>
                      </div>
                   )}

                   {/* 4. Action Plan Grid */}
                   <div className="grid grid-cols-1 gap-3">
                      {f.shortTermActions && (
                         <div>
                            <h5 className="text-[10px] font-bold text-slate-500 dark:text-industrial-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                               ⚡ Immediate Actions (0-7 Days)
                            </h5>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                               {f.shortTermActions.map((action, idx) => (
                                  <li key={idx} className="flex gap-2 items-start">
                                     <span className="text-brand-500 mt-0.5">•</span>
                                     <span>{action}</span>
                                  </li>
                               ))}
                            </ul>
                         </div>
                      )}
                      
                      {f.longTermActions && (
                         <div className="mt-2 pt-2 border-t border-slate-100 dark:border-industrial-700">
                            <h5 className="text-[10px] font-bold text-slate-500 dark:text-industrial-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                               🛡️ Long-Term Strategy
                            </h5>
                            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                               {f.longTermActions.map((action, idx) => (
                                  <li key={idx} className="flex gap-2 items-start">
                                     <span className="text-blue-500 mt-0.5">→</span>
                                     <span>{action}</span>
                                  </li>
                               ))}
                            </ul>
                         </div>
                      )}
                   </div>
                </div>

                {/* 5. Standards Footer */}
                {f.globalStandards && (
                   <div className="bg-slate-50 dark:bg-industrial-900/50 px-3 py-2 border-t border-slate-100 dark:border-industrial-700 flex flex-wrap gap-2 items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Ref:</span>
                      {f.globalStandards.map((std, idx) => (
                         <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-industrial-800 border border-slate-200 dark:border-industrial-600 rounded text-slate-500 dark:text-industrial-400 font-mono">
                            {std}
                         </span>
                      ))}
                   </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Weak Cell Table */}
      {chartData.some(c => c.status !== 'OK') && (
        <div className="card overflow-hidden mt-6 p-0">
           <div className="p-4 bg-slate-50 dark:bg-industrial-700/30 border-b border-slate-200 dark:border-industrial-700 flex justify-between items-center">
             <h3 className="text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wide">Flagged Cells Detail</h3>
             <span className="text-xs text-slate-500 dark:text-industrial-400">Total: {chartData.filter(c => c.status !== 'OK').length}</span>
           </div>
           <div className="max-h-80 overflow-y-auto custom-scrollbar">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-100 dark:bg-industrial-900/80 text-slate-500 dark:text-industrial-400 sticky top-0 backdrop-blur-sm">
                 <tr>
                   <th className="p-4">Cell ID</th>
                   <th className="p-4">Voltage</th>
                   {hasCapacityData && <th className="p-4">Measured Ah</th>}
                   {hasImpedanceData && <th className="p-4">Impedance</th>}
                   <th className="p-4">Z-Score</th>
                   <th className="p-4">Deviation</th>
                   <th className="p-4 text-right">Status</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-industrial-700 text-slate-700 dark:text-slate-300">
                 {chartData.filter(c => c.status !== 'OK').map(c => (
                   <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-industrial-700/30 transition-colors">
                     <td className="p-4 font-mono font-bold">{c.id}</td>
                     <td className="p-4 font-mono">{c.voltage.toFixed(3)} V</td>
                     {hasCapacityData && <td className="p-4 font-mono">{c.measuredAh.toFixed(1)}</td>}
                     {hasImpedanceData && <td className="p-4 font-mono">{c.impedanceOhms.toFixed(2)} mΩ</td>}
                     <td className="p-4 font-mono text-slate-500 dark:text-industrial-400">{c.zScore.toFixed(2)}</td>
                     <td className="p-4 font-mono text-xs">
                       {(c.voltage - data.stats.meanVoltage) > 0 ? '+' : ''}{(c.voltage - data.stats.meanVoltage).toFixed(3)} V
                     </td>
                     <td className="p-4 text-right">
                       <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                         c.status === 'Fail' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/30' : 
                         'bg-amber-100 text-amber-700 dark:bg-yellow-500/20 dark:text-yellow-400 border border-amber-200 dark:border-yellow-500/30'
                       }`}>
                         {c.status}
                       </span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};