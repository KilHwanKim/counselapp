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
    const rows = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const tables = (rows || []).map((r) => r.table_name);
    return res.status(200).json({
      ok: true,
      tables,
    });
  } catch (err) {
    return res.status(503).json({
      ok: false,
      error: err.message || 'Failed to list tables',
    });
  }
}
