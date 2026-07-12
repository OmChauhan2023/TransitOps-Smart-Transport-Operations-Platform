export type VehicleStatus = 'Available' | 'OnTrip' | 'InShop' | 'Retired';

export interface Vehicle {
  id: string;
  reg_number: string;
  name: string;
  type: string;
  max_load: number;
  load_unit: string;
  odometer: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region: string;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleFormData {
  reg_number: string;
  name: string;
  type: string;
  max_load: number | string;
  load_unit: string;
  odometer: number | string;
  acquisition_cost: number | string;
  status: VehicleStatus;
  region: string;
}
