import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import { AdminLoginSchema } from '../schemas/zodSchemas';

const prisma = new PrismaClient();

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = AdminLoginSchema.parse(req.body);

    const admin = await prisma.adminUser.findUnique({ where: { email } });
    
    // Security: standard error message to avoid email enumeration attacks
    if (!admin || !admin.active) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Record login timestamp
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookie
    const isProd = config.NODE_ENV === 'production';
    const sameSite = isProd ? 'SameSite=Strict;' : 'SameSite=Lax;';
    res.setHeader(
      'Set-Cookie',
      `admin_token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; ${sameSite}${isProd ? ' Secure;' : ''}`
    );

    res.status(200).json({
      success: true,
      message: "Admin signed in successfully",
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    // Clear cookie
    res.setHeader(
      'Set-Cookie',
      `admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict;`
    );
    res.status(200).json({ success: true, message: "Admin signed out successfully" });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: any, res: Response, next: NextFunction) {
  try {
    const admin = await prisma.adminUser.findUnique({
      where: { id: req.admin.id },
      select: { id: true, name: true, email: true, role: true, active: true }
    });

    if (!admin || !admin.active) {
      return res.status(401).json({ success: false, message: "User session is no longer active" });
    }

    res.status(200).json({ success: true, admin });
  } catch (err) {
    next(err);
  }
}
