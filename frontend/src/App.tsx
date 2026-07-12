import { useState, useEffect } from 'react';
import { LoginPage, FleetPage, DriversPage, TripsPage, MaintenancePage, FuelExpensePage, DashboardPage, AnalyticsPage, SettingsPage } from './pages';
import type { User } from './types/auth';

type Page = 'Dashboard' | 'Fleet' | 'Drivers' | 'Trips' | 'Maintenance' | 'Fuel & Expenses' | 'Analytics' | 'Settings';

const NAV_ITEMS: Page[] = [
  'Dashboard',
  'Fleet',
  'Drivers',
  'Trips',
  'Maintenance',
  'Fuel & Expenses',
  'Analytics',
  'Settings',
];

const NAV_ICONS: Record<Page, string> = {
  Dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  Fleet: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10 M17 16V8a1 1 0 00-1-1h-2l-3-3H8',
  Drivers: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  Trips: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  Maintenance: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  'Fuel & Expenses': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  Analytics: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  Settings: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<Page>('Dashboard');

  useEffect(() => {
    const savedToken = localStorage.getItem('transitops_token');
    const savedUser = localStorage.getItem('transitops_user');
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch {
        // Corrupted user data - clear everything and re-login
        localStorage.removeItem('transitops_token');
        localStorage.removeItem('transitops_user');
      }
    } else if (savedToken && !savedUser) {
      // Token exists but no persisted user (rememberMe was false)
      // Clear the token so the user is prompted to log in again
      localStorage.removeItem('transitops_token');
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

  const renderPage = () => {
    switch (activePage) {
      case 'Fleet':
        return <FleetPage />;
      case 'Drivers':
        return <DriversPage />;
      case 'Trips':
        return <TripsPage />;
      case 'Maintenance':
        return <MaintenancePage />;
      case 'Fuel & Expenses':
        return <FuelExpensePage />;
      case 'Dashboard':
        return <DashboardPage onNavigate={(p) => setActivePage(p)} />;
      case 'Analytics':
        return <AnalyticsPage />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return (
          <div className="p-12 rounded-2xl bg-[#0e1422] border border-slate-800 text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              {activePage}
            </h2>
            <p className="text-slate-400 text-sm">
              This section is under development.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0e1422] border-r border-slate-800 flex flex-col justify-between fixed inset-y-0 left-0 z-30">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
              T
            </div>
            <span className="font-bold text-lg tracking-tight">TransitOps</span>
          </div>

          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => setActivePage(item)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition duration-150 ${
                  activePage === item
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={NAV_ICONS[item]} />
                </svg>
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Bar */}
        <header className="h-16 bg-[#0e1422] border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="w-96">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 rounded-xl bg-[#151d30] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
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

        <main className="p-8 flex-1">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
