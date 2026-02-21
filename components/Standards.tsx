import React from 'react';
import { BookOpen, ShieldCheck, Scale, FileText, ExternalLink, Info, CheckCircle2 } from 'lucide-react';

export const Standards = () => {
    const standardsInfo = [
        {
            id: 'ieee-450',
            title: 'IEEE 450-2010',
            name: 'Recommended Practice for Maintenance, Testing, and Replacement of Vented Lead-Acid Batteries',
            credits: 'Institute of Electrical and Electronics Engineers (IEEE)',
            update: '2010',
            description: 'Provides exact procedures for maintenance, testing, and replacement of vented (flooded) lead-acid batteries for stationary applications.',
            thresholds: [
                { parameter: 'Voltage Uniformity', clause: 'Sec 7.4, Table 1', limit: '±0.03V to ±0.04V from average depending on chemistry' },
                { parameter: 'Capacity Replacement', clause: 'Sec 8.1', limit: 'Replace when capacity drops to ≤ 80% of manufacturer rating' },
                { parameter: 'Operating Temp', clause: 'Sec 4.3', limit: 'Nominal 20°C to 25°C (68°F to 77°F)' },
                { parameter: 'Connection Resistance', clause: 'Sec 5.2.1', limit: 'Variance ≤ 20% from baseline installation limit' }
            ]
        },
        {
            id: 'ieee-1188',
            title: 'IEEE 1188-2005',
            name: 'Recommended Practice for Maintenance, Testing, and Replacement of Valve-Regulated Lead-Acid (VRLA) Batteries',
            credits: 'Institute of Electrical and Electronics Engineers (IEEE)',
            update: '2005',
            description: 'Defines the maintenance and testing requirements specifically for VRLA internal ohmic measurements and thermal runaway prevention.',
            thresholds: [
                { parameter: 'Resistance Trending (Warning)', clause: 'Sec 6.3.2', limit: '> 20% deviation from baseline (Investigate)' },
                { parameter: 'Resistance Critical (Fail)', clause: 'Sec 7', limit: '> 50% deviation from baseline (Replace)' },
                { parameter: 'Capacity Degradation', clause: 'Sec 6.2.3', limit: 'Drop of > 5% capacity between consecutive tests warrants investigation' }
            ]
        },
        {
            id: 'iec-60896',
            title: 'IEC 60896-11 / 21',
            name: 'Stationary Lead-Acid Batteries (Vented and VRLA)',
            credits: 'International Electrotechnical Commission (IEC)',
            update: '2002 / 2004',
            description: 'Global standard specifying the performance, test methods, and life expectancy calculations for stationary batteries.',
            thresholds: [
                { parameter: 'Temperature Life Reduction', clause: 'Annex A', limit: 'Life halves for every 8°C - 10°C continuous operation above 20°C' },
                { parameter: 'Capacity End-of-Life', clause: 'Sec 18.3', limit: 'Ah capacity falls below 80% (C10 rate)' },
                { parameter: 'Float Voltage Tolerance', clause: 'Sec 14.1', limit: 'Target ± 1% at battery terminals' }
            ]
        },
        {
            id: 'iec-62485',
            title: 'IEC 62485-2',
            name: 'Safety Requirements for Secondary Batteries and Battery Installations',
            credits: 'International Electrotechnical Commission (IEC)',
            update: '2010',
            description: 'Critical safety parameters regarding ventilation, hydrogen evolution, thermal risk, and electrical protection.',
            thresholds: [
                { parameter: 'Thermal Risk', clause: 'Sec 7.1', limit: 'Alarm strictly required if ambient > 40°C or thermal runaway detected' },
                { parameter: 'Ventilation (H2)', clause: 'Sec 8', limit: 'Sufficient air flow to keep hydrogen concentration < 4% LEL' }
            ]
        },
        {
            id: 'is-1651',
            title: 'IS 1651:2013',
            name: 'Stationary Cells and Batteries, Lead-Acid Type (with Tubular Positive Plates)',
            credits: 'Bureau of Indian Standards (BIS)',
            update: '2013',
            description: 'Indian standard dictating technical specifications, testing thresholds, and operational ranges for tubular stationary cells.',
            thresholds: [
                { parameter: 'Specific Gravity', clause: 'Table 2', limit: '1.200 to 1.240 at 27°C depending on application' },
                { parameter: 'Electrolyte Level', clause: 'Sec 6', limit: 'Must be maintained between Max and Min markings' },
                { parameter: 'End of Discharge', clause: 'Sec 14.2', limit: '1.85V to 1.75V per cell depending on discharge rate' }
            ]
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-fade-in">
            {/* Header Section */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative px-8 md:px-12 py-16 md:py-20 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-brand-500/20 rounded-2xl flex items-center justify-center mb-6 border border-brand-500/30">
                        <Scale className="w-8 h-8 text-brand-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                        Global Standards <span className="text-brand-400">Reference</span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed">
                        BatteryOn's analysis engine is built upon rigorous international frameworks.
                        We cross-reference every voltage, resistance, and temperature reading against published
                        thresholds to guarantee industry-grade compliance and reliability.
                    </p>
                </div>
            </div>

            {/* Verification Notice */}
            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-6 flex gap-4 shadow-sm items-start">
                <div className="bg-emerald-100 dark:bg-emerald-800/50 p-2 rounded-lg shrink-0 mt-1">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-2">Methodology Verification</h3>
                    <p className="text-emerald-700 dark:text-emerald-300/80 leading-relaxed text-sm">
                        All automated findings, short-term actions, and PASS/FAIL verdicts generated by this application are directly derived from the standards listed below.
                        Engineers and site managers can use this page to cross-verify the specific clause numbers and threshold limits cited in our generated PDF and Excel PDF reports.
                    </p>
                </div>
            </div>

            {/* Standards List */}
            <div className="grid grid-cols-1 gap-6">
                {standardsInfo.map((std, idx) => (
                    <div key={idx} className="bg-white dark:bg-industrial-800 rounded-2xl border border-slate-200 dark:border-industrial-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6 md:p-8">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <BookOpen className="w-6 h-6 text-brand-600 dark:text-brand-500" />
                                            {std.title}
                                        </h2>
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-industrial-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-full border border-slate-200 dark:border-industrial-600">
                                            v. {std.update}
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">{std.name}</h3>
                                </div>
                                <div className="text-left md:text-right shrink-0">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Standard Body</p>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center md:justify-end gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        {std.credits}
                                    </p>
                                </div>
                            </div>

                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-8 max-w-4xl">
                                {std.description}
                            </p>

                            <div>
                                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Hardcoded Thresholds & Clauses
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {std.thresholds.map((t, i) => (
                                        <div key={i} className="bg-slate-50 dark:bg-industrial-900/50 rounded-xl p-4 border border-slate-100 dark:border-industrial-700/50 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{t.parameter}</span>
                                                    <span className="text-xs font-bold px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded">
                                                        {t.clause}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 select-all">
                                                    {t.limit}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Credits */}
            <div className="text-center py-8 border-t border-slate-200 dark:border-industrial-700 mt-12">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2">
                    <Info className="w-4 h-4" />
                    BatteryOn is an independent analytics platform. We utilize these standards for algorithmic evaluation only.
                    Official standard documents must be purchased from their respective organizations (IEEE, IEC, BIS).
                </p>
            </div>
        </div>
    );
};
