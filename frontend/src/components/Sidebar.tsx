import React from 'react';

export type Page =
  | 'Dashboard'
  | 'Fleet'
  | 'Drivers'
  | 'Trips'
  | 'Maintenance'
  | 'Fuel & Expenses'
  | 'Analytics'
  | 'Settings';

interface SidebarProps {
  activePage: Page;
  onSelectPage: (page: Page) => void;
  onLogout?: () => void;
}

const NAV_ITEMS: { label: Page; iconPath: string }[] = [
  {
    label: 'Dashboard',
    iconPath:
      'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    label: 'Fleet',
    iconPath:
      'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  },
  {
    label: 'Drivers',
    iconPath:
      'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  {
    label: 'Trips',
    iconPath: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  },
  {
    label: 'Maintenance',
    iconPath:
      'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
  {
    label: 'Fuel & Expenses',
    iconPath:
      'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
  },
  {
    label: 'Analytics',
    iconPath:
      'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    label: 'Settings',
    iconPath:
      'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  },
];

const StationDot: React.FC<{ active: boolean }> = ({ active }) => (
  <span
    aria-hidden="true"
    className="absolute left-[19px] top-1/2 -translate-y-1/2 flex items-center justify-center"
    style={{ width: 12, height: 12 }}
  >
    <span
      className="rounded-full transition-all duration-150 ease-out"
      style={{
        width: active ? 10 : 8,
        height: active ? 10 : 8,
        backgroundColor: active ? '#5B2EBF' : '#FCFCFB',
        border: active ? '0' : '1.5px solid #9C9AA6',
        boxShadow: active ? '0 0 0 3px rgba(91,46,191,0.15)' : 'none',
      }}
    />
  </span>
);

export const Sidebar: React.FC<SidebarProps> = ({ activePage, onSelectPage, onLogout }) => {
  return (
    <aside
      data-testid="sidebar"
      className="fixed top-0 left-0 h-screen w-[240px] flex flex-col z-20"
      style={{ backgroundColor: '#EDEDF2', borderRight: '1px solid #E4E4EA' }}
    >
      {/* Brand Header */}
      <div
        className="h-16 flex items-center gap-2.5 px-6"
        style={{ borderBottom: '1px solid #E4E4EA' }}
      >
        <div
          className="flex items-center justify-center"
          style={{ width: 28, height: 28 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 28 28" width="28" height="28">
            <line x1="6" y1="4" x2="6" y2="24" stroke="#5B2EBF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="6" cy="7" r="2.6" fill="#5B2EBF" />
            <circle cx="6" cy="14" r="2.6" fill="#F4B740" />
            <circle cx="6" cy="21" r="2.6" fill="#5B2EBF" />
            <line x1="6" y1="14" x2="22" y2="14" stroke="#5B2EBF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="22" cy="14" r="2.6" fill="#5B2EBF" />
          </svg>
        </div>
        <span
          className="font-bold text-[17px] tracking-tight"
          style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
        >
          TransitOps
        </span>
      </div>

      {/* Transit Rail Nav */}
      <nav className="relative flex-1 px-4 py-6 overflow-y-auto" data-testid="sidebar-nav">
        {/* The rail line */}
        <div
          aria-hidden="true"
          className="absolute top-6 bottom-6"
          style={{
            left: 24,
            width: 2,
            backgroundColor: '#D6D5DD',
          }}
        />
        <ul className="relative flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = activePage === item.label;
            return (
              <li key={item.label} className="relative">
                <button
                  type="button"
                  onClick={() => onSelectPage(item.label)}
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`w-full group flex items-center gap-3 pl-10 pr-3 py-2.5 rounded-md text-sm transition-colors duration-150 cursor-pointer ${
                    isActive ? 'font-semibold' : 'hover:bg-white/70 font-normal'
                  }`}
                  style={{
                    color: isActive ? '#5B2EBF' : '#1B1A22',
                    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px #E4E4EA' : 'none',
                  }}
                >
                  <StationDot active={isActive} />
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={isActive ? 2.2 : 1.75}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
                  </svg>
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer / Logout */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderTop: '1px solid #E4E4EA' }}
      >
        <span className="text-[11px] font-mono" style={{ color: '#9C9AA6' }}>
          v1.0 · LIGHT-THEME
        </span>
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer transition-colors"
          >
            Logout
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
