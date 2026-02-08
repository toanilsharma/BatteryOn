import React from 'react';
import { Shield, Activity, Zap, BookOpen, ArrowRight, BarChart3 } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';

interface LandingPageProps {
  onStart: () => void;
  onViewKnowledge: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onViewKnowledge }) => {
  useTheme(); // Theme context is used for global state

  return (
    <div className="w-full relative animate-fade-in" style={{ backgroundColor: 'white' }}>
      
      {/* Background Gradients - Light mode uses subtle blue, dark mode uses white glow */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

      {/* Hero Section */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 pt-20 pb-32 text-center bg-white dark:bg-transparent">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50/50 dark:bg-white/5 border border-brand-200 dark:border-white/10 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-8 backdrop-blur-sm animate-fade-in-up">
           <span className="flex h-2 w-2 relative">
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
           </span>
           v2.1 Enterprise Release
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-8 leading-[1.1] tracking-tight animate-fade-in-up delay-100">
          BatteryOn Intelligence <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-blue-500 to-brand-600 dark:from-brand-400 dark:via-blue-400 dark:to-brand-400 animate-gradient-x">
            Built for Industry.
          </span>
        </h1>
        
        <p 
          className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200"
          style={{ color: '#1a1a1a' }}
        >
          The comprehensive platform for IEEE compliant testing, predictive maintenance, and fleet-wide battery health monitoring.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
          <button 
            onClick={onStart}
            className="group relative px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-lg rounded-xl shadow-xl shadow-brand-500/30 transition-all hover:-translate-y-1 flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            <span>Start Analysis</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onViewKnowledge}
            className="group px-8 py-4 bg-slate-800 dark:bg-white/10 text-white dark:text-white font-bold text-lg rounded-xl border border-slate-800 dark:border-white/20 hover:bg-slate-700 dark:hover:bg-white/20 transition-all hover:-translate-y-1 flex items-center gap-2 shadow-lg"
          >
            <BookOpen className="w-5 h-5 text-white" />
            Knowledge Base
          </button>
        </div>

        {/* Hero Image Visual */}
        <div className="mt-20 relative animate-fade-in-up delay-500 group max-w-4xl mx-auto">
           <div className="absolute inset-0 bg-brand-500/30 blur-[100px] rounded-full pointer-events-none"></div>
           <div className="relative rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden group-hover:scale-[1.01] transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 opactiy-60"></div>
              <img 
                 src="/assets/images/dashboard-hero.svg" 
                 alt="Advanced Analytics Dashboard" 
                 className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
              {/* Overlay Badge */}
              <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-lg border border-white/20">
                 <div className="w-10 h-10 rounded bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/50">
                    <Activity className="w-6 h-6 text-white" />
                 </div>
                 <div className="text-left">
                    <div className="text-xs text-brand-200 font-bold uppercase tracking-wider">System Status</div>
                    <div className="text-white font-bold text-sm">Real-time Monitoring Active</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Trust Signals */}
      <div className="w-full border-y border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/[0.02] py-16">
         <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-bold text-gray-800 dark:text-slate-300 uppercase tracking-widest mb-10">Trusted Standard Compliance</p>
            <div className="flex flex-wrap justify-center gap-12 md:gap-20">
               {['IEEE-450', 'IEEE-1188', 'NERC PRC-005', 'IEC 60896'].map((std) => (
                  <div key={std} className="text-2xl font-display font-bold text-gray-900 dark:text-slate-300 flex items-center gap-2">
                     <ShieldCheck className="w-6 h-6" />
                     {std}
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* Feature Grid */}
      <div id="features" className="max-w-7xl mx-auto px-6 py-32 w-full">
         <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-6">
               Engineered for Reliability
            </h2>
            <p className="text-lg text-slate-800 dark:text-slate-200 font-medium">
               Replacing manual spreadsheets with automated, audit-ready intelligence.
            </p>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
               icon={<Zap className="w-6 h-6 text-yellow-500" />}
               title="Predictive Engine"
               desc="Advanced algorithms utilizing IEEE-1188 standards to predict cell degradation and failure months in advance."
            />
            <FeatureCard 
               icon={<Shield className="w-6 h-6 text-green-500" />}
               title="Compliance Verified"
               desc="Automated checks against international safety standards ensuring 100% audit-readiness for your facility."
            />
            <FeatureCard 
               icon={<BarChart3 className="w-6 h-6 text-brand-500" />}
               title="Executive Reporting"
               desc="Generate comprehensive, branded PDF reports containing executive summaries and detailed technical appendices."
            />
         </div>
      </div>

      {/* CTA Footer */}
      {/* CTA Section - Simplified for Internal View */}
      <div className="w-full bg-gradient-to-r from-slate-900 to-slate-800 py-12 px-6 text-center text-white rounded-2xl shadow-xl mx-auto max-w-6xl mb-12">
         <h2 className="text-3xl font-display font-bold mb-4">Start your diagnostic session</h2>
         <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Access the Analysis Engine to process battery data or check the Knowledge Base for maintenance standards.
         </p>
         <div className="flex justify-center gap-4">
            <button 
                onClick={onStart}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-brand-500/20"
            >
                Start Analysis
            </button>
         </div>
      </div>

    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-8 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all hover:shadow-xl group">
    <div className="w-12 h-12 bg-slate-50 dark:bg-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{desc}</p>
  </div>
);

const ShieldCheck = ({ className }: { className?: string }) => (
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
   </svg>
);
