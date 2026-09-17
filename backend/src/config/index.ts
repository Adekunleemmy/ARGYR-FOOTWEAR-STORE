import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Reads a required environment variable. Throws a clear error at startup
 * if it is missing so deployment failures are immediately obvious.
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  PORT: process.env.PORT || 5000,
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  DEFAULT_WHATSAPP_NUMBER: requireEnv('ARGYR_WHATSAPP_NUMBER'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLOUDINARY: {
    CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
    API_KEY: requireEnv('CLOUDINARY_API_KEY'),
    API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),
  },
  FLUTTERWAVE: {
    PUBLIC_KEY: process.env.FLW_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY || '',
    SECRET_KEY: process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY || '',
    ENCRYPTION_KEY: process.env.FLW_ENCRYPTION_KEY || '',
    WEBHOOK_SECRET_HASH: process.env.FLW_WEBHOOK_SECRET_HASH || 'argyr_flw_secret_hash_2026',
    isConfigured: Boolean((process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY) && (process.env.FLW_PUBLIC_KEY || process.env.FLUTTERWAVE_PUBLIC_KEY))
  },
  EMAIL: {
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'ARGYR Footwear <orders@argyrworldwide.com>',
    SMTP_SECURE: process.env.SMTP_SECURE === 'true',
    isConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  }
};

/**
 * Resolves a single, valid frontend URL.
 * If a request object is passed, it checks the incoming Origin/Referer against allowed origins,
 * ensuring users on 'www.argyrworldwide.com' return to 'www.argyrworldwide.com' and users on 'argyrworldwide.com' return to 'argyrworldwide.com'.
 * In absence of a request (or non-matching origin), cleanly falls back to the first URL in FRONTEND_URL.
 */
export function getFrontendUrl(req?: { headers?: { origin?: string; referer?: string } }): string {
  const raw = config.FRONTEND_URL || '';
  const allowed = raw
    .split(',')
    .map(url => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  if (req?.headers) {
    const origin = (req.headers.origin || '').trim().replace(/\/$/, '');
    if (origin && (allowed.includes(origin) || allowed.includes('*') || /^https?:\/\/([a-zA-Z0-9-]+\.)?argyrworldwide\.com$/.test(origin))) {
      return origin;
    }
    const referer = (req.headers.referer || '').trim();
    if (referer) {
      try {
        const parsed = new URL(referer).origin.replace(/\/$/, '');
        if (allowed.includes(parsed) || /^https?:\/\/([a-zA-Z0-9-]+\.)?argyrworldwide\.com$/.test(parsed)) {
          return parsed;
        }
      } catch {
        // Ignore invalid URL
      }
    }
  }

  return allowed[0] || 'http://localhost:5173';
}