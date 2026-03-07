import { neon } from '@neondatabase/serverless';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
  await import('dotenv/config');
}

function getBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return {};
}

function toDateString(v) {
  if (v == null) return '';
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    return v.getFullYear() + '-' + String(v.getMonth() + 1).padStart(2, '0') + '-' + String(v.getDate()).padStart(2, '0');
  }
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
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
      const q = (req.query && req.query.q) ? String(req.query.q).trim() : '';
      let rows;
      if (q) {
        const pattern = '%' + q + '%';
        rows = await sql`
          SELECT id, name, parent_phone, birth_date, first_visit_date, reg_date, notes
          FROM students
          WHERE name ILIKE ${pattern} OR parent_phone ILIKE ${pattern} OR (notes IS NOT NULL AND notes ILIKE ${pattern})
          ORDER BY id DESC
        `;
      } else {
        rows = await sql`
          SELECT id, name, parent_phone, birth_date, first_visit_date, reg_date, notes
          FROM students
          ORDER BY id DESC
        `;
      }
      const students = (rows || []).map((r) => ({
        id: r.id,
        name: r.name,
        parent_phone: r.parent_phone || '',
        birth_date: toDateString(r.birth_date),
        first_visit_date: toDateString(r.first_visit_date),
        reg_date: toDateString(r.reg_date),
        notes: r.notes || '',
      }));
      return res.status(200).json({ ok: true, students });
    }

    if (method === 'POST') {
      const body = getBody(req);
      const name = body.name != null ? String(body.name).trim() : '';
      if (!name) return res.status(400).json({ ok: false, error: 'name is required' });
      const parent_phone = body.parent_phone != null ? String(body.parent_phone).trim() : null;
      const birth_date = body.birth_date && String(body.birth_date).trim() ? String(body.birth_date).trim() : null;
      const first_visit_date = body.first_visit_date && String(body.first_visit_date).trim() ? String(body.first_visit_date).trim() : null;
      const reg_date = body.reg_date && String(body.reg_date).trim() ? String(body.reg_date).trim() : new Date().toISOString().slice(0, 10);
      const notes = body.notes != null ? String(body.notes).trim() : null;

      const rows = await sql`
        INSERT INTO students (name, parent_phone, birth_date, first_visit_date, reg_date, notes)
        VALUES (${name}, ${parent_phone}, ${birth_date}, ${first_visit_date}, ${reg_date}, ${notes})
        RETURNING id
      `;
      const id = rows && rows[0] ? rows[0].id : null;
      return res.status(200).json({ ok: true, id });
    }

    if (method === 'PUT') {
      const idParam = req.query && req.query.id != null ? parseInt(String(req.query.id), 10) : NaN;
      if (!Number.isInteger(idParam) || idParam < 1) return res.status(400).json({ ok: false, error: 'id is required' });
      const body = getBody(req);
      const name = body.name != null ? String(body.name).trim() : '';
      if (!name) return res.status(400).json({ ok: false, error: 'name is required' });
      const parent_phone = body.parent_phone != null ? String(body.parent_phone).trim() : null;
      const birth_date = body.birth_date && String(body.birth_date).trim() ? String(body.birth_date).trim() : null;
      const first_visit_date = body.first_visit_date && String(body.first_visit_date).trim() ? String(body.first_visit_date).trim() : null;
      const reg_date = body.reg_date && String(body.reg_date).trim() ? String(body.reg_date).trim() : null;
      const notes = body.notes != null ? String(body.notes).trim() : null;

      await sql`
        UPDATE students
        SET name = ${name}, parent_phone = ${parent_phone}, birth_date = ${birth_date},
            first_visit_date = ${first_visit_date}, reg_date = ${reg_date}, notes = ${notes},
            updated_at = NOW()
        WHERE id = ${idParam}
      `;
      return res.status(200).json({ ok: true });
    }

    if (method === 'DELETE') {
      const idParam = req.query && req.query.id != null ? parseInt(String(req.query.id), 10) : NaN;
      if (!Number.isInteger(idParam) || idParam < 1) return res.status(400).json({ ok: false, error: 'id is required' });
      await sql`DELETE FROM students WHERE id = ${idParam}`;
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err) {
    return res.status(503).json({ ok: false, error: err.message || 'Database error' });
  }
}
