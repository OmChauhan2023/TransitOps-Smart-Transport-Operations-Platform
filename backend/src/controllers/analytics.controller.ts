import { Request, Response } from 'express';
import prisma from '../config/db';

// Helper: build financial analytics map for all vehicles
async function getVehicleAnalyticsData() {
  const vehicles = await prisma.vehicle.findMany({
    select: {
      id: true,
      name: true,
      reg_number: true,
      type: true,
      status: true,
      region: true,
      acquisition_cost: true,
    },
  });

  const trips = await prisma.trip.findMany();
  const fuelLogs = await prisma.fuelLog.findMany();
  const maintenanceLogs = await prisma.maintenanceLog.findMany();
  const expenses = await prisma.expense.findMany();

  const map: Record<string, {
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
  }> = {};

  vehicles.forEach((v) => {
    map[v.id] = {
      id: v.id,
      name: v.name,
      reg_number: v.reg_number,
      type: v.type,
      region: v.region,
      status: v.status,
      acquisition_cost: v.acquisition_cost,
      totalTrips: 0,
      completedTrips: 0,
      totalDistanceKm: 0,
      fuelCost: 0,
      maintenanceCost: 0,
      otherCost: 0,
      totalCost: 0,
      costPerKm: 0,
    };
  });

  trips.forEach((t) => {
    const v = map[t.vehicle_id];
    if (!v) return;
    v.totalTrips += 1;
    if (t.status === 'Completed') {
      v.completedTrips += 1;
      v.totalDistanceKm += t.actual_distance ?? t.planned_distance ?? 0;
    }
  });

  fuelLogs.forEach((f) => {
    const v = map[f.vehicle_id];
    if (!v) return;
    v.fuelCost += f.fuel_cost;
  });

  maintenanceLogs.forEach((m) => {
    const v = map[m.vehicle_id];
    if (!v) return;
    v.maintenanceCost += m.cost;
  });

  expenses.forEach((e) => {
    const v = map[e.vehicle_id];
    if (!v) return;
    v.otherCost += e.total;
  });

  Object.values(map).forEach((v) => {
    v.totalCost = v.fuelCost + v.maintenanceCost + v.otherCost;
    v.costPerKm = v.totalDistanceKm > 0 ? Number((v.totalCost / v.totalDistanceKm).toFixed(2)) : 0;
  });

  return Object.values(map);
}

// GET /api/analytics/summary — Fleet-wide analytics KPIs & ROI breakdown
export const getAnalyticsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicleAnalytics = await getVehicleAnalyticsData();

    let totalFleetCost = 0;
    let totalFuelCost = 0;
    let totalMaintenanceCost = 0;
    let totalOtherCost = 0;
    let totalDistance = 0;
    let totalCompletedTrips = 0;

    vehicleAnalytics.forEach((v) => {
      totalFleetCost += v.totalCost;
      totalFuelCost += v.fuelCost;
      totalMaintenanceCost += v.maintenanceCost;
      totalOtherCost += v.otherCost;
      totalDistance += v.totalDistanceKm;
      totalCompletedTrips += v.completedTrips;
    });

    const averageCostPerKm = totalDistance > 0 ? Number((totalFleetCost / totalDistance).toFixed(2)) : 0;

    // ROI formula breakdown note:
    // Net Fleet Efficiency Score & Cost breakdown per km
    const totalVehicles = vehicleAnalytics.length;

    res.json({
      summary: {
        totalFleetCost: Number(totalFleetCost.toFixed(2)),
        totalFuelCost: Number(totalFuelCost.toFixed(2)),
        totalMaintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
        totalOtherCost: Number(totalOtherCost.toFixed(2)),
        totalDistanceKm: Number(totalDistance.toFixed(1)),
        totalCompletedTrips,
        averageCostPerKm,
        totalVehicles,
      },
      roiFormula: {
        formula: 'ROI = (Total Value Delivered - Operational Cost) / Operational Cost',
        note: 'Operational Cost combines Fuel, Maintenance, and Logged Expenses across active vehicles.',
      },
    });
  } catch (err) {
    console.error('getAnalyticsSummary error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/vehicles — Per-vehicle ranked by cost descending (costliest vehicles ranking)
export const getVehicleAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicleAnalytics = await getVehicleAnalyticsData();

    // Sort by totalCost descending (costliest ranking)
    vehicleAnalytics.sort((a, b) => b.totalCost - a.totalCost);

    res.json(vehicleAnalytics);
  } catch (err) {
    console.error('getVehicleAnalytics error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/analytics/export/csv — Export vehicle financial performance to CSV
export const exportAnalyticsCsv = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicleAnalytics = await getVehicleAnalyticsData();
    vehicleAnalytics.sort((a, b) => b.totalCost - a.totalCost);

    const headers = [
      'Registration Number',
      'Vehicle Name',
      'Type',
      'Region',
      'Total Trips',
      'Completed Trips',
      'Total Distance (km)',
      'Fuel Cost ($)',
      'Maintenance Cost ($)',
      'Other Expenses ($)',
      'Total Cost ($)',
      'Cost per km ($/km)',
    ];

    const rows = vehicleAnalytics.map((v) => [
      `"${v.reg_number.replace(/"/g, '""')}"`,
      `"${v.name.replace(/"/g, '""')}"`,
      `"${v.type.replace(/"/g, '""')}"`,
      `"${v.region.replace(/"/g, '""')}"`,
      v.totalTrips,
      v.completedTrips,
      v.totalDistanceKm.toFixed(1),
      v.fuelCost.toFixed(2),
      v.maintenanceCost.toFixed(2),
      v.otherCost.toFixed(2),
      v.totalCost.toFixed(2),
      v.costPerKm.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-analytics-export.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('exportAnalyticsCsv error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
