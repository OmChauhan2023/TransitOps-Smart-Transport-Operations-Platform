import { useState, useEffect } from 'react';
import { LoginPage } from './pages';
import type { User } from './types/auth';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('transitops_token');
    const savedUser = localStorage.getItem('transitops_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('transitops_user');
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User, jwtToken: string) => {
    setUser(loggedInUser);
    setToken(jwtToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
  };

  if (!user || !token) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0e1422] border-r border-slate-800 flex flex-col justify-between">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
              T
            </div>
            <span className="font-bold text-lg tracking-tight">TransitOps</span>
          </div>

          <nav className="p-4 space-y-1">
            {[
              'Dashboard',
              'Fleet',
              'Drivers',
              'Trips',
              'Maintenance',
              'Fuel & Expenses',
              'Analytics',
              'Settings',
            ].map((item) => (
              <button
                key={item}
                className="w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition"
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-[#0e1422] border-b border-slate-800 px-8 flex items-center justify-between">
          <div className="w-96">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 rounded-xl bg-[#151d30] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-white">
                {user.name}
              </div>
              <div className="text-xs text-blue-400 font-medium">
                {user.role}
              </div>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="p-12 rounded-2xl bg-[#0e1422] border border-slate-800 text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              Welcome, {user.name}
            </h2>
            <p className="text-slate-400 text-sm">
              Role active: <span className="text-blue-400">{user.role}</span>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
