import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
import * as fs from 'fs';

// Initialize configuration
cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
});

/**
 * Validates if the required Cloudinary parameters are configured in .env.
 */
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    config.CLOUDINARY.CLOUD_NAME &&
    config.CLOUDINARY.API_KEY &&
    config.CLOUDINARY.API_SECRET
  );
};

/**
 * Uploads a local file to Cloudinary and deletes the temporary file from the disk.
 */
export async function uploadToCloudinary(localFilePath: string, folder = 'argyr'): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please supply keys in your .env file.');
  }

  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: 'image',
    });

    // Clean up local temp file asynchronously
    fs.unlink(localFilePath, (err) => {
      if (err) {
        console.error(`Failed to delete local temp file at ${localFilePath}:`, err);
      }
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    // Ensure clean-up even on failure
    fs.unlink(localFilePath, () => {});
    throw error;
  }
}

/**
 * Uploads a remote file directly to Cloudinary without local disk storage.
 */
export async function uploadUrlToCloudinary(remoteUrl: string, folder = 'argyr'): Promise<{ url: string; publicId: string }> {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please supply keys in your .env file.');
  }

  const result = await cloudinary.uploader.upload(remoteUrl, {
    folder,
    resource_type: 'image',
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
}
export { cloudinary };
