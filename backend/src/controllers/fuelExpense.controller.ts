import { Request, Response } from 'express';
import prisma from '../config/db';

// ==================== FUEL LOGS ====================

// GET /api/fuel-logs — list all fuel logs
export const getFuelLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicle_id } = req.query;
    const where: Record<string, unknown> = {};
    if (vehicle_id && vehicle_id !== 'All') where.vehicle_id = vehicle_id as string;

    const fuelLogs = await prisma.fuelLog.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true, reg_number: true, type: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json(fuelLogs);
  } catch (err) {
    console.error('getFuelLogs error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/fuel-logs — create fuel log
export const createFuelLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicle_id, date, liters, fuel_cost } = req.body;

    if (!vehicle_id || !date || liters === undefined || fuel_cost === undefined) {
      res.status(400).json({
        message: 'vehicle_id, date, liters, and fuel_cost are required',
      });
      return;
    }

    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    if (!vehicle) {
      res.status(404).json({ message: 'Vehicle not found' });
      return;
    }

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicle_id,
        date: new Date(date),
        liters: parseFloat(liters),
        fuel_cost: parseFloat(fuel_cost),
      },
      include: {
        vehicle: {
          select: { id: true, name: true, reg_number: true },
        },
      },
    });

    res.status(201).json({ message: 'Fuel log created successfully', fuelLog });
  } catch (err) {
    console.error('createFuelLog error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/fuel-logs/:id — delete fuel log
export const deleteFuelLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.fuelLog.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Fuel log not found' });
      return;
    }

    await prisma.fuelLog.delete({ where: { id } });
    res.json({ message: 'Fuel log deleted successfully' });
  } catch (err) {
    console.error('deleteFuelLog error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==================== EXPENSES ====================

// GET /api/expenses — list all expenses
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicle_id, trip_id } = req.query;
    const where: Record<string, unknown> = {};
    if (vehicle_id && vehicle_id !== 'All') where.vehicle_id = vehicle_id as string;
    if (trip_id && trip_id !== 'All') where.trip_id = trip_id as string;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true, reg_number: true },
        },
        trip: {
          select: { id: true, trip_code: true, source: true, destination: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(expenses);
  } catch (err) {
    console.error('getExpenses error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/expenses — create expense
export const createExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicle_id, trip_id, toll = 0, other = 0, maintenance_linked = 0, status = 'Logged' } = req.body;

    if (!vehicle_id) {
      res.status(400).json({ message: 'vehicle_id is required' });
      return;
    }

    const tollVal = parseFloat(toll) || 0;
    const otherVal = parseFloat(other) || 0;
    const maintVal = parseFloat(maintenance_linked) || 0;
    const total = tollVal + otherVal + maintVal;

    const expense = await prisma.expense.create({
      data: {
        vehicle_id,
        trip_id: trip_id || null,
        toll: tollVal,
        other: otherVal,
        maintenance_linked: maintVal,
        total,
        status,
      },
      include: {
        vehicle: {
          select: { id: true, name: true, reg_number: true },
        },
        trip: {
          select: { id: true, trip_code: true },
        },
      },
    });

    res.status(201).json({ message: 'Expense logged successfully', expense });
  } catch (err) {
    console.error('createExpense error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/expenses/:id — delete expense
export const deleteExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Expense not found' });
      return;
    }

    await prisma.expense.delete({ where: { id } });
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    console.error('deleteExpense error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ==================== OPERATIONAL COST AGGREGATION ====================

// GET /api/costs/summary — operational cost aggregation (Fuel + Maintenance + Expenses per vehicle & overall)
export const getOperationalCostSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      select: { id: true, name: true, reg_number: true, type: true, status: true },
    });

    const fuelLogs = await prisma.fuelLog.findMany();
    const maintenanceLogs = await prisma.maintenanceLog.findMany();
    const expenses = await prisma.expense.findMany();

    const vehicleCostMap: Record<string, {
      vehicle_id: string;
      reg_number: string;
      name: string;
      type: string;
      fuelCost: number;
      fuelLiters: number;
      maintenanceCost: number;
      otherExpenseCost: number;
      totalOperationalCost: number;
    }> = {};

    vehicles.forEach((v) => {
      vehicleCostMap[v.id] = {
        vehicle_id: v.id,
        reg_number: v.reg_number,
        name: v.name,
        type: v.type,
        fuelCost: 0,
        fuelLiters: 0,
        maintenanceCost: 0,
        otherExpenseCost: 0,
        totalOperationalCost: 0,
      };
    });

    let overallFuelCost = 0;
    let overallFuelLiters = 0;
    let overallMaintenanceCost = 0;
    let overallOtherExpenseCost = 0;

    fuelLogs.forEach((f) => {
      overallFuelCost += f.fuel_cost;
      overallFuelLiters += f.liters;
      if (vehicleCostMap[f.vehicle_id]) {
        vehicleCostMap[f.vehicle_id].fuelCost += f.fuel_cost;
        vehicleCostMap[f.vehicle_id].fuelLiters += f.liters;
      }
    });

    maintenanceLogs.forEach((m) => {
      overallMaintenanceCost += m.cost;
      if (vehicleCostMap[m.vehicle_id]) {
        vehicleCostMap[m.vehicle_id].maintenanceCost += m.cost;
      }
    });

    expenses.forEach((e) => {
      overallOtherExpenseCost += e.total;
      if (vehicleCostMap[e.vehicle_id]) {
        vehicleCostMap[e.vehicle_id].otherExpenseCost += e.total;
      }
    });

    const perVehicleBreakdown = Object.values(vehicleCostMap).map((item) => ({
      ...item,
      totalOperationalCost: item.fuelCost + item.maintenanceCost + item.otherExpenseCost,
    }));

    const totalOperationalCost = overallFuelCost + overallMaintenanceCost + overallOtherExpenseCost;

    res.json({
      summary: {
        totalOperationalCost,
        overallFuelCost,
        overallFuelLiters,
        overallMaintenanceCost,
        overallOtherExpenseCost,
      },
      byVehicle: perVehicleBreakdown,
    });
  } catch (err) {
    console.error('getOperationalCostSummary error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
