import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ORGANIZATION' | 'PERFORMER';
    isManager: boolean;
    parentOrgId?: string | null;
  };
}

export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Read from httpOnly cookie first, fall back to Authorization header
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'venuevox-super-secret-key'
    ) as { id: string; email: string; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'ORGANIZATION' | 'PERFORMER',
      isManager: user.isManager,
      parentOrgId: user.parentOrgId,
    };

    next();
  } catch (error: any) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      errors: [error.message],
    });
  }
};

export const requireRole = (allowedRoles: ('ORGANIZATION' | 'PERFORMER')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. Insufficient permissions.',
      });
    }

    next();
  };
};
