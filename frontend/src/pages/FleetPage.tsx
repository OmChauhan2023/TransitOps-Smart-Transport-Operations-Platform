import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Vehicle, VehicleFormData, VehicleStatus } from '../types/vehicle';

const VEHICLE_TYPES = ['Truck', 'Van', 'Bus', 'Sedan', 'SUV', 'Trailer'];
const VEHICLE_STATUSES: VehicleStatus[] = ['Available', 'OnTrip', 'InShop', 'Retired'];
const REGIONS = ['North', 'South', 'East', 'West', 'Central'];

const STATUS_COLORS: Record<VehicleStatus, string> = {
  Available: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  OnTrip: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  InShop: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Retired: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<VehicleStatus, string> = {
  Available: 'Available',
  OnTrip: 'On Trip',
  InShop: 'In Shop',
  Retired: 'Retired',
};

const emptyForm: VehicleFormData = {
  reg_number: '',
  name: '',
  type: 'Truck',
  max_load: '',
  load_unit: 'kg',
  odometer: '',
  acquisition_cost: '',
  status: 'Available',
  region: 'North',
};

export const FleetPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchReg, setSearchReg] = useState('');

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterType !== 'All') params.type = filterType;
      if (filterStatus !== 'All') params.status = filterStatus;
      if (searchReg.trim()) params.search = searchReg.trim();
      const res = await api.get('/vehicles', { params });
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, searchReg]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const openAddModal = () => {
    setEditingVehicle(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setForm({
      reg_number: v.reg_number,
      name: v.name,
      type: v.type,
      max_load: v.max_load,
      load_unit: v.load_unit,
      odometer: v.odometer,
      acquisition_cost: v.acquisition_cost,
      status: v.status,
      region: v.region,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, form);
      } else {
        await api.post('/vehicles', form);
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to save vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete vehicle. It may be referenced by existing trips.');
    }
  };

  return (
    <div className="space-y-6" data-testid="fleet-page">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Vehicle Registry
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6976' }}>
            Manage your fleet vehicles and registrations
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition cursor-pointer"
          style={{ backgroundColor: '#5B2EBF' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
          style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
        >
          <option value="All">All Types</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
          style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
        >
          <option value="All">All Statuses</option>
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchReg}
            onChange={(e) => setSearchReg(e.target.value)}
            placeholder="Search reg. no…"
            className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
            style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
          />
        </div>
      </div>

      {/* Rule Text */}
      <div
        className="px-4 py-3 rounded-xl text-xs"
        style={{ backgroundColor: '#E8952E1A', border: '1px solid #E8952E33', color: '#1B1A22' }}
      >
        <span className="font-semibold" style={{ color: '#E8952E' }}>Rule:</span> Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
      </div>

      {/* Vehicles Table */}
      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid #EDEDF2', backgroundColor: '#FCFCFB' }}>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Reg. No.</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Name / Model</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Type</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Capacity</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Odometer</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Acq. Cost</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Status</th>
                <th className="text-right px-6 py-3.5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B6976' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#5B2EBF] border-t-transparent rounded-full animate-spin" />
                      Loading vehicles…
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                    No vehicles found. Add your first vehicle to get started.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-[#FCFCFB] transition"
                    style={{ borderBottom: '1px solid #EDEDF2' }}
                  >
                    <td className="px-6 py-3.5 font-mono font-semibold" style={{ color: '#1B1A22' }}>{v.reg_number}</td>
                    <td className="px-6 py-3.5 font-medium" style={{ color: '#1B1A22' }}>{v.name}</td>
                    <td className="px-6 py-3.5" style={{ color: '#6B6976' }}>{v.type}</td>
                    <td className="px-6 py-3.5 font-mono" style={{ color: '#1B1A22' }}>
                      {v.max_load.toLocaleString()} {v.load_unit}
                    </td>
                    <td className="px-6 py-3.5 font-mono" style={{ color: '#6B6976' }}>
                      {v.odometer.toLocaleString()} km
                    </td>
                    <td className="px-6 py-3.5 font-mono" style={{ color: '#1B1A22' }}>
                      ₹{v.acquisition_cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[v.status]}`}>
                        {STATUS_LABELS[v.status]}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          style={{ color: '#6B6976' }}
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition cursor-pointer"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        {!loading && vehicles.length > 0 && (
          <div className="px-6 py-3 text-xs" style={{ borderTop: '1px solid #EDEDF2', color: '#6B6976' }}>
            Showing {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDEDF2' }}>
              <h3
                className="text-lg font-bold"
                style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
              >
                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                style={{ color: '#6B6976' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div
                  className="px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ backgroundColor: '#DB444415', border: '1px solid #DB444440', color: '#DB4444' }}
                >
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Registration No. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-12-AB-1234"
                    value={form.reg_number}
                    onChange={(e) => setForm({ ...form, reg_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Vehicle Name / Model *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Prima 4018"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Max Load Capacity *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      placeholder="5000"
                      value={form.max_load}
                      onChange={(e) => setForm({ ...form, max_load: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                      style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    />
                    <select
                      value={form.load_unit}
                      onChange={(e) => setForm({ ...form, load_unit: e.target.value })}
                      className="px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                      style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    >
                      <option value="kg">kg</option>
                      <option value="tons">tons</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Acq. Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={form.acquisition_cost}
                    onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                    placeholder="25000"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                    min={0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Assigned Region *
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {editingVehicle ? (
                  <div>
                    <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                      Status
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
                      className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none transition"
                      style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    >
                      {VEHICLE_STATUSES.map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div />
                )}
              </div>

              <div className="pt-3 flex items-center gap-3" style={{ borderTop: '1px solid #EDEDF2' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                  style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 rounded-lg text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#5B2EBF' }}
                >
                  {saving ? 'Saving…' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
