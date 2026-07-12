import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { DashboardSummary } from '../types/dashboard';
import { KpiCard, StatusBadge } from '../components';

interface DashboardPageProps {
  onNavigate?: (page: any) => void;
}

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
      <div className="flex items-center justify-center py-24 text-[#6B6976]">
        <div className="w-6 h-6 border-2 border-[#5B2EBF] border-t-transparent rounded-full animate-spin mr-3" />
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
    <div className="space-y-8" data-testid="dashboard-page">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Operations Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6976' }}>
            Live snapshot of the fleet · updated just now
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono mr-2" style={{ color: '#6B6976' }}>
            <span
              className="w-2 h-2 rounded-full animate-station-pulse"
              style={{ backgroundColor: '#22B573' }}
            />
            SYSTEM · LIVE
          </div>
          <button
            onClick={() => onNavigate?.('Trips')}
            className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition cursor-pointer"
            style={{ backgroundColor: '#5B2EBF' }}
          >
            + Dispatch Trip
          </button>
          <button
            onClick={() => onNavigate?.('Fleet')}
            className="px-4 py-2.5 rounded-lg bg-white hover:bg-gray-50 text-sm font-semibold transition cursor-pointer"
            style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
          >
            Manage Fleet
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="kpi-row">
        <KpiCard
          testId="kpi-active-fleet"
          label="Active Fleet"
          value={kpis.activeVehicles}
          suffix={`/ ${kpis.totalVehicles}`}
          accent="blue"
        />
        <KpiCard
          testId="kpi-pending-dispatches"
          label="Pending Dispatches"
          value={kpis.pendingDispatches}
          accent="amber"
        />
        <KpiCard
          testId="kpi-active-drivers"
          label="Active Drivers"
          value={kpis.activeDrivers}
          suffix={`/ ${kpis.totalDrivers}`}
          accent="green"
        />
        <KpiCard
          testId="kpi-utilization"
          label="Fleet Utilization"
          value={kpis.utilizationRate}
          suffix="%"
          accent="purple"
        />
      </div>

      {/* Fleet Status Distribution Panel */}
      <div
        className="rounded-xl p-6 bg-white"
        style={{ border: '1px solid #EDEDF2' }}
        data-testid="vehicle-status-panel"
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="font-semibold text-base"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Vehicle Status Distribution
          </h2>
          <span className="text-xs font-mono" style={{ color: '#6B6976' }}>
            n = {kpis.totalVehicles}
          </span>
        </div>

        {/* Multi-segment distribution bar */}
        <div className="w-full h-3 rounded-full bg-[#EDEDF2] flex overflow-hidden mb-6">
          {breakdown.Available.percentage > 0 && (
            <div
              style={{ width: `${breakdown.Available.percentage}%`, backgroundColor: '#22B573' }}
              className="h-full transition-all"
              title={`Available: ${breakdown.Available.count}`}
            />
          )}
          {breakdown.OnTrip.percentage > 0 && (
            <div
              style={{ width: `${breakdown.OnTrip.percentage}%`, backgroundColor: '#3373DC' }}
              className="h-full transition-all"
              title={`On Trip: ${breakdown.OnTrip.count}`}
            />
          )}
          {breakdown.InShop.percentage > 0 && (
            <div
              style={{ width: `${breakdown.InShop.percentage}%`, backgroundColor: '#E8952E' }}
              className="h-full transition-all"
              title={`In Shop: ${breakdown.InShop.count}`}
            />
          )}
          {breakdown.Retired.percentage > 0 && (
            <div
              style={{ width: `${breakdown.Retired.percentage}%`, backgroundColor: '#DB4444' }}
              className="h-full transition-all"
              title={`Retired: ${breakdown.Retired.count}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-[#FCFCFB]" style={{ border: '1px solid #EDEDF2' }}>
            <div className="flex items-center gap-2 text-xs font-medium mb-1" style={{ color: '#22B573' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22B573' }} />
              Available
            </div>
            <div className="text-lg font-bold" style={{ color: '#1B1A22' }}>
              {breakdown.Available.count}{' '}
              <span className="text-xs font-normal" style={{ color: '#6B6976' }}>
                ({breakdown.Available.percentage}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FCFCFB]" style={{ border: '1px solid #EDEDF2' }}>
            <div className="flex items-center gap-2 text-xs font-medium mb-1" style={{ color: '#3373DC' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3373DC' }} />
              On Trip
            </div>
            <div className="text-lg font-bold" style={{ color: '#1B1A22' }}>
              {breakdown.OnTrip.count}{' '}
              <span className="text-xs font-normal" style={{ color: '#6B6976' }}>
                ({breakdown.OnTrip.percentage}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FCFCFB]" style={{ border: '1px solid #EDEDF2' }}>
            <div className="flex items-center gap-2 text-xs font-medium mb-1" style={{ color: '#E8952E' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#E8952E' }} />
              In Shop
            </div>
            <div className="text-lg font-bold" style={{ color: '#1B1A22' }}>
              {breakdown.InShop.count}{' '}
              <span className="text-xs font-normal" style={{ color: '#6B6976' }}>
                ({breakdown.InShop.percentage}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FCFCFB]" style={{ border: '1px solid #EDEDF2' }}>
            <div className="flex items-center gap-2 text-xs font-medium mb-1" style={{ color: '#DB4444' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#DB4444' }} />
              Retired
            </div>
            <div className="text-lg font-bold" style={{ color: '#1B1A22' }}>
              {breakdown.Retired.count}{' '}
              <span className="text-xs font-normal" style={{ color: '#6B6976' }}>
                ({breakdown.Retired.percentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDEDF2' }}>
          <h3
            className="font-semibold text-base"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Recent Dispatched &amp; Active Trips
          </h3>
          <button
            onClick={() => onNavigate?.('Trips')}
            className="text-xs font-medium hover:underline cursor-pointer"
            style={{ color: '#5B2EBF' }}
          >
            View All Trips →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #EDEDF2' }}>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>
                  Trip ID
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>
                  Route
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>
                  Vehicle
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>
                  Driver
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>
                  Cargo Weight
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center" style={{ color: '#6B6976' }}>
                    No recent trips logged. Dispatch a trip to see real-time activity.
                  </td>
                </tr>
              ) : (
                recentTrips.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-[#FCFCFB] transition"
                    style={{ borderBottom: '1px solid #EDEDF2' }}
                  >
                    <td className="px-6 py-3.5 font-mono font-medium" style={{ color: '#1B1A22' }}>
                      {t.trip_code}
                    </td>
                    <td className="px-6 py-3.5" style={{ color: '#1B1A22' }}>
                      {t.source} → {t.destination}
                    </td>
                    <td className="px-6 py-3.5" style={{ color: '#6B6976' }}>
                      {t.vehicle.reg_number} ({t.vehicle.name})
                    </td>
                    <td className="px-6 py-3.5" style={{ color: '#6B6976' }}>
                      {t.driver.name}
                    </td>
                    <td className="px-6 py-3.5 font-mono" style={{ color: '#1B1A22' }}>
                      {t.cargo_weight} kg
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={t.status} />
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

export default DashboardPage;
