import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'nurselink-super-secret-key-change-in-prod';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'Lab Technician';
    fullName: string;
  };
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token = req.cookies.token;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: No credentials provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      role: 'Admin' | 'Doctor' | 'Nurse' | 'Pharmacist' | 'Lab Technician';
      fullName: string;
    };

    // Verify user still exists in DB
    const user = db.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Account not found.',
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Session expired or invalid credentials.',
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Unauthorized access to this resource.',
      });
    }

    next();
  };
};
