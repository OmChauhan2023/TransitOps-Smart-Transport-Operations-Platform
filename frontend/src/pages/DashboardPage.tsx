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
  const [expiringDrivers, setExpiringDrivers] = useState<any[]>([]);
  const [inShopVehiclesList, setInShopVehiclesList] = useState<any[]>([]);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [res, driversRes, vehiclesRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/drivers').catch(() => ({ data: [] })),
        api.get('/vehicles').catch(() => ({ data: [] })),
      ]);
      setSummary(res.data);

      const now = Date.now();
      const thirtyDays = 30 * 24 * 3600 * 1000;
      const expiring = (driversRes.data || []).filter((d: any) => {
        if (!d.license_expiry) return false;
        const expTime = new Date(d.license_expiry).getTime();
        return expTime - now <= thirtyDays;
      });
      setExpiringDrivers(expiring);

      const inShop = (vehiclesRes.data || []).filter((v: any) => v.status === 'InShop');
      setInShopVehiclesList(inShop);
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
      {/* Proactive License & Maintenance Alert Banner (Tier 1) */}
      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition hover:shadow-md"
        style={{
          backgroundColor: expiringDrivers.length > 0 ? '#DB44440C' : '#E8952E0C',
          borderColor: expiringDrivers.length > 0 ? '#DB444440' : '#E8952E40',
        }}
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{
              backgroundColor: expiringDrivers.length > 0 ? '#DB4444' : '#E8952E',
              color: '#FFFFFF',
            }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                style={{
                  color: expiringDrivers.length > 0 ? '#DB4444' : '#E8952E',
                  backgroundColor: expiringDrivers.length > 0 ? '#DB44441A' : '#E8952E1A',
                }}
              >
                PROACTIVE COMPLIANCE &amp; MAINTENANCE ALERT
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                Live AI Fleet Scan
              </span>
            </div>
            <div className="text-sm font-semibold mt-1" style={{ color: '#1B1A22' }}>
              {expiringDrivers.length > 0 ? (
                <span>
                  <span className="font-bold text-red-600">{expiringDrivers.length} Driver(s)</span> expiring within 30 days •{' '}
                  <span className="font-bold text-amber-600">{inShopVehiclesList.length || kpis.inShopVehicles} Vehicle(s)</span> currently In Shop / maintenance
                </span>
              ) : (
                <span>
                  <span className="font-bold text-amber-600">{inShopVehiclesList.length || kpis.inShopVehicles} Vehicle(s)</span> In Shop requiring active maintenance monitoring • All Driver Licenses Compliance Checked
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <button
            onClick={() => setShowAlertModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white transition shadow cursor-pointer flex items-center gap-1.5"
            style={{
              backgroundColor: expiringDrivers.length > 0 ? '#DB4444' : '#E8952E',
            }}
          >
            <span>Inspect Alerts ({expiringDrivers.length + (inShopVehiclesList.length || kpis.inShopVehicles)})</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

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

      {/* Proactive Alerts Inspect Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white border rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto" style={{ borderColor: '#EDEDF2' }}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b" style={{ borderColor: '#EDEDF2' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: '#E8952E' }}>
                  ⚠
                </div>
                <h3 className="text-lg font-bold" style={{ color: '#1B1A22' }}>
                  Proactive Fleet Compliance &amp; Maintenance Alerts
                </h3>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                style={{ color: '#6B6976' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Expiring Drivers Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: '#DB4444' }}>
                  <span>Driver Licenses Expiring Within 30 Days ({expiringDrivers.length})</span>
                  {onNavigate && (
                    <button
                      onClick={() => {
                        setShowAlertModal(false);
                        onNavigate('drivers');
                      }}
                      className="text-xs font-semibold underline cursor-pointer"
                    >
                      Manage Drivers →
                    </button>
                  )}
                </h4>
                {expiringDrivers.length === 0 ? (
                  <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
                    ✓ All driver licenses are currently up to date (no expirations in the next 30 days).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {expiringDrivers.map((d) => (
                      <div key={d.id} className="p-3 rounded-xl bg-red-50/60 border border-red-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{d.name}</span>
                          <span className="text-gray-500 ml-2">({d.mobile})</span>
                        </div>
                        <div className="font-semibold text-red-600">
                          Expires: {new Date(d.license_expiry).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vehicles In Shop Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center justify-between" style={{ color: '#E8952E' }}>
                  <span>Vehicles Currently In Shop ({inShopVehiclesList.length || kpis.inShopVehicles})</span>
                  {onNavigate && (
                    <button
                      onClick={() => {
                        setShowAlertModal(false);
                        onNavigate('maintenance');
                      }}
                      className="text-xs font-semibold underline cursor-pointer"
                    >
                      View Maintenance Logs →
                    </button>
                  )}
                </h4>
                {inShopVehiclesList.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                    {kpis.inShopVehicles > 0
                      ? `${kpis.inShopVehicles} vehicle(s) currently marked as In Shop in fleet summary.`
                      : '✓ All vehicles are operational or available.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inShopVehiclesList.map((v) => (
                      <div key={v.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{v.reg_number}</span>
                          <span className="text-gray-600 ml-2">— {v.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                          In Shop
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end" style={{ borderColor: '#EDEDF2' }}>
              <button
                onClick={() => setShowAlertModal(false)}
                className="px-5 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition cursor-pointer"
              >
                Close Alerts
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
