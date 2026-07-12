export interface AnalyticsSummary {
  summary: {
    totalFleetCost: number;
    totalFuelCost: number;
    totalMaintenanceCost: number;
    totalOtherCost: number;
    totalDistanceKm: number;
    totalCompletedTrips: number;
    averageCostPerKm: number;
    totalVehicles: number;
  };
  roiFormula: {
    formula: string;
    note: string;
  };
}

export interface VehicleAnalyticsItem {
  id: string;
  name: string;
  reg_number: string;
  type: string;
  region: string;
  status: string;
  acquisition_cost: number;
  totalTrips: number;
  completedTrips: number;
  totalDistanceKm: number;
  fuelCost: number;
  maintenanceCost: number;
  otherCost: number;
  totalCost: number;
  costPerKm: number;
}
