import { Request, Response } from 'express';
import prisma from '../config/db';

// GET /api/drivers — list all drivers with optional filters
export const getDrivers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, license_category, search } = req.query;

    const where: any = {};
    if (status && status !== 'All') where.status = status as string;
    if (license_category && license_category !== 'All') {
      where.license_category = license_category as string;
    }
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { license_number: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const drivers = await prisma.driver.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(drivers);
  } catch (err) {
    console.error('getDrivers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/drivers/:id — get single driver
export const getDriverById = async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { orderBy: { created_at: 'desc' }, take: 10 },
      },
    });

    if (!driver) {
      res.status(404).json({ message: 'Driver not found' });
      return;
    }

    res.json(driver);
  } catch (err) {
    console.error('getDriverById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/drivers — create a new driver
export const createDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      license_number,
      license_category,
      license_expiry,
      contact,
      trip_completion_pct,
      safety_score,
      status,
    } = req.body;

    if (!name || !license_number || !license_category || !license_expiry || !contact) {
      res.status(400).json({
        message: 'name, license_number, license_category, license_expiry, and contact are required',
      });
      return;
    }

    // Unique license number validation
    const existing = await prisma.driver.findUnique({ where: { license_number } });
    if (existing) {
      res.status(409).json({ message: 'Driver license number rejected if duplicate' });
      return;
    }

    const expiryDate = new Date(license_expiry);
    if (isNaN(expiryDate.getTime())) {
      res.status(400).json({ message: 'Invalid license_expiry date format' });
      return;
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        license_number,
        license_category,
        license_expiry: expiryDate,
        contact,
        trip_completion_pct: trip_completion_pct !== undefined ? parseFloat(trip_completion_pct) : 100.0,
        safety_score: safety_score !== undefined ? parseFloat(safety_score) : 100.0,
        status: status || 'Available',
      },
    });

    res.status(201).json({ message: 'Driver created successfully', driver });
  } catch (err) {
    console.error('createDriver error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/drivers/:id — update a driver
export const updateDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      license_number,
      license_category,
      license_expiry,
      contact,
      trip_completion_pct,
      safety_score,
      status,
    } = req.body;

    const existing = await prisma.driver.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Driver not found' });
      return;
    }

    if (license_number && license_number !== existing.license_number) {
      const duplicate = await prisma.driver.findUnique({ where: { license_number } });
      if (duplicate) {
        res.status(409).json({ message: 'Driver license number rejected if duplicate' });
        return;
      }
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(license_number && { license_number }),
        ...(license_category && { license_category }),
        ...(license_expiry && { license_expiry: new Date(license_expiry) }),
        ...(contact && { contact }),
        ...(trip_completion_pct !== undefined && { trip_completion_pct: parseFloat(trip_completion_pct) }),
        ...(safety_score !== undefined && { safety_score: parseFloat(safety_score) }),
        ...(status && { status }),
      },
    });

    res.json({ message: 'Driver updated successfully', driver });
  } catch (err) {
    console.error('updateDriver error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/drivers/:id/status — update driver status
export const updateDriverStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Available', 'OnTrip', 'OffDuty', 'Suspended'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const existing = await prisma.driver.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Driver not found' });
      return;
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { status },
    });

    res.json({ message: 'Driver status updated successfully', driver });
  } catch (err) {
    console.error('updateDriverStatus error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/drivers/:id — delete a driver
export const deleteDriver = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.driver.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Driver not found' });
      return;
    }

    await prisma.driver.delete({ where: { id } });
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('deleteDriver error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
