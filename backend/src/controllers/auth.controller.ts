import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import prisma from '../config/db';

const SALT_ROUNDS = 10;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: 'name, email, password and role are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'A user with this email already exists' });
      return;
    }

    const validRoles = ['FleetManager', 'Dispatcher', 'SafetyOfficer', 'FinancialAnalyst'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ message: 'Invalid role. Must be one of: ' + validRoles.join(', ') });
      return;
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, password_hash, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ message: 'Account created successfully', user });
  } catch (err) {
    console.error('signup error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      res.status(400).json({ message: 'email, password and role are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if account is currently locked
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil((user.locked_until.getTime() - Date.now()) / 60000);
      res.status(403).json({
        message: `Account is locked. Try again in ${minutesLeft} minute(s).`,
        locked: true,
      });
      return;
    }

    // Validate password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const newFailedCount = user.failed_login_attempts + 1;
      const shouldLock = newFailedCount >= MAX_FAILED_ATTEMPTS;

      await prisma.user.update({
        where: { email },
        data: {
          failed_login_attempts: newFailedCount,
          locked_until: shouldLock
            ? new Date(Date.now() + LOCKOUT_DURATION_MS)
            : null,
        },
      });

      if (shouldLock) {
        res.status(403).json({
          message: 'Too many failed attempts. Account locked for 15 minutes.',
          locked: true,
        });
      } else {
        const attemptsLeft = MAX_FAILED_ATTEMPTS - newFailedCount;
        res.status(401).json({
          message: `Invalid credentials. ${attemptsLeft} attempt(s) remaining before lockout.`,
        });
      }
      return;
    }

    // Validate role matches
    if (user.role !== role) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { email },
      data: { failed_login_attempts: 0, locked_until: null },
    });

    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn } as jwt.SignOptions
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
