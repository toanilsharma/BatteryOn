import React from 'react';
import { Construction } from 'lucide-react';

export const FleetDashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50 dark:bg-industrial-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-industrial-700">
      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded-full mb-6">
        <Construction className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Fleet Management Dashboard</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md">
        This feature is part of the Phase 7 rollout. It will allow you to manage multi-site assets, aggregate data, and view global health metrics.
      </p>
      <div className="mt-8 flex gap-4">
        <button 
           onClick={() => alert('Detailed roadmap available in project documentation.')}
           className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold hover:bg-slate-300 transition-colors"
        >
           View Roadmap
        </button>
      </div>
    </div>
  );
};
