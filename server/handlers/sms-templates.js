import { neon } from '@neondatabase/serverless';
import { DEFAULT_SMS_TEMPLATES } from '../../js/constants/sms.js';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
    await import('dotenv/config');
}

function getBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    return {};
}

function mapRow(row) {
    return {
        id: row.id,
        name: row.name || '',
        body: row.body || '',
    };
}

async function seedDefaultTemplates(sql) {
    for (const tpl of DEFAULT_SMS_TEMPLATES) {
        await sql`
            INSERT INTO sms_templates (name, body)
            VALUES (${tpl.name}, ${tpl.body})
            ON CONFLICT (name) DO NOTHING
        `;
    }
}

async function listTemplates(sql) {
    const rows = await sql`
        SELECT id, name, body
        FROM sms_templates
        ORDER BY id ASC
    `;
    if (!rows.length) {
        await seedDefaultTemplates(sql);
        const seeded = await sql`
            SELECT id, name, body
            FROM sms_templates
            ORDER BY id ASC
        `;
        return seeded.map(mapRow);
    }
    return rows.map(mapRow);
}

export default async function handler(req, res) {
    const method = (req.method || 'GET').toUpperCase();
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!connectionString) {
        return res.status(503).json({ ok: false, error: 'POSTGRES_URL or DATABASE_URL is not set.' });
    }

    const sql = neon(connectionString);

    try {
        if (method === 'GET') {
            const templates = await listTemplates(sql);
            return res.status(200).json({ ok: true, templates });
        }

        if (method === 'POST') {
            const body = getBody(req);
            const name = body.name != null ? String(body.name).trim() : '';
            const text = body.body != null ? String(body.body).trim() : '';
            const idRaw = body.id != null ? parseInt(String(body.id), 10) : NaN;

            if (!name) {
                return res.status(400).json({ ok: false, error: '템플릿 이름이 필요합니다.' });
            }
            if (!text) {
                return res.status(400).json({ ok: false, error: '문자 내용이 필요합니다.' });
            }

            if (Number.isFinite(idRaw) && idRaw > 0) {
                const updated = await sql`
                    UPDATE sms_templates
                    SET name = ${name}, body = ${text}, updated_at = NOW()
                    WHERE id = ${idRaw}
                    RETURNING id, name, body
                `;
                if (!updated.length) {
                    return res.status(404).json({ ok: false, error: '템플릿을 찾을 수 없습니다.' });
                }
                return res.status(200).json({ ok: true, template: mapRow(updated[0]) });
            }

            const inserted = await sql`
                INSERT INTO sms_templates (name, body)
                VALUES (${name}, ${text})
                ON CONFLICT (name) DO UPDATE
                SET body = EXCLUDED.body, updated_at = NOW()
                RETURNING id, name, body
            `;
            return res.status(200).json({ ok: true, template: mapRow(inserted[0]) });
        }

        if (method === 'DELETE') {
            const idRaw = req.query && req.query.id != null ? parseInt(String(req.query.id), 10) : NaN;
            if (!Number.isFinite(idRaw) || idRaw <= 0) {
                return res.status(400).json({ ok: false, error: 'id가 필요합니다.' });
            }
            const deleted = await sql`
                DELETE FROM sms_templates
                WHERE id = ${idRaw}
                RETURNING id
            `;
            if (!deleted.length) {
                return res.status(404).json({ ok: false, error: '템플릿을 찾을 수 없습니다.' });
            }
            return res.status(200).json({ ok: true, id: idRaw });
        }

        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    } catch (err) {
        console.error('sms templates handler error:', err);
        return res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
    }
}
