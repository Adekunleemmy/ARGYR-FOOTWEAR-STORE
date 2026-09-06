import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import { AdminNotificationEmailSchema } from '../schemas/zodSchemas';

const prisma = new PrismaClient();

/**
 * Public: Fetch public settings
 */
export async function getPublicSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const keys = [
      "WHATSAPP_BUSINESS_NUMBER",
      "STORE_EMAIL",
      "STORE_NAME",
      "DEFAULT_CURRENCY",
      "DEFAULT_COUNTRY",
      "ESTIMATED_DELIVERY_TIMEFRAME",
      "SUPPORT_EMAIL"
    ];

    const dbSettings = await prisma.setting.findMany({
      where: { key: { in: keys } }
    });

    // Default settings
    const settings: Record<string, string> = {
      WHATSAPP_BUSINESS_NUMBER: config.DEFAULT_WHATSAPP_NUMBER,
      STORE_EMAIL: "orders@argyrworldwide.com",
      STORE_NAME: "ARGYR Footwear",
      DEFAULT_CURRENCY: "NGN",
      DEFAULT_COUNTRY: "Nigeria",
      ESTIMATED_DELIVERY_TIMEFRAME: "7–14 days",
      SUPPORT_EMAIL: "support@argyrworldwide.com"
    };

    dbSettings.forEach(s => {
      settings[s.key] = s.value;
    });

    res.status(200).json({ success: true, settings });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Get all settings, gateway connection status, and notification emails
 */
export async function adminGetSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const [dbSettings, notificationEmails] = await Promise.all([
      prisma.setting.findMany(),
      prisma.adminNotificationEmail.findMany({
        orderBy: { createdAt: 'asc' }
      })
    ]);

    const settings: Record<string, string> = {
      WHATSAPP_BUSINESS_NUMBER: config.DEFAULT_WHATSAPP_NUMBER,
      STORE_EMAIL: "orders@argyrworldwide.com",
      STORE_NAME: "ARGYR Footwear",
      DEFAULT_CURRENCY: "NGN",
      DEFAULT_COUNTRY: "Nigeria",
      ESTIMATED_DELIVERY_TIMEFRAME: "7–14 days",
      SUPPORT_EMAIL: "support@argyrworldwide.com"
    };

    dbSettings.forEach(s => {
      settings[s.key] = s.value;
    });

    res.status(200).json({
      success: true,
      settings,
      notificationEmails,
      systemStatus: {
        isFlutterwaveConfigured: config.FLUTTERWAVE.isConfigured,
        isEmailConfigured: config.EMAIL.isConfigured
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Update/upsert configuration settings
 */
export async function adminUpdateSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settingsData = req.body as Record<string, string>;

    const upsertQueries = Object.entries(settingsData).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });

    await prisma.$transaction(upsertQueries);

    res.status(200).json({
      success: true,
      message: "Store settings updated successfully"
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Add an additional order notification email recipient
 */
export async function adminAddNotificationEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = AdminNotificationEmailSchema.parse(req.body);
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.adminNotificationEmail.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      return res.status(409).json({ success: false, message: "This email is already in the recipient list." });
    }

    const created = await prisma.adminNotificationEmail.create({
      data: { email: normalizedEmail, active: true }
    });

    res.status(201).json({
      success: true,
      message: "Recipient added successfully.",
      notificationEmail: created
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Admin: Delete a notification email recipient
 */
export async function adminDeleteNotificationEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    await prisma.adminNotificationEmail.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: "Notification recipient removed."
    });
  } catch (err) {
    next(err);
  }
}
