import crypto from 'crypto';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Cloudinary Credentials
const CLOUD_NAME = "dagkrnoap";
const API_KEY = "851642813282413";
const API_SECRET = "pvA-LTlpxSl9L5zvAgpHTSODmw8";

// Generate secure signature for Cloudinary signed upload
function generateSignature(folder: string, timestamp: number): string {
  const str = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  return crypto.createHash('sha1').update(str).digest('hex');
}

// Upload a remote URL to Cloudinary directly via signed upload REST API
async function uploadToCloudinary(imageUrl: string, folder: string): Promise<string> {
  // If it's already uploaded to this Cloudinary cloud name, skip it
  if (imageUrl.includes(`res.cloudinary.com/${CLOUD_NAME}`)) {
    return imageUrl;
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = generateSignature(folder, timestamp);

  const formData = new URLSearchParams();
  formData.append('file', imageUrl);
  formData.append('folder', folder);
  formData.append('timestamp', String(timestamp));
  formData.append('api_key', API_KEY);
  formData.append('signature', signature);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const response = await axios.post(url, formData.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (response.data && response.data.secure_url) {
    return response.data.secure_url;
  }
  throw new Error('Upload response did not contain secure_url');
}

async function migrateImages() {
  console.log('=== STARTING CLOUDINARY IMAGE MIGRATION ===\n');

  // Migrate Performers
  console.log('--- Migrating Performers ---');
  const performers = await prisma.performer.findMany();
  for (const performer of performers) {
    let updatedNeeded = false;
    let newImageUrl = performer.imageUrl;
    let newPhotos = [...(performer.photos || [])];

    const performerFolder = `VenueVox/Performer/${performer.id}/images`;

    // 1. Primary imageUrl
    if (performer.imageUrl && !performer.imageUrl.includes(`res.cloudinary.com/${CLOUD_NAME}`)) {
      try {
        console.log(`Uploading performer "${performer.name}" primary photo: ${performer.imageUrl}`);
        newImageUrl = await uploadToCloudinary(performer.imageUrl, performerFolder);
        updatedNeeded = true;
      } catch (err: any) {
        console.error(`Failed to upload primary photo for performer ${performer.name}: ${err.message}`);
      }
    }

    // 2. Photos gallery
    if (performer.photos && performer.photos.length > 0) {
      const updatedPhotosList = [];
      for (const pUrl of performer.photos) {
        if (pUrl && !pUrl.includes(`res.cloudinary.com/${CLOUD_NAME}`)) {
          try {
            console.log(`Uploading performer "${performer.name}" gallery photo: ${pUrl}`);
            const cloudUrl = await uploadToCloudinary(pUrl, performerFolder);
            updatedPhotosList.push(cloudUrl);
            updatedNeeded = true;
          } catch (err: any) {
            console.error(`Failed to upload gallery photo for performer ${performer.name}: ${err.message}`);
            updatedPhotosList.push(pUrl); // Keep original if upload fails
          }
        } else {
          updatedPhotosList.push(pUrl);
        }
      }
      newPhotos = updatedPhotosList;
    }

    if (updatedNeeded) {
      await prisma.performer.update({
        where: { id: performer.id },
        data: {
          imageUrl: newImageUrl,
          photos: newPhotos
        }
      });
      console.log(`✓ Updated Performer "${performer.name}" in DB.\n`);
    }
  }

  // Migrate Venues
  console.log('--- Migrating Venues ---');
  const venues = await prisma.venue.findMany({
    include: { organization: true }
  });

  for (const venue of venues) {
    let updatedNeeded = false;
    let newImageUrl = venue.imageUrl;
    let newPhotos = [...(venue.photos || [])];

    const orgId = venue.organizationId;
    const venueFolder = `VenueVox/Organization/${orgId}/Venue/${venue.id}/images`;

    // 1. Primary imageUrl
    if (venue.imageUrl && !venue.imageUrl.includes(`res.cloudinary.com/${CLOUD_NAME}`)) {
      try {
        console.log(`Uploading venue "${venue.name}" primary photo: ${venue.imageUrl}`);
        newImageUrl = await uploadToCloudinary(venue.imageUrl, venueFolder);
        updatedNeeded = true;
      } catch (err: any) {
        console.error(`Failed to upload primary photo for venue ${venue.name}: ${err.message}`);
      }
    }

    // 2. Photos gallery
    if (venue.photos && venue.photos.length > 0) {
      const updatedPhotosList = [];
      for (const pUrl of venue.photos) {
        if (pUrl && !pUrl.includes(`res.cloudinary.com/${CLOUD_NAME}`)) {
          try {
            console.log(`Uploading venue "${venue.name}" gallery photo: ${pUrl}`);
            const cloudUrl = await uploadToCloudinary(pUrl, venueFolder);
            updatedPhotosList.push(cloudUrl);
            updatedNeeded = true;
          } catch (err: any) {
            console.error(`Failed to upload gallery photo for venue ${venue.name}: ${err.message}`);
            updatedPhotosList.push(pUrl); // Keep original if upload fails
          }
        } else {
          updatedPhotosList.push(pUrl);
        }
      }
      newPhotos = updatedPhotosList;
    }

    if (updatedNeeded) {
      await prisma.venue.update({
        where: { id: venue.id },
        data: {
          imageUrl: newImageUrl,
          photos: newPhotos
        }
      });
      console.log(`✓ Updated Venue "${venue.name}" in DB.\n`);
    }
  }

  console.log('=== CLOUDINARY MIGRATION COMPLETED SUCCESSFULLY ===');
}

migrateImages()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
