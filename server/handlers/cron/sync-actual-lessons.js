import { neon } from '@neondatabase/serverless';
import { syncActualLessonsForMonth } from '../actual-lessons.js';

/** 매월 1일 Cron: 그 달(당월) 정기 수업만 lessons 템플릿에서 생성 */
function currentCalendarMonth(from = new Date()) {
  return { year: from.getFullYear(), month: from.getMonth() + 1 };
}

export default async function handler(req, res) {
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || '';
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({ ok: false, error: 'POSTGRES_URL or DATABASE_URL is not set.' });
  }

  try {
    const sql = neon(connectionString);
    const { year, month } = currentCalendarMonth();
    const { inserted } = await syncActualLessonsForMonth(sql, year, month);
    return res.status(200).json({ ok: true, year, month, inserted });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}
