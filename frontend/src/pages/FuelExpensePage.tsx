import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { FuelLog, Expense, OperationalCostSummary } from '../types/fuelExpense';
import type { Vehicle } from '../types/vehicle';

export const FuelExpensePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses' | 'breakdown'>('fuel');

  // Data states
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summaryData, setSummaryData] = useState<OperationalCostSummary | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter
  const [filterVehicleId, setFilterVehicleId] = useState('All');

  // Fuel Form State
  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '',
    date: new Date().toISOString().slice(0, 10),
    liters: '',
    fuel_cost: '',
  });

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '',
    toll: '',
    other: '',
    maintenance_linked: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterVehicleId !== 'All') params.vehicle_id = filterVehicleId;

      const [sumRes, fRes, eRes, vRes] = await Promise.all([
        api.get('/fuel-expenses/summary'),
        api.get('/fuel-expenses/fuel-logs', { params }),
        api.get('/fuel-expenses/expenses', { params }),
        api.get('/vehicles'),
      ]);

      setSummaryData(sumRes.data);
      setFuelLogs(fRes.data);
      setExpenses(eRes.data);
      setVehicles(vRes.data);
    } catch (err) {
      console.error('Failed to fetch fuel/expense data:', err);
    } finally {
      setLoading(false);
    }
  }, [filterVehicleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleCreateFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post('/fuel-expenses/fuel-logs', fuelForm);
      setShowFuelModal(false);
      setFuelForm({
        vehicle_id: '',
        date: new Date().toISOString().slice(0, 10),
        liters: '',
        fuel_cost: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log fuel');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await api.post('/fuel-expenses/expenses', expenseForm);
      setShowExpenseModal(false);
      setExpenseForm({
        vehicle_id: '',
        toll: '',
        other: '',
        maintenance_linked: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to log expense');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFuel = async (id: string) => {
    if (!confirm('Delete this fuel record?')) return;
    try {
      await api.delete(`/fuel-expenses/fuel-logs/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete fuel log:', err);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      await api.delete(`/fuel-expenses/expenses/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  };

  const summary = summaryData?.summary || {
    totalOperationalCost: 0,
    overallFuelCost: 0,
    overallFuelLiters: 0,
    overallMaintenanceCost: 0,
    overallOtherExpenseCost: 0,
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Fuel &amp; Expense Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track operational costs, fuel efficiency, and incidentals across the fleet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setError(null);
              setShowFuelModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Fuel
          </button>
          <button
            onClick={() => {
              setError(null);
              setShowExpenseModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#151d30] hover:bg-slate-800 border border-slate-700 text-white text-sm font-semibold transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Expense
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {/* Total Operational Cost */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-800/80 border border-blue-500/30">
          <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
            Total Operational Cost
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{summary.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Fuel + Maintenance + Logged Expenses
          </div>
        </div>

        {/* Total Fuel */}
        <div className="p-5 rounded-2xl bg-[#131a2a] border border-slate-800">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Fuel Spend
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{summary.overallFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {summary.overallFuelLiters.toLocaleString()} Liters Logged
          </div>
        </div>

        {/* Total Maintenance */}
        <div className="p-5 rounded-2xl bg-[#131a2a] border border-slate-800">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            Maintenance Spend
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{summary.overallMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Active & Completed Logs
          </div>
        </div>

        {/* Total Other Expenses */}
        <div className="p-5 rounded-2xl bg-[#131a2a] border border-slate-800">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            Other Expenses
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{summary.overallOtherExpenseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Tolls, Parking & Incidentals
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#0e1422] border border-slate-800">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'fuel'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fuel Logs ({fuelLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Other Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'breakdown'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cost Breakdown by Vehicle
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Filter Vehicle:</span>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#151d30] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="All">All Vehicles</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.reg_number} ({v.name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: FUEL LOGS */}
      {activeTab === 'fuel' && (
        <div className="rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Liters</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cost</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cost / Liter</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      Loading fuel logs…
                    </td>
                  </tr>
                ) : fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      No fuel records found. Click &quot;Log Fuel&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => {
                    const costPerL = log.liters > 0 ? log.fuel_cost / log.liters : 0;
                    return (
                      <tr
                        key={log.id}
                        className="border-b border-slate-800/60 hover:bg-slate-800/30 transition"
                      >
                        <td className="px-6 py-4 text-slate-300">
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold text-white">
                            {log.vehicle.reg_number}
                          </div>
                          <div className="text-xs text-slate-400">{log.vehicle.name}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-300">
                          {log.liters.toLocaleString()} L
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-emerald-400">
                          ₹{log.fuel_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-mono text-slate-400">
                          ₹{costPerL.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteFuel(log.id)}
                            className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: OTHER EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Toll Fees</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Other / Incidentals</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Maint. Linked</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Amount</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      Loading expenses…
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      No expense records found. Click &quot;Log Expense&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold text-white">
                          {exp.vehicle.reg_number}
                        </div>
                        <div className="text-xs text-slate-400">{exp.vehicle.name}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        ₹{exp.toll.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        ₹{exp.other.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        ₹{exp.maintenance_linked.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold text-amber-400">
                        ₹{exp.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BREAKDOWN BY VEHICLE */}
      {activeTab === 'breakdown' && (
        <div className="rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reg. No.</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle Model</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Fuel Cost</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Maintenance Cost</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Other Expenses</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Operational Cost</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      Loading cost breakdown…
                    </td>
                  </tr>
                ) : !summaryData?.byVehicle || summaryData.byVehicle.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      No cost data available.
                    </td>
                  </tr>
                ) : (
                  summaryData.byVehicle.map((v) => (
                    <tr
                      key={v.vehicle_id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/30 transition"
                    >
                      <td className="px-6 py-4 font-mono font-semibold text-white">
                        {v.reg_number}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {v.name} ({v.type})
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        ₹{v.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        ₹{v.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        ₹{v.otherExpenseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-blue-400">
                        ₹{v.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD FUEL MODAL */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowFuelModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-[#0e1422] border border-slate-700 rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Log Fuel Record</h3>
              <button
                onClick={() => setShowFuelModal(false)}
                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateFuel} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Vehicle
                </label>
                <select
                  value={fuelForm.vehicle_id}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                >
                  <option value="">Choose vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.reg_number} — {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={fuelForm.date}
                  onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Liters
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Total Fuel Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fuelForm.fuel_cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, fuel_cost: e.target.value })}
                    placeholder="e.g. 85.50"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Fuel Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD EXPENSE MODAL */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowExpenseModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-[#0e1422] border border-slate-700 rounded-2xl shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Log Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Vehicle
                </label>
                <select
                  value={expenseForm.vehicle_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                >
                  <option value="">Choose vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.reg_number} — {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Toll Fees (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={expenseForm.toll}
                    onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Other / Incidentals (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={expenseForm.other}
                    onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    min={0}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
