import { Request, Response } from 'express';
import prisma from '../config/db';

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Parallel queries for fast aggregation
    const [
      vehicles,
      drivers,
      trips,
      recentTrips,
    ] = await Promise.all([
      prisma.vehicle.findMany({ select: { status: true } }),
      prisma.driver.findMany({ select: { status: true } }),
      prisma.trip.findMany({ select: { status: true } }),
      prisma.trip.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: {
          vehicle: { select: { reg_number: true, name: true } },
          driver: { select: { name: true } },
        },
      }),
    ]);

    // Aggregate vehicle counts by status
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter((v) => v.status === 'OnTrip').length;
    const availableVehicles = vehicles.filter((v) => v.status === 'Available').length;
    const inShopVehicles = vehicles.filter((v) => v.status === 'InShop').length;
    const retiredVehicles = vehicles.filter((v) => v.status === 'Retired').length;

    // Aggregate driver counts
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter((d) => d.status === 'OnTrip').length;
    const availableDrivers = drivers.filter((d) => d.status === 'Available').length;

    // Aggregate trip counts
    const pendingDispatches = trips.filter((t) => t.status === 'Draft').length;
    const activeTrips = trips.filter((t) => t.status === 'Dispatched').length;
    const completedTrips = trips.filter((t) => t.status === 'Completed').length;

    // Vehicle utilization percentage (Active / Operational Non-Retired)
    const operationalCount = totalVehicles - retiredVehicles;
    const utilizationRate = operationalCount > 0 ? Math.round((activeVehicles / operationalCount) * 100) : 0;

    // Vehicle status breakdown percentages
    const vehicleStatusBreakdown = {
      Available: {
        count: availableVehicles,
        percentage: totalVehicles > 0 ? Math.round((availableVehicles / totalVehicles) * 100) : 0,
      },
      OnTrip: {
        count: activeVehicles,
        percentage: totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0,
      },
      InShop: {
        count: inShopVehicles,
        percentage: totalVehicles > 0 ? Math.round((inShopVehicles / totalVehicles) * 100) : 0,
      },
      Retired: {
        count: retiredVehicles,
        percentage: totalVehicles > 0 ? Math.round((retiredVehicles / totalVehicles) * 100) : 0,
      },
    };

    res.json({
      kpis: {
        totalVehicles,
        activeVehicles,
        availableVehicles,
        inShopVehicles,
        retiredVehicles,
        utilizationRate,
        totalDrivers,
        activeDrivers,
        availableDrivers,
        pendingDispatches,
        activeTrips,
        completedTrips,
      },
      vehicleStatusBreakdown,
      recentTrips,
    });
  } catch (err) {
    console.error('getDashboardSummary error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
