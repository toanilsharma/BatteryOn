import React, { useState } from 'react';
import {
  Activity,
  FileText
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { ReportView } from './components/ReportView';
import { LandingPage } from './components/LandingPage';
import { AppLayout } from './components/AppLayout';
import { AnalysisUpload } from './components/AnalysisUpload';
import { FlukeDataViewer } from './components/FlukeDataViewer';
import { Sitemap } from './components/Sitemap';
import { Standards } from './components/Standards';
import { AnalysisResult } from './types';

import { ThemeProvider, useTheme } from './components/ThemeContext';
import { AboutUs } from './components/AboutUs';
import { ContactUs } from './components/ContactUs';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import { Disclaimer } from './components/Disclaimer';

function AppContent() {
  const [currentView, setCurrentView] = useState('landing');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const { theme, setTheme } = useTheme();

  // Mock user for now
  const user = { username: 'Demo User', role: 'Engineer' };

  const handleNavigate = (viewId: string) => {
    setCurrentView(viewId);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onStart={() => handleNavigate('dashboard')} />;
      case 'dashboard':
        return (
          <div className="space-y-6 animate-fade-in">
            {analysisResult ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-industrial-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-industrial-700">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-brand-600" />
                      Active Analysis
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {analysisResult.assetId} • {analysisResult.chemistry}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAnalysisResult(null)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                      Close Session
                    </button>
                    <button
                      onClick={() => handleNavigate('reports')}
                      className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </button>
                  </div>
                </div>
                <Dashboard
                  data={analysisResult}
                  onAnalyze={() => setAnalysisResult(null)}
                  onGenerateReport={() => handleNavigate('reports')}
                />
              </div>
            ) : (
              <Dashboard
                data={null}
                onAnalyze={() => handleNavigate('analysis')}
                onViewReports={() => handleNavigate('reports')}
                onGenerateReport={() => handleNavigate('reports')}
              />
            )}
          </div>
        );
      case 'analysis':
        return (
          <div className="space-y-6 animate-fade-in">
            {analysisResult ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-white dark:bg-industrial-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-industrial-700">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-brand-600" />
                      Analysis Results
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {analysisResult.assetId} • {analysisResult.chemistry}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAnalysisResult(null)}
                      className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                      New Analysis
                    </button>
                    <button
                      onClick={() => handleNavigate('reports')}
                      className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Generate Report
                    </button>
                  </div>
                </div>
                <Dashboard
                  data={analysisResult}
                  onAnalyze={() => setAnalysisResult(null)}
                  onGenerateReport={() => handleNavigate('reports')}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-industrial-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-industrial-700">
                <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-3">
                  <Activity className="w-6 h-6 text-brand-600" />
                  New Analysis
                </h2>
                <AnalysisUpload onAnalysisComplete={(result: AnalysisResult) => {
                  setAnalysisResult(result);
                  // Stay in this view to show results inline
                }} />
              </div>
            )}
          </div>
        );
      case 'fluke-import':
        return (
          <div className="space-y-6 animate-fade-in">
            <FlukeDataViewer />
          </div>
        );
      case 'reports':
        // If we have a stored result, show report, otherwise show list/empty state
        return analysisResult ? (
          <ReportView data={analysisResult} onBack={() => handleNavigate('dashboard')} />
        ) : (
          <div className="text-center py-20 bg-white dark:bg-industrial-800 rounded-xl border border-dashed border-slate-300 dark:border-industrial-700">
            <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-500">No Reports Generated</h3>
            <p className="text-slate-400 max-w-sm mx-auto mt-2">Run a new analysis to generate an engineering report.</p>
            <button
              onClick={() => handleNavigate('analysis')}
              className="mt-6 px-6 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 transition-colors"
            >
              Start Analysis
            </button>
          </div>
        );
      case 'sitemap':
        return <Sitemap onNavigate={handleNavigate} />;
      case 'standards':
        return (
          <div className="space-y-6 animate-fade-in">
            <Standards />
          </div>
        );
      case 'settings':
        // ... (Settings code remains same)
        return (
          <div className="max-w-2xl mx-auto bg-white dark:bg-industrial-800 rounded-xl shadow p-8 border border-slate-200 dark:border-industrial-700">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">System Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Theme Preference</label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${theme === 'light' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'border-slate-300 text-slate-600'}`}
                  >
                    Light Mode
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${theme === 'dark' ? 'bg-industrial-900 border-brand-500 text-brand-400' : 'border-slate-300 text-slate-600'}`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Data Source Mode</label>
                <select className="w-full p-2 rounded border border-slate-300 dark:border-industrial-600 bg-white dark:bg-industrial-900 text-slate-900 dark:text-white">
                  <option>Manual Upload (CSV/Excel)</option>
                  <option>Fluke 500 Series Import</option>
                  <option>Alber CRT Import</option>
                  <option>Modbus TCP (Real-time)</option>
                </select>
              </div>
            </div>
          </div>

        );
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'terms':
        return <TermsOfService />;
      case 'disclaimer':
        return <Disclaimer />;
      default:
        // Fallback
        return <LandingPage onStart={() => handleNavigate('dashboard')} />;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-industrial-900 min-h-screen">
      <AppLayout
        currentView={currentView}
        onNavigate={handleNavigate}
        user={{ name: user.username, role: user.role }}
      >
        {renderContent()}
      </AppLayout>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <AppContent />
    </ThemeProvider>
  );
}
