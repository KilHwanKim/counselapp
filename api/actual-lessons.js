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

function defaultEndTime(startTime) {
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + (m || 0) + 60;
  const h2 = Math.floor(total / 60);
  const m2 = total % 60;
  return (h2 < 10 ? '0' + h2 : '' + h2) + ':' + (m2 < 10 ? '0' + m2 : '' + m2);
}

function sliceTime(value) {
  return value ? String(value).slice(0, 5) : '';
}

function mapActualLessonRow(r) {
  const fromLesson = !r.is_makeup && r.lesson_id;
  const startTime = fromLesson ? sliceTime(r.lesson_start_time) : sliceTime(r.makeup_start_time);
  const endTime = fromLesson ? sliceTime(r.lesson_end_time) : sliceTime(r.makeup_end_time);
  const studentId = fromLesson ? r.lesson_student_id : r.makeup_student_id;
  return {
    id: r.id,
    lesson_id: r.lesson_id,
    lesson_date: toDateString(r.lesson_date),
    status: r.status || 'scheduled',
    is_makeup: !!r.is_makeup,
    day_of_week: r.day_of_week,
    start_time: startTime,
    end_time: endTime,
    color: r.color || '',
    student_id: studentId,
    student_name: r.student_name || '',
    student_birth_date: toDateString(r.student_birth_date),
    created_at: r.created_at ? String(r.created_at) : '',

    journal_exists: !!r.journal_id,
    journal: r.journal_id
      ? {
          lesson_content: r.lesson_content || '',
          amount_type: r.amount_type || '',
          lesson_time: r.lesson_time || '',
          approval_number: r.approval_number || '',
          parent_consultation: r.parent_consultation || '',
          homework: r.homework || '',
          updated_at: r.journal_updated_at ? String(r.journal_updated_at) : '',
        }
      : null,
  };
}

async function findDateOverlapError(sql, lessonDate, startTime, endTimeNorm, excludeId) {
  const rows = await sql`
    SELECT al.id, al.status, al.is_makeup,
           l.start_time AS lesson_start_time, l.end_time AS lesson_end_time,
           al.start_time AS makeup_start_time, al.end_time AS makeup_end_time
    FROM actual_lessons al
    LEFT JOIN lessons l ON l.id = al.lesson_id
    WHERE al.lesson_date = ${lessonDate}
  `;
  for (const row of rows || []) {
    if (excludeId != null && row.id === excludeId) continue;
    if ((row.status || 'scheduled') === 'cancelled') continue;
    const otherStart = row.is_makeup ? sliceTime(row.makeup_start_time) : sliceTime(row.lesson_start_time);
    const otherEndRaw = row.is_makeup ? sliceTime(row.makeup_end_time) : sliceTime(row.lesson_end_time);
    const otherEndNorm = otherEndRaw || defaultEndTime(otherStart);
    if (!otherStart) continue;
    if (overlaps(startTime, endTimeNorm, otherStart, otherEndNorm)) {
      return '선택한 시간이 해당 날짜의 다른 수업과 겹칩니다.';
    }
  }
  return null;
}

/** Generate actual_lessons rows for one calendar month from recurring lessons (templates). */
export async function syncActualLessonsForMonth(sql, year, month) {
  const lastDay = new Date(year, month, 0).getDate();
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const result = await sql`
    INSERT INTO actual_lessons (lesson_id, lesson_date)
    SELECT l.id, gs.day::date
    FROM lessons l
    CROSS JOIN generate_series(${fromDate}::date, ${toDate}::date, interval '1 day') AS gs(day)
    WHERE (CASE WHEN l.day_of_week = 7 THEN 0 ELSE l.day_of_week END) = EXTRACT(DOW FROM gs.day)::int
    ON CONFLICT (lesson_id, lesson_date) DO NOTHING
    RETURNING id
  `;
  return { inserted: result?.length ?? 0 };
}

