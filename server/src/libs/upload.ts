import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';

/**
 * Avatar file upload → local disk. Files are served statically from /uploads (see app.ts).
 * For production you'd swap the disk storage for object storage (S3, etc.).
 */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
const AVATAR_DIR = join(UPLOADS_DIR, 'avatars');
mkdirSync(AVATAR_DIR, { recursive: true });

/**
 * Allowlist of accepted image types → the FIXED, safe extension we store them under. The stored
 * extension is chosen from THIS map (keyed by the validated mimetype), never copied from the
 * client-supplied `originalname` — otherwise an attacker could send `Content-Type: image/png` with
 * `filename="x.html"` and get the bytes persisted as `<uuid>.html`, which express.static would then
 * serve as `text/html` and the browser would execute (stored XSS on the API origin). Note `svg` is
 * deliberately absent: SVG can carry inline script, so it is not an accepted avatar format.
 */
const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (_req, file, cb) => {
    // fileFilter runs first, so by here the mimetype is guaranteed to be in the allowlist.
    const ext = MIME_TO_EXT[file.mimetype] ?? 'png';
    cb(null, `${randomUUID()}.${ext}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (_req, file, cb) => {
    if (Object.prototype.hasOwnProperty.call(MIME_TO_EXT, file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PNG, JPEG, GIF, or WebP images are allowed'));
    }
  },
});
