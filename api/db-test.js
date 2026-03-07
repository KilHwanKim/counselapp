import { neon } from '@neondatabase/serverless';

// 로컬 개발 시 .env 로드 (Vercel 배포 환경에서는 이미 환경 변수 주입됨)
if (typeof process !== 'undefined' && !process.env.VERCEL) {
  await import('dotenv/config');
}

export default async function handler(req, res) {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    return res.status(503).json({
      ok: false,
      error: 'POSTGRES_URL or DATABASE_URL is not set.',
    });
  }
  try {
    const sql = neon(connectionString);
    const rows = await sql`SELECT NOW() as now`;
    const time = rows && rows[0] ? rows[0].now : null;
    return res.status(200).json({
      ok: true,
      message: 'Connected',
      time: time != null ? String(time) : null,
    });
  } catch (err) {
    return res.status(503).json({
      ok: false,
      error: err.message || 'Connection failed',
    });
  }
}
