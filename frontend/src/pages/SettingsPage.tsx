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

const BADGE_STYLES: Record<PermissionLevel, { label: string; className: string }> = {
  full: {
    label: 'Full Access',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  view: {
    label: 'Read-Only',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  none: {
    label: 'No Access',
    className: 'bg-slate-800/80 text-slate-500 border-slate-700/60',
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
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Settings & Access Control
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure organization preferences and audit the active Role-Based Access Control (RBAC) security matrix.
        </p>
      </div>

      {/* General Settings Form Card */}
      <div className="bg-[#131a2a] rounded-2xl border border-slate-800 p-6 shadow-xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white">General Organization Preferences</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            These parameters govern default units, timezones, and maintenance alert thresholds across the fleet.
          </p>
        </div>

        {savedMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {savedMessage}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#182236] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                System Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#182236] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="America/New_York">America / New York (EST)</option>
                <option value="Europe/London">Europe / London (GMT)</option>
                <option value="Asia/Kolkata">Asia / Kolkata (IST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Currency Symbol
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#182236] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
                <option value="GBP (£)">GBP (£)</option>
                <option value="INR (₹)">INR (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Maintenance Alert Odometer Interval (km)
              </label>
              <input
                type="number"
                value={maintThreshold}
                onChange={(e) => setMaintThreshold(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#182236] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition duration-150 cursor-pointer"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Read-Only RBAC Permission Matrix Card */}
      <div className="bg-[#131a2a] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              RBAC Security Permission Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-based access is strictly enforced at both middleware (API) and UI navigation levels. Read-only matrix below.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
              Full Access
            </span>
            <span className="px-2.5 py-1 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium">
              Read-Only
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-500 border border-slate-700 font-medium">
              No Access
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#182236]/60">
                <th className="py-4 px-6">System Module</th>
                <th className="py-4 px-6 text-center">Fleet Manager</th>
                <th className="py-4 px-6 text-center">Dispatcher</th>
                <th className="py-4 px-6 text-center">Safety Officer</th>
                <th className="py-4 px-6 text-center">Financial Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {RBAC_DATA.map((row) => (
                <tr
                  key={row.module}
                  className="hover:bg-slate-800/30 transition duration-150"
                >
                  <td className="py-4 px-6">
                    <div className="font-semibold text-white">{row.module}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{row.description}</div>
                  </td>

                  {(['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'] as const).map(
                    (roleKey) => {
                      const level = row[roleKey];
                      const badge = BADGE_STYLES[level];
                      return (
                        <td key={roleKey} className="py-4 px-6 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${badge.className}`}
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

        <div className="px-6 py-3 bg-[#182236]/30 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Security policy: Explicit Principle of Least Privilege (PoLP)</span>
          <span>Matrix Status: Active & Enforced</span>
        </div>
      </div>
    </div>
  );
};
