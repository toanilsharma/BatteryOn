import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  ChevronRight,
  Calendar,
  Filter
} from 'lucide-react';

export const ComplianceDashboard: React.FC = () => {
  const [selectedStandard, setSelectedStandard] = useState<string>('all');

  const complianceData = [
    {
      id: 'ieee-450',
      standard: 'IEEE 450-2020',
      title: 'VLA Maintenance Schedule',
      type: 'Maintenance',
      status: 'Warning',
      compliance: 85,
      nextAudit: '2026-03-15',
      items: [
         { task: 'Monthly Pilot Cell Inspection', status: 'Pass', lastDate: '2026-02-01', nextDate: '2026-03-01' },
         { task: 'Quarterly Voltage Check', status: 'Pass', lastDate: '2025-12-15', nextDate: '2026-03-15' },
         { task: 'Annual Capacity Test', status: 'Warning', lastDate: '2024-01-10', nextDate: '2025-01-10', note: 'Overdue by 28 days' },
         { task: 'Visual Rack Inspection', status: 'Pass', lastDate: '2026-02-01', nextDate: '2026-03-01' },
      ]
    },
    {
      id: 'ieee-1188',
      standard: 'IEEE 1188-2005',
      title: 'VRLA Inspection (UPS-A)',
      type: 'Maintenance',
      status: 'Pass',
      compliance: 100,
      nextAudit: '2026-02-28',
      items: [
         { task: 'Monthly Float Voltage', status: 'Pass', lastDate: '2026-02-01', nextDate: '2026-03-01' },
         { task: 'Quarterly Internal Ohmic', status: 'Pass', lastDate: '2025-12-20', nextDate: '2026-03-20' },
         { task: 'Ambient Temperature Log', status: 'Pass', lastDate: '2026-02-07', nextDate: '2026-02-08' },
      ]
    },
    {
       id: 'nerc-prc',
       standard: 'NERC PRC-005-6',
       title: 'Protection System Maint.',
       type: 'Regulatory',
       status: 'Critical',
       compliance: 60,
       nextAudit: '2026-02-10',
       items: [
          { task: 'Battery Continuity Test', status: 'Fail', lastDate: '2025-08-01', nextDate: '2026-02-01', note: 'Missing data for String 3' },
          { task: 'DC Supply Voltage Monitor', status: 'Pass', lastDate: '2026-02-01', nextDate: '2026-03-01' },
          { task: 'Unintentional Ground Detection', status: 'Pass', lastDate: '2026-02-01', nextDate: '2026-03-01' }
       ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white dark:bg-industrial-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700 flex items-center justify-between">
            <div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Compliance</div>
               <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white mt-2">82.5%</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
               <ShieldCheck className="w-6 h-6" />
            </div>
         </div>
         
         <div className="bg-white dark:bg-industrial-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700 flex items-center justify-between">
            <div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Open Audits</div>
               <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white mt-2">3</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
               <FileText className="w-6 h-6" />
            </div>
         </div>

         <div className="bg-white dark:bg-industrial-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700 flex items-center justify-between">
            <div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">High Risks</div>
               <div className="text-3xl font-mono font-bold text-slate-900 dark:text-white mt-2 text-red-600">1</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
               <AlertTriangle className="w-6 h-6" />
            </div>
         </div>

         <div className="bg-white dark:bg-industrial-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700 flex items-center justify-between">
            <div>
               <div className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Next Audit</div>
               <div className="text-lg font-bold text-slate-900 dark:text-white mt-2">Feb 10</div>
               <div className="text-xs text-slate-500">NERC PRC-005</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
               <Calendar className="w-6 h-6" />
            </div>
         </div>
      </div>

      {/* Control Bar */}
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-500" />
            Active Compliance Frameworks
         </h2>
         <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white dark:bg-industrial-800 border border-slate-200 dark:border-industrial-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
               <Filter className="w-4 h-4" />
               Filter Standards
            </button>
            <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
               Generate Compliance Report
            </button>
         </div>
      </div>

      {/* Standards List */}
      <div className="space-y-6">
         {complianceData.map((std) => (
            <div key={std.id} className="bg-white dark:bg-industrial-800 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700 overflow-hidden">
               {/* Framework Header */}
               <div className="p-6 border-b border-slate-200 dark:border-industrial-700 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/5">
                  <div className="flex items-start gap-4">
                     <div className={`mt-1 w-2 h-12 rounded-full ${
                        std.status === 'Pass' ? 'bg-green-500' : 
                        std.status === 'Warning' ? 'bg-yellow-500' : 'bg-red-500'
                     }`}></div>
                     <div>
                        <div className="flex items-center gap-3 mb-1">
                           <h3 className="text-lg font-bold text-slate-900 dark:text-white">{std.title}</h3>
                           <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-200 dark:bg-industrial-700 text-slate-600 dark:text-slate-300">
                              {std.standard}
                           </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                           {std.type} Framework • Next Audit: {std.nextAudit}
                        </p>
                     </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                     <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Compliance Score</div>
                        <div className="text-2xl font-mono font-bold">{std.compliance}%</div>
                     </div>
                     <div className="w-32 h-2 bg-slate-200 dark:bg-industrial-900 rounded-full overflow-hidden">
                        <div 
                           className={`h-full rounded-full ${
                              std.compliance >= 90 ? 'bg-green-500' : 
                              std.compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                           }`}
                           style={{ width: `${std.compliance}%` }}
                        ></div>
                     </div>
                  </div>
               </div>

               {/* Checklist Items */}
               <div className="divide-y divide-slate-100 dark:divide-industrial-700">
                  {std.items.map((item, idx) => (
                     <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className={`p-1.5 rounded-full ${
                              item.status === 'Pass' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                              item.status === 'Warning' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                           }`}>
                              {item.status === 'Pass' && <CheckCircle className="w-4 h-4" />}
                              {item.status === 'Warning' && <Clock className="w-4 h-4" />}
                              {item.status === 'Fail' && <AlertTriangle className="w-4 h-4" />}
                           </div>
                           <div>
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.task}</div>
                              {item.note && <div className="text-xs text-red-500 mt-0.5 font-medium">{item.note}</div>}
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-8 text-xs text-slate-500 dark:text-slate-400">
                           <div className="hidden md:block">
                              <span className="uppercase tracking-wider opacity-70 mr-2">Last:</span>
                              <span className="font-mono">{item.lastDate}</span>
                           </div>
                           <div className="hidden md:block">
                              <span className="uppercase tracking-wider opacity-70 mr-2">Next:</span>
                              <span className="font-mono">{item.nextDate}</span>
                           </div>
                           <button className="p-1 hover:bg-slate-200 dark:hover:bg-industrial-700 rounded transition-colors">
                              <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
               
               {/* Footer Action */}
               <div className="p-3 bg-slate-50 dark:bg-industrial-900/50 text-center border-t border-slate-200 dark:border-industrial-700">
                  <button className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 uppercase tracking-widest transition-colors">
                     View Complete Checklist
                  </button>
               </div>
            </div>
         ))}
      </div>

    </div>
  );
};
