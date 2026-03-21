import { neon } from '@neondatabase/serverless';
import { syncActualLessonsForMonth } from '../actual-lessons.js';

function nextCalendarMonth(from = new Date()) {
  const y = from.getFullYear();
  const m = from.getMonth();
  const next = new Date(y, m + 1, 1);
  return { year: next.getFullYear(), month: next.getMonth() + 1 };
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
    const { year, month } = nextCalendarMonth();
    const { inserted } = await syncActualLessonsForMonth(sql, year, month);
    return res.status(200).json({ ok: true, year, month, inserted });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}
