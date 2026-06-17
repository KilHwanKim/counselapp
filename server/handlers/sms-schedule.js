import { neon } from '@neondatabase/serverless';
import {
    sendSolapiMessage,
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

export default async function handler(req, res) {
    if ((req.method || 'GET').toUpperCase() !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    try {
        const body = getBody(req);
        const studentId = body.student_id != null ? parseInt(String(body.student_id), 10) : NaN;
        const messageBody = body.body != null ? String(body.body).trim() : '';
        const scheduledAt = body.scheduled_at != null ? String(body.scheduled_at).trim() : '';

        if (!Number.isFinite(studentId) || studentId <= 0) {
            return res.status(400).json({ ok: false, error: 'student_id가 필요합니다.' });
        }
        if (!messageBody) {
            return res.status(400).json({ ok: false, error: '문자 내용이 비어 있습니다.' });
        }
        if (!scheduledAt) {
            return res.status(400).json({ ok: false, error: 'scheduled_at이 필요합니다.' });
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now()) {
            return res.status(400).json({ ok: false, error: '예약 일시는 현재 시각 이후여야 합니다.' });
        }

        const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
        if (!connectionString) {
            return res.status(503).json({ ok: false, error: 'POSTGRES_URL or DATABASE_URL is not set.' });
        }

        const sql = neon(connectionString);
        const studentRows = await sql`
            SELECT id, name, parent_phone
            FROM students
            WHERE id = ${studentId}
            LIMIT 1
        `;
        const student = studentRows && studentRows[0];
        if (!student) {
            return res.status(404).json({ ok: false, error: '학생을 찾을 수 없습니다.' });
        }

        const parentPhone = normalizePhone(student.parent_phone);
        if (!parentPhone) {
            return res.status(400).json({ ok: false, error: '부모님 전화번호가 없어 예약할 수 없습니다.' });
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
                groupId: 'dry-run-schedule-' + Date.now(),
                studentId: student.id,
                studentName: student.name,
                parentPhone,
                scheduledAt: scheduledDate.toISOString(),
                messageType: detectMessageType(messageBody),
            });
        }

        const result = await sendSolapiMessage({
            to: parentPhone,
            from: fromNumber,
            text: messageBody,
            customFields,
            scheduledDate: scheduledDate,
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
            scheduledAt: scheduledDate.toISOString(),
            messageType: result.messageType,
        });
    } catch (err) {
        console.error('sms schedule handler error:', err);
        return res.status(500).json({ ok: false, error: err.message || 'Internal server error' });
    }
}
