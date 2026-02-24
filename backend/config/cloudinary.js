import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// ✅ FIX: Factory function - creates storage when env vars are ready
const createPostStorage = () => {
  console.log("🔍 DEBUG - Creating postStorage, env vars available:", !!process.env.CLOUDINARY_CLOUD_NAME);
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
      folder: 'prolinka/posts',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webp'],
      resource_type: 'auto',
    }),
  });
};

const createProfileStorage = () => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
      folder: 'prolinka/profiles',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: 'image',
      transformation: [{ width: 500, height: 500, crop: 'limit' }],
    }),
  });
};

const createCoverStorage = () => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => ({
      folder: 'prolinka/covers',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      resource_type: 'image',
      transformation: [{ width: 1500, height: 500, crop: 'limit' }],
    }),
  });
};

// ✅ FIX: Configure cloudinary when this function is called (after env vars loaded)
const getConfiguredCloudinary = () => {
  if (!cloudinary.config().cloud_name) {
    // Parse cloud name from URL format if needed
    let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    console.log("🔍 DEBUG - Original CLOUDINARY_CLOUD_NAME:", cloudName);
    
    if (cloudName && cloudName.includes('://')) {
      // Extract from cloudinary://api_key:api_secret@cloud_name format
      // Split by @ and take the last part (the cloud name)
      const parts = cloudName.split('@');
      console.log("🔍 DEBUG - Split parts:", parts);
      if (parts.length > 1) {
        cloudName = parts[parts.length - 1];
        console.log("🔍 DEBUG - Extracted cloud_name from URL:", cloudName);
      }
    }
    
    console.log("🔍 DEBUG - Final cloud_name for config:", cloudName);

    cloudinary.config({
      cloud_name: cloudName,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
  return cloudinary;
};



// ✅ FIX: Create multer instances with factory functions
// These will be initialized when first used (after env vars are loaded)
let uploadPostInstance, uploadProfileInstance, uploadCoverInstance;

export const uploadPost = {
  single: (fieldName) => {
    const cloudinaryInstance = getConfiguredCloudinary();
    const storage = createPostStorage();
    return multer({ storage }).single(fieldName);
  }
};

export const uploadProfile = {
  single: (fieldName) => {
    const cloudinaryInstance = getConfiguredCloudinary();
    const storage = createProfileStorage();
    return multer({ storage }).single(fieldName);
  }
};

export const uploadCover = {
  single: (fieldName) => {
    const cloudinaryInstance = getConfiguredCloudinary();
    const storage = createCoverStorage();
    return multer({ storage }).single(fieldName);
  }
};

// Export cloudinary for direct use
export { cloudinary };

export default {
  uploadPost,
  uploadProfile,
  uploadCover,
  cloudinary
};
