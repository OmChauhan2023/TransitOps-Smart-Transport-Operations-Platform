import React, { useState } from 'react';
import axios from 'axios';
import type { Role, User } from '../types/auth';
import api from '../services/api';

interface LoginPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

const ROLES: { value: Role; label: string; preview: string }[] = [
  { value: 'FleetManager', label: 'Fleet Manager', preview: 'Fleet, Maintenance' },
  { value: 'Dispatcher', label: 'Dispatcher', preview: 'Dashboard, Trips' },
  { value: 'SafetyOfficer', label: 'Safety Officer', preview: 'Drivers, Compliance' },
  { value: 'FinancialAnalyst', label: 'Financial Analyst', preview: 'Fuel & Expenses, Analytics' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('FleetManager');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Invalid credentials');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        role,
      });

      if (response.data.token && response.data.user) {
        if (rememberMe) {
          localStorage.setItem('transitops_token', response.data.token);
          localStorage.setItem('transitops_user', JSON.stringify(response.data.user));
        }
        onLoginSuccess(response.data.user, response.data.token);
      }
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response) {
        const data = err.response.data;
        if (data.locked) {
          setIsLocked(true);
        }
        setError(data.message || 'Invalid credentials');
      } else {
        setError('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0b0f19]">
      {/* Left Light Panel */}
      <div className="lg:w-1/2 bg-slate-50 text-slate-900 p-8 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/30">
              T
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">TransitOps</h1>
              <p className="text-xs text-slate-500 font-medium">
                Smart Transport Operations Platform
              </p>
            </div>
          </div>

          <div className="max-w-md my-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-4">
              One platform for unified transport intelligence.
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              One login, four roles:
            </p>

            <div className="space-y-4">
              {ROLES.map((item) => (
                <div
                  key={item.value}
                  className="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm"
                >
                  <span className="font-semibold text-slate-800">
                    {item.label}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {item.preview}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400 mt-8">
          © {new Date().getFullYear()} TransitOps Smart Transport Operations Platform
        </div>
      </div>

      {/* Right Dark Panel */}
      <div className="lg:w-1/2 bg-[#0e1422] text-slate-100 p-8 lg:p-16 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-400">
              Enter your credentials and select your operational role.
            </p>
          </div>

          {error && (
            <div
              className={`p-4 rounded-xl mb-6 text-sm font-medium border ${
                isLocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dispatcher@transitops.com"
                className="w-full px-4 py-3 rounded-xl bg-[#151d30] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-[#151d30] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Role (RBAC)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-4 py-3 rounded-xl bg-[#151d30] border border-slate-700 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#151d30] border-slate-700 text-blue-600 focus:ring-0"
                />
                Remember me
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact your Fleet Manager to reset your password.');
                }}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold shadow-lg shadow-blue-600/25 transition duration-150"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Footer Text Listing Role Previews */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-300 mb-2">
              Role Access Overview:
            </p>
            <ul className="space-y-1">
              <li>• Fleet Manager → Fleet, Maintenance</li>
              <li>• Dispatcher → Dashboard, Trips</li>
              <li>• Safety Officer → Drivers, Compliance</li>
              <li>• Financial Analyst → Fuel & Expenses, Analytics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
