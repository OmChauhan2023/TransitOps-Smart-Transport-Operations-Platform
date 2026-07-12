import React, { useState } from 'react';

type PermissionLevel = 'full' | 'view' | 'none';

interface RbacRow {
  module: string;
  description: string;
  FleetManager: PermissionLevel;
  Dispatcher: PermissionLevel;
  SafetyOfficer: PermissionLevel;
  FinancialAnalyst: PermissionLevel;
}

const RBAC_DATA: RbacRow[] = [
  {
    module: 'Fleet Management',
    description: 'Vehicles CRUD, specs, load capacity, region assignments',
    FleetManager: 'full',
    Dispatcher: 'view',
    SafetyOfficer: 'none',
    FinancialAnalyst: 'view',
  },
  {
    module: 'Drivers & Safety Profiles',
    description: 'Driver profiles, CDL license expiries, safety scores, duty status',
    FleetManager: 'full',
    Dispatcher: 'none',
    SafetyOfficer: 'full',
    FinancialAnalyst: 'none',
  },
  {
    module: 'Trips & Dispatch',
    description: 'Trip lifecycle stepper, capacity check, dispatching, completion/cancellation',
    FleetManager: 'none',
    Dispatcher: 'full',
    SafetyOfficer: 'view',
    FinancialAnalyst: 'none',
  },
  {
    module: 'Maintenance Logs',
    description: 'Service logs, auto In-Shop sync, service costs & history',
    FleetManager: 'full',
    Dispatcher: 'none',
    SafetyOfficer: 'view',
    FinancialAnalyst: 'view',
  },
  {
    module: 'Fuel & Expenses',
    description: 'Fuel logs, toll fees, trip expenses & operational cost aggregation',
    FleetManager: 'full',
    Dispatcher: 'none',
    SafetyOfficer: 'none',
    FinancialAnalyst: 'full',
  },
  {
    module: 'Analytics & Reporting',
    description: 'ROI formula, costliest-vehicles ranking, CSV report export',
    FleetManager: 'full',
    Dispatcher: 'none',
    SafetyOfficer: 'none',
    FinancialAnalyst: 'full',
  },
];

const BADGE_STYLES: Record<PermissionLevel, { label: string; style: React.CSSProperties }> = {
  full: {
    label: 'Full Access',
    style: { backgroundColor: '#22B57315', color: '#22B573', border: '1px solid #22B57340' },
  },
  view: {
    label: 'Read-Only',
    style: { backgroundColor: '#5B2EBF15', color: '#5B2EBF', border: '1px solid #5B2EBF40' },
  },
  none: {
    label: 'No Access',
    style: { backgroundColor: '#FCFCFB', color: '#6B6976', border: '1px solid #EDEDF2' },
  },
};

export const SettingsPage: React.FC = () => {
  const [orgName, setOrgName] = useState('TransitOps Corporation');
  const [timezone, setTimezone] = useState('UTC');
  const [currency, setCurrency] = useState('USD ($)');
  const [maintThreshold, setMaintThreshold] = useState('10000');
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Organization settings updated successfully.');
    setTimeout(() => {
      setSavedMessage(null);
    }, 3500);
  };

  return (
    <div className="space-y-8" data-testid="settings-page">
      {/* Page Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
        >
          Settings &amp; Access Control
        </h1>
        <p className="text-sm mt-1" style={{ color: '#6B6976' }}>
          Configure organization preferences and audit the active Role-Based Access Control (RBAC) security matrix.
        </p>
      </div>

      {/* General Settings Form Card */}
      <div className="bg-white rounded-xl p-6 space-y-6" style={{ border: '1px solid #EDEDF2' }}>
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}>
            General Organization Preferences
          </h2>
          <p className="text-xs mt-0.5" style={{ color: '#6B6976' }}>
            These parameters govern default units, timezones, and maintenance alert thresholds across the fleet.
          </p>
        </div>

        {savedMessage && (
          <div
            className="p-3.5 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{ backgroundColor: '#22B57315', border: '1px solid #22B57340', color: '#22B573' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {savedMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                System Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America / New York (EST)</option>
                <option value="Europe/London">Europe / London (GMT)</option>
                <option value="Asia/Kolkata">Asia / Kolkata (IST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="INR (₹)">INR (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                Maintenance Alert Odometer Interval (km)
              </label>
              <input
                type="number"
                value={maintThreshold}
                onChange={(e) => setMaintThreshold(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-white text-sm font-semibold transition cursor-pointer"
              style={{ backgroundColor: '#5B2EBF' }}
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Read-Only RBAC Permission Matrix Card */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderBottom: '1px solid #EDEDF2' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}>
              RBAC Security Permission Matrix
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B6976' }}>
              Role-based access is strictly enforced at both middleware (API) and UI navigation levels. Read-only matrix below.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span
              className="px-2.5 py-1 rounded-md font-medium"
              style={{ backgroundColor: '#22B57315', color: '#22B573', border: '1px solid #22B57340' }}
            >
              Full Access
            </span>
            <span
              className="px-2.5 py-1 rounded-md font-medium"
              style={{ backgroundColor: '#5B2EBF15', color: '#5B2EBF', border: '1px solid #5B2EBF40' }}
            >
              Read-Only
            </span>
            <span
              className="px-2.5 py-1 rounded-md font-medium"
              style={{ backgroundColor: '#FCFCFB', color: '#6B6976', border: '1px solid #EDEDF2' }}
            >
              No Access
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #EDEDF2' }}>
                <th className="py-3.5 px-6 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>System Module</th>
                <th className="py-3.5 px-6 text-xs font-medium uppercase tracking-wider text-center" style={{ color: '#6B6976' }}>Fleet Manager</th>
                <th className="py-3.5 px-6 text-xs font-medium uppercase tracking-wider text-center" style={{ color: '#6B6976' }}>Dispatcher</th>
                <th className="py-3.5 px-6 text-xs font-medium uppercase tracking-wider text-center" style={{ color: '#6B6976' }}>Safety Officer</th>
                <th className="py-3.5 px-6 text-xs font-medium uppercase tracking-wider text-center" style={{ color: '#6B6976' }}>Financial Analyst</th>
              </tr>
            </thead>
            <tbody>
              {RBAC_DATA.map((row) => (
                <tr
                  key={row.module}
                  className="hover:bg-[#FCFCFB] transition"
                  style={{ borderBottom: '1px solid #EDEDF2' }}
                >
                  <td className="py-4 px-6">
                    <div className="font-semibold" style={{ color: '#1B1A22' }}>{row.module}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#6B6976' }}>{row.description}</div>
                  </td>

                  {(['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'] as const).map(
                    (roleKey) => {
                      const level = row[roleKey];
                      const badge = BADGE_STYLES[level];
                      return (
                        <td key={roleKey} className="py-4 px-6 text-center">
                          <span
                            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                            style={badge.style}
                          >
                            {badge.label}
                          </span>
                        </td>
                      );
                    }
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="px-6 py-3 text-xs flex items-center justify-between"
          style={{ backgroundColor: '#FCFCFB', borderTop: '1px solid #EDEDF2', color: '#6B6976' }}
        >
          <span>Security policy: Explicit Principle of Least Privilege (PoLP)</span>
          <span>Matrix Status: Active &amp; Enforced</span>
        </div>
      </div>
    </div>
  );
};
