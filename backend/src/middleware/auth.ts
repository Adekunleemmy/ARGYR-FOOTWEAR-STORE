import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

const parseCookies = (cookieString?: string) => {
  if (!cookieString) return {};
  return cookieString.split(';').reduce((acc, curr) => {
    const parts = curr.split('=');
    const key = parts[0]?.trim();
    const val = parts.slice(1).join('=')?.trim();
    if (key && val) {
      acc[key] = decodeURIComponent(val);
    }
    return acc;
  }, {} as Record<string, string>);
};

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    let token = '';

    // 1. Read token from HTTP-only cookie
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.admin_token) {
      token = cookies.admin_token;
    }

    // 2. Fallback to Authorization Header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication required."
      });
    }

    // Verify Token
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      role: string;
    };

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please sign in again."
    });
  }
}
