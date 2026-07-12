import { Request, Response } from 'express';
import prisma from '../config/db';

// GET /api/vehicles — list all vehicles with optional filters
export const getVehicles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, region, search } = req.query;

    const where: any = {};
    if (type && type !== 'All') where.type = type as string;
    if (status && status !== 'All') where.status = status as string;
    if (region && region !== 'All') where.region = region as string;
    if (search) {
      where.reg_number = { contains: search as string, mode: 'insensitive' };
    }

    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(vehicles);
  } catch (err) {
    console.error('getVehicles error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/vehicles/:id — get single vehicle
export const getVehicleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { orderBy: { created_at: 'desc' }, take: 5 },
        maintenanceLogs: { orderBy: { date: 'desc' }, take: 5 },
        fuelLogs: { orderBy: { date: 'desc' }, take: 5 },
      },
    });

    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    res.json(vehicle);
  } catch (err) {
    console.error('getVehicleById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/vehicles — create a new vehicle
export const createVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reg_number, name, type, max_load, load_unit, odometer, acquisition_cost, status, region } = req.body;

    if (!reg_number || !name || !type || max_load === undefined || odometer === undefined || acquisition_cost === undefined) {
      res.status(400).json({ message: 'reg_number, name, type, max_load, odometer, and acquisition_cost are required' });
      return;
    }

    // Unique registration number validation
    const existing = await prisma.vehicle.findUnique({ where: { reg_number } });
    if (existing) {
      res.status(409).json({ message: 'Vehicle registration number rejected if duplicate' });
      return;
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        reg_number,
        name,
        type,
        max_load: parseFloat(max_load),
        load_unit: load_unit || 'kg',
        odometer: parseFloat(odometer),
        acquisition_cost: parseFloat(acquisition_cost),
        status: status || 'Available',
        region: region || 'North',
      },
    });

    res.status(201).json({ message: 'Vehicle created successfully', vehicle });
  } catch (err) {
    console.error('createVehicle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/vehicles/:id — update a vehicle
export const updateVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reg_number, name, type, max_load, load_unit, odometer, acquisition_cost, status, region } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    // If reg_number is being changed, validate uniqueness
    if (reg_number && reg_number !== existing.reg_number) {
      const duplicate = await prisma.vehicle.findUnique({ where: { reg_number } });
      if (duplicate) {
        res.status(409).json({ message: 'Vehicle registration number rejected if duplicate' });
        return;
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(reg_number && { reg_number }),
        ...(name && { name }),
        ...(type && { type }),
        ...(max_load !== undefined && { max_load: parseFloat(max_load) }),
        ...(load_unit && { load_unit }),
        ...(odometer !== undefined && { odometer: parseFloat(odometer) }),
        ...(acquisition_cost !== undefined && { acquisition_cost: parseFloat(acquisition_cost) }),
        ...(status && { status }),
        ...(region && { region }),
      },
    });

    res.json({ message: 'Vehicle updated successfully', vehicle });
  } catch (err) {
    console.error('updateVehicle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/vehicles/:id — delete a vehicle
export const deleteVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    await prisma.vehicle.delete({ where: { id } });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('deleteVehicle error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
