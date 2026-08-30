import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const prisma = new PrismaClient();

/**
 * Public: Fetch public settings
 */
export async function getPublicSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const keys = ["WHATSAPP_BUSINESS_NUMBER", "STORE_EMAIL", "STORE_NAME", "DEFAULT_CURRENCY", "DEFAULT_COUNTRY"];
    const dbSettings = await prisma.setting.findMany({
      where: { key: { in: keys } }
    });

    // Load defaults from config or standard placeholders
    const settings: Record<string, string> = {
      WHATSAPP_BUSINESS_NUMBER: config.DEFAULT_WHATSAPP_NUMBER,
      STORE_EMAIL: "orders@argyr.com",
      STORE_NAME: "ARGYR",
      DEFAULT_CURRENCY: "NGN",
      DEFAULT_COUNTRY: "Nigeria"
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
 * Admin: Get all settings
 */
export async function adminGetSettings(req: Request, res: Response, next: NextFunction) {
  try {
    const dbSettings = await prisma.setting.findMany();
    const settings: Record<string, string> = {
      WHATSAPP_BUSINESS_NUMBER: config.DEFAULT_WHATSAPP_NUMBER,
      STORE_EMAIL: "orders@argyr.com",
      STORE_NAME: "ARGYR",
      DEFAULT_CURRENCY: "NGN",
      DEFAULT_COUNTRY: "Nigeria"
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
 * Admin: Update/upsert multiple configuration settings in a transaction
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
