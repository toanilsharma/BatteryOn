import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  FileText, 
  BookOpen, 
  Settings, 
  Bell, 
  Search, 
  BarChart3,
  ShieldCheck,
  Globe,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ChevronDown,
  X
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
  user?: { name: string; role: string };
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  currentView, 
  onNavigate,
  user = { name: 'Demo User', role: 'Engineer' }
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  
  const toggleSubMenu = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
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
      id: 'monitoring', 
      label: 'Live Monitoring', 
      icon: Activity,
      subItems: [
        { id: 'mon-realtime', label: 'Real-time View', view: 'monitoring' },
        { id: 'mon-history', label: 'Data History', view: 'monitoring' },
        { id: 'mon-alarms', label: 'Active Alarms', view: 'monitoring' },
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
      id: 'compliance', 
      label: 'Compliance', 
      icon: ShieldCheck,
      subItems: [
        { id: 'comp-overview', label: 'Status Overview', view: 'compliance' },
        { id: 'comp-reports', label: 'Regulatory Reports', view: 'compliance' },
        { id: 'comp-tasks', label: 'Audit Tasks', view: 'compliance' },
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
       id: 'knowledge', 
       label: 'Knowledge Base', 
       icon: BookOpen,
       subItems: [
          { id: 'kb-vrla', label: 'VRLA (Lead-Acid)', view: 'knowledge' },
          { id: 'kb-vla', label: 'Vented Lead-Acid', view: 'knowledge' },
          { id: 'kb-liion', label: 'Lithium-Ion', view: 'knowledge' },
          { id: 'kb-nicd', label: 'Nickel-Cadmium', view: 'knowledge' },
          { id: 'kb-flow', label: 'Flow Batteries', view: 'knowledge' },
          { id: 'kb-sodium', label: 'Sodium-Based', view: 'knowledge' }
       ] 
    },
    { 
      id: 'fleet', 
      label: 'Fleet Manager', 
      icon: Globe,
      subItems: [
        { id: 'fleet-map', label: 'Global Map', view: 'fleet' },
        { id: 'fleet-list', label: 'Site List', view: 'fleet' },
        { id: 'fleet-maint', label: 'Maintenance Ops', view: 'fleet' },
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
    <div className="flex h-screen bg-slate-50 dark:bg-industrial-900 font-sans text-slate-900 dark:text-white overflow-hidden transition-colors duration-200">
      
      {/* MOBILE OVERLAY */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40
          ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'} 
          bg-slate-900 text-white flex flex-col transition-all duration-300 shadow-2xl h-screen`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between md:justify-center border-b border-slate-800 px-4 md:px-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-brand-500 flex items-center justify-center shrink-0">
                <Activity className="text-white w-5 h-5" />
             </div>
             {!isSidebarCollapsed && (
               <div className="font-bold text-lg tracking-tight animate-fade-in whitespace-nowrap block md:hidden lg:block">
                  BatteryOn
               </div>
             )}
          </div>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 overflow-y-auto scrollbar-hide">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.includes(item.id);

              return (
                <li key={item.id}>
                  <div className="relative">
                    <button
                        onClick={() => {
                            if (hasSubItems && !isSidebarCollapsed) {
                                toggleSubMenu(item.id);
                            } else {
                                onNavigate(item.id);
                                setIsSidebarCollapsed(true); // Close on mobile selection
                            }
                        }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 group
                        ${isActive 
                            ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                            <span className={`font-medium truncate transition-opacity duration-200 ${isSidebarCollapsed ? 'md:opacity-0 md:w-0' : 'opacity-100'}`}>
                                {item.label}
                            </span>
                        </div>
                        
                        {/* Dropdown Chevron */}
                        {hasSubItems && !isSidebarCollapsed && (
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        )}
                    </button>

                    {/* Sub-menu (Accordion) */}
                    {hasSubItems && isExpanded && !isSidebarCollapsed && (
                        <ul className="mt-1 ml-4 border-l border-slate-700 pl-2 space-y-1 animate-fade-in-up">
                            {item.subItems?.map(sub => (
                                <li key={sub.id}>
                                    <button
                                        onClick={() => {
                                            onNavigate(sub.view);
                                            setIsSidebarCollapsed(true);
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                                    >
                                        {sub.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* Tooltip for collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-16 top-2 bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap hidden md:block">
                        {item.label}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button 
             onClick={toggleSidebar}
             className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
             {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* HEADER */}
        <header className="h-16 bg-white dark:bg-industrial-800 shadow-sm border-b border-slate-200 dark:border-industrial-700 flex items-center justify-between px-6 z-10">
          
          {/* Breadcrumbs / Page Title */}
          <div className="flex items-center gap-4">
             {currentView !== 'landing' && (
                <button 
                  onClick={() => onNavigate('landing')}
                  className="md:hidden p-2 text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400"
                >
                  <Activity className="w-6 h-6" />
                </button>
             )}
             <h2 className="text-xl font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
               {navItems.find(n => n.id === currentView)?.label || 'Dashboard'}
             </h2>
             <span className="hidden md:inline-block px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-industrial-900/50 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-industrial-700">
               v2.1.0 Enterprise
             </span>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
             {/* Home Shortcut */}
             <button 
               onClick={() => onNavigate('landing')} 
               className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400 transition-colors mr-2"
             >
               Home
             </button>

            {/* Search */}
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-industrial-900/50 rounded-full px-4 py-2 w-64 border border-transparent focus-within:border-brand-500 transition-all">
               <Search className="w-4 h-4 text-slate-400 mr-2" />
               <input 
                 type="text" 
                 placeholder="Search assets, sites..." 
                 className="bg-transparent border-none outline-none text-sm w-full text-slate-800 dark:text-slate-100 placeholder:text-slate-500 font-medium"
               />
            </div>

            {/* Theme Toggle */}
            <button 
               onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
               className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors font-bold text-xs"
               aria-label="Toggle Theme"
            >
               {theme === 'dark' ? 'LIGHT' : 'DARK'}
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors">
               <Bell className="w-5 h-5" />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-industrial-800"></span>
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-200 dark:bg-industrial-700"></div>

            {/* Profile */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-industrial-700"
              >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                    {user.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left">
                     <div className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{user.name}</div>
                     <div className="text-xs text-slate-500 dark:text-slate-400">{user.role}</div>
                  </div>
              </button>
            </div>

          </div>
        </header>

        {/* CONTENT SCROLL AREA */}
        <main 
            ref={mainContentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-x-hidden overflow-y-auto bg-white dark:bg-industrial-900 scroll-smooth relative"
        >
            {/* Scroll To Top Button */}
            <button
                onClick={scrollToTop}
                className={`fixed bottom-8 right-8 z-50 p-3 rounded-full bg-brand-600 text-white shadow-xl hover:bg-brand-700 transition-all duration-300 ${showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-5 h-5" />
            </button>

           <div className="max-w-7xl mx-auto min-h-full pb-12 p-6">
              {children}
           </div>
           
           {/* PROFESSIONAL FOOTER (AdSense Compliant) */}
           <footer className="mt-auto bg-white dark:bg-industrial-950 border-t border-slate-200 dark:border-industrial-800">
              <div className="max-w-7xl mx-auto px-6 py-12">
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-1">
                       <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-6 h-6 text-brand-600" />
                          <span className="font-bold text-xl text-slate-900 dark:text-white">BatteryOn</span>
                       </div>
                       <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed font-medium">
                          Enterprise-grade battery diagnostics and predictive analytics platform for critical power infrastructure.
                       </p>
                       <p className="text-xs text-slate-400 mb-4">
                          Created by Anil Sharma
                       </p>
                       <div className="flex gap-4">
                          {/* Social Placeholders */}
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-industrial-800 flex items-center justify-center text-slate-500 hover:bg-brand-500 hover:text-white transition-colors cursor-pointer">
                             <Globe className="w-4 h-4" />
                          </div>
                       </div>
                    </div>

                    {/* Product Links */}
                    <div>
                       <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Product</h4>
                       <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          <li><button onClick={() => onNavigate('landing')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Home</button></li>
                          <li><button onClick={() => onNavigate('dashboard')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Dashboard</button></li>
                          <li><button onClick={() => onNavigate('about')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">About Us</button></li>
                          <li><button onClick={() => onNavigate('knowledge')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Knowledge Base</button></li>
                       </ul>
                    </div>

                    {/* Legal Links */}
                    <div>
                       <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Legal & Compliance</h4>
                       <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          <li><button onClick={() => onNavigate('privacy')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Privacy Policy</button></li>
                          <li><button onClick={() => onNavigate('terms')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Terms of Service</button></li>
                          <li><button onClick={() => onNavigate('disclaimer')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Disclaimer</button></li>
                       </ul>
                    </div>

                    {/* Contact / Status */}
                    <div>
                       <h4 className="font-bold text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-wider">Support</h4>
                       <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 font-medium">
                          <li><button onClick={() => onNavigate('contact')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">Contact Us</button></li>
                          <li><button onClick={() => onNavigate('dashboard')} className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">System Status</button></li>
                       </ul>
                       <div className="mt-6 flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold w-fit">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          System Nominal
                       </div>
                    </div>
                 </div>

                  <div className="mt-12 pt-8 border-t border-slate-200 dark:border-industrial-800 flex flex-col md:flex-row justify-between items-center gap-4">
                     <p className="text-xs text-slate-400">
                        © 2026 BatteryOn. All rights reserved.
                     </p>
                    <div className="flex gap-6 text-xs text-slate-400">
                       <span>English (US)</span>
                       <span>v2.1.0-RC</span>
                    </div>
                 </div>
              </div>
           </footer>
        </main>

      </div>
    </div>
  );
};
