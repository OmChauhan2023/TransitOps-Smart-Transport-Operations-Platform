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
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Vehicle Registry</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your fleet vehicles and registrations</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Vehicle
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
        >
          <option value="All">All Types</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 transition"
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
            className="w-full px-4 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Rule Text */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300/80">
        <span className="font-semibold text-amber-300">Rule:</span> Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
      </div>

      {/* Vehicles Table */}
      <div className="rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reg. No.</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Name / Model</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Capacity</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Odometer</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acq. Cost</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading vehicles…
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    No vehicles found. Add your first vehicle to get started.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr
                    key={v.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition"
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-white">{v.reg_number}</td>
                    <td className="px-6 py-4 text-slate-300">{v.name}</td>
                    <td className="px-6 py-4 text-slate-400">{v.type}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {v.max_load.toLocaleString()} {v.load_unit}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {v.odometer.toLocaleString()} km
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      ₹{v.acquisition_cost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[v.status]}`}
                      >
                        {STATUS_LABELS[v.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-blue-400 transition"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-red-400 transition"
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
          <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-lg mx-4 bg-[#0e1422] border border-slate-700 rounded-2xl shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Registration No. (AA 00 BB 1111)
                  </label>
                  <input
                    type="text"
                    value={form.reg_number}
                    onChange={(e) => setForm({ ...form, reg_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. MH 12 AB 1234"
                    pattern="^[A-Z]{2}\s?[0-9]{2}\s?[A-Z]{2}\s?[0-9]{4}$"
                    title="Format: AA 00 BB 1111 (e.g. MH 12 AB 1234)"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white font-mono text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Name / Model
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Mercedes Sprinter"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  >
                    {VEHICLE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Region
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Max Load
                  </label>
                  <input
                    type="number"
                    value={form.max_load}
                    onChange={(e) => setForm({ ...form, max_load: e.target.value })}
                    placeholder="500"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    value={form.odometer}
                    onChange={(e) => setForm({ ...form, odometer: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                    min={0}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Acq. Cost (₹)
                  </label>
                  <input
                    type="number"
                    value={form.acquisition_cost}
                    onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                    placeholder="25000"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                    min={0}
                  />
                </div>
              </div>

              {editingVehicle && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as VehicleStatus })}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  >
                    {VEHICLE_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition"
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
