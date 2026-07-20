import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(_request, _file, callback) {
    callback(null, uploadDir);
  },
  filename(_request, file, callback) {
    const safeName = file.originalname.replace(/\s+/g, '-');
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({ storage });

type StoredFileRef = {
  filename?: string;
  storedName?: string;
};

export function deleteUploadedFiles(files: StoredFileRef[] = []): void {
  for (const file of files) {
    const filename = file.filename || file.storedName;
    if (!filename) {
      continue;
    }

    const filePath = path.join(uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

export { uploadDir };
export default upload;

