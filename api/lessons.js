import { neon } from '@neondatabase/serverless';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
  await import('dotenv/config');
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

function parseTime(s) {
  const t = String(s || '').trim();
  if (!/^\d{1,2}:\d{2}$/.test(t)) return null;
  const [h, m] = t.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return (h < 10 ? '0' + h : '' + h) + ':' + (m < 10 ? '0' + m : '' + m);
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = String(t).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function overlaps(s1, e1, s2, e2) {
  const a = timeToMinutes(s1);
  const b = timeToMinutes(e1);
  const c = timeToMinutes(s2);
  const d = timeToMinutes(e2);
  return a < d && c < b;
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
      const rows = await sql`
        SELECT l.id, l.student_id, l.day_of_week, l.start_time, l.end_time, l.created_at, l.updated_at,
               s.name AS student_name
        FROM lessons l
        LEFT JOIN students s ON s.id = l.student_id
        ORDER BY l.day_of_week, l.start_time
      `;
      const lessons = (rows || []).map((r) => ({
        id: r.id,
        student_id: r.student_id,
        day_of_week: r.day_of_week,
        start_time: r.start_time ? String(r.start_time).slice(0, 5) : '',
        end_time: r.end_time ? String(r.end_time).slice(0, 5) : '',
        student_name: r.student_name || '',
        created_at: r.created_at ? String(r.created_at) : '',
        updated_at: r.updated_at ? String(r.updated_at) : '',
      }));
      return res.status(200).json({ ok: true, lessons });
    }

    if (method === 'POST') {
      const body = getBody(req);
      const dayOfWeek = body.day_of_week != null ? parseInt(String(body.day_of_week), 10) : NaN;
      const startTime = parseTime(body.start_time);
      const endTime = body.end_time != null ? parseTime(body.end_time) : null;
      const studentId = body.student_id != null ? parseInt(String(body.student_id), 10) : NaN;
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        return res.status(400).json({ ok: false, error: 'day_of_week must be 1-7' });
      }
      if (!startTime) return res.status(400).json({ ok: false, error: 'start_time invalid (e.g. 14:00)' });
      if (!Number.isInteger(studentId) || studentId < 1) {
        return res.status(400).json({ ok: false, error: 'student_id is required' });
      }

      const endTimeNorm = endTime || (() => {
        const [h, m] = startTime.split(':').map(Number);
        const total = h * 60 + (m || 0) + 60;
        const h2 = Math.floor(total / 60);
        const m2 = total % 60;
        return (h2 < 10 ? '0' + h2 : '' + h2) + ':' + (m2 < 10 ? '0' + m2 : '' + m2);
      })();

      const sameDayRows = await sql`
        SELECT start_time, end_time FROM lessons WHERE day_of_week = ${dayOfWeek}
      `;
      for (const row of sameDayRows || []) {
        const otherStart = row.start_time ? String(row.start_time).slice(0, 5) : '';
        if (otherStart === startTime) continue;
        const otherEnd = row.end_time ? String(row.end_time).slice(0, 5) : null;
        const otherEndNorm = otherEnd || (() => {
          const [h, m] = otherStart.split(':').map(Number);
          const total = h * 60 + (m || 0) + 60;
          const h2 = Math.floor(total / 60);
          const m2 = total % 60;
          return (h2 < 10 ? '0' + h2 : '' + h2) + ':' + (m2 < 10 ? '0' + m2 : '' + m2);
        })();
        if (overlaps(startTime, endTimeNorm, otherStart, otherEndNorm)) {
          return res.status(400).json({ ok: false, error: '선택한 시간이 이미 등록된 수업과 겹칩니다.' });
        }
      }

      const existing = await sql`
        SELECT id FROM lessons WHERE day_of_week = ${dayOfWeek} AND start_time = ${startTime}
      `;
      if (existing && existing.length > 0) {
        await sql`
          UPDATE lessons SET student_id = ${studentId}, end_time = ${endTime}, updated_at = NOW()
          WHERE day_of_week = ${dayOfWeek} AND start_time = ${startTime}
        `;
      } else {
        await sql`
          INSERT INTO lessons (student_id, day_of_week, start_time, end_time)
          VALUES (${studentId}, ${dayOfWeek}, ${startTime}, ${endTime})
        `;
      }
      return res.status(200).json({ ok: true });
    }

    if (method === 'DELETE') {
      const dayOfWeek = req.query && req.query.day_of_week != null ? parseInt(String(req.query.day_of_week), 10) : NaN;
      const startTime = parseTime(req.query && req.query.start_time);
      if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
        return res.status(400).json({ ok: false, error: 'day_of_week is required (1-7)' });
      }
      if (!startTime) return res.status(400).json({ ok: false, error: 'start_time is required' });
      await sql`
        DELETE FROM lessons WHERE day_of_week = ${dayOfWeek} AND start_time = ${startTime}
      `;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}
