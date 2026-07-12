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
    <div className="space-y-6" data-testid="drivers-page">
      {/* Top Bar with Inline Rule Notice and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Drivers &amp; Safety Profiles
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6976' }}>
            Manage driver compliance, qualifications, safety scores, and duty status.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition duration-150 cursor-pointer"
          style={{ backgroundColor: '#5B2EBF' }}
        >
          <span>+ Add Driver</span>
        </button>
      </div>

      {/* Inline Rule Text Notice */}
      <div
        className="p-4 rounded-xl flex items-center gap-3 text-xs"
        style={{ backgroundColor: '#E8952E1A', border: '1px solid #E8952E33', color: '#1B1A22' }}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: '#E8952E' }} />
        <span className="font-semibold" style={{ color: '#E8952E' }}>Rule:</span>
        <span>Expired license or Suspended status → blocked from trip assignment</span>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Search driver name or license no…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
            style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
          style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
          className="px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
          style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #EDEDF2', backgroundColor: '#FCFCFB' }}>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Driver</th>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>License No</th>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Category</th>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Expiry</th>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Contact</th>
                <th className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Trip Compl. (%)</th>
                <th className="py-3.5 px-4 text-center text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Safety</th>
                <th className="py-3.5 px-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Status Toggle</th>
                <th className="py-3.5 px-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center" style={{ color: '#6B6976' }}>
                    Loading drivers...
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center" style={{ color: '#6B6976' }}>
                    No drivers found matching your filters.
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const expired = isExpired(driver.license_expiry);
                  return (
                    <tr
                      key={driver.id}
                      className="hover:bg-[#FCFCFB] transition"
                      style={{ borderBottom: '1px solid #EDEDF2' }}
                    >
                      <td className="py-3.5 px-4 font-semibold" style={{ color: '#1B1A22' }}>
                        {driver.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs" style={{ color: '#6B6976' }}>
                        {driver.license_number}
                      </td>
                      <td className="py-3.5 px-4" style={{ color: '#1B1A22' }}>
                        {driver.license_category}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: expired ? '#DB444415' : '#FCFCFB',
                            color: expired ? '#DB4444' : '#1B1A22',
                            border: expired ? '1px solid #DB444440' : '1px solid #EDEDF2',
                          }}
                        >
                          {new Date(driver.license_expiry).toLocaleDateString()}
                          {expired && ' (Expired)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4" style={{ color: '#1B1A22' }}>
                        {driver.contact}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold" style={{ color: '#1B1A22' }}>
                        {driver.trip_completion_pct}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor:
                              driver.safety_score >= 90
                                ? '#22B57315'
                                : driver.safety_score >= 75
                                ? '#E8952E15'
                                : '#DB444415',
                            color:
                              driver.safety_score >= 90
                                ? '#22B573'
                                : driver.safety_score >= 75
                                ? '#E8952E'
                                : '#DB4444',
                            border:
                              driver.safety_score >= 90
                                ? '1px solid #22B57333'
                                : driver.safety_score >= 75
                                ? '1px solid #E8952E33'
                                : '1px solid #DB444433',
                          }}
                        >
                          {driver.safety_score}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <select
                          value={driver.status}
                          onChange={(e) =>
                            handleStatusChange(driver.id, e.target.value as DriverStatus)
                          }
                          className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
                            STATUS_COLORS[driver.status]
                          } bg-white focus:outline-none`}
                        >
                          {DRIVER_STATUSES.map((st) => (
                            <option key={st} value={st} className="bg-white text-gray-900">
                              {STATUS_LABELS[st]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(driver)}
                          className="px-2.5 py-1 rounded-lg hover:bg-gray-100 text-xs font-medium transition cursor-pointer"
                          style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(driver.id)}
                          className="px-2.5 py-1 rounded-lg hover:bg-red-50 text-red-500 text-xs font-medium transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden p-6" style={{ border: '1px solid #EDEDF2' }}>
            <h2
              className="text-lg font-bold mb-4"
              style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
            >
              {editingDriver ? 'Edit Driver Profile' : 'Add Driver Profile'}
            </h2>

            {formError && (
              <div
                className="p-3 mb-4 rounded-xl text-xs font-medium"
                style={{ backgroundColor: '#DB444415', border: '1px solid #DB444440', color: '#DB4444' }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Alex Mercer"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.license_number}
                    onChange={(e) =>
                      setForm({ ...form, license_number: e.target.value })
                    }
                    placeholder="DL-98234"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none font-mono"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    License Category *
                  </label>
                  <select
                    value={form.license_category}
                    onChange={(e) =>
                      setForm({ ...form, license_category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  >
                    {LICENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    License Expiry *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.license_expiry}
                    onChange={(e) =>
                      setForm({ ...form, license_expiry: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Contact Phone (+91 10-digit mobile) *
                  </label>
                  <div className="flex">
                    <span
                      className="inline-flex items-center px-3 rounded-l-lg text-sm font-semibold"
                      style={{ border: '1px solid #EDEDF2', borderRight: 'none', backgroundColor: '#EDEDF2', color: '#1B1A22' }}
                    >
                      +91
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={form.contact.replace(/^\+91\s*/, '')}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setForm({ ...form, contact: `+91 ${digits}` });
                      }}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 rounded-r-lg bg-[#FCFCFB] text-sm focus:outline-none font-mono"
                      style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as DriverStatus })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
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
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Safety Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.safety_score}
                    onChange={(e) => setForm({ ...form, safety_score: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid #EDEDF2' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                  style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#5B2EBF' }}
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
