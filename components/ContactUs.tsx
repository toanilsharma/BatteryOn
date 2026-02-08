import React from 'react';
import { Mail, MapPin } from 'lucide-react';

export const ContactUs: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-4">Contact Us</h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">We're here to help with your battery diagnostics needs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-industrial-800 rounded-xl p-8 border border-slate-200 dark:border-industrial-700 shadow-sm">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Get in Touch</h2>
           
           <div className="space-y-6">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Email Us</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">For general inquiries and support:</p>
                    <a href="mailto:info.onesharma@gmail.com" className="text-brand-600 dark:text-brand-400 font-bold hover:underline">
                       info.onesharma@gmail.com
                    </a>
                 </div>
              </div>

              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Location</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                       BatteryOn Headquarters<br/>
                       Vadodara, Gujarat, India
                    </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white dark:bg-industrial-800 rounded-xl p-8 border border-slate-200 dark:border-industrial-700 shadow-sm">
           <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Send a Message</h2>
           <form className="space-y-4">
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Name</label>
                 <input type="text" className="w-full p-2 bg-slate-50 dark:bg-industrial-900 border border-slate-300 dark:border-industrial-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Your Name" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                 <input type="email" className="w-full p-2 bg-slate-50 dark:bg-industrial-900 border border-slate-300 dark:border-industrial-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="your@email.com" />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Message</label>
                 <textarea rows={4} className="w-full p-2 bg-slate-50 dark:bg-industrial-900 border border-slate-300 dark:border-industrial-600 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="How can we help you?"></textarea>
              </div>
              <button className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg transition-colors">
                 Send Message
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};
