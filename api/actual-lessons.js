import { neon } from '@neondatabase/serverless';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
  await import('dotenv/config');
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

function toDateString(value) {
  if (value == null) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
  }
  const s = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
}

function parseStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  if (status === 'cancelled') return 'cancelled';
  return 'scheduled';
}

// day_of_week: 1=Mon .. 7=Sun (DB). JS getDay(): 0=Sun, 1=Mon, .. 6=Sat
function toJsDay(dayOfWeek) {
  return dayOfWeek === 7 ? 0 : dayOfWeek;
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
      const year = req.query && req.query.year != null ? parseInt(String(req.query.year), 10) : null;
      const month = req.query && req.query.month != null ? parseInt(String(req.query.month), 10) : null;
      let fromDate, toDate;
      if (year != null && !Number.isNaN(year) && month != null && !Number.isNaN(month)) {
        fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else {
        const now = new Date();
        fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        toDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
      const rows = await sql`
        SELECT al.id, al.lesson_id, al.lesson_date, al.created_at, al.status,
               l.day_of_week, l.start_time, l.end_time, l.student_id, l.color,
               s.name AS student_name, s.birth_date AS student_birth_date
        FROM actual_lessons al
        JOIN lessons l ON l.id = al.lesson_id
        LEFT JOIN students s ON s.id = l.student_id
        WHERE al.lesson_date >= ${fromDate} AND al.lesson_date <= ${toDate}
        ORDER BY al.lesson_date, l.start_time
      `;
      const list = (rows || []).map((r) => ({
        id: r.id,
        lesson_id: r.lesson_id,
        lesson_date: toDateString(r.lesson_date),
        status: r.status || 'scheduled',
        day_of_week: r.day_of_week,
        start_time: r.start_time ? String(r.start_time).slice(0, 5) : '',
        end_time: r.end_time ? String(r.end_time).slice(0, 5) : '',
        color: r.color || '',
        student_id: r.student_id,
        student_name: r.student_name || '',
        student_birth_date: toDateString(r.student_birth_date),
        created_at: r.created_at ? String(r.created_at) : '',
      }));
      return res.status(200).json({ ok: true, actual_lessons: list });
    }

    if (method === 'POST') {
      const body = getBody(req);
      const now = new Date();
      const year = body.year != null && !Number.isNaN(Number(body.year)) ? Number(body.year) : now.getFullYear();
      const month = body.month != null && !Number.isNaN(Number(body.month)) ? Number(body.month) : now.getMonth() + 1;
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0).getDate();

      const lessons = await sql`
        SELECT id, day_of_week FROM lessons
      `;
      let inserted = 0;
      for (const lesson of lessons || []) {
        const targetDow = toJsDay(lesson.day_of_week);
        for (let d = 1; d <= lastDay; d++) {
          const date = new Date(year, month - 1, d);
          if (date.getDay() !== targetDow) continue;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const result = await sql`
            INSERT INTO actual_lessons (lesson_id, lesson_date)
            VALUES (${lesson.id}, ${dateStr})
            ON CONFLICT (lesson_id, lesson_date) DO NOTHING
            RETURNING id
          `;
          if (result && result.length > 0) inserted += result.length;
        }
      }
      return res.status(200).json({ ok: true, inserted });
    }

    if (method === 'PATCH') {
      const body = getBody(req);
      const idParam = req.query && req.query.id != null ? parseInt(String(req.query.id), 10) : NaN;
      const dateParam = req.query && req.query.date ? String(req.query.date).trim() : '';
      const status = parseStatus(body.status);

      if (Number.isInteger(idParam) && idParam > 0) {
        await sql`
          UPDATE actual_lessons
          SET status = ${status}
          WHERE id = ${idParam}
        `;
        return res.status(200).json({ ok: true });
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        await sql`
          UPDATE actual_lessons
          SET status = ${status}
          WHERE lesson_date = ${dateParam}
        `;
        return res.status(200).json({ ok: true });
      }

      return res.status(400).json({ ok: false, error: 'id or date (YYYY-MM-DD) is required' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}
