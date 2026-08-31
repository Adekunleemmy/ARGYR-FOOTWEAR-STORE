import multer from 'multer';
import path from 'path';

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedExtensions = /jpeg|jpg|png|webp/;
  const mimeType = allowedExtensions.test(file.mimetype);
  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());

  if (mimeType && extName) {
    return cb(null, true);
  }
  cb(new Error("File format invalid. Only image uploads (JPEG, JPG, PNG, WEBP) are allowed."));
};

// Use memory storage — files go directly to Cloudinary, nothing saved to disk
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file limit
  },
  fileFilter
});
