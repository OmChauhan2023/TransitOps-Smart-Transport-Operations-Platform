export type MaintenanceStatus = 'Active' | 'Completed';

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  service_type: string;
  cost: number;
  date: string;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  vehicle: {
    id: string;
    name: string;
    reg_number: string;
    status: string;
    type: string;
  };
}

export interface MaintenanceFormData {
  vehicle_id: string;
  service_type: string;
  cost: number | string;
  date: string;
  status: MaintenanceStatus;
}
