import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { storageService } from '../services/storageService.js';

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageService.getUploadDirectory());
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const randomName = `${crypto.randomUUID()}${ext}`;
    cb(null, randomName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    return cb(
      new Error(`Unsupported file type. Only JPEG, PNG, WEBP, and GIF images are allowed.`),
      false
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage: diskStorage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter,
});

export const uploadSingle = (fieldName = 'image') => upload.single(fieldName);
export const uploadMultiple = (fieldName = 'images', maxCount = 5) => upload.array(fieldName, maxCount);
