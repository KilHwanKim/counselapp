export const JOURNAL_ATTACHMENT_MAX_FILES = 5;
export const JOURNAL_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(['pdf', 'hwp']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
  'application/octet-stream',
]);

export function getFileExtension(filename) {
  const name = String(filename || '').trim();
  const idx = name.lastIndexOf('.');
  if (idx < 0) return '';
  return name.slice(idx + 1).toLowerCase();
}

export function isAllowedJournalAttachment(filename, mimeType) {
  const ext = getFileExtension(filename);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return { ok: false, error: 'PDF 또는 HWP 파일만 첨부할 수 있습니다.' };
  }
  const mime = String(mimeType || '').trim().toLowerCase();
  if (mime && !ALLOWED_MIME_TYPES.has(mime)) {
    return { ok: false, error: '허용되지 않은 파일 형식입니다.' };
  }
  return { ok: true };
}

export function isAllowedBlobPathname(pathname) {
  const path = String(pathname || '').trim();
  if (!path.startsWith('journals/')) return false;
  const filename = path.split('/').pop() || '';
  const ext = getFileExtension(filename);
  return ALLOWED_EXTENSIONS.has(ext);
}
