import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import type { Trip, TripFormData, TripStatus } from '../types/trip';
import type { Vehicle } from '../types/vehicle';
import type { Driver } from '../types/driver';
import { StatusBadge } from '../components';

const STATUS_STEPS: TripStatus[] = ['Draft', 'Dispatched', 'Completed', 'Cancelled'];

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
    const distStr = window.prompt('Enter actual distance (km):', trip.planned_distance.toString());
    if (distStr === null) return;
    const actual_distance = parseFloat(distStr);
    if (isNaN(actual_distance) || actual_distance < 0) {
      alert('Please enter a valid distance.');
      return;
    }
    try {
      await api.post(`/trips/${trip.id}/complete`, { actual_distance });
      fetchTrips();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete trip');
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
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
    <div className="space-y-6" data-testid="trips-page">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}
          >
            Trip Dispatcher
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B6976' }}>
            Create, dispatch, and manage trips
          </p>
        </div>
        <button
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm transition cursor-pointer"
          style={{ backgroundColor: '#5B2EBF' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Trip
        </button>
      </div>

      {/* Stepper Pipeline */}
      <div className="bg-white p-5 rounded-xl" style={{ border: '1px solid #EDEDF2' }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B6976' }}>
          Trip Lifecycle Stepper
        </div>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {STATUS_STEPS.map((step, idx) => (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center min-w-[80px]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono mb-1.5"
                  style={{
                    backgroundColor: filterStatus === step ? '#5B2EBF' : '#FCFCFB',
                    color: filterStatus === step ? '#FFFFFF' : '#6B6976',
                    border: '1px solid #EDEDF2',
                  }}
                >
                  {idx + 1}
                </div>
                <span className="text-xs font-medium" style={{ color: filterStatus === step ? '#1B1A22' : '#6B6976' }}>
                  {step}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className="flex-1 h-px mx-4 mt-[-20px]" style={{ backgroundColor: '#EDEDF2' }} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Create Trip Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setShowCreateForm(false)}
          />
          <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-xl overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDEDF2' }}>
              <h3 className="text-lg font-bold" style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}>Create &amp; Dispatch Trip</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition"
                style={{ color: '#6B6976' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleDispatch} className="p-6">
              {formError && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-sm text-red-600 font-medium" style={{ border: '1px solid #FCA5A5' }}>
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Source
                  </label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="e.g. Central Depot"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Destination
                  </label>
                  <input
                    type="text"
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                    placeholder="e.g. North Terminal"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Trip Code
                  </label>
                  <input
                    type="text"
                    value={form.trip_code}
                    onChange={(e) => setForm({ ...form, trip_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Vehicle
                  </label>
                  <select
                    value={form.vehicle_id}
                    onChange={(e) => handleVehicleSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Driver
                  </label>
                  <select
                    value={form.driver_id}
                    onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                  >
                    <option value="">Select driver…</option>
                    {availableDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.license_category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Cargo Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={form.cargo_weight}
                    onChange={(e) => setForm({ ...form, cargo_weight: e.target.value })}
                    placeholder="4500"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                    min={0}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider mb-1.5" style={{ color: '#6B6976' }}>
                    Planned Distance (km)
                  </label>
                  <input
                    type="number"
                    value={form.planned_distance}
                    onChange={(e) => setForm({ ...form, planned_distance: e.target.value })}
                    placeholder="120"
                    className="w-full px-3 py-2 rounded-lg bg-[#FCFCFB] text-sm focus:outline-none"
                    style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                    required
                    min={0}
                  />
                </div>
              </div>

              {selectedVehicle && (
                <div
                  className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3"
                  style={{
                    backgroundColor: capacityExceeded ? '#DB444415' : '#22B57315',
                    border: `1px solid ${capacityExceeded ? '#DB444440' : '#22B57340'}`,
                    color: capacityExceeded ? '#DB4444' : '#22B573',
                  }}
                >
                  <span>
                    {capacityExceeded
                      ? `Overload warning: ${form.cargo_weight} kg exceeds vehicle max capacity (${selectedVehicle.max_load} kg)`
                      : `Capacity valid: ${form.cargo_weight || 0} / ${selectedVehicle.max_load} kg`}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid #EDEDF2' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
                  style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving || capacityExceeded}
                  className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
                  style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={saving || capacityExceeded}
                  className="px-5 py-2 rounded-lg text-white text-sm font-semibold transition cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: '#5B2EBF' }}
                >
                  {saving ? 'Dispatching…' : 'Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div
        className="px-4 py-3 rounded-xl text-xs flex items-center gap-2"
        style={{ backgroundColor: '#E8952E1A', border: '1px solid #E8952E33', color: '#1B1A22' }}
      >
        <span className="font-semibold" style={{ color: '#E8952E' }}>On Complete:</span>
        odometer → fuel log → expenses → Vehicle &amp; Driver Available
      </div>

      {/* Live Board — In-Flight Trips */}
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}>Live Board</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {inFlightTrips.length === 0 && !loading ? (
            <div className="col-span-full text-center py-12 text-sm" style={{ color: '#6B6976' }}>
              No active trips. Create a new trip to get started.
            </div>
          ) : (
            inFlightTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-5 rounded-xl bg-white transition"
                style={{ border: '1px solid #EDEDF2' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono font-bold text-sm" style={{ color: '#1B1A22' }}>
                    {trip.trip_code}
                  </span>
                  <StatusBadge status={trip.status} />
                </div>
                <div className="text-sm mb-2 font-medium" style={{ color: '#1B1A22' }}>
                  <span>{trip.source}</span>
                  <span className="mx-2 text-[#6B6976]">→</span>
                  <span>{trip.destination}</span>
                </div>
                <div className="text-xs space-y-1" style={{ color: '#6B6976' }}>
                  <div>
                    Vehicle: <span className="font-mono font-medium" style={{ color: '#1B1A22' }}>{trip.vehicle.reg_number}</span> ({trip.vehicle.name})
                  </div>
                  <div>
                    Driver: <span className="font-medium" style={{ color: '#1B1A22' }}>{trip.driver.name}</span>
                  </div>
                  <div>
                    Cargo: <span className="font-mono font-medium" style={{ color: '#1B1A22' }}>{trip.cargo_weight} kg</span>
                  </div>
                </div>
                {trip.status === 'Draft' && (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleDispatchExisting(trip.id)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer"
                      style={{ backgroundColor: '#5B2EBF', color: '#FFFFFF' }}
                    >
                      Dispatch Now
                    </button>
                    <button
                      onClick={() => handleCancelTrip(trip.id)}
                      className="py-1.5 px-3 rounded-lg text-red-600 text-xs font-semibold hover:bg-red-50 transition cursor-pointer"
                      style={{ border: '1px solid #EDEDF2' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {trip.status === 'Dispatched' && (
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => handleCompleteTrip(trip)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
                      style={{ backgroundColor: '#22B573' }}
                    >
                      Complete Trip
                    </button>
                    <button
                      onClick={() => handleCancelTrip(trip.id)}
                      className="py-1.5 px-3 rounded-lg text-red-600 text-xs font-semibold hover:bg-red-50 transition cursor-pointer"
                      style={{ border: '1px solid #EDEDF2' }}
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
      <div className="rounded-xl bg-white overflow-hidden" style={{ border: '1px solid #EDEDF2' }}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #EDEDF2' }}>
          <h3 className="font-bold" style={{ color: '#1B1A22', fontFamily: 'Archivo, system-ui, sans-serif' }}>All Trips</h3>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white text-xs focus:outline-none transition"
            style={{ border: '1px solid #EDEDF2', color: '#1B1A22' }}
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
              <tr style={{ borderBottom: '1px solid #EDEDF2' }}>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>Trip ID</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>Route</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>Vehicle</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>Driver</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>Cargo</th>
                <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider" style={{ color: '#6B6976' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-[#5B2EBF] border-t-transparent rounded-full animate-spin" />
                      Loading trips…
                    </div>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center" style={{ color: '#6B6976' }}>
                    No trips found.
                  </td>
                </tr>
              ) : (
                trips.map((trip) => (
                  <tr
                    key={trip.id}
                    className="hover:bg-[#FCFCFB] transition"
                    style={{ borderBottom: '1px solid #EDEDF2' }}
                  >
                    <td className="px-6 py-3.5 font-mono font-medium" style={{ color: '#1B1A22' }}>{trip.trip_code}</td>
                    <td className="px-6 py-3.5" style={{ color: '#1B1A22' }}>
                      {trip.source} → {trip.destination}
                    </td>
                    <td className="px-6 py-3.5 font-mono" style={{ color: '#6B6976' }}>{trip.vehicle.reg_number}</td>
                    <td className="px-6 py-3.5" style={{ color: '#6B6976' }}>{trip.driver.name}</td>
                    <td className="px-6 py-3.5 font-mono" style={{ color: '#1B1A22' }}>{trip.cargo_weight} kg</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={trip.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && trips.length > 0 && (
          <div className="px-6 py-3 text-xs" style={{ borderTop: '1px solid #EDEDF2', color: '#6B6976' }}>
            Showing {trips.length} trip{trips.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
