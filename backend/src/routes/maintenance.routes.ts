import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import {
  getMaintenanceLogs,
  getMaintenanceLogById,
  createMaintenanceLog,
  updateMaintenanceLog,
  updateMaintenanceLogStatus,
  deleteMaintenanceLog,
} from '../controllers/maintenance.controller';

const router = Router();

// All maintenance routes require authentication
router.use(authenticateJWT);

// GET routes
router.get('/', rbacGuard('maintenance', 'view'), getMaintenanceLogs);
router.get('/:id', rbacGuard('maintenance', 'view'), getMaintenanceLogById);

// Write routes
router.post('/', rbacGuard('maintenance', 'full'), createMaintenanceLog);
router.put('/:id', rbacGuard('maintenance', 'full'), updateMaintenanceLog);
router.patch('/:id/status', rbacGuard('maintenance', 'full'), updateMaintenanceLogStatus);
router.delete('/:id', rbacGuard('maintenance', 'full'), deleteMaintenanceLog);

export default router;
