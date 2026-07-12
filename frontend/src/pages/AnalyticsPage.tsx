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
      let csvText = '';
      try {
        const response = await api.get('/analytics/export/csv', {
          responseType: 'text',
        });
        csvText = response.data;
      } catch (err) {
        // Fallback to client-side CSV generator
        const headers = [
          'Registration Number',
          'Vehicle Name',
          'Type',
          'Region',
          'Total Trips',
          'Completed Trips',
          'Total Distance (km)',
          'Fuel Cost (INR)',
          'Maintenance Cost (INR)',
          'Other Expenses (INR)',
          'Total Cost (INR)',
          'Cost per km (INR/km)',
        ];
        const rows = vehicles.map((v) => [
          `"${v.reg_number}"`,
          `"${v.name}"`,
          `"${v.type}"`,
          `"${v.region}"`,
          v.totalTrips,
          v.completedTrips,
          v.totalDistanceKm,
          v.fuelCost.toFixed(2),
          v.maintenanceCost.toFixed(2),
          v.otherCost.toFixed(2),
          v.totalCost.toFixed(2),
          v.costPerKm.toFixed(2),
        ]);
        csvText = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      }

      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transitops-analytics-report-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
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
    <div className="space-y-6" data-testid="analytics-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Analytics &amp; Financial Reporting
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6976' }}>
            Detailed breakdown of fleet operational costs, ROI formula, and costliest vehicle rankings.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={exporting || loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition duration-150 disabled:opacity-50 cursor-pointer"
          style={{ backgroundColor: '#5B2EBF' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {exporting ? 'Exporting CSV…' : 'Export CSV Report'}
        </button>
      </div>

      {error && (
        <div
          className="p-4 rounded-xl text-sm font-medium"
          style={{ backgroundColor: '#DB444415', border: '1px solid #DB444440', color: '#DB4444' }}
        >
          {error}
        </div>
      )}

      {/* ROI Formula & Explanatory Note Banner */}
      <div
        className="p-5 rounded-xl shadow-xs"
        style={{ backgroundColor: '#5B2EBF0D', border: '1px solid #5B2EBF33' }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5B2EBF' }}>
              Financial Return on Investment (ROI) Formula
            </div>
            <div className="text-base md:text-lg font-mono font-bold" style={{ color: '#1B1A22' }}>
              {roiInfo?.formula || 'ROI = (Total Value Delivered - Operational Cost) / Operational Cost'}
            </div>
          </div>
          <div
            className="text-xs max-w-md p-3 rounded-lg"
            style={{ backgroundColor: '#FCFCFB', border: '1px solid #EDEDF2', color: '#6B6976' }}
          >
            {roiInfo?.note || 'Operational Cost combines Fuel, Maintenance, and Logged Expenses across active vehicles.'}
          </div>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Fleet Operational Cost',
            value: `₹${(summary?.totalFleetCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: '#1B1A22',
            bg: '#FCFCFB',
            iconColor: '#5B2EBF',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          },
          {
            label: 'Average Cost per km',
            value: `₹${(summary?.averageCostPerKm || 0).toFixed(2)} / km`,
            color: '#1B1A22',
            bg: '#FCFCFB',
            iconColor: '#22B573',
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
          },
          {
            label: 'Total Distance Traveled',
            value: `${(summary?.totalDistanceKm || 0).toLocaleString()} km`,
            color: '#1B1A22',
            bg: '#FCFCFB',
            iconColor: '#E8952E',
            icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
          },
          {
            label: 'Completed Trips',
            value: `${summary?.totalCompletedTrips || 0} trips`,
            color: '#1B1A22',
            bg: '#FCFCFB',
            iconColor: '#5B2EBF',
            icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="p-5 rounded-xl flex items-center gap-4 bg-white"
            style={{ border: '1px solid #EDEDF2' }}
          >
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${card.iconColor}15` }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: card.iconColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={card.icon} />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs mt-0.5" style={{ color: '#6B6976' }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Visual Proportion Breakdown */}
      <div className="bg-white p-6 rounded-xl space-y-4" style={{ border: '1px solid #EDEDF2' }}>
        <div className="flex items-center justify-between">
          <h3
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Fleet Operational Cost Breakdown
          </h3>
          <span className="text-xs" style={{ color: '#6B6976' }}>
            Total: ₹{(summary?.totalFleetCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-4 rounded-full overflow-hidden flex" style={{ backgroundColor: '#EDEDF2' }}>
          <div
            style={{ width: `${fuelPct}%`, backgroundColor: '#E8952E' }}
            className="transition-all duration-500"
            title={`Fuel: ${fuelPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${maintPct}%`, backgroundColor: '#5B2EBF' }}
            className="transition-all duration-500"
            title={`Maintenance: ${maintPct.toFixed(1)}%`}
          />
          <div
            style={{ width: `${otherPct}%`, backgroundColor: '#1B1A22' }}
            className="transition-all duration-500"
            title={`Other Expenses: ${otherPct.toFixed(1)}%`}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#FCFCFB]" style={{ border: '1px solid #EDEDF2' }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#E8952E' }} />
              <span className="font-medium" style={{ color: '#1B1A22' }}>Fuel Cost</span>
            </div>
            <div className="font-semibold" style={{ color: '#1B1A22' }}>
              ₹{(summary?.totalFuelCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({fuelPct.toFixed(1)}%)
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#FCFCFB]" style={{ border: '1px solid #EDEDF2' }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#5B2EBF' }} />
              <span className="font-medium" style={{ color: '#1B1A22' }}>Maintenance Cost</span>
            </div>
            <div className="font-semibold" style={{ color: '#1B1A22' }}>
              ₹{(summary?.totalMaintenanceCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({maintPct.toFixed(1)}%)
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-[#FCFCFB]" style={{ border: '1px solid #EDEDF2' }}>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1B1A22' }} />
              <span className="font-medium" style={{ color: '#1B1A22' }}>Other Expenses</span>
            </div>
            <div className="font-semibold" style={{ color: '#1B1A22' }}>
              ₹{(summary?.totalOtherCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({otherPct.toFixed(1)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Costliest Vehicles Ranking Table */}
      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDEDF2' }}>
          <div>
            <h3
              className="text-base font-bold"
              style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
            >
              Vehicle Cost Breakdown &amp; Efficiency Ranking
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#6B6976' }}>
              Vehicles ranked by total operational cost (highest to lowest)
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-mono" style={{ backgroundColor: '#FCFCFB', border: '1px solid #EDEDF2', color: '#6B6976' }}>
            {vehicles.length} Vehicles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #EDEDF2', backgroundColor: '#FCFCFB' }}>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Rank</th>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Vehicle</th>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Type &amp; Region</th>
                <th className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Trips (Done/Total)</th>
                <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Distance</th>
                <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Fuel Cost</th>
                <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Maint. Cost</th>
                <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Other</th>
                <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Total Cost</th>
                <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm" style={{ color: '#6B6976' }}>
                    Loading analytics data…
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-sm" style={{ color: '#6B6976' }}>
                    No vehicle analytics available yet. Complete trips or record expenses to generate data.
                  </td>
                </tr>
              ) : (
                vehicles.map((v, idx) => {
                  const rank = idx + 1;
                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-[#FCFCFB] transition"
                      style={{ borderBottom: '1px solid #EDEDF2' }}
                    >
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold font-mono"
                          style={{
                            backgroundColor: rank <= 3 ? '#5B2EBF15' : '#FCFCFB',
                            color: rank <= 3 ? '#5B2EBF' : '#6B6976',
                            border: '1px solid #EDEDF2',
                          }}
                        >
                          #{rank}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium" style={{ color: '#1B1A22' }}>{v.name}</div>
                        <div className="text-xs font-mono" style={{ color: '#6B6976' }}>{v.reg_number}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div style={{ color: '#1B1A22' }}>{v.type}</div>
                        <div className="text-xs" style={{ color: '#6B6976' }}>{v.region}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono" style={{ color: '#1B1A22' }}>
                        {v.completedTrips} / {v.totalTrips}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono" style={{ color: '#1B1A22' }}>
                        {v.totalDistanceKm.toLocaleString()} km
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono" style={{ color: '#6B6976' }}>
                        ₹{v.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono" style={{ color: '#6B6976' }}>
                        ₹{v.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono" style={{ color: '#6B6976' }}>
                        ₹{v.otherCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold" style={{ color: '#5B2EBF' }}>
                        ₹{v.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs" style={{ color: '#1B1A22' }}>
                        ₹{v.costPerKm.toFixed(2)} / km
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
