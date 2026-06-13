import { neon } from '@neondatabase/serverless';

// 로컬 개발 시 .env 로드 (Vercel 배포 환경에서는 이미 환경 변수 주입됨)
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

function normalizeAmountType(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  const allowed = new Set(['basic', 'makeup', 'evaluation', 'consulting']);
  return allowed.has(v) ? v : null;
}

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: 'POSTGRES_URL or DATABASE_URL is not set.' });
  }

  const sql = neon(connectionString);
  const method = (req.method || 'GET').toUpperCase();

  try {
    const actualLessonId =
      req.query && req.query.actual_lesson_id != null
        ? toInt(req.query.actual_lesson_id)
        : (getBody(req).actual_lesson_id != null ? toInt(getBody(req).actual_lesson_id) : null);

    if (method === 'GET') {
      if (!actualLessonId) {
        return res.status(400).json({ ok: false, error: 'actual_lesson_id is required' });
      }

      const rows = await sql`
        SELECT id, actual_lesson_id, lesson_content, amount_type, lesson_time, approval_number,
               parent_consultation, homework, created_at, updated_at
        FROM lesson_journals
        WHERE actual_lesson_id = ${actualLessonId}
        LIMIT 1
      `;
      const row = rows && rows[0] ? rows[0] : null;
      return res.status(200).json({ ok: true, journal: row || null });
    }

    if (method === 'POST') {
      const body = getBody(req);
      const id = body.actual_lesson_id != null ? toInt(body.actual_lesson_id) : null;
      if (!id) {
        return res.status(400).json({ ok: false, error: 'actual_lesson_id is required' });
      }

      const payload = {
        lesson_content: normalizeStr(body.lesson_content, 20000),
        amount_type: normalizeAmountType(body.amount_type),
        lesson_time: normalizeStr(body.lesson_time, 60),
        approval_number: normalizeStr(body.approval_number, 100),
        parent_consultation: normalizeStr(body.parent_consultation, 20000),
        homework: normalizeStr(body.homework, 20000),
      };

      // Upsert: actual_lesson_id는 UNIQUE이므로 1개만 유지합니다.
      await sql`
        INSERT INTO lesson_journals (
          actual_lesson_id, lesson_content, amount_type, lesson_time, approval_number,
          parent_consultation, homework, updated_at
        )
        VALUES (
          ${id}, ${payload.lesson_content}, ${payload.amount_type}, ${payload.lesson_time}, ${payload.approval_number},
          ${payload.parent_consultation}, ${payload.homework}, NOW()
        )
        ON CONFLICT (actual_lesson_id)
        DO UPDATE SET
          lesson_content = EXCLUDED.lesson_content,
          amount_type = EXCLUDED.amount_type,
          lesson_time = EXCLUDED.lesson_time,
          approval_number = EXCLUDED.approval_number,
          parent_consultation = EXCLUDED.parent_consultation,
          homework = EXCLUDED.homework,
          updated_at = NOW()
      `;

      return res.status(200).json({ ok: true });
    }

    if (method === 'DELETE') {
      if (!actualLessonId) {
        return res.status(400).json({ ok: false, error: 'actual_lesson_id is required' });
      }

      await sql`
        DELETE FROM lesson_journals
        WHERE actual_lesson_id = ${actualLessonId}
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}

