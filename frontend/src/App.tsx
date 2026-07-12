import { useState, useEffect } from 'react';
import { LoginPage, FleetPage, DriversPage, TripsPage, MaintenancePage, FuelExpensePage, DashboardPage, AnalyticsPage, SettingsPage } from './pages';
import { Sidebar, TopBar } from './components';
import type { User } from './types/auth';

type Page = 'Dashboard' | 'Fleet' | 'Drivers' | 'Trips' | 'Maintenance' | 'Fuel & Expenses' | 'Analytics' | 'Settings';

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
    <div
      className="min-h-screen"
      style={{ backgroundColor: '#FCFCFB', color: '#1B1A22' }}
    >
      <Sidebar
        activePage={activePage}
        onSelectPage={(p: Page) => setActivePage(p)}
        onLogout={handleLogout}
      />
      <TopBar role={user.role} userName={user.name} />
      <main
        data-testid="main-content"
        className="ml-[240px] pt-16 min-h-screen"
      >
        <div className="p-8">{renderPage()}</div>
      </main>
    </div>
  );
}

export default App;
