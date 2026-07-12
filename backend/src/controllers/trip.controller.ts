import { Request, Response } from 'express';
import prisma from '../config/db';

// GET /api/trips/available-vehicles — only Available vehicles
export const getAvailableVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: 'Available',
      },
      orderBy: { name: 'asc' },
    });
    res.json(vehicles);
  } catch (err) {
    console.error('getAvailableVehicles error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/trips/available-drivers — only Available drivers with non-expired license
export const getAvailableDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'Available',
        license_expiry: {
          gt: now,
        },
      },
      orderBy: { name: 'asc' },
    });
    res.json(drivers);
  } catch (err) {
    console.error('getAvailableDrivers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/trips — list all trips
export const getTrips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    const where: any = {};
    if (status && status !== 'All') where.status = status as string;
    if (search) {
      where.OR = [
        { trip_code: { contains: search as string, mode: 'insensitive' } },
        { source: { contains: search as string, mode: 'insensitive' } },
        { destination: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const trips = await prisma.trip.findMany({
      where,
      include: {
        vehicle: true,
        driver: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(trips);
  } catch (err) {
    console.error('getTrips error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/trips/:id — get trip details
export const getTripById = async (req: Request, res: Response): Promise<void> => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
        driver: true,
        expenses: true,
      },
    });

    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    res.json(trip);
  } catch (err) {
    console.error('getTripById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/trips — create a new trip (Draft or Dispatched)
export const createTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      trip_code,
      source,
      destination,
      vehicle_id,
      driver_id,
      cargo_weight,
      planned_distance,
      status = 'Draft',
      note,
    } = req.body;

    if (!trip_code || !source || !destination || !vehicle_id || !driver_id || cargo_weight === undefined || planned_distance === undefined) {
      res.status(400).json({
        message: 'trip_code, source, destination, vehicle_id, driver_id, cargo_weight, and planned_distance are required',
      });
      return;
    }

    // Check unique trip_code
    const existingCode = await prisma.trip.findUnique({ where: { trip_code } });
    if (existingCode) {
      res.status(409).json({ message: 'Trip code must be unique' });
      return;
    }

    // Validate vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      res.status(404).json({ message: 'Selected vehicle not found' });
      return;
    }

    // Check capacity rule: exact error message required by Screen 4 mockup & Section 7
    const weightNum = parseFloat(cargo_weight);
    if (weightNum > vehicle.max_load) {
      const excess = weightNum - vehicle.max_load;
      res.status(400).json({
        message: `Capacity exceeded by ${excess} kg — dispatch blocked`,
      });
      return;
    }

    // Validate driver
    const driver = await prisma.driver.findUnique({ where: { id: driver_id } });
    if (!driver) {
      res.status(404).json({ message: 'Selected driver not found' });
      return;
    }

    // Check driver license expiry & suspension
    if (driver.status === 'Suspended') {
      res.status(400).json({ message: 'Expired license or Suspended status → blocked from trip assignment' });
      return;
    }

    if (new Date(driver.license_expiry) < new Date()) {
      res.status(400).json({ message: 'Expired license or Suspended status → blocked from trip assignment' });
      return;
    }

    // If status is Dispatched, verify vehicle and driver are Available
    if (status === 'Dispatched') {
      if (vehicle.status !== 'Available') {
        res.status(400).json({ message: `Vehicle ${vehicle.reg_number} is not available for dispatch (Status: ${vehicle.status})` });
        return;
      }
      if (driver.status !== 'Available') {
        res.status(400).json({ message: `Driver ${driver.name} is not available for dispatch (Status: ${driver.status})` });
        return;
      }
    }

    // Transaction to create trip and optionally update vehicle/driver status
    const trip = await prisma.$transaction(async (tx: any) => {
      const newTrip = await tx.trip.create({
        data: {
          trip_code,
          source,
          destination,
          vehicle_id,
          driver_id,
          cargo_weight: weightNum,
          planned_distance: parseFloat(planned_distance),
          status,
          dispatched_at: status === 'Dispatched' ? new Date() : null,
          note: note || null,
        },
        include: {
          vehicle: true,
          driver: true,
        },
      });

      if (status === 'Dispatched') {
        await tx.vehicle.update({
          where: { id: vehicle_id },
          data: { status: 'OnTrip' },
        });
        await tx.driver.update({
          where: { id: driver_id },
          data: { status: 'OnTrip' },
        });
      }

      return newTrip;
    });

    res.status(201).json({ message: 'Trip created successfully', trip });
  } catch (err) {
    console.error('createTrip error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/trips/:id/dispatch — transition a Draft trip to Dispatched
export const dispatchTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    if (trip.status !== 'Draft') {
      res.status(400).json({ message: `Cannot dispatch trip with status '${trip.status}'` });
      return;
    }

    // Validate capacity
    if (trip.cargo_weight > trip.vehicle.max_load) {
      const excess = trip.cargo_weight - trip.vehicle.max_load;
      res.status(400).json({
        message: `Capacity exceeded by ${excess} kg — dispatch blocked`,
      });
      return;
    }

    // Validate vehicle and driver availability
    if (trip.vehicle.status !== 'Available') {
      res.status(400).json({ message: `Vehicle ${trip.vehicle.reg_number} is not available for dispatch` });
      return;
    }
    if (trip.driver.status !== 'Available') {
      res.status(400).json({ message: `Driver ${trip.driver.name} is not available for dispatch` });
      return;
    }

    const updatedTrip = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: {
          status: 'Dispatched',
          dispatched_at: new Date(),
        },
        include: { vehicle: true, driver: true },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicle_id },
        data: { status: 'OnTrip' },
      });
      await tx.driver.update({
        where: { id: trip.driver_id },
        data: { status: 'OnTrip' },
      });

      return updated;
    });

    res.json({ message: 'Trip dispatched successfully', trip: updatedTrip });
  } catch (err) {
    console.error('dispatchTrip error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/trips/:id/complete — complete a Dispatched trip + sync status
export const completeTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { actual_distance, fuel_consumed, note } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    if (trip.status !== 'Dispatched') {
      res.status(400).json({ message: `Only dispatched trips can be completed (Current status: ${trip.status})` });
      return;
    }

    const distanceNum = actual_distance !== undefined ? parseFloat(actual_distance) : trip.planned_distance;
    const fuelNum = fuel_consumed !== undefined && fuel_consumed !== '' ? parseFloat(fuel_consumed) : null;

    const completedTrip = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: {
          status: 'Completed',
          completed_at: new Date(),
          actual_distance: distanceNum,
          fuel_consumed: fuelNum,
          note: note !== undefined ? note : trip.note,
        },
        include: { vehicle: true, driver: true },
      });

      // Sync Vehicle: return status to Available and add distance to odometer
      await tx.vehicle.update({
        where: { id: trip.vehicle_id },
        data: {
          status: 'Available',
          odometer: { increment: distanceNum },
        },
      });

      // Sync Driver: return status to Available
      await tx.driver.update({
        where: { id: trip.driver_id },
        data: {
          status: 'Available',
        },
      });

      return updated;
    });

    res.json({ message: 'Trip completed successfully', trip: completedTrip });
  } catch (err) {
    console.error('completeTrip error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/trips/:id/cancel — cancel a Draft or Dispatched trip + sync status
export const cancelTrip = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason, note } = req.body;

    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true },
    });

    if (!trip) {
      res.status(404).json({ message: 'Trip not found' });
      return;
    }

    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      res.status(400).json({ message: `Cannot cancel trip that is already ${trip.status}` });
      return;
    }

    const wasDispatched = trip.status === 'Dispatched';

    const cancelledTrip = await prisma.$transaction(async (tx: any) => {
      const updated = await tx.trip.update({
        where: { id: trip.id },
        data: {
          status: 'Cancelled',
          cancelled_at: new Date(),
          note: note || reason || trip.note,
        },
        include: { vehicle: true, driver: true },
      });

      // If it was dispatched, revert vehicle & driver back to Available
      if (wasDispatched) {
        await tx.vehicle.update({
          where: { id: trip.vehicle_id },
          data: { status: 'Available' },
        });

        await tx.driver.update({
          where: { id: trip.driver_id },
          data: { status: 'Available' },
        });
      }

      return updated;
    });

    res.json({ message: 'Trip cancelled successfully', trip: cancelledTrip });
  } catch (err) {
    console.error('cancelTrip error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
