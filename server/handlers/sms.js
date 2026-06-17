import { neon } from '@neondatabase/serverless';
import {
    sendSolapiMessage,
    listSolapiMessages,
    cancelSolapiReservation,
    normalizePhone,
    detectMessageType,
} from '../../lib/sms/solapi.js';

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

function enrichStudentNames(messages, students) {
    const byPhone = new Map();
    (students || []).forEach(function (s) {
        const phone = normalizePhone(s.parent_phone);
        if (phone && !byPhone.has(phone)) {
            byPhone.set(phone, { id: String(s.id), name: s.name || '' });
        }
    });

    return (messages || []).map(function (m) {
        if (m.studentName) return m;
        const hit = byPhone.get(normalizePhone(m.parentPhone));
        if (!hit) return m;
        return Object.assign({}, m, {
            studentId: m.studentId || hit.id,
            studentName: hit.name,
        });
    });
}

async function loadStudent(sql, studentId) {
    const studentRows = await sql`
        SELECT id, name, parent_phone
        FROM students
        WHERE id = ${studentId}
        LIMIT 1
    `;
    return studentRows && studentRows[0];
}

export default async function handler(req, res) {
    const method = (req.method || 'GET').toUpperCase();

    try {
        if (method === 'GET') {
            const limitRaw = req.query && req.query.limit != null ? parseInt(String(req.query.limit), 10) : 10;
            const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 10;
            const startKey = req.query && req.query.startKey ? String(req.query.startKey).trim() : '';
            const fromNumber = normalizePhone(process.env.SMS_FROM_NUMBER);

            const result = await listSolapiMessages({
                limit,
                startKey: startKey || undefined,
                from: fromNumber || undefined,
            });

            if (!result.ok) {
                return res.status(502).json({ ok: false, error: result.error });
            }

            let messages = result.messages;

            const pendingOnly = req.query && (req.query.pendingOnly === '1' || req.query.pendingOnly === 'true');
            if (pendingOnly) {
                messages = messages.filter(function (m) { return m.canCancel; });
            }

            const needsFallback = messages.some(function (m) { return !m.studentName; });
            if (needsFallback) {
                const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
                if (connectionString) {
                    const sql = neon(connectionString);
                    const rows = await sql`SELECT id, name, parent_phone FROM students`;
                    messages = enrichStudentNames(messages, rows);
                }
            }

            return res.status(200).json({
                ok: true,
                messages,
                limit: result.limit,
                startKey: result.startKey,
                nextKey: result.nextKey,
                hasMore: result.hasMore,
            });
        }

        if (method === 'POST') {
            const body = getBody(req);
            const studentId = body.student_id != null ? parseInt(String(body.student_id), 10) : NaN;
            const messageBody = body.body != null ? String(body.body).trim() : '';

            if (!Number.isFinite(studentId) || studentId <= 0) {
                return res.status(400).json({ ok: false, error: 'student_id가 필요합니다.' });
            }
            if (!messageBody) {
                return res.status(400).json({ ok: false, error: '문자 내용이 비어 있습니다.' });
            }

            const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
            if (!connectionString) {
                return res.status(503).json({ ok: false, error: 'POSTGRES_URL or DATABASE_URL is not set.' });
            }

            const sql = neon(connectionString);
            const student = await loadStudent(sql, studentId);
            if (!student) {
                return res.status(404).json({ ok: false, error: '학생을 찾을 수 없습니다.' });
            }

            const parentPhone = normalizePhone(student.parent_phone);
            if (!parentPhone) {
                return res.status(400).json({ ok: false, error: '부모님 전화번호가 없어 발송할 수 없습니다.' });
            }

            const fromNumber = normalizePhone(process.env.SMS_FROM_NUMBER);
            const dryRun = isDryRun();
            if (!dryRun && !fromNumber) {
                return res.status(503).json({ ok: false, error: 'SMS_FROM_NUMBER가 설정되지 않았습니다.' });
            }

            const customFields = {
                studentId: String(student.id),
                studentName: String(student.name || ''),
            };

            if (dryRun) {
                return res.status(200).json({
                    ok: true,
                    dryRun: true,
                    groupId: 'dry-run-' + Date.now(),
                    studentId: student.id,
                    studentName: student.name,
                    parentPhone,
                    messageType: detectMessageType(messageBody),
                });
            }

            const result = await sendSolapiMessage({
                to: parentPhone,
                from: fromNumber,
                text: messageBody,
                customFields,
            });

            if (!result.ok) {
                return res.status(502).json({ ok: false, error: result.error });
            }

            return res.status(200).json({
                ok: true,
                dryRun: false,
                groupId: result.groupId,
                studentId: student.id,
                studentName: student.name,
                parentPhone,
                messageType: result.messageType,
            });
        }

        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    } catch (err) {
        console.error('sms handler error:', err);
        return res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
    }
}
