import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Listing from '../models/Listing.js';

dotenv.config();

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(scriptDir, '..', 'uploads');
const dryRun = process.argv.includes('--dry-run');

function legacyFilename(imageUrl) {
  try {
    const url = new URL(imageUrl);
    if (!url.pathname.startsWith('/uploads/')) return null;
    return path.basename(decodeURIComponent(url.pathname));
  } catch {
    return null;
  }
}

function assertConfiguration() {
  const missing = ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']
    .filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

async function uploadFile(filePath) {
  // Load this after dotenv so Cloudinary sees local migration credentials.
  const { cloudinary } = await import('../config/cloudinary.js');
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'campustrade-nitj/listings',
    resource_type: 'image',
  });
  return result.secure_url;
}

async function migrate() {
  if (!dryRun) assertConfiguration();
  if (!process.env.MONGODB_URI) throw new Error('Missing required environment variable: MONGODB_URI');

  await mongoose.connect(process.env.MONGODB_URI);
  const listings = await Listing.find({ images: { $exists: true, $ne: [] } });
  let candidates = 0;
  let migrated = 0;
  let missingFiles = 0;

  for (const listing of listings) {
    const nextImages = [];
    let changed = false;

    for (const imageUrl of listing.images) {
      const filename = legacyFilename(imageUrl);
      if (!filename) {
        nextImages.push(imageUrl);
        continue;
      }

      candidates += 1;
      const filePath = path.join(uploadsDir, filename);
      try {
        await fs.access(filePath);
      } catch {
        missingFiles += 1;
        nextImages.push(imageUrl);
        continue;
      }

      if (dryRun) {
        nextImages.push(imageUrl);
        continue;
      }

      nextImages.push(await uploadFile(filePath));
      changed = true;
      migrated += 1;
    }

    if (changed) {
      listing.images = nextImages;
      await listing.save();
    }
  }

  console.log(JSON.stringify({ dryRun, candidates, migrated, missingFiles }));
}

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
