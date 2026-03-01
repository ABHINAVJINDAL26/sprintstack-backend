const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const AppError = require('../utils/appError');
const { cloudinary, hasCloudinaryConfig } = require('../config/cloudinary');

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const storage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => {
    const sanitizedOriginalName = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 80);

    return {
      folder: 'sprintstack/chats',
      resource_type: 'auto',
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedOriginalName || 'file'}`,
    };
  },
});

const fileFilter = (_req, file, cb) => {
  if (!hasCloudinaryConfig) {
    cb(new AppError('Cloudinary is not configured on server. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.', 500));
    return;
  }

  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new AppError('Unsupported file type. Upload image, video, zip, or common document formats.', 400));
};

const uploadChatFiles = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024,
    files: 5,
  },
  fileFilter,
});

module.exports = {
  uploadChatFiles,
};
