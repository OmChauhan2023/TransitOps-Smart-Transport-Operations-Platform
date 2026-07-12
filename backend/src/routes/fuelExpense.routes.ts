import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import {
  getFuelLogs,
  createFuelLog,
  deleteFuelLog,
  getExpenses,
  createExpense,
  deleteExpense,
  getOperationalCostSummary,
} from '../controllers/fuelExpense.controller';

const router = Router();

router.use(authenticateJWT);

// Summary & Aggregation
router.get('/summary', rbacGuard('fuel-exp', 'view'), getOperationalCostSummary);

// Fuel Logs
router.get('/fuel-logs', rbacGuard('fuel-exp', 'view'), getFuelLogs);
router.post('/fuel-logs', rbacGuard('fuel-exp', 'full'), createFuelLog);
router.delete('/fuel-logs/:id', rbacGuard('fuel-exp', 'full'), deleteFuelLog);

// Expenses
router.get('/expenses', rbacGuard('fuel-exp', 'view'), getExpenses);
router.post('/expenses', rbacGuard('fuel-exp', 'full'), createExpense);
router.delete('/expenses/:id', rbacGuard('fuel-exp', 'full'), deleteExpense);

export default router;
