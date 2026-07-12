import { Request, Response } from 'express';
import prisma from '../config/db';

// GET /api/maintenance — list all maintenance logs with optional filters
export const getMaintenanceLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, vehicle_id, service_type } = req.query;

    const where: any = {};
    if (status && status !== 'All') where.status = status as string;
    if (vehicle_id && vehicle_id !== 'All') where.vehicle_id = vehicle_id as string;
    if (service_type && service_type !== 'All') where.service_type = service_type as string;

    const logs = await prisma.maintenanceLog.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true, reg_number: true, status: true, type: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(logs);
  } catch (err) {
    console.error('getMaintenanceLogs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/maintenance/:id — get single maintenance log
export const getMaintenanceLogById = async (req: Request, res: Response): Promise<void> => {
  try {
    const log = await prisma.maintenanceLog.findUnique({
      where: { id: req.params.id },
      include: {
        vehicle: true,
      },
    });

    if (!log) {
      res.status(404).json({ message: 'Maintenance log not found' });
      return;
    }

    res.json(log);
  } catch (err) {
    console.error('getMaintenanceLogById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/maintenance — create maintenance log & update vehicle to InShop if Active
export const createMaintenanceLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicle_id, service_type, cost, date, status } = req.body;

    if (!vehicle_id || !service_type || cost === undefined || !date) {
      res.status(400).json({
        message: 'vehicle_id, service_type, cost, and date are required',
      });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      res.status(404).json({ message: 'Associated vehicle not found' });
      return;
    }

    const logStatus = status || 'Active';

    // Perform transaction: create log and optionally transition vehicle to InShop
    const result = await prisma.$transaction(async (tx: any) => {
      const maintenanceLog = await tx.maintenanceLog.create({
        data: {
          vehicle_id,
          service_type,
          cost: parseFloat(cost),
          date: new Date(date),
          status: logStatus,
        },
        include: {
          vehicle: {
            select: { id: true, name: true, reg_number: true, status: true },
          },
        },
      });

      // Creating active record -> vehicle InShop
      if (logStatus === 'Active' && vehicle.status !== 'Retired') {
        await tx.vehicle.update({
          where: { id: vehicle_id },
          data: { status: 'InShop' },
        });
      }

      return maintenanceLog;
    });

    res.status(201).json({
      message: 'Maintenance log created successfully',
      maintenanceLog: result,
    });
  } catch (err) {
    console.error('createMaintenanceLog error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PUT /api/maintenance/:id — update maintenance log & handle status sync
export const updateMaintenanceLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { service_type, cost, date, status } = req.body;

    const existing = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Maintenance log not found' });
      return;
    }

    const newStatus = status || existing.status;

    const updated = await prisma.$transaction(async (tx: any) => {
      const log = await tx.maintenanceLog.update({
        where: { id },
        data: {
          ...(service_type && { service_type }),
          ...(cost !== undefined && { cost: parseFloat(cost) }),
          ...(date && { date: new Date(date) }),
          ...(status && { status }),
        },
        include: {
          vehicle: {
            select: { id: true, name: true, reg_number: true, status: true },
          },
        },
      });

      // If status changed to Completed, check if vehicle should return to Available
      if (existing.status === 'Active' && newStatus === 'Completed') {
        const remainingActive = await tx.maintenanceLog.count({
          where: {
            vehicle_id: existing.vehicle_id,
            status: 'Active',
          },
        });

        if (remainingActive === 0 && existing.vehicle.status !== 'Retired') {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'Available' },
          });
        }
      } else if (existing.status === 'Completed' && newStatus === 'Active') {
        if (existing.vehicle.status !== 'Retired') {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'InShop' },
          });
        }
      }

      return log;
    });

    res.json({ message: 'Maintenance log updated successfully', maintenanceLog: updated });
  } catch (err) {
    console.error('updateMaintenanceLog error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/maintenance/:id/status — quick toggle for maintenance status
export const updateMaintenanceLogStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['Active', 'Completed'].includes(status)) {
      res.status(400).json({ message: 'Status must be Active or Completed' });
      return;
    }

    const existing = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Maintenance log not found' });
      return;
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      const log = await tx.maintenanceLog.update({
        where: { id },
        data: { status },
        include: {
          vehicle: {
            select: { id: true, name: true, reg_number: true, status: true },
          },
        },
      });

      if (existing.status === 'Active' && status === 'Completed') {
        const remainingActive = await tx.maintenanceLog.count({
          where: {
            vehicle_id: existing.vehicle_id,
            status: 'Active',
          },
        });

        if (remainingActive === 0 && existing.vehicle.status !== 'Retired') {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'Available' },
          });
        }
      } else if (existing.status === 'Completed' && status === 'Active') {
        if (existing.vehicle.status !== 'Retired') {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'InShop' },
          });
        }
      }

      return log;
    });

    res.json({ message: 'Maintenance log status updated successfully', maintenanceLog: updated });
  } catch (err) {
    console.error('updateMaintenanceLogStatus error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/maintenance/:id — delete log & restore status if needed
export const deleteMaintenanceLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!existing) {
      res.status(404).json({ message: 'Maintenance log not found' });
      return;
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.maintenanceLog.delete({ where: { id } });

      if (existing.status === 'Active' && existing.vehicle.status !== 'Retired') {
        const remainingActive = await tx.maintenanceLog.count({
          where: {
            vehicle_id: existing.vehicle_id,
            status: 'Active',
          },
        });

        if (remainingActive === 0) {
          await tx.vehicle.update({
            where: { id: existing.vehicle_id },
            data: { status: 'Available' },
          });
        }
      }
    });

    res.json({ message: 'Maintenance log deleted successfully' });
  } catch (err) {
    console.error('deleteMaintenanceLog error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
