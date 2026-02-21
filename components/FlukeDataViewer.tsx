import React, { useState, useMemo } from 'react';
import { Upload, FileText, AlertCircle, Zap, Battery, MapPin, Clock, Hash, TrendingUp, TrendingDown, BarChart3, ArrowUpDown, Search, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { parseFlukeCSV, FlukeParseResult, FlukeCellReading } from './FlukeCSVParser';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, Cell, ComposedChart, Area, Legend, ScatterChart, Scatter, ZAxis, Brush
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

type SortField = 'id' | 'resistance' | 'voltage' | 'temperature' | 'time';
type SortDir = 'asc' | 'desc';

export const FlukeDataViewer: React.FC = () => {
    const [data, setData] = useState<FlukeParseResult | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeChart, setActiveChart] = useState<'resistance' | 'voltage' | 'distribution' | 'combined'>('resistance');
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [showTable, setShowTable] = useState(true);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFile = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            const text = await file.text();
            const result = parseFlukeCSV(text);
            if (result.readings.length === 0) {
                throw new Error('No valid battery cell readings found in the file. Please check the file format.');
            }
            setData(result);
        } catch (e: any) {
            setError(e.message || 'Failed to parse file');
        } finally {
            setLoading(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
    };

    // Sorting & filtering
    const filteredData = useMemo(() => {
        if (!data) return [];
        let rows = [...data.readings];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            rows = rows.filter(r => r.id.toLowerCase().includes(s) || r.time.includes(s));
        }
        rows.sort((a, b) => {
            let cmp = 0;
            if (sortField === 'id') cmp = parseInt(a.id) - parseInt(b.id);
            else if (sortField === 'resistance') cmp = a.resistance - b.resistance;
            else if (sortField === 'voltage') cmp = a.voltage - b.voltage;
            else if (sortField === 'temperature') cmp = a.temperature - b.temperature;
            else if (sortField === 'time') cmp = a.time.localeCompare(b.time);
            return sortDir === 'asc' ? cmp : -cmp;
        });
        return rows;
    }, [data, sortField, sortDir, searchTerm]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('asc'); }
    };

    // Health thresholds
    const getResistanceColor = (val: number, avg: number) => {
        const deviation = Math.abs(val - avg) / avg;
        if (deviation > 0.5) return 'text-red-500 font-bold';
        if (deviation > 0.3) return 'text-amber-500 font-semibold';
        return 'text-emerald-600 dark:text-emerald-400';
    };

    const getResistanceBarColor = (val: number, avg: number) => {
        const deviation = Math.abs(val - avg) / avg;
        if (deviation > 0.5) return '#ef4444'; // Red-500
        if (deviation > 0.3) return '#f59e0b'; // Amber-500
        return '#10b981'; // Emerald-500
    };

    const CustomChartTooltip = ({ active, payload, label, type }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const resDev = data.resistance ? Math.abs(data.resistance - stats.avgResistance) / stats.avgResistance : 0;
            const resStatus = resDev > 0.5 ? 'CRITICAL FAIL' : resDev > 0.3 ? 'WARNING' : 'PASS';
            const resColor = resDev > 0.5 ? 'text-red-500' : resDev > 0.3 ? 'text-amber-500' : 'text-emerald-500';

            return (
                <div className="bg-white dark:bg-industrial-800 border border-slate-200 dark:border-industrial-700 shadow-xl rounded-lg p-3 text-sm min-w-[180px]">
                    <p className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-industrial-700 pb-2 mb-2">
                        {type === 'distribution' ? `Range: ${data.range} mΩ` : `Cell ${label || data.id}`}
                    </p>
                    {type === 'resistance' && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Resistance:</span>
                                <span className={`font-bold ${resColor}`}>{data.resistance} mΩ</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Deviation (avg):</span>
                                <span className={`font-bold ${resColor}`}>±{(resDev * 100).toFixed(1)}%</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-industrial-700">
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${resDev > 0.5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                    resDev > 0.3 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    }`}>{resStatus}</span>
                            </div>
                        </div>
                    )}
                    {type === 'voltage' && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Voltage:</span>
                                <span className="font-bold text-blue-500">{data.voltage} VDC</span>
                            </div>
                        </div>
                    )}
                    {type === 'combined' && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Resistance:</span>
                                <span className={`font-bold ${resColor}`}>{data.resistance} mΩ</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Voltage:</span>
                                <span className="font-bold text-blue-500">{data.voltage} VDC</span>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-industrial-700">
                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${resDev > 0.5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                    resDev > 0.3 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    }`}>{resStatus}</span>
                            </div>
                        </div>
                    )}
                    {type === 'distribution' && (
                        <div className="space-y-1.5">
                            <div className="flex justify-between gap-4">
                                <span className="text-slate-500 dark:text-slate-400">Cell Count:</span>
                                <span className="font-bold text-violet-500">{data.count} Cells</span>
                            </div>
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    // Histogram data for distribution
    const distributionData = useMemo(() => {
        if (!data) return [];
        const resistances = data.readings.map(r => r.resistance);
        const min = Math.min(...resistances);
        const max = Math.max(...resistances);
        const binCount = 12;
        const binWidth = (max - min) / binCount || 0.1;
        const bins: { range: string; count: number; from: number; to: number }[] = [];
        for (let i = 0; i < binCount; i++) {
            const from = Math.round((min + i * binWidth) * 100) / 100;
            const to = Math.round((min + (i + 1) * binWidth) * 100) / 100;
            bins.push({
                range: `${from}-${to}`,
                count: resistances.filter(r => r >= from && (i === binCount - 1 ? r <= to : r < to)).length,
                from, to
            });
        }
        return bins;
    }, [data]);

    // Chart data per cell (sample every Nth for large datasets)
    const chartData = useMemo(() => {
        if (!data) return [];
        return data.readings.map(r => ({
            id: r.id,
            resistance: r.resistance,
            voltage: r.voltage,
            temp: r.temperature,
        }));
    }, [data]);

    // Outlier cells
    const outliers = useMemo(() => {
        if (!data) return [];
        const avg = data.stats.avgResistance;
        const std = data.stats.stdDevResistance;
        return data.readings.filter(r => Math.abs(r.resistance - avg) > 2 * std);
    }, [data]);

    // ═══════════════════════════════════════════════════════════
    // STANDARDS-BASED COMPLIANCE ANALYSIS
    // IEEE 450-2010 | IEEE 1188-2005 | IEC 60896 | IS 1651
    // ═══════════════════════════════════════════════════════════
    interface StandardsFinding {
        severity: 'Critical' | 'Warning' | 'Pass' | 'Info';
        title: string;
        description: string;
        standard: string;
        clause: string;
        threshold: string;
        measured: string;
        verdict: 'FAIL' | 'WARNING' | 'PASS';
        recommendations: string[];
        actions: string[];
        reliabilityImpact: string;
    }

    const standardsFindings = useMemo((): StandardsFinding[] => {
        if (!data) return [];
        const { stats: s, readings } = data;
        const findings: StandardsFinding[] = [];

        // 1. RESISTANCE UNIFORMITY — IEEE 1188-2005 Sec 6.3.2
        // Resistance spread > 20% of average = investigate, > 50% = critical
        const resistanceSpreadPct = ((s.maxResistance - s.minResistance) / s.avgResistance) * 100;
        if (resistanceSpreadPct > 50) {
            findings.push({
                severity: 'Critical',
                title: 'Internal Resistance Spread — CRITICAL',
                description: `Resistance spread of ${resistanceSpreadPct.toFixed(1)}% exceeds the 50% critical threshold per IEEE 1188-2005. This indicates severe cell degradation, high-resistance connections, or internal faults.`,
                standard: 'IEEE 1188-2005',
                clause: 'Section 6.3.2 — Impedance/Conductance Testing',
                threshold: '≤50% spread from mean',
                measured: `${resistanceSpreadPct.toFixed(1)}% spread (${s.minResistance}–${s.maxResistance} mΩ)`,
                verdict: 'FAIL',
                recommendations: [
                    'Immediately identify cells with resistance >50% above baseline',
                    'Schedule replacement of degraded cells per IEEE 1188-2005 Sec 7',
                    'Perform inter-cell connection resistance test (<50µΩ per IEEE 450 Table 3)',
                    'Verify measurement instrument calibration'
                ],
                actions: [
                    'Replace cells with resistance >50% above average within 30 days',
                    'Re-test remaining cells after replacement',
                    'Establish baseline impedance readings for new cells',
                    'Implement quarterly impedance trending program'
                ],
                reliabilityImpact: 'High-resistance cells limit discharge current capacity and reduce autonomy. String performance is limited by the worst cell.'
            });
        } else if (resistanceSpreadPct > 20) {
            findings.push({
                severity: 'Warning',
                title: 'Internal Resistance Spread — WARNING',
                description: `Resistance spread of ${resistanceSpreadPct.toFixed(1)}% exceeds the 20% investigation threshold per IEEE 1188-2005. Early indication of cell aging or connection deterioration.`,
                standard: 'IEEE 1188-2005',
                clause: 'Section 6.3.2 — Impedance/Conductance Testing',
                threshold: '≤20% spread from mean',
                measured: `${resistanceSpreadPct.toFixed(1)}% spread`,
                verdict: 'WARNING',
                recommendations: [
                    'Flag cells >20% above average for enhanced monitoring',
                    'Perform inter-cell connection torque verification',
                    'Compare with baseline values — if >20% increase, investigate root cause',
                    'Schedule capacity test within 6 months per IEEE 450-2010 Sec 7.3'
                ],
                actions: [
                    'Reduce impedance test interval to quarterly',
                    'Perform connection resistance measurement on flagged cells',
                    'Trend impedance values to project replacement timeline'
                ],
                reliabilityImpact: 'Developing cell imbalance — current autonomy may be 10-20% less than rated.'
            });
        } else {
            findings.push({
                severity: 'Pass',
                title: 'Internal Resistance Uniformity — PASS',
                description: `Resistance spread of ${resistanceSpreadPct.toFixed(1)}% is within the acceptable ≤20% limit per IEEE 1188-2005. Cells show uniform internal resistance.`,
                standard: 'IEEE 1188-2005',
                clause: 'Section 6.3.2',
                threshold: '≤20% spread',
                measured: `${resistanceSpreadPct.toFixed(1)}%`,
                verdict: 'PASS',
                recommendations: ['Continue quarterly impedance testing per IEEE 1188-2005 Sec 5.3'],
                actions: ['Maintain current maintenance schedule'],
                reliabilityImpact: 'Cells are balanced — expected performance consistent with design.'
            });
        }

        // 2. VOLTAGE UNIFORMITY — IEEE 450-2010 Sec 7.4, Table 1
        // Cell-to-cell voltage deviation: ±0.04V for VRLA, ±0.03V for VLA
        const voltageSpread = s.maxVoltage - s.minVoltage;
        const voltageSpreadLimit = 0.04; // VRLA default
        if (voltageSpread > voltageSpreadLimit * 3) {
            findings.push({
                severity: 'Critical',
                title: 'Voltage Uniformity — CRITICAL',
                description: `Cell voltage spread of ${voltageSpread.toFixed(3)}V significantly exceeds the IEEE 450 limit of ±${voltageSpreadLimit}V. Indicates severely degraded cells, charger malfunction, or connection faults.`,
                standard: 'IEEE 450-2010',
                clause: 'Section 7.4, Table 1 — Cell Voltage Limits',
                threshold: `±${voltageSpreadLimit}V cell-to-cell`,
                measured: `${voltageSpread.toFixed(3)}V spread (${s.minVoltage}–${s.maxVoltage} VDC)`,
                verdict: 'FAIL',
                recommendations: [
                    'Immediate investigation of low-voltage cells',
                    'Verify charger float voltage per IEEE 1188-2005 Sec 6.2',
                    'Check for shorted cells or open connections',
                    'Perform equalization charge if lead-acid (IEEE 450 Sec 7.2.3)'
                ],
                actions: [
                    'Isolate and test individual low-voltage cells',
                    'Measure charger output voltage and current regulation',
                    'Replace cells that do not recover after equalization'
                ],
                reliabilityImpact: 'Severe voltage imbalance reduces effective autonomy by 20-40%. Weakest cell determines string cutoff.'
            });
        } else if (voltageSpread > voltageSpreadLimit) {
            findings.push({
                severity: 'Warning',
                title: 'Voltage Uniformity — WARNING',
                description: `Cell voltage spread of ${voltageSpread.toFixed(3)}V exceeds the ±${voltageSpreadLimit}V limit per IEEE 450-2010 Table 1.`,
                standard: 'IEEE 450-2010',
                clause: 'Section 7.4, Table 1',
                threshold: `±${voltageSpreadLimit}V`,
                measured: `${voltageSpread.toFixed(3)}V`,
                verdict: 'WARNING',
                recommendations: [
                    'Monitor deviant cells monthly',
                    'Verify charger temperature compensation function',
                    'Check inter-cell connector torques'
                ],
                actions: ['Schedule detailed investigation within 30 days'],
                reliabilityImpact: 'Moderate voltage imbalance — autonomy may be 5-15% less than rated.'
            });
        } else {
            findings.push({
                severity: 'Pass',
                title: 'Voltage Uniformity — PASS',
                description: `Cell voltage spread of ${voltageSpread.toFixed(3)}V is within the ±${voltageSpreadLimit}V limit per IEEE 450-2010.`,
                standard: 'IEEE 450-2010',
                clause: 'Section 7.4, Table 1',
                threshold: `±${voltageSpreadLimit}V`,
                measured: `${voltageSpread.toFixed(3)}V`,
                verdict: 'PASS',
                recommendations: ['Continue quarterly voltage monitoring per IEEE 450-2010 Sec 5.4'],
                actions: ['Maintain current maintenance schedule'],
                reliabilityImpact: 'Voltage balance is nominal — expected performance consistent with design.'
            });
        }

        // 3. INDIVIDUAL CELL RESISTANCE vs BASELINE — IEEE 1188-2005 Sec 6.3.2
        const cellsAbove50Pct = readings.filter(r => Math.abs(r.resistance - s.avgResistance) / s.avgResistance > 0.5);
        const cellsAbove20Pct = readings.filter(r => {
            const dev = Math.abs(r.resistance - s.avgResistance) / s.avgResistance;
            return dev > 0.2 && dev <= 0.5;
        });

        if (cellsAbove50Pct.length > 0) {
            findings.push({
                severity: 'Critical',
                title: `${cellsAbove50Pct.length} Cell(s) Exceed 50% Resistance Threshold`,
                description: `Per IEEE 1188-2005 Sec 7: Cells with impedance >50% above baseline shall be replaced. Affected cells: ${cellsAbove50Pct.map(c => c.id).join(', ')}`,
                standard: 'IEEE 1188-2005',
                clause: 'Section 7 — Cell Replacement Criteria',
                threshold: '≤50% above bank average',
                measured: `${cellsAbove50Pct.length} cells exceed threshold`,
                verdict: 'FAIL',
                recommendations: [
                    `Replace cells: ${cellsAbove50Pct.map(c => `${c.id} (${c.resistance} mΩ)`).join(', ')}`,
                    'Verify replacement cells match existing string specifications',
                    'Establish new baseline impedance after replacement'
                ],
                actions: [
                    'Procure replacement cells within 30 days',
                    'Schedule installation during planned maintenance window',
                    'Re-test string after replacement per IEC 60896-11 Sec 18'
                ],
                reliabilityImpact: `${cellsAbove50Pct.length} cells at end-of-life will limit string performance during discharge events.`
            });
        }
        if (cellsAbove20Pct.length > 0) {
            findings.push({
                severity: 'Warning',
                title: `${cellsAbove20Pct.length} Cell(s) in 20-50% Resistance Warning Zone`,
                description: `Per IEEE 1188-2005 Sec 6.3.2: Cells with impedance 20-50% above baseline require enhanced monitoring.`,
                standard: 'IEEE 1188-2005',
                clause: 'Section 6.3.2 — Impedance Trending',
                threshold: '20-50% above average',
                measured: `${cellsAbove20Pct.length} cells in warning zone`,
                verdict: 'WARNING',
                recommendations: [
                    'Increase monitoring frequency to monthly for these cells',
                    'Trend impedance to predict when 50% threshold will be reached',
                    'Budget for cell replacement within 6-12 months'
                ],
                actions: ['Add flagged cells to enhanced monitoring program'],
                reliabilityImpact: 'These cells are degrading and will likely require replacement within 6-12 months.'
            });
        }

        // 4. TEMPERATURE CHECK — IEC 60896-11 Annex A / IEEE 450 Sec 4.3
        const temps = readings.filter(r => r.temperature > 0).map(r => r.temperature);
        if (temps.length > 0) {
            const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
            const maxTemp = Math.max(...temps);
            if (maxTemp > 35) {
                findings.push({
                    severity: 'Warning',
                    title: `Elevated Temperature (Max: ${maxTemp}°C)`,
                    description: `Per IEC 60896-11 Annex A, battery life halves for every 8-10°C above 20°C reference. Maximum temperature of ${maxTemp}°C will significantly reduce design life.`,
                    standard: 'IEC 60896-11',
                    clause: 'Annex A — Effect of Temperature on Life',
                    threshold: '20-25°C (IEEE 450 Sec 4.3)',
                    measured: `Avg: ${avgTemp.toFixed(1)}°C, Max: ${maxTemp}°C`,
                    verdict: 'WARNING',
                    recommendations: [
                        'Improve battery room HVAC/cooling',
                        'Verify charger temperature compensation (-3mV/°C/cell)',
                        'Install temperature monitoring system'
                    ],
                    actions: ['Review and upgrade cooling system within 90 days'],
                    reliabilityImpact: `Estimated life reduction: ${((maxTemp - 20) / 10 * 50).toFixed(0)}% due to elevated temperature.`
                });
            } else {
                findings.push({
                    severity: 'Pass',
                    title: 'Operating Temperature — PASS',
                    description: `Temperature within acceptable range per IEEE 450-2010 Sec 4.3 and IEC 60896-11.`,
                    standard: 'IEEE 450-2010 / IEC 60896-11',
                    clause: 'IEEE 450 Sec 4.3 / IEC 60896 Annex A',
                    threshold: '20-25°C recommended',
                    measured: `Avg: ${avgTemp.toFixed(1)}°C, Max: ${maxTemp}°C`,
                    verdict: 'PASS',
                    recommendations: ['Continue ambient temperature monitoring'],
                    actions: ['Maintain current environment'],
                    reliabilityImpact: 'Temperature is nominal — no life reduction expected.'
                });
            }
        }

        // 5. OVERALL COMPLIANCE VERDICT — IEC 60896-21 / IEEE 1188
        const criticalCount = findings.filter(f => f.severity === 'Critical').length;
        const warningCount = findings.filter(f => f.severity === 'Warning').length;
        const passCount = findings.filter(f => f.severity === 'Pass').length;

        findings.push({
            severity: criticalCount > 0 ? 'Critical' : warningCount > 0 ? 'Warning' : 'Pass',
            title: 'Overall Compliance Assessment',
            description: criticalCount > 0
                ? `${criticalCount} critical finding(s) detected. Battery system is NON-COMPLIANT with IEEE/IEC standards. Immediate corrective action required.`
                : warningCount > 0
                    ? `${warningCount} warning(s) detected. Enhanced monitoring and corrective actions recommended per IEEE 1188-2005.`
                    : `All ${passCount} checks passed. Battery system is COMPLIANT with IEEE 450-2010, IEEE 1188-2005, IEC 60896, and IS 1651 standards.`,
            standard: 'IEEE 450-2010 / IEEE 1188-2005 / IEC 60896 / IS 1651',
            clause: 'Comprehensive Assessment',
            threshold: 'All parameters within standard limits',
            measured: `${passCount} Pass, ${warningCount} Warning, ${criticalCount} Critical`,
            verdict: criticalCount > 0 ? 'FAIL' : warningCount > 0 ? 'WARNING' : 'PASS',
            recommendations: criticalCount > 0
                ? ['Immediately address all critical findings', 'Increase inspection frequency to weekly', 'Plan battery replacement']
                : warningCount > 0
                    ? ['Address warning findings within 30 days', 'Increase inspection frequency to monthly']
                    : ['Continue standard quarterly maintenance per IEEE 450/1188'],
            actions: criticalCount > 0
                ? ['Emergency maintenance review within 72 hours']
                : ['Next scheduled inspection per maintenance calendar'],
            reliabilityImpact: criticalCount > 0
                ? 'System reliability is compromised. Risk of unplanned outage is elevated.'
                : warningCount > 0
                    ? 'System reliability is acceptable but degrading. Proactive action will prevent future failure.'
                    : 'System reliability is at design level.'
        });

        return findings;
    }, [data]);

    // --- EXPORT FUNCTIONS ---
    const exportToPDF = () => {
        if (!data) return;
        const { metadata: m, stats: s, readings } = data;
        const doc = new jsPDF({ orientation: 'landscape' });

        // Title
        doc.setFontSize(20);
        doc.setTextColor(30, 41, 59);
        doc.text('BatteryOn — Fluke Meter Report', 14, 18);

        // Device Info
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Device: ${m.deviceName}  |  Location: ${m.location}  |  Capacity: ${m.capacity}  |  Cells: ${s.totalCells}`, 14, 26);
        doc.text(`Test Date: ${m.timeCreated}  |  Duration: ${s.testDurationMinutes} min  |  Generated: ${new Date().toLocaleString()}`, 14, 32);

        // Statistics
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text('Statistics Summary', 14, 42);

        autoTable(doc, {
            startY: 46,
            head: [['Metric', 'Resistance (mΩ)', 'Voltage (VDC)']],
            body: [
                ['Average', String(s.avgResistance), String(s.avgVoltage)],
                ['Minimum', String(s.minResistance), String(s.minVoltage)],
                ['Maximum', String(s.maxResistance), String(s.maxVoltage)],
                ['Std Deviation', String(s.stdDevResistance), String(s.stdDevVoltage)],
                ['Total', '—', String(s.totalVoltage) + ' V'],
            ],
            theme: 'grid',
            headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            margin: { left: 14 },
        });

        // Outliers
        const currentOutliers = readings.filter(r => Math.abs(r.resistance - s.avgResistance) > 2 * s.stdDevResistance);
        if (currentOutliers.length > 0) {
            const afterStatsY = (doc as any).lastAutoTable?.finalY || 90;
            doc.setFontSize(12);
            doc.setTextColor(220, 38, 38);
            doc.text(`Outlier Cells (${currentOutliers.length} detected, ±2σ)`, 14, afterStatsY + 10);
            autoTable(doc, {
                startY: afterStatsY + 14,
                head: [['Cell ID', 'Resistance (mΩ)', 'Voltage (VDC)', 'Status']],
                body: currentOutliers.map(o => [o.id, String(o.resistance), String(o.voltage), 'CRITICAL']),
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontStyle: 'bold' },
                styles: { fontSize: 9, cellPadding: 3 },
                margin: { left: 14 },
            });
        }

        // Standards Compliance Analysis Page
        doc.addPage('landscape');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Standards Compliance Analysis', 14, 18);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('IEEE 450-2010 | IEEE 1188-2005 | IEC 60896 | IEC 62485-2 | IS 1651:2013', 14, 24);

        autoTable(doc, {
            startY: 30,
            head: [['Verdict', 'Finding', 'Standard & Clause', 'Threshold', 'Measured', 'Recommendations', 'Reliability Impact']],
            body: standardsFindings.map(f => [
                f.verdict,
                f.title,
                `${f.standard} — ${f.clause}`,
                f.threshold,
                f.measured,
                f.recommendations.join('; '),
                f.reliabilityImpact
            ]),
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7 },
            styles: { fontSize: 7, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 40 },
                5: { cellWidth: 55 },
                6: { cellWidth: 45 }
            },
            margin: { left: 14 },
            didParseCell: (hookData: any) => {
                if (hookData.section === 'body' && hookData.column.index === 0) {
                    const val = hookData.cell.raw;
                    if (val === 'FAIL') hookData.cell.styles.textColor = [220, 38, 38];
                    else if (val === 'WARNING') hookData.cell.styles.textColor = [245, 158, 11];
                    else hookData.cell.styles.textColor = [16, 185, 129];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            },
        });

        // Cell Data Table
        doc.addPage('landscape');
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Cell Measurement Data', 14, 18);

        autoTable(doc, {
            startY: 24,
            head: [['Cell ID', 'Resistance (mΩ)', 'Voltage (VDC)', 'Temp (℃)', 'Timestamp', 'Status']],
            body: readings.map(r => {
                const dev = Math.abs(r.resistance - s.avgResistance) / s.avgResistance;
                const status = dev > 0.5 ? 'CRITICAL' : dev > 0.3 ? 'WARNING' : 'OK';
                return [r.id, String(r.resistance), String(r.voltage), String(r.temperature), r.time, status];
            }),
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 14 },
            didParseCell: (hookData: any) => {
                if (hookData.section === 'body' && hookData.column.index === 5) {
                    const val = hookData.cell.raw;
                    if (val === 'CRITICAL') hookData.cell.styles.textColor = [220, 38, 38];
                    else if (val === 'WARNING') hookData.cell.styles.textColor = [245, 158, 11];
                    else hookData.cell.styles.textColor = [16, 185, 129];
                    hookData.cell.styles.fontStyle = 'bold';
                }
            },
        });

        // Footer on each page
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`BatteryOn Report  •  Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 8);
        }

        doc.save(`BatteryOn_${m.deviceName.replace(/\s+/g, '_')}_${m.timeCreated?.split(' ')[0] || 'report'}.pdf`);
    };

    const exportToExcel = () => {
        if (!data) return;
        const { metadata: m, stats: s, readings } = data;
        const wb = XLSX.utils.book_new();

        // Sheet 1: Profile & Statistics
        const summaryData = [
            ['BatteryOn — Fluke Meter Report'],
            [],
            ['Profile Information'],
            ['Location', m.location],
            ['Device Name', m.deviceName],
            ['Device ID', m.deviceId],
            ['Battery Series', m.batterySeries],
            ['Battery Count', m.batteryNumber],
            ['Capacity', m.capacity],
            ['Test Created', m.timeCreated],
            ['Test Modified', m.timeModified],
            [],
            ['Statistics', 'Resistance (mΩ)', 'Voltage (VDC)'],
            ['Average', s.avgResistance, s.avgVoltage],
            ['Minimum', s.minResistance, s.minVoltage],
            ['Maximum', s.maxResistance, s.maxVoltage],
            ['Std Deviation', s.stdDevResistance, s.stdDevVoltage],
            ['Total Voltage', '', s.totalVoltage],
            ['Test Duration (min)', s.testDurationMinutes, ''],
            ['Total Cells', s.totalCells, ''],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
        ws1['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

        // Sheet 2: Cell Data
        const cellHeaders = ['Cell ID', 'Resistance (mΩ)', 'Voltage (VDC)', 'Temperature (℃)', 'Timestamp', 'Status'];
        const cellRows = readings.map(r => {
            const dev = Math.abs(r.resistance - s.avgResistance) / s.avgResistance;
            const status = dev > 0.5 ? 'CRITICAL' : dev > 0.3 ? 'WARNING' : 'OK';
            return [r.id, r.resistance, r.voltage, r.temperature, r.time, status];
        });
        const ws2 = XLSX.utils.aoa_to_sheet([cellHeaders, ...cellRows]);
        ws2['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 22 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, ws2, 'Cell Data');

        // Sheet 3: Outliers
        const currentOutliers = readings.filter(r => Math.abs(r.resistance - s.avgResistance) > 2 * s.stdDevResistance);
        if (currentOutliers.length > 0) {
            const outlierHeaders = ['Cell ID', 'Resistance (mΩ)', 'Voltage (VDC)', 'Temperature (℃)', 'Deviation from Avg'];
            const outlierRows = currentOutliers.map(r => [
                r.id, r.resistance, r.voltage, r.temperature,
                `${((Math.abs(r.resistance - s.avgResistance) / s.avgResistance) * 100).toFixed(1)}%`
            ]);
            const ws3 = XLSX.utils.aoa_to_sheet([outlierHeaders, ...outlierRows]);
            ws3['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws3, 'Outliers');
        }

        // Sheet 4: Standards Compliance Analysis
        const complianceHeaders = ['Verdict', 'Finding', 'Standard', 'Clause', 'Threshold', 'Measured', 'Recommendations', 'Action Items', 'Reliability Impact'];
        const complianceRows = standardsFindings.map(f => [
            f.verdict,
            f.title,
            f.standard,
            f.clause,
            f.threshold,
            f.measured,
            f.recommendations.join('\n'),
            f.actions.join('\n'),
            f.reliabilityImpact
        ]);
        const ws4 = XLSX.utils.aoa_to_sheet([complianceHeaders, ...complianceRows]);
        ws4['!cols'] = [{ wch: 10 }, { wch: 35 }, { wch: 18 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, { wch: 45 }, { wch: 35 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(wb, ws4, 'Standards Compliance');

        XLSX.writeFile(wb, `BatteryOn_${m.deviceName.replace(/\s+/g, '_')}_${m.timeCreated?.split(' ')[0] || 'report'}.xlsx`);
    };

    // --- UPLOAD VIEW ---
    if (!data) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white dark:bg-industrial-800 rounded-xl shadow-lg p-8 border border-slate-200 dark:border-industrial-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Fluke Meter Import</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Upload CSV files exported from Fluke Battery Analyzers</p>
                        </div>
                    </div>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 cursor-pointer ${isDragOver
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 scale-[1.01]'
                            : 'border-slate-300 dark:border-industrial-600 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/10'
                            }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                    <Zap className="w-8 h-8 text-amber-500 animate-spin" />
                                </div>
                                <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Parsing Fluke data...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center shadow-lg shadow-amber-200/50 dark:shadow-amber-900/20">
                                    <Upload className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Drop Fluke CSV File Here</h3>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                        or click to browse • Supports <code className="text-amber-600 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-sm font-bold">CA-*.csv</code> format
                                    </p>
                                </div>
                                <button className="mt-4 px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 active:scale-95">
                                    Browse Files
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-red-700 dark:text-red-400 font-medium text-sm">{error}</p>
                        </div>
                    )}

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-industrial-900/50 border border-slate-200 dark:border-industrial-700">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supported Format</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">Fluke BT500 series CSV export files (CA-*.csv)</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-industrial-900/50 border border-slate-200 dark:border-industrial-700">
                            <div className="flex items-center gap-2 mb-2">
                                <Battery className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data Captured</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">Resistance (mΩ), Voltage (VDC), Temperature (℃)</p>
                        </div>
                        <div className="p-4 rounded-lg bg-slate-50 dark:bg-industrial-900/50 border border-slate-200 dark:border-industrial-700">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Analysis</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">Auto-detect outliers, health flags & statistical breakdown</p>
                        </div>
                    </div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept=".csv" />
            </div>
        );
    }

    // --- RESULTS VIEW ---
    const { metadata: meta, stats } = data;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-industrial-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-industrial-700 gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl">
                        <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">{meta.deviceName || 'Fluke Import'}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {meta.location} • {meta.capacity} • {stats.totalCells} cells
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={exportToPDF}
                        className="px-4 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                        <Download className="w-4 h-4" /> Excel
                    </button>
                    <button
                        onClick={() => { setData(null); setError(null); }}
                        className="px-5 py-2 text-sm font-bold text-slate-600 hover:text-white bg-slate-100 hover:bg-amber-500 dark:bg-industrial-700 dark:text-slate-300 dark:hover:bg-amber-500 dark:hover:text-white rounded-lg transition-all"
                    >
                        Import Another File
                    </button>
                </div>
            </div>

            {/* Profile Metadata Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                    { icon: MapPin, label: 'Location', value: meta.location || '—', color: 'text-blue-500' },
                    { icon: Battery, label: 'Device', value: meta.deviceName, color: 'text-emerald-500' },
                    { icon: Hash, label: 'Batteries', value: meta.batteryNumber.toString(), color: 'text-violet-500' },
                    { icon: Zap, label: 'Capacity', value: meta.capacity, color: 'text-amber-500' },
                    { icon: Clock, label: 'Test Date', value: meta.timeCreated ? meta.timeCreated.split(' ')[0] : '—', color: 'text-cyan-500' },
                    { icon: Clock, label: 'Duration', value: `${stats.testDurationMinutes} min`, color: 'text-rose-500' },
                ].map((card, i) => (
                    <div key={i} className="bg-white dark:bg-industrial-800 rounded-xl p-4 border border-slate-200 dark:border-industrial-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</span>
                        </div>
                        <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Statistics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Resistance Stats */}
                <div className="bg-white dark:bg-industrial-800 rounded-xl p-5 border border-slate-200 dark:border-industrial-700 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Resistance Statistics (mΩ)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-slate-400 font-medium">Average</span>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.avgResistance}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium">Std Deviation</span>
                                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{stats.stdDevResistance}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-emerald-500" />
                                <div>
                                    <span className="text-xs text-slate-400 font-medium">Min</span>
                                    <p className="text-lg font-bold text-emerald-600">{stats.minResistance}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-red-500" />
                                <div>
                                    <span className="text-xs text-slate-400 font-medium">Max</span>
                                    <p className="text-lg font-bold text-red-500">{stats.maxResistance}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Voltage Stats */}
                <div className="bg-white dark:bg-industrial-800 rounded-xl p-5 border border-slate-200 dark:border-industrial-700 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Battery className="w-4 h-4 text-emerald-500" /> Voltage Statistics (VDC)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div>
                                <span className="text-xs text-slate-400 font-medium">Average</span>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.avgVoltage} V</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-medium">Total String</span>
                                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">{stats.totalVoltage} V</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-emerald-500" />
                                <div>
                                    <span className="text-xs text-slate-400 font-medium">Min</span>
                                    <p className="text-lg font-bold text-emerald-600">{stats.minVoltage} V</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                <div>
                                    <span className="text-xs text-slate-400 font-medium">Max</span>
                                    <p className="text-lg font-bold text-blue-500">{stats.maxVoltage} V</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════ STANDARDS COMPLIANCE ANALYSIS ═══════════ */}
            {standardsFindings.length > 0 && (
                <div className="bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 dark:border-industrial-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20">
                        <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Standards Compliance Analysis
                        </h3>
                        <p className="text-xs text-indigo-500 dark:text-indigo-400/70 mt-1">
                            IEEE 450-2010 | IEEE 1188-2005 | IEC 60896 | IEC 62485-2 | IS 1651:2013
                        </p>
                    </div>
                    <div className="p-5 space-y-4">
                        {standardsFindings.map((finding, idx) => (
                            <div key={idx} className={`rounded-lg border p-4 ${finding.verdict === 'FAIL' ? 'border-red-200 dark:border-red-800/50 bg-red-50/60 dark:bg-red-900/10' :
                                finding.verdict === 'WARNING' ? 'border-amber-200 dark:border-amber-800/50 bg-amber-50/60 dark:bg-amber-900/10' :
                                    'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/60 dark:bg-emerald-900/10'
                                }`}>
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${finding.verdict === 'FAIL' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                                                finding.verdict === 'WARNING' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
                                                    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                                                }`}>
                                                {finding.verdict}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{finding.standard}</span>
                                        </div>
                                        <h4 className={`text-sm font-bold ${finding.verdict === 'FAIL' ? 'text-red-700 dark:text-red-400' :
                                            finding.verdict === 'WARNING' ? 'text-amber-700 dark:text-amber-400' :
                                                'text-emerald-700 dark:text-emerald-400'
                                            }`}>{finding.title}</h4>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">{finding.description}</p>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3 text-xs">
                                    <div className="bg-white/60 dark:bg-industrial-900/40 rounded px-3 py-2">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Standard & Clause</span>
                                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{finding.clause}</p>
                                    </div>
                                    <div className="bg-white/60 dark:bg-industrial-900/40 rounded px-3 py-2">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Threshold</span>
                                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{finding.threshold}</p>
                                    </div>
                                    <div className="bg-white/60 dark:bg-industrial-900/40 rounded px-3 py-2">
                                        <span className="font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px]">Measured</span>
                                        <p className="text-slate-700 dark:text-slate-300 font-medium mt-0.5">{finding.measured}</p>
                                    </div>
                                </div>

                                {(finding.verdict !== 'PASS') && (
                                    <>
                                        <div className="mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recommendations</span>
                                            <ul className="mt-1 space-y-1">
                                                {finding.recommendations.map((rec, i) => (
                                                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                                        <span className="text-amber-500 mt-0.5">▸</span> {rec}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action Items</span>
                                            <ul className="mt-1 space-y-1">
                                                {finding.actions.map((act, i) => (
                                                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                                                        <span className="text-blue-500 mt-0.5">◆</span> {act}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </>
                                )}

                                <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-industrial-700/50">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Reliability Impact: </span>
                                    <span className="text-xs text-slate-600 dark:text-slate-400">{finding.reliabilityImpact}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Outlier Alerts */}
            {outliers.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-800/50 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {outliers.length} Outlier Cell{outliers.length > 1 ? 's' : ''} Detected (±2σ)
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {outliers.map(o => (
                            <span key={o.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                                Cell {o.id} — {o.resistance} mΩ
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Charts Section */}
            <div className="bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700 shadow-sm overflow-hidden">
                {/* Chart Tabs */}
                <div className="flex border-b border-slate-200 dark:border-industrial-700 overflow-x-auto">
                    {[
                        { id: 'resistance' as const, label: 'Resistance Chart' },
                        { id: 'voltage' as const, label: 'Voltage Chart' },
                        { id: 'distribution' as const, label: 'Distribution' },
                        { id: 'combined' as const, label: 'Combined View' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveChart(tab.id)}
                            className={`px-6 py-3.5 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeChart === tab.id
                                ? 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
                                : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-industrial-700/50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6" style={{ height: 420 }}>
                    {activeChart === 'resistance' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="id" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 20)} label={{ value: 'Cell ID', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} label={{ value: 'mΩ', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} content={<CustomChartTooltip type="resistance" />} />
                                <ReferenceLine y={stats.avgResistance} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: `Avg: ${stats.avgResistance}`, position: 'right', fontSize: 11 }} />
                                <Bar dataKey="resistance" radius={[2, 2, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={index} fill={getResistanceBarColor(entry.resistance, stats.avgResistance)} />
                                    ))}
                                </Bar>
                                <Brush dataKey="id" height={30} stroke="#4f46e5" fill="#f8fafc" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {activeChart === 'voltage' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="id" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 20)} label={{ value: 'Cell ID', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} label={{ value: 'VDC', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} content={<CustomChartTooltip type="voltage" />} />
                                <ReferenceLine y={stats.avgVoltage} stroke="#10b981" strokeDasharray="5 5" label={{ value: `Avg: ${stats.avgVoltage}V`, position: 'right', fontSize: 11 }} />
                                <Line type="monotone" dataKey="voltage" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
                                <Brush dataKey="id" height={30} stroke="#4f46e5" fill="#f8fafc" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}

                    {activeChart === 'distribution' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="range" tick={{ fontSize: 9, angle: -30 }} height={50} label={{ value: 'Resistance Range (mΩ)', position: 'insideBottom', offset: -5, fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} content={<CustomChartTooltip type="distribution" />} />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {distributionData.map((entry, index) => (
                                        <Cell key={index} fill={entry.count > stats.totalCells * 0.15 ? '#8b5cf6' : '#a78bfa'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}

                    {activeChart === 'combined' && (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData} margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="id" tick={{ fontSize: 10 }} interval={Math.floor(chartData.length / 20)} label={{ value: 'Cell ID', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                                <YAxis yAxisId="left" tick={{ fontSize: 11 }} label={{ value: 'mΩ', angle: -90, position: 'insideLeft', offset: 10, fontSize: 12 }} />
                                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 11 }} label={{ value: 'VDC', angle: 90, position: 'insideRight', offset: 10, fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} content={<CustomChartTooltip type="combined" />} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="resistance" name="Resistance (mΩ)" radius={[2, 2, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={index} fill={getResistanceBarColor(entry.resistance, stats.avgResistance)} />
                                    ))}
                                </Bar>
                                <Line yAxisId="right" type="monotone" dataKey="voltage" stroke="#3b82f6" strokeWidth={2} dot={false} name="Voltage (VDC)" />
                                <Brush dataKey="id" height={30} stroke="#4f46e5" fill="#f8fafc" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-industrial-800 rounded-xl border border-slate-200 dark:border-industrial-700 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-industrial-700">
                    <button onClick={() => setShowTable(!showTable)} className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                        {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        Cell Measurements ({stats.totalCells} cells)
                    </button>
                    {showTable && (
                        <div className="flex items-center bg-slate-100 dark:bg-industrial-900/50 rounded-lg px-3 py-1.5 w-64 border border-slate-200 dark:border-industrial-700 focus-within:border-amber-500 transition-all">
                            <Search className="w-4 h-4 text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search cell ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none w-full text-sm text-slate-700 dark:text-white placeholder:text-slate-400 font-medium"
                            />
                        </div>
                    )}
                </div>

                {showTable && (
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-industrial-900 text-slate-500 dark:text-slate-400 font-bold sticky top-0 z-10">
                                <tr>
                                    {[
                                        { field: 'id' as SortField, label: 'Cell ID' },
                                        { field: 'resistance' as SortField, label: 'Resistance (mΩ)' },
                                        { field: 'voltage' as SortField, label: 'Voltage (VDC)' },
                                        { field: 'temperature' as SortField, label: 'Temp (℃)' },
                                        { field: 'time' as SortField, label: 'Timestamp' },
                                    ].map(col => (
                                        <th
                                            key={col.field}
                                            onClick={() => toggleSort(col.field)}
                                            className="px-4 py-3 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400 transition-colors select-none"
                                        >
                                            <span className="flex items-center gap-1.5">
                                                {col.label}
                                                <ArrowUpDown className={`w-3 h-3 ${sortField === col.field ? 'text-amber-500' : 'opacity-30'}`} />
                                            </span>
                                        </th>
                                    ))}
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-industrial-700/50">
                                {filteredData.map((row, idx) => {
                                    const deviation = Math.abs(row.resistance - stats.avgResistance) / stats.avgResistance;
                                    const isOutlier = deviation > 0.5;
                                    const isWarning = deviation > 0.3 && !isOutlier;
                                    return (
                                        <tr key={idx} className={`transition-colors ${isOutlier ? 'bg-red-50/50 dark:bg-red-900/10' : isWarning ? 'bg-amber-50/50 dark:bg-amber-900/10' : 'hover:bg-slate-50 dark:hover:bg-industrial-700/30'}`}>
                                            <td className="px-4 py-2.5 font-bold text-slate-700 dark:text-slate-300">{row.id}</td>
                                            <td className={`px-4 py-2.5 font-mono ${getResistanceColor(row.resistance, stats.avgResistance)}`}>{row.resistance}</td>
                                            <td className="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400">{row.voltage}</td>
                                            <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{row.temperature}</td>
                                            <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 text-xs">{row.time}</td>
                                            <td className="px-4 py-2.5">
                                                {isOutlier ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full">
                                                        <AlertCircle className="w-3 h-3" /> Critical
                                                    </span>
                                                ) : isWarning ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-full">
                                                        Warning
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                                                        OK
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
