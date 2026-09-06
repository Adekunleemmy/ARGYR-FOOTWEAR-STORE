import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { config } from '../config';
import {
  CustomerRegisterSchema,
  CustomerLoginSchema,
  CustomerVerifyOtpSchema,
  CustomerResendOtpSchema,
  CustomerForgotPasswordSchema,
  CustomerResetPasswordSchema
} from '../schemas/zodSchemas';
import { sendOtpEmail, sendPasswordResetEmail } from '../services/emailService';

const prisma = new PrismaClient();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: config.NODE_ENV === 'production' ? ('strict' as const) : ('lax' as const),
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

function generateCustomerToken(customer: { id: string; email: string; firstName: string; lastName: string }): string {
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      role: 'CUSTOMER'
    },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * 1. Customer Registration
 */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = CustomerRegisterSchema.parse(req.body);
    const normalizedEmail = data.email.toLowerCase().trim();

    // Check for existing customer account
    const existing = await prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      if (!existing.isEmailVerified) {
        // Account exists but is unverified: generate new OTP and prompt to verify
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        await prisma.customerOtp.create({
          data: {
            customerId: existing.id,
            code: otpCode,
            purpose: 'EMAIL_VERIFICATION',
            expiresAt
          }
        });

        // Send OTP email in background
        sendOtpEmail(existing.email, existing.firstName, otpCode).catch(err => {
          console.error("Failed to send OTP email:", err);
        });

        return res.status(200).json({
          success: true,
          requiresVerification: true,
          message: "An unverified account already exists with this email. A new verification code has been sent.",
          email: existing.email,
          customerId: existing.id
        });
      }

      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists. Please sign in."
      });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create customer in unverified state
    const customer = await prisma.customer.create({
      data: {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: data.phone?.trim() || null,
        marketingOptIn: Boolean(data.marketingOptIn),
        isEmailVerified: false
      }
    });

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.customerOtp.create({
      data: {
        customerId: customer.id,
        code: otpCode,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt
      }
    });

    // Send transactional OTP email
    sendOtpEmail(customer.email, customer.firstName, otpCode).catch(err => {
      console.error("Failed to dispatch registration OTP email:", err);
    });

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: "Registration successful. Please enter the 6-digit verification code sent to your email.",
      email: customer.email,
      customerId: customer.id
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 2. OTP Verification
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, customerId, otp } = CustomerVerifyOtpSchema.parse(req.body);

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email.toLowerCase().trim() }] : []),
          ...(customerId ? [{ id: customerId }] : [])
        ]
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please register to create an account."
      });
    }

    // Find the latest unexpired and unconsumed OTP
    const latestOtp = await prisma.customerOtp.findFirst({
      where: {
        customerId: customer.id,
        purpose: 'EMAIL_VERIFICATION',
        consumedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!latestOtp) {
      return res.status(400).json({
        success: false,
        message: "The verification code has expired or is invalid. Please request a new code."
      });
    }

    if (latestOtp.code !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code. Please check and try again."
      });
    }

    // Consume OTP & verify customer in a transaction
    await prisma.$transaction([
      prisma.customerOtp.update({
        where: { id: latestOtp.id },
        data: { consumedAt: new Date() }
      }),
      prisma.customer.update({
        where: { id: customer.id },
        data: { isEmailVerified: true, lastLoginAt: new Date() }
      })
    ]);

    // Issue JWT token
    const token = generateCustomerToken(customer);

    res.cookie('customer_token', token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Email verified successfully! Welcome to ARGYR.",
      token,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        isEmailVerified: true
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. Resend OTP
 */
export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, customerId } = CustomerResendOtpSchema.parse(req.body);

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          ...(email ? [{ email: email.toLowerCase().trim() }] : []),
          ...(customerId ? [{ id: customerId }] : [])
        ]
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Account not found."
      });
    }

    // Rate-limiting check: ensure at least 45 seconds since last OTP
    const recentOtp = await prisma.customerOtp.findFirst({
      where: {
        customerId: customer.id,
        createdAt: { gt: new Date(Date.now() - 45 * 1000) }
      }
    });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: "Please wait a moment before requesting another code."
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.customerOtp.create({
      data: {
        customerId: customer.id,
        code: otpCode,
        purpose: 'EMAIL_VERIFICATION',
        expiresAt
      }
    });

    // Send email
    sendOtpEmail(customer.email, customer.firstName, otpCode).catch(err => {
      console.error("Failed to resend OTP email:", err);
    });

    res.status(200).json({
      success: true,
      message: "A new verification code has been dispatched to your email."
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. Customer Login
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = CustomerLoginSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const isValidPassword = await bcrypt.compare(password, customer.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // If account has not verified email yet, prompt for OTP
    if (!customer.isEmailVerified) {
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await prisma.customerOtp.create({
        data: {
          customerId: customer.id,
          code: otpCode,
          purpose: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
      });

      sendOtpEmail(customer.email, customer.firstName, otpCode).catch(err => {
        console.error("Failed to send OTP on login:", err);
      });

      return res.status(403).json({
        success: false,
        requiresVerification: true,
        message: "Please verify your email address to access your account. A new code has been sent.",
        email: customer.email,
        customerId: customer.id
      });
    }

    // Update last login
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() }
    });

    const token = generateCustomerToken(customer);
    res.cookie('customer_token', token, COOKIE_OPTIONS);

    res.status(200).json({
      success: true,
      message: "Welcome back!",
      token,
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        isEmailVerified: true
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. Customer Logout
 */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie('customer_token', COOKIE_OPTIONS);
    res.status(200).json({
      success: true,
      message: "You have signed out successfully."
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. Get Current Authenticated Customer Session
 */
export async function getMe(req: any, res: Response, next: NextFunction) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.customer.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isEmailVerified: true,
        marketingOptIn: true,
        createdAt: true,
        addresses: {
          orderBy: { isDefault: 'desc' }
        },
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Customer session no longer exists."
      });
    }

    res.status(200).json({
      success: true,
      customer
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 7. Forgot Password - Request Reset Link
 */
export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = CustomerForgotPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    // Security: always return same message even if email not registered to prevent enumeration
    if (!customer) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset link has been dispatched."
      });
    }

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        customerId: customer.id,
        token,
        expiresAt
      }
    });

    sendPasswordResetEmail(customer.email, customer.firstName, token).catch(err => {
      console.error("Failed to send password reset email:", err);
    });

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link has been dispatched."
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 8. Reset Password - Execute Reset
 */
export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, token, password } = CustomerResetPasswordSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const customer = await prisma.customer.findUnique({
      where: { email: normalizedEmail }
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link."
      });
    }

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        customerId: customer.id,
        token,
        consumedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: "This password reset link has expired or has already been used."
      });
    }

    const newPasswordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.customer.update({
        where: { id: customer.id },
        data: { passwordHash: newPasswordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { consumedAt: new Date() }
      })
    ]);

    res.status(200).json({
      success: true,
      message: "Your password has been reset successfully. You may now sign in with your new credentials."
    });
  } catch (err) {
    next(err);
  }
}
