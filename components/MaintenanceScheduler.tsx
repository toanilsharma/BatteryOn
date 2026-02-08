import React from 'react';
import { Calendar, Clock, CheckSquare, AlertCircle, User, ArrowRight } from 'lucide-react';
import { MaintenanceTask } from '../types';

export const MaintenanceScheduler: React.FC = () => {
    // Mock Maintenance Tasks
    const maintenanceTasks: MaintenanceTask[] = [
        {
            id: '1', title: 'Quarterly Voltage Inspection', standardRef: 'IEEE 450 Sec 5.2.1',
            frequency: 'Quarterly', lastPerformed: '2023-11-15', nextDue: '2024-02-15', status: 'Due', assignedTo: 'J. Smith'
        },
        {
            id: '2', title: 'Annual Capacity Test', standardRef: 'IEEE 450 Sec 6.3',
            frequency: 'Annual', lastPerformed: '2023-01-20', nextDue: '2024-01-20', status: 'Overdue', assignedTo: 'Team A'
        },
        {
            id: '3', title: 'Monthly Visual Check', standardRef: 'IEEE 450 Sec 5.2.3',
            frequency: 'Monthly', lastPerformed: '2024-01-10', nextDue: '2024-02-10', status: 'Upcoming', assignedTo: 'Open'
        }
    ];

    const getStatusColor = (status: MaintenanceTask['status']) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'Due': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'Overdue': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        }
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="p-6 border-b border-slate-200 dark:border-industrial-700 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-brand-500" />
                    Maintenance Schedule
                </h2>
                <button className="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1">
                    View Calendar <ArrowRight className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-grow overflow-auto p-4 space-y-3">
                {maintenanceTasks.map(task => (
                    <div key={task.id} className="p-4 rounded-lg border border-slate-200 dark:border-industrial-700 bg-slate-50 dark:bg-industrial-800 hover:border-brand-300 dark:hover:border-brand-700 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-slate-700 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                {task.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getStatusColor(task.status)}`}>
                                {task.status}
                            </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 dark:text-industrial-400 mb-3 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            {task.standardRef}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-industrial-300">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Due: <span className="font-mono font-medium">{task.nextDue}</span></span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600 dark:text-industrial-300">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{task.assignedTo || 'Unassigned'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-industrial-900 rounded-b-lg border-t border-slate-200 dark:border-industrial-700">
                <button className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-industrial-600 rounded text-slate-500 dark:text-industrial-400 text-sm font-medium hover:bg-white dark:hover:bg-industrial-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Schedule New Task
                </button>
            </div>
        </div>
    );
};
