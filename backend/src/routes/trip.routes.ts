import { Router } from 'express';
import { authenticateJWT } from '../middleware/auth.middleware';
import { rbacGuard } from '../middleware/rbac.middleware';
import {
  getAvailableVehicles,
  getAvailableDrivers,
  getTrips,
  getTripById,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
} from '../controllers/trip.controller';

const router = Router();

// Require authentication for all trip routes
router.use(authenticateJWT);

// GET routes (requires 'view' access on 'trips')
router.get('/available-vehicles', rbacGuard('trips', 'view'), getAvailableVehicles);
router.get('/available-drivers', rbacGuard('trips', 'view'), getAvailableDrivers);
router.get('/', rbacGuard('trips', 'view'), getTrips);
router.get('/:id', rbacGuard('trips', 'view'), getTripById);

// POST routes (requires 'full' access on 'trips' — Dispatcher)
router.post('/', rbacGuard('trips', 'full'), createTrip);
router.post('/:id/dispatch', rbacGuard('trips', 'full'), dispatchTrip);
router.post('/:id/complete', rbacGuard('trips', 'full'), completeTrip);
router.post('/:id/cancel', rbacGuard('trips', 'full'), cancelTrip);

export default router;

