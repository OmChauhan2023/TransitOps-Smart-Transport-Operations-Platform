export interface DashboardSummary {
  kpis: {
    totalVehicles: number;
    activeVehicles: number;
    availableVehicles: number;
    inShopVehicles: number;
    retiredVehicles: number;
    utilizationRate: number;
    totalDrivers: number;
    activeDrivers: number;
    availableDrivers: number;
    pendingDispatches: number;
    activeTrips: number;
    completedTrips: number;
  };
  vehicleStatusBreakdown: {
    Available: { count: number; percentage: number };
    OnTrip: { count: number; percentage: number };
    InShop: { count: number; percentage: number };
    Retired: { count: number; percentage: number };
  };
  recentTrips: {
    id: string;
    trip_code: string;
    source: string;
    destination: string;
    cargo_weight: number;
    status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
    created_at: string;
    vehicle: {
      reg_number: string;
      name: string;
    };
    driver: {
      name: string;
    };
  }[];
}
