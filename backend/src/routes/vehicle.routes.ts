import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../controllers/vehicle.controller';

const router = Router();

// All vehicle routes require authentication
router.use(authenticateJWT);

// GET routes — 'view' access is sufficient (FleetManager, Dispatcher, FinancialAnalyst)
router.get('/', rbacGuard('fleet', 'view'), getVehicles);
router.get('/:id', rbacGuard('fleet', 'view'), getVehicleById);

// Write routes — 'full' access required (FleetManager only)
router.post('/', rbacGuard('fleet', 'full'), createVehicle);
router.put('/:id', rbacGuard('fleet', 'full'), updateVehicle);
router.delete('/:id', rbacGuard('fleet', 'full'), deleteVehicle);

export default router;
