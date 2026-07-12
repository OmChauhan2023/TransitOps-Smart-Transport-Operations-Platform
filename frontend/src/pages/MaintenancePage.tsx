import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { MaintenanceLog, MaintenanceFormData, MaintenanceStatus } from '../types/maintenance';
import type { Vehicle } from '../types/vehicle';

const SERVICE_TYPES = [
  'Oil Change',
  'Tyre Replacement',
  'Brake Service',
  'Engine Overhaul',
  'Electrical Repair',
  'Body Repair',
  'Transmission Service',
  'Coolant Flush',
  'Battery Replacement',
  'Scheduled Inspection',
  'Other',
];

const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  Active: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const STATUS_ICONS: Record<MaintenanceStatus, string> = {
  Active: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  Completed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
};

const today = () => new Date().toISOString().split('T')[0];

const emptyForm: MaintenanceFormData = {
  vehicle_id: '',
  service_type: 'Oil Change',
  cost: '',
  date: today(),
  status: 'Active',
};

export const MaintenancePage: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<MaintenanceLog | null>(null);
  const [form, setForm] = useState<MaintenanceFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterVehicle, setFilterVehicle] = useState('All');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterVehicle !== 'All') params.vehicle_id = filterVehicle;
      const res = await api.get('/maintenance', { params });
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch maintenance logs:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterVehicle]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenAdd = () => {
    setEditingLog(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (log: MaintenanceLog) => {
    setEditingLog(log);
    setForm({
      vehicle_id: log.vehicle_id,
      service_type: log.service_type,
      cost: log.cost,
      date: log.date.split('T')[0],
      status: log.status,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleStatusToggle = async (log: MaintenanceLog) => {
    const nextStatus: MaintenanceStatus = log.status === 'Active' ? 'Completed' : 'Active';
    try {
      await api.patch(`/maintenance/${log.id}/status`, { status: nextStatus });
      fetchLogs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update maintenance status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.vehicle_id || !form.service_type || !form.cost || !form.date) {
      setFormError('Vehicle, service type, cost, and date are required.');
      return;
    }

    if (parseFloat(form.cost as string) < 0) {
      setFormError('Cost cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, cost: parseFloat(form.cost as string) };

      if (editingLog) {
        await api.put(`/maintenance/${editingLog.id}`, payload);
      } else {
        await api.post('/maintenance', payload);
      }
      setShowModal(false);
      fetchLogs();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save maintenance record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this maintenance record? Vehicle status may be affected.')) return;
    try {
      await api.delete(`/maintenance/${id}`);
      fetchLogs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete maintenance record');
    }
  };

  // Summary stats
  const totalActive = logs.filter((l) => l.status === 'Active').length;
  const totalCost = logs.reduce((sum, l) => sum + l.cost, 0);
  const vehiclesInShop = new Set(logs.filter((l) => l.status === 'Active').map((l) => l.vehicle_id)).size;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Maintenance</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track service logs and manage vehicle maintenance lifecycle.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Log Service
        </button>
      </div>

      {/* State Diagram Note */}
      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
        <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Vehicle Status State Machine
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">Available</span>
          <span className="text-slate-600">→ Log Active →</span>
          <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">In Shop</span>
          <span className="text-slate-600">→ Mark Completed →</span>
          <span className="px-2 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">Available</span>
          <span className="mx-2 text-slate-600">|</span>
          <span className="px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 font-semibold">Retired</span>
          <span className="text-slate-600">→ status never changes</span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Active Service Logs',
            value: totalActive,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
          },
          {
            label: 'Vehicles In Shop',
            value: vehiclesInShop,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 border-blue-500/20',
            icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
          },
          {
            label: 'Total Service Cost',
            value: `₹${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            color: 'text-slate-200',
            bg: 'bg-slate-800/60 border-slate-700/60',
            icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
          },
        ].map((card) => (
          <div key={card.label} className={`p-5 rounded-2xl border ${card.bg} flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg}`}>
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-[#131a2a] p-4 rounded-xl border border-slate-800">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Vehicles</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.reg_number} — {v.name}
            </option>
          ))}
        </select>
      </div>

      {/* Service Log Table */}
      <div className="bg-[#131a2a] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#182236]/60">
                <th className="py-4 px-6">Vehicle</th>
                <th className="py-4 px-6">Service Type</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Cost</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading service logs…
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No maintenance records found. Log your first service to get started.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/30 transition duration-150"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{log.vehicle.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{log.vehicle.reg_number}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-300">{log.service_type}</td>
                    <td className="py-4 px-6 text-slate-400">
                      {new Date(log.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right font-semibold text-slate-200">
                      ₹{log.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleStatusToggle(log)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer transition hover:opacity-80 ${STATUS_COLORS[log.status]}`}
                        title={`Click to mark as ${log.status === 'Active' ? 'Completed' : 'Active'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={STATUS_ICONS[log.status]} />
                        </svg>
                        {log.status}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(log)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && logs.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {logs.length} service record{logs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131a2a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-white">
                {editingLog ? 'Edit Service Record' : 'Log Service'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              {/* Vehicle Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Vehicle
                </label>
                <select
                  required
                  value={form.vehicle_id}
                  onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
                  disabled={!!editingLog}
                  className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500 disabled:opacity-60"
                >
                  <option value="">Select vehicle…</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.reg_number} — {v.name} ({v.status})
                    </option>
                  ))}
                </select>
                {!editingLog && (
                  <p className="text-xs text-amber-400/70 mt-1">
                    Creating an Active record will move the vehicle to In Shop.
                  </p>
                )}
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Service Type
                </label>
                <select
                  value={form.service_type}
                  onChange={(e) => setForm({ ...form, service_type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  {SERVICE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Cost */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                    Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="250.00"
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                    Service Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1.5">
                  Status
                </label>
                <div className="flex gap-3">
                  {(['Active', 'Completed'] as MaintenanceStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                        form.status === s
                          ? STATUS_COLORS[s]
                          : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : editingLog ? 'Update Record' : 'Log Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
