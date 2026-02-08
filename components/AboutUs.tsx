import React from 'react';
import { Activity, Zap, Shield, Globe } from 'lucide-react';

export const AboutUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">About BatteryOn</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">Empowering Critical Infrastructure with Battery Intelligence</p>
      </div>

      <div className="bg-white dark:bg-industrial-800 rounded-xl p-8 border border-slate-200 dark:border-industrial-700 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Our Mission</h2>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
          BatteryOn is dedicated to providing industrial-grade diagnostics and predictive analytics for critical power backup systems. 
          We understand that reliable power is the backbone of modern infrastructure, and battery failure is not an option.
          Our mission is to replace manual, error-prone testing with automated, standards-compliant intelligence that ensures your backup systems are ready when you need them most.
        </p>
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
           Created by <strong>Anil Sharma</strong>, BatteryOn leverages deep industry expertise to solve the complex challenges of battery fleet management.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700">
           <Zap className="w-8 h-8 text-yellow-500 mb-4" />
           <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Predictive Capability</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">Advanced algorithms that forecast degradation before it becomes a failure.</p>
        </div>
        <div className="p-6 bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700">
           <Shield className="w-8 h-8 text-green-500 mb-4" />
           <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Compliance First</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">Built-in adherence to IEC, IEEE, and NERC standards for total audit readiness.</p>
        </div>
        <div className="p-6 bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700">
           <Globe className="w-8 h-8 text-blue-500 mb-4" />
           <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Global Scale</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400">Scalable architecture designed to manage fleets across multiple sites and regions.</p>
        </div>
      </div>
    </div>
  );
};
