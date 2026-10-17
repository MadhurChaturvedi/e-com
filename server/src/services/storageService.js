import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirectory = path.resolve(__dirname, '../../', env.UPLOAD_DIR);

// Ensure upload directory exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

export const storageService = {
  getUploadDirectory() {
    return uploadDirectory;
  },

  getFileUrl(req, filename) {
    if (!filename) return '';
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
    }
    const protocol = req.protocol || 'http';
    const host = req.get('host') || `localhost:${env.PORT}`;
    return `${protocol}://${host}/uploads/${filename}`;
  },

  async deleteFile(filename) {
    if (!filename) return false;
    // Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(uploadDirectory, safeFilename);

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
    } catch (error) {
      console.error(`[StorageService] Error deleting file ${safeFilename}:`, error);
    }
    return false;
  },
};
