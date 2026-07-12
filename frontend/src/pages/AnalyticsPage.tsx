import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { AnalyticsSummary, VehicleAnalyticsItem } from '../types/analytics';

export const AnalyticsPage: React.FC = () => {
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [vehicles, setVehicles] = useState<VehicleAnalyticsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, vehiclesRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/vehicles'),
      ]);
      setSummaryData(summaryRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load analytics data.');
      console.error('fetchAnalytics error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const response = await api.get('/analytics/export/csv', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transitops-analytics-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Failed to export CSV report.');
      console.error('export CSV error:', err);
    } finally {
      setExporting(false);
    }
  };

  const summary = summaryData?.summary;
  const roiInfo = summaryData?.roiFormula;

  const totalCost = summary?.totalFleetCost || 0;
  const fuelPct = totalCost > 0 ? ((summary?.totalFuelCost || 0) / totalCost) * 100 : 0;
  const maintPct = totalCost > 0 ? ((summary?.totalMaintenanceCost || 0) / totalCost) * 100 : 0;
  const otherPct = totalCost > 0 ? ((summary?.totalOtherCost || 0) / totalCost) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Analytics & Financial Reporting
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detailed breakdown of fleet operational costs, ROI formula, and costliest vehicle rankings.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition duration-150 disabled:opacity-50 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Exporting CSV…' : 'Export CSV Report'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* ROI Formula & Explanatory Note Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900/40 via-slate-800/80 to-slate-900/90 border border-blue-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Financial Return on Investment (ROI) Formula
            </div>
            <div className="text-base md:text-lg font-mono font-bold text-white">
              {roiInfo?.formula || 'ROI = (Total Value Delivered - Operational Cost) / Operational Cost'}
            </div>
          </div>
          <div className="text-xs text-slate-300 max-w-md bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            {roiInfo?.note || 'Operational Cost combines Fuel, Maintenance, and Logged Expenses across active vehicles.'}
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Operational Cost',
            value: `$${(summary?.totalFleetCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          },
          {
            label: 'Average Cost / km',
            value: `$${(summary?.averageCostPerKm || 0).toFixed(2)} / km`,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
            icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
          },
          {
            label: 'Total Distance Traveled',
            value: `${(summary?.totalDistanceKm || 0).toLocaleString()} km`,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
          },
          {
            label: 'Completed Trips',
            value: `${summary?.totalCompletedTrips || 0} trips`,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10 border-purple-500/20',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          },
        ].map((card) => (
          <div key={card.label} className={`p-5 rounded-2xl border ${card.bg} flex items-center gap-4`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bg}`}>
              <svg className={`w-5 h-5 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.icon} />
              </svg>
            </div>
            <div>
              <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Proportion Breakdown */}
      <div className="bg-[#131a2a] p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Fleet Operational Cost Breakdown
          </h3>
          <span className="text-xs text-slate-400">
            Total: ${(summary?.totalFleetCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${fuelPct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Fuel: ${fuelPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${maintPct}%` }}
            className="bg-blue-500 transition-all duration-500"
            title={`Maintenance: ${maintPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${otherPct}%` }}
            className="bg-purple-500 transition-all duration-500"
            title={`Other Expenses: ${otherPct.toFixed(1)}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-slate-300 font-medium">Fuel Cost</span>
            </div>
            <div className="font-semibold text-white">
              ${(summary?.totalFuelCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({fuelPct.toFixed(1)}%)
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-300 font-medium">Maintenance Cost</span>
            </div>
            <div className="font-semibold text-white">
              ${(summary?.totalMaintenanceCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({maintPct.toFixed(1)}%)
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-slate-300 font-medium">Other Expenses</span>
            </div>
            <div className="font-semibold text-white">
              ${(summary?.totalOtherCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({otherPct.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Costliest Vehicles Ranking Table */}
      <div className="bg-[#131a2a] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Costliest Vehicles Ranking
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Vehicles ranked by highest total operational expense (Fuel + Maintenance + Other).
            </p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
            {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#182236]/60">
                <th className="py-4 px-6 w-16">Rank</th>
                <th className="py-4 px-6">Vehicle</th>
                <th className="py-4 px-6">Region / Type</th>
                <th className="py-4 px-6 text-center">Trips</th>
                <th className="py-4 px-6 text-right">Distance</th>
                <th className="py-4 px-6 text-right">Fuel</th>
                <th className="py-4 px-6 text-right">Maintenance</th>
                <th className="py-4 px-6 text-right">Other</th>
                <th className="py-4 px-6 text-right font-bold text-white">Total Cost</th>
                <th className="py-4 px-6 text-right">Cost / km</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading analytics rankings…
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No vehicle financial data available.
                  </td>
                </tr>
              ) : (
                vehicles.map((v, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-slate-800/30 transition duration-150"
                    >
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                            rank === 1
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : rank === 2
                              ? 'bg-slate-300/20 text-slate-300 border border-slate-400/40'
                              : rank === 3
                              ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white">{v.name}</div>
                        <div className="text-xs text-slate-500 font-mono">{v.reg_number}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-slate-300">{v.type}</div>
                        <div className="text-xs text-slate-500">{v.region}</div>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-300">
                        {v.completedTrips} / {v.totalTrips}
                      </td>
                      <td className="py-4 px-6 text-right text-slate-300">
                        {v.totalDistanceKm.toLocaleString()} km
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400">
                        ${v.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400">
                        ${v.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right text-slate-400">
                        ${v.otherCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-emerald-400">
                        ${v.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-xs text-slate-300">
                        ${v.costPerKm.toFixed(2)} / km
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
