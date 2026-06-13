import { neon } from '@neondatabase/serverless';
import { del } from '@vercel/blob';
import {
  JOURNAL_ATTACHMENT_MAX_BYTES,
  JOURNAL_ATTACHMENT_MAX_FILES,
  isAllowedBlobPathname,
  isAllowedJournalAttachment,
} from '../lib/journal-attachment-policy.js';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
  await import('dotenv/config');
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

function toInt(value) {
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function normalizeStr(value, maxLen) {
  const s = value == null ? '' : String(value);
  const trimmed = s.trim();
  if (!trimmed) return null;
  if (maxLen != null && trimmed.length > maxLen) return trimmed.slice(0, maxLen);
  return trimmed;
}

async function countActiveAttachments(sql, actualLessonId) {
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM journal_attachments
    WHERE actual_lesson_id = ${actualLessonId} AND status = 'active'
  `;
  return rows && rows[0] ? Number(rows[0].count) : 0;
}

async function getJournalForLesson(sql, actualLessonId) {
  const rows = await sql`
    SELECT id
    FROM lesson_journals
    WHERE actual_lesson_id = ${actualLessonId}
    LIMIT 1
  `;
  return rows && rows[0] ? rows[0] : null;
}

export async function softDeleteAttachmentsForJournal(sql, journalId) {
  if (!journalId) return;
  await sql`
    UPDATE journal_attachments
    SET status = 'deleted', deleted_at = NOW()
    WHERE journal_id = ${journalId} AND status = 'active'
  `;
}

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: 'POSTGRES_URL or DATABASE_URL is not set.' });
  }

  const sql = neon(connectionString);
  const method = (req.method || 'GET').toUpperCase();

  try {
    if (method === 'GET') {
      const actualLessonId = req.query && req.query.actual_lesson_id != null
        ? toInt(req.query.actual_lesson_id)
        : null;
      if (!actualLessonId) {
        return res.status(400).json({ ok: false, error: 'actual_lesson_id is required' });
      }

      const rows = await sql`
        SELECT id, journal_id, actual_lesson_id, blob_url, blob_pathname, original_name,
               mime_type, size_bytes, status, created_at
        FROM journal_attachments
        WHERE actual_lesson_id = ${actualLessonId} AND status = 'active'
        ORDER BY created_at ASC, id ASC
      `;
      return res.status(200).json({ ok: true, attachments: rows || [] });
    }

    if (method === 'POST') {
      const body = getBody(req);
      const actualLessonId = body.actual_lesson_id != null ? toInt(body.actual_lesson_id) : null;
      const journalId = body.journal_id != null ? toInt(body.journal_id) : null;
      const blobUrl = normalizeStr(body.blob_url, 2000);
      const blobPathname = normalizeStr(body.blob_pathname, 500);
      const originalName = normalizeStr(body.original_name, 255);
      const mimeType = normalizeStr(body.mime_type, 100);
      const sizeBytes = body.size_bytes != null ? toInt(body.size_bytes) : null;

      if (!actualLessonId || !journalId || !blobUrl || !blobPathname || !originalName || !sizeBytes) {
        return res.status(400).json({ ok: false, error: '필수 첨부 정보가 누락되었습니다.' });
      }
      if (sizeBytes <= 0 || sizeBytes > JOURNAL_ATTACHMENT_MAX_BYTES) {
        return res.status(400).json({ ok: false, error: '파일 크기가 허용 범위를 벗어났습니다.' });
      }

      const allowed = isAllowedJournalAttachment(originalName, mimeType);
      if (!allowed.ok) {
        return res.status(400).json({ ok: false, error: allowed.error });
      }
      if (!isAllowedBlobPathname(blobPathname)) {
        return res.status(400).json({ ok: false, error: '유효하지 않은 저장 경로입니다.' });
      }

      const journal = await getJournalForLesson(sql, actualLessonId);
      if (!journal || journal.id !== journalId) {
        return res.status(400).json({ ok: false, error: '일지 정보가 일치하지 않습니다.' });
      }

      const activeCount = await countActiveAttachments(sql, actualLessonId);
      if (activeCount >= JOURNAL_ATTACHMENT_MAX_FILES) {
        return res.status(400).json({ ok: false, error: `첨부파일은 최대 ${JOURNAL_ATTACHMENT_MAX_FILES}개까지 등록할 수 있습니다.` });
      }

      const rows = await sql`
        INSERT INTO journal_attachments (
          journal_id, actual_lesson_id, blob_url, blob_pathname, original_name,
          mime_type, size_bytes, status
        )
        VALUES (
          ${journalId}, ${actualLessonId}, ${blobUrl}, ${blobPathname}, ${originalName},
          ${mimeType}, ${sizeBytes}, 'active'
        )
        RETURNING id, journal_id, actual_lesson_id, blob_url, blob_pathname, original_name,
                  mime_type, size_bytes, status, created_at
      `;

      return res.status(200).json({ ok: true, attachment: rows && rows[0] ? rows[0] : null });
    }

    if (method === 'DELETE') {
      const id = req.query && req.query.id != null ? toInt(req.query.id) : null;
      if (!id) {
        return res.status(400).json({ ok: false, error: 'id is required' });
      }

      const rows = await sql`
        SELECT id, blob_pathname, status
        FROM journal_attachments
        WHERE id = ${id}
        LIMIT 1
      `;
      const row = rows && rows[0] ? rows[0] : null;
      if (!row) {
        return res.status(404).json({ ok: false, error: '첨부파일을 찾을 수 없습니다.' });
      }
      if (row.status !== 'active') {
        return res.status(400).json({ ok: false, error: '이미 삭제된 첨부파일입니다.' });
      }

      if (row.blob_pathname) {
        await del(row.blob_pathname);
      }

      await sql`
        DELETE FROM journal_attachments
        WHERE id = ${id}
      `;

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}
