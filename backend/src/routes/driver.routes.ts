import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  updateDriverStatus,
  deleteDriver,
} from '../controllers/driver.controller';

const router = Router();

// All driver routes require authentication
router.use(authenticateJWT);

// GET routes
router.get('/', rbacGuard('drivers', 'view'), getDrivers);
router.get('/:id', rbacGuard('drivers', 'view'), getDriverById);

// Write routes
router.post('/', rbacGuard('drivers', 'full'), createDriver);
router.put('/:id', rbacGuard('drivers', 'full'), updateDriver);
router.patch('/:id/status', rbacGuard('drivers', 'full'), updateDriverStatus);
router.delete('/:id', rbacGuard('drivers', 'full'), deleteDriver);

export default router;
