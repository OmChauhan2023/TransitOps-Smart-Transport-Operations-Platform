import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Trip, TripFormData, TripStatus } from '../types/trip';
import type { Vehicle } from '../types/vehicle';
import type { Driver } from '../types/driver';

const STATUS_STEPS: TripStatus[] = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

const STATUS_COLORS: Record<TripStatus, string> = {
  Draft: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Dispatched: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STEP_ACTIVE_COLORS: Record<TripStatus, string> = {
  Draft: 'bg-slate-500 text-white',
  Dispatched: 'bg-blue-500 text-white',
  Completed: 'bg-emerald-500 text-white',
  Cancelled: 'bg-red-500 text-white',
};

const emptyForm: TripFormData = {
  trip_code: '',
  source: '',
  destination: '',
  vehicle_id: '',
  driver_id: '',
  cargo_weight: '',
  planned_distance: '',
  note: '',
};

export const TripsPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<TripFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');

  // Capacity validation state
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const cargoNum = parseFloat(form.cargo_weight as string) || 0;
  const capacityExceeded = selectedVehicle ? cargoNum > selectedVehicle.max_load : false;
  const excessWeight = selectedVehicle ? cargoNum - selectedVehicle.max_load : 0;

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      const res = await api.get('/trips', { params });
      setTrips(res.data);
    } catch (err) {
      console.error('Failed to fetch trips:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchAvailableOptions = async () => {
    try {
      const [vRes, dRes] = await Promise.all([
        api.get('/trips/available-vehicles'),
        api.get('/trips/available-drivers'),
      ]);
      setAvailableVehicles(vRes.data);
      setAvailableDrivers(dRes.data);
    } catch (err) {
      console.error('Failed to fetch available options:', err);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const openCreateForm = () => {
    setForm({
      ...emptyForm,
      trip_code: `TRP-${Date.now().toString(36).toUpperCase()}`,
    });
    setFormError(null);
    setSelectedVehicle(null);
    setShowCreateForm(true);
    fetchAvailableOptions();
  };

  const handleVehicleSelect = (vehicleId: string) => {
    setForm({ ...form, vehicle_id: vehicleId });
    const v = availableVehicles.find((veh) => veh.id === vehicleId) || null;
    setSelectedVehicle(v);
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (capacityExceeded) return;
    setFormError(null);
    setSaving(true);
    try {
      await api.post('/trips', { ...form, status: 'Dispatched' });
      setShowCreateForm(false);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to dispatch trip');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setFormError(null);
    setSaving(true);
    try {
      await api.post('/trips', { ...form, status: 'Draft' });
      setShowCreateForm(false);
      fetchTrips();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleDispatchExisting = async (tripId: string) => {
    try {
      await api.post(`/trips/${tripId}/dispatch`);
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to dispatch trip');
    }
  };

  const handleCompleteTrip = async (trip: Trip) => {
    const distStr = prompt('Enter actual distance (km):', trip.planned_distance.toString());
    if (distStr === null) return;
    const actual_distance = parseFloat(distStr) || trip.planned_distance;
    try {
      await api.post(`/trips/${trip.id}/complete`, { actual_distance });
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete trip');
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    try {
      await api.post(`/trips/${tripId}/cancel`, {});
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel trip');
    }
  };

  const inFlightTrips = trips.filter(
    (t) => t.status === 'Dispatched' || t.status === 'Draft'
  );

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Trip Dispatcher</h1>
          <p className="text-sm text-slate-400 mt-1">Create, dispatch, and manage trips</p>
        </div>
        <button
          onClick={openCreateForm}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition duration-150"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Trip
        </button>
      </div>

      {/* Lifecycle Stepper */}
      <div className="mb-8 p-5 rounded-2xl bg-[#0e1422] border border-slate-800">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {STATUS_STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                    filterStatus === step
                      ? STEP_ACTIVE_COLORS[step] + ' border-transparent'
                      : 'border-slate-700 text-slate-500 bg-[#151d30]'
                  } cursor-pointer transition`}
                  onClick={() =>
                    setFilterStatus(filterStatus === step ? 'All' : step)
                  }
                >
                  {i + 1}
                </div>
                <span
                  className={`text-xs font-medium ${
                    filterStatus === step ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {step}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className="flex-1 h-px bg-slate-700 mx-4 mt-[-20px]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Create Trip Form */}
      {showCreateForm && (
        <div className="mb-8 rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Create Trip</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-1 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleDispatch} className="p-6">
            {formError && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300 font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Source
                </label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="e.g. Warehouse A"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Destination
                </label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  placeholder="e.g. Depot B"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Trip Code
                </label>
                <input
                  type="text"
                  value={form.trip_code}
                  onChange={(e) => setForm({ ...form, trip_code: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Vehicle (Available Only)
                </label>
                <select
                  value={form.vehicle_id}
                  onChange={(e) => handleVehicleSelect(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select vehicle…</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.reg_number} — {v.name} ({v.max_load} {v.load_unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Driver (Available Only)
                </label>
                <select
                  value={form.driver_id}
                  onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition"
                  required
                >
                  <option value="">Select driver…</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.license_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Cargo Weight (kg)
                </label>
                <input
                  type="number"
                  value={form.cargo_weight}
                  onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })}
                  placeholder="450"
                  className={`w-full px-3 py-2.5 rounded-xl bg-[#151d30] border text-sm placeholder-slate-500 focus:outline-none transition ${
                    capacityExceeded
                      ? 'border-red-500 text-red-300 focus:border-red-400'
                      : 'border-slate-700 text-white focus:border-blue-500'
                  }`}
                  required
                  min={0}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Planned Distance (km)
                </label>
                <input
                  type="number"
                  value={form.planned_distance}
                  onChange={(e) => setForm({ ...form, planned_distance: e.target.value })}
                  placeholder="120"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#151d30] border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  required
                  min={0}
                />
              </div>
            </div>

            {/* Live Capacity Validation Box */}
            {selectedVehicle && (
              <div
                className={`mb-4 px-4 py-3 rounded-xl border text-sm font-medium flex items-center gap-3 ${
                  capacityExceeded
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {capacityExceeded ? (
                  <>
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>
                      Capacity exceeded by {excessWeight} kg — dispatch blocked
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      Vehicle Capacity: {selectedVehicle.max_load} {selectedVehicle.load_unit} | Cargo: {cargoNum} {selectedVehicle.load_unit} | Remaining: {selectedVehicle.max_load - cargoNum} {selectedVehicle.load_unit}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-200 text-sm font-semibold hover:bg-slate-700 transition disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="submit"
                disabled={saving || capacityExceeded}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-lg shadow-blue-600/25 transition"
              >
                {saving ? 'Dispatching…' : 'Dispatch'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Footer note */}
      <div className="mb-6 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300/80">
        <span className="font-semibold text-amber-300">On Complete:</span> odometer → fuel log → expenses → Vehicle &amp; Driver Available
      </div>

      {/* Live Board — In-Flight Trips */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-4">Live Board</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inFlightTrips.length === 0 && !loading ? (
            <div className="col-span-full text-center py-12 text-slate-500 text-sm">
              No active trips. Create a new trip to get started.
            </div>
          ) : (
            inFlightTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-5 rounded-2xl bg-[#0e1422] border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-white text-sm">
                    {trip.trip_code}
                  </span>
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[trip.status]}`}
                  >
                    {trip.status}
                  </span>
                </div>
                <div className="text-sm text-slate-400 mb-2">
                  <span className="text-white">{trip.source}</span>
                  <span className="mx-2">→</span>
                  <span className="text-white">{trip.destination}</span>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <div>
                    Vehicle: <span className="text-slate-300">{trip.vehicle.reg_number}</span>
                  </div>
                  <div>
                    Driver: <span className="text-slate-300">{trip.driver.name}</span>
                  </div>
                  <div>
                    Cargo: <span className="text-slate-300">{trip.cargo_weight} kg</span> / {trip.vehicle.max_load} {trip.vehicle.load_unit}
                  </div>
                </div>
                {trip.status === 'Draft' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleDispatchExisting(trip.id)}
                      className="flex-1 py-2 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 text-xs font-semibold hover:bg-blue-600/25 transition"
                    >
                      Dispatch Now
                    </button>
                    <button
                      onClick={() => handleCancelTrip(trip.id)}
                      className="py-2 px-3 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-600/25 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {trip.status === 'Dispatched' && (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => handleCompleteTrip(trip)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-600/25 transition"
                    >
                      Complete Trip
                    </button>
                    <button
                      onClick={() => handleCancelTrip(trip.id)}
                      className="py-2 px-3 rounded-xl bg-red-600/15 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-600/25 transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* All Trips Table */}
      <div className="rounded-2xl bg-[#0e1422] border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white">All Trips</h3>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#151d30] border border-slate-700 text-xs text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="All">All Statuses</option>
            {STATUS_STEPS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trip ID</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Route</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicle</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Cargo</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading trips…
                    </div>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    No trips found.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr
                    key={trip.id}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 transition"
                  >
                    <td className="px-6 py-4 font-mono font-semibold text-white">{trip.trip_code}</td>
                    <td className="px-6 py-4 text-slate-300">
                      {trip.source} → {trip.destination}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{trip.vehicle.reg_number}</td>
                    <td className="px-6 py-4 text-slate-400">{trip.driver.name}</td>
                    <td className="px-6 py-4 text-slate-300">{trip.cargo_weight} kg</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${STATUS_COLORS[trip.status]}`}
                      >
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && trips.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
