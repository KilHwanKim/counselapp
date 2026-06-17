import { cancelSolapiReservation } from '../../lib/sms/solapi.js';

if (typeof process !== 'undefined' && !process.env.VERCEL) {
    await import('dotenv/config');
}

function getBody(req) {
    if (req.body && typeof req.body === 'object') return req.body;
    return {};
}

function isDryRun() {
    return process.env.SMS_DRY_RUN === 'true' || process.env.SMS_DRY_RUN === '1';
}

export default async function handler(req, res) {
    const method = (req.method || 'GET').toUpperCase();
    if (method !== 'POST' && method !== 'DELETE') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    try {
        const body = getBody(req);
        const groupId = (req.query && req.query.groupId)
            ? String(req.query.groupId).trim()
            : (body.groupId != null ? String(body.groupId).trim() : '');

        if (!groupId) {
            return res.status(400).json({ ok: false, error: 'groupId가 필요합니다.' });
        }

        if (isDryRun() || groupId.startsWith('dry-run')) {
            return res.status(200).json({ ok: true, dryRun: true, groupId });
        }

        const result = await cancelSolapiReservation(groupId);
        if (!result.ok) {
            return res.status(502).json({ ok: false, error: result.error });
        }

        return res.status(200).json({ ok: true, groupId });
    } catch (err) {
        console.error('sms cancel handler error:', err);
        return res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
    }
}
