import React from 'react';

interface TopBarProps {
  role?: string;
  userName?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  role = 'Fleet Manager',
  userName = 'Operator',
}) => {
  return (
    <header
      data-testid="topbar"
      className="fixed top-0 left-[240px] right-0 h-16 z-10 flex items-center justify-between px-8"
      style={{ backgroundColor: '#FCFCFB', borderBottom: '1px solid #EDEDF2' }}
    >
      <div className="flex items-center gap-3 max-w-md w-full">
        <div className="relative w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#9C9AA6' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            data-testid="global-search"
            placeholder="Search vehicles, trips, drivers..."
            className="w-full h-9 pl-9 pr-3 rounded-md text-sm outline-none transition-colors duration-150"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #EDEDF2',
              color: '#1B1A22',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#5B2EBF')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#EDEDF2')}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: '#1B1A22' }}>
          {userName}
        </span>
        <span
          data-testid="role-badge"
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#5B2EBF', color: '#FFFFFF' }}
        >
          {role}
        </span>
      </div>
    </header>
  );
};

export default TopBar;
