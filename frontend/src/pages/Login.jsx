import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, UserCheck, Briefcase, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Preset demo auto-fill credentials
  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-100 font-extrabold text-2xl">
          A
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Beauty & Wellness Business OS
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Configurable Operating System for Appointment-based Businesses
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl border border-slate-200/80 rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="owner@aura.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Preset Demo Logins Card */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> One-Click Seeded Demo Login:
            </p>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('owner@aura.com', 'password123')}
                className="w-full p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Business Owner</p>
                    <p className="text-[10px] text-slate-500">owner@aura.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600">Auto-fill</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('reception@aura.com', 'password123')}
                className="w-full p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Reception / Front Desk</p>
                    <p className="text-[10px] text-slate-500">reception@aura.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600">Auto-fill</span>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('staff@aura.com', 'password123')}
                className="w-full p-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Staff Specialist</p>
                    <p className="text-[10px] text-slate-500">staff@aura.com</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-indigo-600">Auto-fill</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs">
            <span className="text-slate-500">Want to register a new business? </span>
            <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700">
              Create Business Account
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
