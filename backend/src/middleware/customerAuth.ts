import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedCustomerRequest extends Request {
  customer?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
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

export function requireCustomer(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    let token = '';

    // 1. Check HTTP-only cookie
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.customer_token) {
      token = cookies.customer_token;
    }

    // 2. Fallback to Authorization Header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Customer authentication required. Please sign in to continue."
      });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };

    if (decoded.role !== 'CUSTOMER') {
      return res.status(403).json({
        success: false,
        message: "Access denied. Valid customer account required."
      });
    }

    req.customer = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Session expired or invalid. Please sign in again."
    });
  }
}

export function optionalCustomer(req: AuthenticatedCustomerRequest, res: Response, next: NextFunction) {
  try {
    let token = '';
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.customer_token) {
      token = cookies.customer_token;
    } else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      if (decoded.role === 'CUSTOMER') {
        req.customer = decoded;
      }
    }
  } catch {
    // Silently continue for unauthenticated guests
  }
  next();
}
