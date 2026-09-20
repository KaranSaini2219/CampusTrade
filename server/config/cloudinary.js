import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary if credentials exist
const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Listing images must not be written to a service's local disk: Render's free
// filesystem is ephemeral and files vanish when the service restarts.
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error('Invalid image type. Use jpg, png, webp, gif.'), false);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export async function uploadListingImage(file) {
  if (!useCloudinary) {
    throw new Error('Listing image storage is not configured.');
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'campustrade-nitj/listings', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
  });
}

export { cloudinary, useCloudinary };
