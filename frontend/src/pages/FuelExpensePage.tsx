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
    <div className="space-y-6" data-testid="fuel-expense-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Fuel &amp; Expense Management
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6976' }}>
            Track operational costs, fuel efficiency, and incidentals across the fleet
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setError(null);
              setShowFuelModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition cursor-pointer"
            style={{ backgroundColor: '#5B2EBF' }}
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
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition cursor-pointer"
            style={{ backgroundColor: '#FCFCFB', border: '1px solid #EDEDF2', color: '#1B1A22' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Expense
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Operational Cost */}
        <div
          className="p-5 rounded-xl bg-white"
          style={{ border: '1px solid #EDEDF2' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#5B2EBF' }}>
            Total Operational Cost
          </div>
          <div className="text-2xl font-bold" style={{ color: '#1B1A22' }}>
            ₹{summary.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs mt-1" style={{ color: '#6B6976' }}>
            Fuel + Maintenance + Logged Expenses
          </div>
        </div>

        {/* Total Fuel */}
        <div
          className="p-5 rounded-xl bg-white"
          style={{ border: '1px solid #EDEDF2' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#22B573' }}>
            Fuel Spend
          </div>
          <div className="text-2xl font-bold" style={{ color: '#1B1A22' }}>
            ₹{summary.overallFuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs mt-1" style={{ color: '#6B6976' }}>
            {summary.overallFuelLiters.toLocaleString()} Liters Logged
          </div>
        </div>

        {/* Total Maintenance */}
        <div
          className="p-5 rounded-xl bg-white"
          style={{ border: '1px solid #EDEDF2' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#E8952E' }}>
            Maintenance Spend
          </div>
          <div className="text-2xl font-bold" style={{ color: '#1B1A22' }}>
            ₹{summary.overallMaintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs mt-1" style={{ color: '#6B6976' }}>
            Active &amp; Completed Logs
          </div>
        </div>

        {/* Total Other Expenses */}
        <div
          className="p-5 rounded-xl bg-white"
          style={{ border: '1px solid #EDEDF2' }}
        >
          <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#9B51E0' }}>
            Other Expenses
          </div>
          <div className="text-2xl font-bold" style={{ color: '#1B1A22' }}>
            ₹{summary.overallOtherExpenseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs mt-1" style={{ color: '#6B6976' }}>
            Tolls, Parking & Incidentals
          </div>
        </div>
      </div>

      {/* Filter and Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white" style={{ border: '1px solid #EDEDF2' }}>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'fuel'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Fuel Logs ({fuelLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Other Expenses ({expenses.length})
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'breakdown'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cost Breakdown by Vehicle
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: '#6B6976' }}>Filter Vehicle:</span>
          <select
            value={filterVehicleId}
            onChange={(e) => setFilterVehicleId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FCFCFB] text-xs focus:outline-none transition"
            style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
        <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDEDF2', backgroundColor: '#FCFCFB' }}>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Date</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Vehicle</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Liters</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Total Cost</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Cost / Liter</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: '#EDEDF2' }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                      Loading fuel logs…
                    </td>
                  </tr>
                ) : fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                      No fuel records found. Click &quot;Log Fuel&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => {
                    const costPerL = log.liters > 0 ? log.fuel_cost / log.liters : 0;
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-6 py-4" style={{ color: '#1B1A22' }}>
                          {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono font-semibold" style={{ color: '#1B1A22' }}>
                            {log.vehicle.reg_number}
                          </div>
                          <div className="text-xs" style={{ color: '#6B6976' }}>{log.vehicle.name}</div>
                        </td>
                        <td className="px-6 py-4 font-mono" style={{ color: '#1B1A22' }}>
                          {log.liters.toLocaleString()} L
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold" style={{ color: '#22B573' }}>
                          ₹{log.fuel_cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-mono" style={{ color: '#6B6976' }}>
                          ₹{costPerL.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleDeleteFuel(log.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                            style={{ color: '#6B6976' }}
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
        <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDEDF2', backgroundColor: '#FCFCFB' }}>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Vehicle</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Toll Fees</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Other / Incidentals</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Maint. Linked</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Total Amount</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: '#EDEDF2' }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                      Loading expenses…
                    </td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                      No expense records found. Click &quot;Log Expense&quot; to add one.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono font-semibold" style={{ color: '#1B1A22' }}>
                          {exp.vehicle.reg_number}
                        </div>
                        <div className="text-xs" style={{ color: '#6B6976' }}>{exp.vehicle.name}</div>
                      </td>
                      <td className="px-6 py-4 font-mono" style={{ color: '#1B1A22' }}>
                        ₹{exp.toll.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono" style={{ color: '#1B1A22' }}>
                        ₹{exp.other.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono" style={{ color: '#6B6976' }}>
                        ₹{exp.maintenance_linked.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-mono font-semibold" style={{ color: '#E8952E' }}>
                        ₹{exp.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          style={{ color: '#6B6976' }}
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
        <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #EDEDF2', backgroundColor: '#FCFCFB' }}>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Reg. No.</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Vehicle Model</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Fuel Cost</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Maintenance Cost</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Other Expenses</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Total Operational Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm" style={{ borderColor: '#EDEDF2' }}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                      Loading cost breakdown…
                    </td>
                  </tr>
                ) : !summaryData?.byVehicle || summaryData.byVehicle.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                      No cost data available.
                    </td>
                  </tr>
                ) : (
                  summaryData.byVehicle.map((v) => (
                    <tr
                      key={v.vehicle_id}
                      className="hover:bg-slate-50 transition"
                    >
                      <td className="px-6 py-4 font-mono font-semibold" style={{ color: '#1B1A22' }}>
                        {v.reg_number}
                      </td>
                      <td className="px-6 py-4" style={{ color: '#1B1A22' }}>
                        {v.name} ({v.type})
                      </td>
                      <td className="px-6 py-4 font-mono" style={{ color: '#1B1A22' }}>
                        ₹{v.fuelCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-mono" style={{ color: '#1B1A22' }}>
                        ₹{v.maintenanceCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-mono" style={{ color: '#1B1A22' }}>
                        ₹{v.otherExpenseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold" style={{ color: '#3373DC' }}>
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
      {/* ADD FUEL MODAL */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowFuelModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-white border rounded-2xl shadow-2xl" style={{ borderColor: '#EDEDF2' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#EDEDF2' }}>
              <h3 className="text-lg font-bold" style={{ color: '#1B1A22' }}>Log Fuel Record</h3>
              <button
                onClick={() => setShowFuelModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                style={{ color: '#6B6976' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateFuel} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#DB444415', border: '1px solid #DB444440', color: '#DB4444' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                  Select Vehicle
                </label>
                <select
                  value={fuelForm.vehicle_id}
                  onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FCFCFB] text-sm focus:outline-none transition"
                  style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={fuelForm.date}
                  onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FCFCFB] text-sm focus:outline-none transition"
                  style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Liters
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FCFCFB] text-sm focus:outline-none transition"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Total Fuel Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fuelForm.fuel_cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, fuel_cost: e.target.value })}
                    placeholder="e.g. 85.50"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FCFCFB] text-sm focus:outline-none transition"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition cursor-pointer"
                  style={{ backgroundColor: '#FCFCFB', border: '1px solid #EDEDF2', color: '#1B1A22' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowExpenseModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 bg-white border rounded-2xl shadow-2xl" style={{ borderColor: '#EDEDF2' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#EDEDF2' }}>
              <h3 className="text-lg font-bold" style={{ color: '#1B1A22' }}>Log Expense</h3>
              <button
                onClick={() => setShowExpenseModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                style={{ color: '#6B6976' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#DB444415', border: '1px solid #DB444440', color: '#DB4444' }}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                  Select Vehicle
                </label>
                <select
                  value={expenseForm.vehicle_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#FCFCFB] text-sm focus:outline-none transition"
                  style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Toll Fees (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={expenseForm.toll}
                    onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FCFCFB] text-sm focus:outline-none transition"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Other / Incidentals (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={expenseForm.other}
                    onChange={(e) => setExpenseForm({ ...expenseForm, other: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FCFCFB] text-sm focus:outline-none transition"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    min={0}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition cursor-pointer"
                  style={{ backgroundColor: '#FCFCFB', border: '1px solid #EDEDF2', color: '#1B1A22' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition disabled:opacity-50 cursor-pointer"
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
