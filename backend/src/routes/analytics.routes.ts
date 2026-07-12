import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import {
  getAnalyticsSummary,
  getVehicleAnalytics,
  exportAnalyticsCsv,
} from '../controllers/analytics.controller';

const router = Router();

router.use(authenticateJWT);

router.get('/summary', rbacGuard('analytics', 'view'), getAnalyticsSummary);
router.get('/vehicles', rbacGuard('analytics', 'view'), getVehicleAnalytics);
router.get('/export/csv', rbacGuard('analytics', 'view'), exportAnalyticsCsv);

export default router;
