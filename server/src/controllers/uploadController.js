import { storageService } from '../services/storageService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const uploadSingleImage = (req, res) => {
  if (!req.file) {
    return errorResponse(res, 'No image file uploaded.', 400);
  }

  const fileUrl = storageService.getFileUrl(req, req.file.filename);
  return successResponse(
    res,
    {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
    'Image uploaded successfully.',
    201
  );
};

export const uploadMultipleImages = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return errorResponse(res, 'No image files uploaded.', 400);
  }

  const files = req.files.map(file => ({
    url: storageService.getFileUrl(req, file.filename),
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  }));

  return successResponse(
    res,
    { files, urls: files.map(f => f.url) },
    'Images uploaded successfully.',
    201
  );
};
