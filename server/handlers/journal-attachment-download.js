import { neon } from '@neondatabase/serverless';
import { get } from '@vercel/blob';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
  await import('dotenv/config');
}

function toInt(value) {
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

export function buildAttachmentContentDisposition(originalName) {
  const name = String(originalName || 'download').trim() || 'download';
  const encoded = encodeURIComponent(name);
  return "inline; filename*=UTF-8''" + encoded;
}

export async function loadJournalAttachmentForDownload(attachmentId) {
  const id = toInt(attachmentId);
  if (!id) {
    return { ok: false, status: 400, error: 'id is required' };
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return { ok: false, status: 503, error: 'POSTGRES_URL or DATABASE_URL is not set.' };
  }

  const sql = neon(connectionString);
  const rows = await sql`
    SELECT id, blob_pathname, original_name, mime_type, status
    FROM journal_attachments
    WHERE id = ${id}
    LIMIT 1
  `;
  const row = rows && rows[0] ? rows[0] : null;
  if (!row || row.status !== 'active') {
    return { ok: false, status: 404, error: '첨부파일을 찾을 수 없습니다.' };
  }
  if (!row.blob_pathname) {
    return { ok: false, status: 404, error: '저장 경로가 없습니다.' };
  }

  const blobResult = await get(row.blob_pathname, { access: 'private' });
  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    return { ok: false, status: 404, error: '파일을 불러오지 못했습니다.' };
  }

  const contentType = row.mime_type
    || (blobResult.blob && blobResult.blob.contentType)
    || 'application/octet-stream';

  return {
    ok: true,
    stream: blobResult.stream,
    contentType,
    originalName: row.original_name || 'download',
  };
}

export default async function handler(req, res) {
  try {
    const result = await loadJournalAttachmentForDownload(req.query && req.query.id);
    if (!result.ok) {
      return res.status(result.status).json({ ok: false, error: result.error });
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', buildAttachmentContentDisposition(result.originalName));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    result.stream.pipe(res);
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Download error' });
  }
}
