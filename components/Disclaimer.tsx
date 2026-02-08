import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const Disclaimer: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-industrial-800 rounded-xl p-8 border border-slate-200 dark:border-industrial-700 shadow-sm animate-fade-in mb-12">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Disclaimer</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Last Updated: February 2026</p>

      <div className="space-y-6 text-slate-700 dark:text-slate-300 leading-relaxed">
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-lg flex items-start gap-3 mb-6">
           <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
           <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
             Important Safety Note: Working with industrial batteries involves significant electrical and chemical hazards.
           </p>
        </div>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. General Information</h2>
          <p>
            The information provided by BatteryOn ("we," "us," or "our") on our website and through our services is for general informational and educational purposes only. All information on the Site is provided in good faith, however we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, availability, or completeness of any information on the Site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Professional Advice Disclaimer</h2>
          <p>
            The Site cannot and does not contain engineering or safety advice. The battery health information is provided for general informational and educational purposes only and is not a substitute for professional engineering advice. Accordingly, before taking any actions based upon such information, we encourage you to consult with the appropriate professionals. We do not provide any kind of engineering or safety advice. THE USE OR RELIANCE OF ANY INFORMATION CONTAINED ON THE SITE IS SOLELY AT YOUR OWN RISK.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. External Links Disclaimer</h2>
          <p>
            The Site may contain (or you may be sent through the Site) links to other websites or content belonging to or originating from third parties or links to websites and features in banners or other advertising. Such external links are not investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Safety & Liability</h2>
          <p>
             Industrial batteries present risks including electric shock, arc flash, fire, and chemical burns. BatteryOn software provides diagnostic data based on user inputs and measurements but cannot guarantee the physical condition or safety of any equipment. Users are responsible for following all manufacturer guidelines, safety standards (such as OSHA, IEEE, NFPA), and using appropriate Personal Protective Equipment (PPE) when interacting with battery systems.
          </p>
        </section>
      </div>
    </div>
  );
};
