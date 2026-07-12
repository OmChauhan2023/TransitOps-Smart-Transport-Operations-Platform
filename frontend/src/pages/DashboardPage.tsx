import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { DashboardSummary } from '../types/dashboard';

interface DashboardPageProps {
  onNavigate?: (page: any) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Dispatched: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/dashboard/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading Executive Command Center…
      </div>
    );
  }

  const kpis = summary?.kpis || {
    totalVehicles: 0,
    activeVehicles: 0,
    availableVehicles: 0,
    inShopVehicles: 0,
    retiredVehicles: 0,
    utilizationRate: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    availableDrivers: 0,
    pendingDispatches: 0,
    activeTrips: 0,
    completedTrips: 0,
  };

  const breakdown = summary?.vehicleStatusBreakdown || {
    Available: { count: 0, percentage: 0 },
    OnTrip: { count: 0, percentage: 0 },
    InShop: { count: 0, percentage: 0 },
    Retired: { count: 0, percentage: 0 },
  };

  const recentTrips = summary?.recentTrips || [];

  return (
    <div className="space-y-8">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Executive Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time telemetry, operational status, and fleet dispatch overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate?.('Trips')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition"
          >
            + Dispatch Trip
          </button>
          <button
            onClick={() => onNavigate?.('Fleet')}
            className="px-4 py-2.5 rounded-xl bg-[#151d30] hover:bg-slate-800 border border-slate-700 text-white text-sm font-semibold transition"
          >
            Manage Fleet
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Active Fleet */}
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Fleet
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-xs font-semibold">
              {kpis.utilizationRate}% Utilized
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {kpis.activeVehicles}{' '}
            <span className="text-base font-normal text-slate-500">
              / {kpis.totalVehicles} total
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {kpis.availableVehicles} available for dispatch
          </div>
        </div>

        {/* Pending Dispatches */}
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Dispatches
            </span>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {kpis.pendingDispatches}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Draft trips awaiting driver assignment
          </div>
        </div>

        {/* Active Drivers */}
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Drivers
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-xs font-semibold">
              On Duty
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {kpis.activeDrivers}{' '}
            <span className="text-base font-normal text-slate-500">
              / {kpis.totalDrivers} total
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {kpis.availableDrivers} drivers ready
          </div>
        </div>

        {/* Vehicles In Shop */}
        <div className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Vehicles In Shop
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-xs font-semibold">
              Maintenance
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {kpis.inShopVehicles}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {kpis.retiredVehicles} retired units excluded
          </div>
        </div>
      </div>

      {/* Fleet Status Distribution Bars */}
      <div className="p-6 rounded-2xl bg-[#0e1422] border border-slate-800">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Fleet Status Distribution
        </h3>

        {/* Multi-segment distribution bar */}
        <div className="w-full h-4 rounded-full bg-slate-800 flex overflow-hidden mb-6">
          {breakdown.Available.percentage > 0 && (
            <div
              style={{ width: `${breakdown.Available.percentage}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Available: ${breakdown.Available.count}`}
            />
          )}
          {breakdown.OnTrip.percentage > 0 && (
            <div
              style={{ width: `${breakdown.OnTrip.percentage}%` }}
              className="bg-blue-500 h-full transition-all"
              title={`On Trip: ${breakdown.OnTrip.count}`}
            />
          )}
          {breakdown.InShop.percentage > 0 && (
            <div
              style={{ width: `${breakdown.InShop.percentage}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`In Shop: ${breakdown.InShop.count}`}
            />
          )}
          {breakdown.Retired.percentage > 0 && (
            <div
              style={{ width: `${breakdown.Retired.percentage}%` }}
              className="bg-red-500 h-full transition-all"
              title={`Retired: ${breakdown.Retired.count}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-[#151d30] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Available
            </div>
            <div className="text-lg font-bold text-white">
              {breakdown.Available.count}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({breakdown.Available.percentage}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#151d30] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              On Trip
            </div>
            <div className="text-lg font-bold text-white">
              {breakdown.OnTrip.count}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({breakdown.OnTrip.percentage}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#151d30] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              In Shop
            </div>
            <div className="text-lg font-bold text-white">
              {breakdown.InShop.count}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({breakdown.InShop.percentage}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#151d30] border border-slate-800">
            <div className="flex items-center gap-2 text-xs text-red-400 font-semibold mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Retired
            </div>
            <div className="text-lg font-bold text-white">
              {breakdown.Retired.count}{' '}
              <span className="text-xs text-slate-500 font-normal">
                ({breakdown.Retired.percentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white">Recent Dispatched &amp; Active Trips</h3>
          <button
            onClick={() => onNavigate?.('Trips')}
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            View All Trips →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trip ID</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Route</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cargo Weight</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No recent trips logged. Dispatch a trip to see real-time activity.
                  </td>
                </tr>
              ) : (
                recentTrips.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition"
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-white">
                      {t.trip_code}
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {t.source} → {t.destination}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {t.vehicle.reg_number} ({t.vehicle.name})
                    </td>
                    <td className="px-6 py-4 text-slate-400">{t.driver.name}</td>
                    <td className="px-6 py-4 text-slate-300">{t.cargo_weight} kg</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          STATUS_COLORS[t.status] || 'bg-slate-700 text-white'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
