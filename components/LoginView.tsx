import React, { useState } from 'react';
import { Lock, User, Battery, AlertCircle, ArrowRight } from 'lucide-react';
import { AuthService } from '../services/AuthService';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await AuthService.login(username, password);
      onLogin();
    } catch (err) {
      setError('Invalid credentials. Try "admin" / "password".');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1558494949-ef526b0042a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800/90"></div>
      </div>

      <div className="max-w-md w-full z-10 animate-fade-in-up">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
             <div className="bg-brand-600 p-2 rounded-xl shadow-glow">
                <Battery className="w-8 h-8 text-white" />
             </div>
             <h1 className="text-3xl font-display font-bold text-white tracking-tight">BatteryOn <span className="text-brand-500">Analytics</span></h1>
          </div>
          <p className="text-slate-300 text-sm font-medium">Enterprise Battery Monitoring Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-400" /> Secure Access
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-slate-500"
                  placeholder="Enter ID (e.g. admin)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex items-center gap-2 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-brand-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
             <div className="text-xs text-slate-500">
               Protected by Enterprise Grade Security
             </div>
             <div className="flex justify-center gap-4 mt-2">
                <span className="w-2 h-2 rounded-full bg-green-500" title="System Online"></span>
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                <span className="w-2 h-2 rounded-full bg-slate-600"></span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
