import React, { useState } from 'react';
import {
   LayoutDashboard,
   Activity,
   FileText,
   Settings,
   Bell,
   Search,
   BarChart3,
   Globe,
   ChevronDown,
   ArrowUp,
   Zap,
   BookOpen
} from 'lucide-react';
import { useTheme } from './ThemeContext';

interface NavItem {
   id: string;
   label: string;
   icon: React.ElementType;
   subItems?: { id: string; label: string; view: string }[];
}

interface AppLayoutProps {
   children: React.ReactNode;
   currentView: string;
   onNavigate: (view: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
   children,
   currentView,
   onNavigate,
}) => {
   const { theme, setTheme } = useTheme();

   // Scroll to Top Logic
   const mainContentRef = React.useRef<HTMLDivElement>(null);
   const [showScrollTop, setShowScrollTop] = useState(false);

   // Handle Scroll Event
   const handleScroll = () => {
      if (mainContentRef.current) {
         setShowScrollTop(mainContentRef.current.scrollTop > 300);
      }
   };

   const scrollToTop = () => {
      mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
   };

   const navItems: NavItem[] = [
      {
         id: 'landing',
         label: 'Home',
         icon: Globe,
         subItems: [
            { id: 'home-main', label: 'Overview', view: 'landing' },
            { id: 'home-features', label: 'Features', view: 'landing' },
            { id: 'home-solutions', label: 'Solutions', view: 'landing' },
         ]
      },
      {
         id: 'dashboard',
         label: 'Dashboard',
         icon: LayoutDashboard,
         subItems: [
            { id: 'dash-overview', label: 'Overview', view: 'dashboard' },
            { id: 'dash-alerts', label: 'Alerts', view: 'dashboard' },
            { id: 'dash-analytics', label: 'Analytics', view: 'dashboard' },
         ]
      },
      {
         id: 'analysis',
         label: 'Analysis Engine',
         icon: BarChart3,
         subItems: [
            { id: 'analysis-new', label: 'New Analysis', view: 'analysis' },
            { id: 'analysis-history', label: 'History', view: 'analysis' },
            { id: 'analysis-compare', label: 'Comparisons', view: 'analysis' },
         ]
      },
      {
         id: 'fluke-import',
         label: 'Fluke Import',
         icon: Zap,
         subItems: [
            { id: 'fluke-upload', label: 'Upload Data', view: 'fluke-import' },
            { id: 'fluke-history', label: 'Import History', view: 'fluke-import' },
         ]
      },
      {
         id: 'reports',
         label: 'Reports',
         icon: FileText,
         subItems: [
            { id: 'rep-recent', label: 'Recent Reports', view: 'reports' },
            { id: 'rep-templates', label: 'Templates', view: 'reports' },
            { id: 'rep-archive', label: 'Archive', view: 'reports' },
         ]
      },
      {
         id: 'standards',
         label: 'Standards Info',
         icon: BookOpen,
         subItems: [
            { id: 'std-methodology', label: 'Methodology', view: 'standards' },
         ]
      },
      {
         id: 'settings',
         label: 'Settings',
         icon: Settings,
         subItems: [
            { id: 'set-profile', label: 'User Profile', view: 'settings' },
            { id: 'set-system', label: 'System Config', view: 'settings' },
            { id: 'set-notif', label: 'Notifications', view: 'settings' },
         ]
      },
   ];

   return (
      <div className="flex h-screen bg-slate-50 dark:bg-industrial-900 font-sans text-slate-900 dark:text-white overflow-hidden transition-colors duration-200 flex-col">

         {/* HEADER */}
         <header className="h-20 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between px-6 z-50 shadow-md">

            {/* Brand & Logo */}
            <div className="flex items-center gap-12">
               <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
                  <div className="w-9 h-9 rounded bg-brand-500 flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/30">
                     <Activity className="text-white w-5 h-5" />
                  </div>
                  <div className="font-bold text-xl tracking-tight text-white">
                     BatteryOn
                  </div>
               </div>

               {/* MAIN NAVIGATION (Horizontal) */}
               <nav className="hidden md:flex items-center gap-1">
                  {navItems.map((item) => {
                     const isActive = currentView === item.id;
                     const hasSubItems = item.subItems && item.subItems.length > 0;

                     return (
                        <div key={item.id} className="relative group">
                           <button
                              onClick={() => onNavigate(item.id)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                               ${isActive
                                    ? 'bg-slate-800 text-brand-400'
                                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                                 }`}
                           >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                              {hasSubItems && <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />}
                           </button>

                           {/* Dropdown Menu */}
                           {hasSubItems && (
                              <div className="absolute top-full left-0 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-1 group-hover:translate-y-0">
                                 <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden p-1">
                                    {item.subItems?.map(sub => (
                                       <button
                                          key={sub.id}
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             onNavigate(sub.view);
                                          }}
                                          className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-md transition-colors flex items-center justify-between group/sub"
                                       >
                                          {sub.label}
                                       </button>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     );
                  })}
               </nav>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">

               {/* Search */}
               <div className="hidden lg:flex items-center bg-slate-800/50 rounded-full px-4 py-2 w-64 border border-slate-700 focus-within:border-brand-500 transition-all text-sm">
                  <Search className="w-4 h-4 text-slate-400 mr-2" />
                  <input
                     type="text"
                     placeholder="Search..."
                     className="bg-transparent border-none outline-none w-full text-white placeholder:text-slate-500 font-medium"
                  />
               </div>

               {/* Theme Toggle */}
               <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors text-xs font-bold"
                  aria-label="Toggle Theme"
               >
                  {theme === 'dark' ? 'LIGHT' : 'DARK'}
               </button>

               {/* Notifications */}
               <button className="relative p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-slate-900"></span>
               </button>

            </div>
         </header>

         {/* CONTENT SCROLL AREA */}
         <main
            ref={mainContentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-industrial-900 scroll-smooth relative flex flex-col"
         >
            {/* Scroll To Top Button */}
            <button
               onClick={scrollToTop}
               className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
               aria-label="Scroll to top"
            >
               <ArrowUp className="w-5 h-5" />
            </button>

            <div className="max-w-7xl mx-auto w-full pb-12 p-6 flex-1">
               {children}
            </div>

            {/* PROFESSIONAL FOOTER */}
            <footer className="mt-auto bg-slate-900 border-t border-slate-800 text-white">
               <div className="max-w-7xl mx-auto px-6 py-8">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-brand-500" />
                        <span className="font-bold text-lg tracking-tight">BatteryOn</span>
                     </div>

                     {/* Tools Links */}
                     <div className="flex bg-slate-800/50 rounded-full px-6 py-2 gap-6 border border-slate-700/50">
                        <button onClick={() => onNavigate('dashboard')} className="text-sm font-medium text-slate-300 hover:text-white hover:text-brand-400 transition-colors">Dashboard</button>
                        <button onClick={() => onNavigate('analysis')} className="text-sm font-medium text-slate-300 hover:text-white hover:text-brand-400 transition-colors">Analysis Engine</button>
                        <button onClick={() => onNavigate('reports')} className="text-sm font-medium text-slate-300 hover:text-white hover:text-brand-400 transition-colors">Reports</button>
                     </div>

                     <div className="text-xs text-slate-500">
                        © 2026 BatteryOn - Created by Anil Sharma
                     </div>
                  </div>
               </div>
            </footer>
         </main>
      </div>
   );
};
