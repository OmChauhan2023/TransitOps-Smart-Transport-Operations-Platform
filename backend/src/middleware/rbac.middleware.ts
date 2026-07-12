import { Request, Response, NextFunction } from 'express';

export type ModuleName = 'fleet' | 'drivers' | 'trips' | 'fuel-exp' | 'analytics';
export type AccessLevel = 'full' | 'view' | 'none';

export type RoleName =
  | 'FleetManager'
  | 'Dispatcher'
  | 'SafetyOfficer'
  | 'FinancialAnalyst';

export const RBAC_MATRIX: Record<RoleName, Record<ModuleName, AccessLevel>> = {
  FleetManager: {
    fleet: 'full',
    drivers: 'full',
    trips: 'none',
    'fuel-exp': 'none',
    analytics: 'full',
  },
  Dispatcher: {
    fleet: 'view',
    drivers: 'none',
    trips: 'full',
    'fuel-exp': 'none',
    analytics: 'none',
  },
  SafetyOfficer: {
    fleet: 'none',
    drivers: 'full',
    trips: 'view',
    'fuel-exp': 'none',
    analytics: 'none',
  },
  FinancialAnalyst: {
    fleet: 'view',
    drivers: 'none',
    trips: 'none',
    'fuel-exp': 'full',
    analytics: 'full',
  },
};

/**
 * Middleware that checks if the authenticated user has one of the allowed roles.
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden: Role ${req.user.role} does not have permission to access this resource`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware that enforces the Screen 8 / Section 4 permission matrix.
 * If requiredLevel is not explicitly provided:
 * - GET requests require at least 'view' access ('view' or 'full')
 * - POST, PUT, PATCH, DELETE requests require 'full' access
 */
export const rbacGuard = (
  moduleName: ModuleName,
  requiredLevel?: 'view' | 'full'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized: User not authenticated' });
      return;
    }

    const role = req.user.role as RoleName;
    const permissions = RBAC_MATRIX[role];

    if (!permissions) {
      res.status(403).json({ message: 'Forbidden: Unknown user role' });
      return;
    }

    const access = permissions[moduleName];

    const levelNeeded: 'view' | 'full' =
      requiredLevel || (req.method === 'GET' ? 'view' : 'full');

    if (access === 'none') {
      res.status(403).json({
        message: `Forbidden: Role '${role}' has no access to '${moduleName}'`,
      });
      return;
    }

    if (levelNeeded === 'full' && access !== 'full') {
      res.status(403).json({
        message: `Forbidden: Role '${role}' has read-only ('view') access to '${moduleName}'`,
      });
      return;
    }

    next();
  };
};