async function handleMakeupPost(sql, body, res) {
  const studentId = body.student_id != null ? parseInt(String(body.student_id), 10) : NaN;
  const lessonDate = body.lesson_date ? String(body.lesson_date).trim() : '';
  const startTime = parseTime(body.start_time);
  const endTime = body.end_time != null ? parseTime(body.end_time) : null;

  if (!Number.isInteger(studentId) || studentId < 1) {
    return res.status(400).json({ ok: false, error: 'student_id is required' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lessonDate)) {
    return res.status(400).json({ ok: false, error: 'lesson_date invalid (YYYY-MM-DD)' });
  }
  if (!startTime) {
    return res.status(400).json({ ok: false, error: 'start_time invalid (e.g. 14:00)' });
  }

  const studentRows = await sql`SELECT id FROM students WHERE id = ${studentId}`;
  if (!studentRows || studentRows.length === 0) {
    return res.status(400).json({ ok: false, error: 'student not found' });
  }

  const endTimeNorm = endTime || defaultEndTime(startTime);
  const overlapError = await findDateOverlapError(sql, lessonDate, startTime, endTimeNorm, null);
  if (overlapError) return res.status(400).json({ ok: false, error: overlapError });

  const inserted = await sql`
    INSERT INTO actual_lessons (lesson_id, lesson_date, student_id, start_time, end_time, is_makeup, status)
    VALUES (NULL, ${lessonDate}, ${studentId}, ${startTime}, ${endTime}, true, 'scheduled')
    RETURNING id
  `;
  const id = inserted && inserted[0] ? inserted[0].id : null;
  return res.status(200).json({ ok: true, id });
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
      let fromDate, toDate, targetYear, targetMonth;
      if (year != null && !Number.isNaN(year) && month != null && !Number.isNaN(month)) {
        targetYear = year;
        targetMonth = month;
        fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        toDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else {
        const now = new Date();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth() + 1;
        fromDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
        const lastDay = new Date(targetYear, targetMonth, 0).getDate();
        toDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
      await syncActualLessonsForMonth(sql, targetYear, targetMonth);
      const rows = await sql`
        SELECT al.id, al.lesson_id, al.lesson_date, al.created_at, al.status, al.is_makeup,
               l.day_of_week, l.start_time AS lesson_start_time, l.end_time AS lesson_end_time,
               l.student_id AS lesson_student_id, l.color,
               al.start_time AS makeup_start_time, al.end_time AS makeup_end_time,
               al.student_id AS makeup_student_id,
               s.name AS student_name, s.birth_date AS student_birth_date,

               lj.id AS journal_id, lj.lesson_content, lj.amount_type, lj.lesson_time,
               lj.approval_number, lj.parent_consultation, lj.homework, lj.updated_at AS journal_updated_at
        FROM actual_lessons al
        LEFT JOIN lessons l ON l.id = al.lesson_id
        LEFT JOIN students s ON s.id = COALESCE(l.student_id, al.student_id)
        LEFT JOIN lesson_journals lj ON lj.actual_lesson_id = al.id
        WHERE al.lesson_date >= ${fromDate} AND al.lesson_date <= ${toDate}
        ORDER BY al.lesson_date, COALESCE(l.start_time, to_char(al.start_time, 'HH24:MI'))
      `;
      const list = (rows || []).map(mapActualLessonRow);
      return res.status(200).json({ ok: true, actual_lessons: list });
    }

    if (method === 'POST') {
      const body = getBody(req);
      if (body.action === 'makeup' || (body.student_id != null && body.lesson_date && body.start_time)) {
        return handleMakeupPost(sql, body, res);
      }
      const now = new Date();
      const year = body.year != null && !Number.isNaN(Number(body.year)) ? Number(body.year) : now.getFullYear();
      const month = body.month != null && !Number.isNaN(Number(body.month)) ? Number(body.month) : now.getMonth() + 1;
      const { inserted } = await syncActualLessonsForMonth(sql, year, month);
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
