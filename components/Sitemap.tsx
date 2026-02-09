import React from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  BookOpen, 
  Map, 
  ArrowRight
} from 'lucide-react';

export const Sitemap: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const sections = [
    {
      title: 'Main Application',
      icon: LayoutDashboard,
      links: [
        { name: 'Dashboard', view: 'dashboard', desc: 'Main overview of fleet status' },
        { name: 'Analysis Engine', view: 'analysis', desc: 'Upload and analyze battery data' },
        { name: 'Reports', view: 'reports', desc: 'Geneated engineering reports' },
      ]
    },
    {
      title: 'Resources',
      icon: BookOpen,
      links: [
        { name: 'System Settings', view: 'settings', desc: 'Configuration and preferences' },
      ]
    },
    {
      title: 'Public Pages',
      icon: Map,
      links: [
        { name: 'Landing Page', view: 'landing', desc: 'Marketing home and login' },
      ]
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
           <div className="w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white">
               <Activity className="w-5 h-5" />
           </div>
           <h1 className="text-2xl font-bold text-slate-900 dark:text-white">BatteryOn Site Map</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">Overview of all available modules and resources.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white dark:bg-industrial-800 rounded-xl shadow-lg border border-slate-200 dark:border-industrial-700 overflow-hidden">
             <div className="p-6 border-b border-slate-200 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-900/50 flex items-center gap-3">
                <section.icon className="w-5 h-5 text-brand-500" />
                <h2 className="font-bold text-slate-900 dark:text-white">{section.title}</h2>
             </div>
             <div className="p-2">
                {section.links.map((link, lIdx) => (
                   <button 
                     key={lIdx}
                     onClick={() => onNavigate(link.view)}
                     className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors group"
                   >
                      <div className="font-bold text-brand-600 dark:text-brand-400 group-hover:text-brand-700 dark:group-hover:text-brand-300 flex items-center gap-2">
                        {link.name}
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{link.desc}</div>
                   </button>
                ))}
             </div>
          </div>
        ))}
      </div>
      
      <div className="mt-12 p-8 bg-slate-100 dark:bg-industrial-900 rounded-xl text-center">
         <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">Need Help?</h3>
         <p className="text-sm text-slate-500 mb-4">Contact support for assistance with the Analysis Engine.</p>
         <button 
           onClick={() => onNavigate('contact')}
           className="px-6 py-2 bg-white dark:bg-industrial-800 border border-slate-300 dark:border-industrial-600 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all"
         >
           Contact Support
         </button>
      </div>

    </div>
  );
};


