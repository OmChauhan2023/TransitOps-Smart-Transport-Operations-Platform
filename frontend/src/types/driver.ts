export type DriverStatus = 'Available' | 'OnTrip' | 'OffDuty' | 'Suspended';

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  contact: string;
  trip_completion_pct: number;
  safety_score: number;
  status: DriverStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DriverFormData {
  name: string;
  license_number: string;
  license_category: string;
  license_expiry: string;
  contact: string;
  trip_completion_pct: number | string;
  safety_score: number | string;
  status: DriverStatus;
}
