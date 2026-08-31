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
  PORT: process.env.PORT,
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  DEFAULT_WHATSAPP_NUMBER: requireEnv('ARGYR_WHATSAPP_NUMBER'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLOUDINARY: {
    CLOUD_NAME: requireEnv('CLOUDINARY_CLOUD_NAME'),
    API_KEY: requireEnv('CLOUDINARY_API_KEY'),
    API_SECRET: requireEnv('CLOUDINARY_API_SECRET'),
  }
};
