import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { getDashboardSummary } from '../controllers/dashboard.controller';

const router = Router();

router.use(authenticateJWT);

router.get('/summary', getDashboardSummary);

export default router;
