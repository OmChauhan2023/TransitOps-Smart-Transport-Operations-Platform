export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  trip_code: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number;
  planned_distance: number;
  actual_distance: number | null;
  fuel_consumed: number | null;
  status: TripStatus;
  created_at: string;
  dispatched_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  note: string | null;
  vehicle: {
    id: string;
    reg_number: string;
    name: string;
    max_load: number;
    load_unit: string;
    status: string;
  };
  driver: {
    id: string;
    name: string;
    license_number: string;
    status: string;
  };
}

export interface TripFormData {
  trip_code: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight: number | string;
  planned_distance: number | string;
  note: string;
}
