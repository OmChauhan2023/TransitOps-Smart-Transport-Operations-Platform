import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Driver, DriverFormData, DriverStatus } from '../types/driver';

const DRIVER_STATUSES: DriverStatus[] = ['Available', 'OnTrip', 'OffDuty', 'Suspended'];
const LICENSE_CATEGORIES = ['Class A (Heavy Articulated)', 'Class B (Heavy Rigid)', 'Class C (Commercial Van)', 'Class D (Standard)'];

const STATUS_COLORS: Record<DriverStatus, string> = {
  Available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  OnTrip: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  OffDuty: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Suspended: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const STATUS_LABELS: Record<DriverStatus, string> = {
  Available: 'Available',
  OnTrip: 'On Trip',
  OffDuty: 'Off Duty',
  Suspended: 'Suspended',
};

const emptyForm: DriverFormData = {
  name: '',
  license_number: '',
  license_category: 'Class A (Heavy Articulated)',
  license_expiry: '',
  contact: '',
  trip_completion_pct: 100,
  safety_score: 100,
  status: 'Available',
};

export const DriversPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [form, setForm] = useState<DriverFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (filterCategory !== 'All') params.license_category = filterCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await api.get('/drivers', { params });
      setDrivers(res.data);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterCategory, searchQuery]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleOpenAdd = () => {
    setEditingDriver(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (driver: Driver) => {
    setEditingDriver(driver);
    setForm({
      name: driver.name,
      license_number: driver.license_number,
      license_category: driver.license_category,
      license_expiry: driver.license_expiry.split('T')[0],
      contact: driver.contact,
      trip_completion_pct: driver.trip_completion_pct,
      safety_score: driver.safety_score,
      status: driver.status,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleStatusChange = async (driverId: string, newStatus: DriverStatus) => {
    try {
      await api.patch(`/drivers/${driverId}/status`, { status: newStatus });
      setDrivers((prev) =>
        prev.map((d) => (d.id === driverId ? { ...d, status: newStatus } : d))
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update driver status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name || !form.license_number || !form.license_category || !form.license_expiry || !form.contact) {
      setFormError('Name, license number, category, expiry date, and contact are required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        trip_completion_pct: Number(form.trip_completion_pct),
        safety_score: Number(form.safety_score),
      };

      if (editingDriver) {
        await api.put(`/drivers/${editingDriver.id}`, payload);
      } else {
        await api.post('/drivers', payload);
      }
      setShowModal(false);
      fetchDrivers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save driver');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (driverId: string) => {
    if (!window.confirm('Are you sure you want to delete this driver profile? This action cannot be undone.')) return;
    try {
      await api.delete(`/drivers/${driverId}`);
      fetchDrivers();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete driver. They may be assigned to existing trips.');
    }
  };

  const isExpired = (expiryDateStr: string) => {
    return new Date(expiryDateStr) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Inline Rule Notice and Add Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Drivers & Safety Profiles
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage driver compliance, qualifications, safety scores, and duty status.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 transition duration-150"
        >
          <span>+ Add Driver</span>
        </button>
      </div>

      {/* Inline Rule Text Notice */}
      <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 text-xs text-slate-300">
        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
        <span className="font-semibold text-white">Rule:</span>
        <span>Expired license or Suspended status → blocked from trip assignment</span>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-[#131a2a] p-4 rounded-xl border border-slate-800">
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Search driver name or license no…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-[#182236] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All License Categories</option>
          {LICENSE_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="All">All Statuses</option>
          {DRIVER_STATUSES.map((st) => (
            <option key={st} value={st}>
              {STATUS_LABELS[st]}
            </option>
          ))}
        </select>
      </div>

      {/* Table Section */}
      <div className="bg-[#131a2a] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-[#182236]/60">
                <th className="py-4 px-6">Driver</th>
                <th className="py-4 px-6">License No</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Expiry</th>
                <th className="py-4 px-6">Contact</th>
                <th className="py-4 px-6 text-center">Trip Compl. (%)</th>
                <th className="py-4 px-6 text-center">Safety</th>
                <th className="py-4 px-6">Status Toggle</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Loading drivers...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No drivers found matching your filters.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const expired = isExpired(driver.license_expiry);
                  return (
                    <tr
                      key={driver.id}
                      className="hover:bg-slate-800/30 transition duration-150"
                    >
                      <td className="py-4 px-6 font-semibold text-white">
                        {driver.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-300">
                        {driver.license_number}
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {driver.license_category}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            expired
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'text-slate-300'
                          }`}
                        >
                          {new Date(driver.license_expiry).toLocaleDateString()}
                          {expired && ' (Expired)'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-300">
                        {driver.contact}
                      </td>
                      <td className="py-4 px-6 text-center font-semibold text-slate-200">
                        {driver.trip_completion_pct}%
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                            driver.safety_score >= 90
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : driver.safety_score >= 75
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}
                        >
                          {driver.safety_score}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <select
                          value={driver.status}
                          onChange={(e) =>
                            handleStatusChange(driver.id, e.target.value as DriverStatus)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
                            STATUS_COLORS[driver.status]
                          } bg-[#182236] focus:outline-none`}
                        >
                          {DRIVER_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-[#182236] text-white">
                              {STATUS_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(driver)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition"
                        >
                          Delete
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

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#131a2a] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingDriver ? 'Edit Driver Profile' : 'Add Driver Profile'}
            </h2>

            {formError && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Alex Mercer"
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    License Number
                  </label>
                  <input
                    type="text"
                    required
                    value={form.license_number}
                    onChange={(e) =>
                      setForm({ ...form, license_number: e.target.value })
                    }
                    placeholder="DL-98234"
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    License Category
                  </label>
                  <select
                    value={form.license_category}
                    onChange={(e) =>
                      setForm({ ...form, license_category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    {LICENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    License Expiry
                  </label>
                  <input
                    type="date"
                    required
                    value={form.license_expiry}
                    onChange={(e) =>
                      setForm({ ...form, license_expiry: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as DriverStatus })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    {DRIVER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {STATUS_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Trip Completion (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.trip_completion_pct}
                    onChange={(e) =>
                      setForm({ ...form, trip_completion_pct: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Safety Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.safety_score}
                    onChange={(e) => setForm({ ...form, safety_score: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#182236] border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition shadow-lg shadow-blue-600/25"
                >
                  {saving ? 'Saving...' : 'Save Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
