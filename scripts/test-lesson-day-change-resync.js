/**
 * 주간 수업 요일 변경(수정) 시 미래 actual_lessons 재생성 검증.
 * node scripts/test-lesson-day-change-resync.js
 */
import 'dotenv/config';
import pg from 'pg';
import lessonsHandler from '../api/lessons.js';
import { syncActualLessonsForMonth } from '../api/actual-lessons.js';

const MARKER = '__test_lesson_dow_change__';
const T1 = '23:45';
const T2 = '23:46';

function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

async function post(body) {
  const res = mockRes();
  await lessonsHandler({ method: 'POST', body }, res);
  return res;
}

async function main() {
  const cs = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!cs) { console.error('NO_DB'); process.exit(1); }
  const pool = new pg.Pool({ connectionString: cs });
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(cs);

  try {
    let sid;
    const s = await pool.query('SELECT id FROM students WHERE name = $1', [MARKER]);
    if (s.rows[0]) sid = s.rows[0].id;
    else sid = (await pool.query('INSERT INTO students (name) VALUES ($1) RETURNING id', [MARKER])).rows[0].id;

    await pool.query('DELETE FROM actual_lessons WHERE lesson_id IN (SELECT id FROM lessons WHERE start_time IN ($1,$2))', [T1, T2]);
    await pool.query('DELETE FROM lessons WHERE start_time IN ($1,$2)', [T1, T2]);

    const fromDow = 1;
    const toDow = 2;
    const r1 = await post({ day_of_week: fromDow, start_time: T1, end_time: T2, student_id: sid });
    if (!r1.body?.ok) throw new Error('create ' + JSON.stringify(r1.body));
    const lessonId = r1.body.id;

    await syncActualLessonsForMonth(sql, new Date().getFullYear(), new Date().getMonth() + 1);
    const before = await pool.query(
      `SELECT COUNT(*)::int c FROM actual_lessons WHERE lesson_id = $1 AND lesson_date >= CURRENT_DATE`,
      [lessonId]
    );
    console.log('seeded future rows (via sync):', before.rows[0].c);

    const r2 = await post({
      day_of_week: toDow,
      start_time: T1,
      end_time: T2,
      student_id: sid,
      original_day_of_week: fromDow,
      original_start_time: T1,
    });
    if (!r2.body?.ok) throw new Error('edit ' + JSON.stringify(r2.body));

    const oldDowRows = await pool.query(
      `SELECT COUNT(*)::int c FROM actual_lessons
       WHERE lesson_id = $1 AND lesson_date >= CURRENT_DATE
         AND EXTRACT(DOW FROM lesson_date)::int = CASE WHEN $2 = 7 THEN 0 ELSE $2 END`,
      [lessonId, fromDow]
    );
    const newDowRows = await pool.query(
      `SELECT COUNT(*)::int c FROM actual_lessons
       WHERE lesson_id = $1 AND lesson_date >= CURRENT_DATE
         AND EXTRACT(DOW FROM lesson_date)::int = CASE WHEN $2 = 7 THEN 0 ELSE $2 END`,
      [lessonId, toDow]
    );
    console.log('after day change: old dow future=', oldDowRows.rows[0].c, 'new dow future=', newDowRows.rows[0].c);

    const pass = oldDowRows.rows[0].c === 0 && newDowRows.rows[0].c > 0;
    console.log(pass ? '\nPASS: 요일 변경 시 구 요일 삭제·신 요일 생성' : '\nFAIL: 요일 변경 resync');

    await pool.query('DELETE FROM actual_lessons WHERE lesson_id = $1', [lessonId]);
    await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);
    if (!pass) process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
