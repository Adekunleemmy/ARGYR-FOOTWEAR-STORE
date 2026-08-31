import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';

// Initialize configuration
cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
});

/**
 * Uploads an image buffer directly to Cloudinary (no local disk involvement).
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder = 'argyr'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

/**
 * Uploads a remote URL directly to Cloudinary.
 */
export async function uploadUrlToCloudinary(
  remoteUrl: string,
  folder = 'argyr'
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(remoteUrl, {
    folder,
    resource_type: 'image',
  });
  return { url: result.secure_url, publicId: result.public_id };
}

export { cloudinary };
