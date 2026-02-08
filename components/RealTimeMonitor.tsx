import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Bell, 
  Wifi, 
  WifiOff, 
  Thermometer, 
  Zap, 
  Battery, 
  AlertOctagon,
  CheckCircle,
  X
} from 'lucide-react';

interface Alert {
  id: string;
  timestamp: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  active: boolean;
}

export const RealTimeMonitor: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: '1', timestamp: '10:42:15 AM', severity: 'Critical', message: 'Thermal Runaway Risk: Cell #42 Temp > 45°C', active: true },
    { id: '2', timestamp: '10:38:00 AM', severity: 'Warning', message: 'String B Voltage Deviation > 2%', active: true },
  ]);

  // Simulated live data
  const [liveMetrics, setLiveMetrics] = useState({
    voltage: 128.4,
    current: 42.5,
    temp: 24.8,
    soc: 88
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate slight fluctuations
      setLiveMetrics(prev => ({
        voltage: 128 + (Math.random() - 0.5),
        current: 42 + (Math.random() - 0.5) * 5,
        temp: 24.8 + (Math.random() - 0.5) * 0.2,
        soc: prev.soc - 0.01 // slowly discharging
      }));
    }, 2000); // 2 second refresh

    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: false } : a));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Status Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
               isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}>
               {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
               {isConnected ? 'System Online' : 'Connection Lost'}
            </div>
            <div className="text-slate-400 text-xs font-mono">
               Last Update: {lastUpdate.toLocaleTimeString()}
            </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
               <div className="text-xs text-slate-400 uppercase font-bold">Active Alarms</div>
               <div className="text-xl font-bold leading-none text-red-500">{alerts.filter(a => a.active).length}</div>
            </div>
            <div className="p-2 bg-slate-800 rounded-lg relative">
               <Bell className="w-6 h-6 text-slate-300" />
               {alerts.some(a => a.active) && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
               )}
            </div>
         </div>
      </div>

      {/* Active Alerts Banner */}
      {alerts.filter(a => a.active).map(alert => (
         <div key={alert.id} className={`flex items-start justify-between p-4 rounded-lg border-l-4 shadow-md ${
            alert.severity === 'Critical' ? 'bg-red-50 border-red-500 text-red-900' : 'bg-yellow-50 border-yellow-500 text-yellow-900'
         }`}>
            <div className="flex items-start gap-3">
               <AlertOctagon className={`w-5 h-5 mt-0.5 ${alert.severity === 'Critical' ? 'text-red-600' : 'text-yellow-600'}`} />
               <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                     {alert.severity.toUpperCase()} ALERT
                     <span className="font-normal opacity-75 text-xs text-slate-500">at {alert.timestamp}</span>
                  </div>
                  <div className="mt-1 text-sm">{alert.message}</div>
               </div>
            </div>
            <button 
               onClick={() => acknowledgeAlert(alert.id)}
               className="px-3 py-1 bg-white/50 hover:bg-white rounded border border-black/5 text-xs font-bold uppercase tracking-wider transition-colors"
            >
               Acknowledge
            </button>
         </div>
      ))}

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <LiveMetricCard 
            label="Bus Voltage" 
            value={liveMetrics.voltage.toFixed(1)} 
            unit="V" 
            icon={Zap} 
            color="text-blue-500" 
            trend="stable"
         />
         <LiveMetricCard 
            label="Load Current" 
            value={liveMetrics.current.toFixed(1)} 
            unit="A" 
            icon={Activity} 
            color="text-amber-500" 
            trend="up"
         />
         <LiveMetricCard 
            label="Avg Temp" 
            value={liveMetrics.temp.toFixed(1)} 
            unit="°C" 
            icon={Thermometer} 
            color="text-red-500" 
            trend="down"
         />
         <LiveMetricCard 
            label="State of Charge" 
            value={liveMetrics.soc.toFixed(1)} 
            unit="%" 
            icon={Battery} 
            color="text-green-500" 
            trend="down"
         />
      </div>

      {/* Connection Topology */}
      <div className="bg-white dark:bg-industrial-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700">
         <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" />
            System Topology Status
         </h3>
         
         <div className="relative">
            {/* Visual connector lines could go here */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {/* SCADA Gateway */}
               <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-industrial-900 rounded-lg border border-slate-200 dark:border-industrial-700 relative">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mb-3">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">SCADA Gateway</div>
                  <div className="text-xs text-green-500 font-bold mt-1 flex items-center gap-1">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     Connected (15ms)
                  </div>
               </div>

               {/* Processing Unit */}
               <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-industrial-900 rounded-lg border border-slate-200 dark:border-industrial-700 animate-border-pulse">
                   <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center mb-3">
                     <Activity className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Analysis Engine</div>
                  <div className="text-xs text-green-500 font-bold mt-1">Processing</div>
               </div>

               {/* Database */}
               <div className="flex flex-col items-center text-center p-4 bg-slate-50 dark:bg-industrial-900 rounded-lg border border-slate-200 dark:border-industrial-700">
                   <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center mb-3">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">Historian DB</div>
                  <div className="text-xs text-green-500 font-bold mt-1">Active Write</div>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
};

const LiveMetricCard = ({ label, value, unit, icon: Icon, color, trend }: any) => (
   <div className="bg-white dark:bg-industrial-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700">
      <div className="flex items-center justify-between mb-2">
         <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
         <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex items-end gap-1">
         <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white leading-none">{value}</span>
         <span className="text-xs font-bold text-slate-400 mb-0.5">{unit}</span>
      </div>
      {/* Tiny simulated sparkline or trend indicator */}
      <div className="mt-2 h-1 w-full bg-slate-100 dark:bg-industrial-900 rounded-full overflow-hidden">
         <div className={`h-full w-2/3 rounded-full ${color.replace('text-', 'bg-')} opacity-50`}></div>
      </div>
   </div>
);
