import React, { useEffect, useState } from 'react';

// Mock history data for offline fallback
const MOCK_HISTORY = [
  { id: 105, timestamp: '2023-12-01', asset_id: 'LOCAL-BACKUP-1', chemistry: 'Lead-Acid (VRLA AGM)', health_score: 92, grade: 'Excellent' },
];

export const HistoryView = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.warn("Using offline history");
        setOffline(true);
        setHistory(MOCK_HISTORY);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="p-8 text-industrial-400 text-center animate-pulse">Loading archive...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-industrial-800 p-6 rounded-lg border border-industrial-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-industrial-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Analysis History
          </h2>
          {offline && <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/50">OFFLINE MODE</span>}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-industrial-900 text-industrial-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">Asset ID</th>
                <th className="p-4">Chemistry</th>
                <th className="p-4">Score</th>
                <th className="p-4">Grade</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-700 text-slate-300">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-industrial-700/30 transition-colors">
                  <td className="p-4 font-mono text-industrial-300">{new Date(row.timestamp).toLocaleDateString()}</td>
                  <td className="p-4 font-bold text-white">{row.asset_id}</td>
                  <td className="p-4 text-industrial-400">{row.chemistry}</td>
                  <td className="p-4 font-mono">{row.health_score}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      row.grade === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                      row.grade === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                      row.grade === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {row.grade}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-industrial-accent hover:text-white underline">View JSON</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};