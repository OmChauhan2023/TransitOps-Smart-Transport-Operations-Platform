export interface FuelLog {
  id: string;
  vehicle_id: string;
  date: string;
  liters: number;
  fuel_cost: number;
  created_at: string;
  vehicle: {
    id: string;
    name: string;
    reg_number: string;
    type?: string;
  };
}

export interface Expense {
  id: string;
  vehicle_id: string;
  trip_id: string | null;
  toll: number;
  other: number;
  maintenance_linked: number;
  total: number;
  status: string;
  created_at: string;
  vehicle: {
    id: string;
    name: string;
    reg_number: string;
  };
  trip?: {
    id: string;
    trip_code: string;
  } | null;
}

export interface OperationalCostSummary {
  summary: {
    totalOperationalCost: number;
    overallFuelCost: number;
    overallFuelLiters: number;
    overallMaintenanceCost: number;
    overallOtherExpenseCost: number;
  };
  byVehicle: {
    vehicle_id: string;
    reg_number: string;
    name: string;
    type: string;
    fuelCost: number;
    fuelLiters: number;
    maintenanceCost: number;
    otherExpenseCost: number;
    totalOperationalCost: number;
  }[];
}
