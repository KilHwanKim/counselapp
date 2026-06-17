import { SolapiMessageService } from 'solapi';

/** 하이픈 제거, 국내 010 형식 유지 */
export function normalizePhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('82') && digits.length >= 11) {
        return '0' + digits.slice(2);
    }
    return digits;
}

export function detectMessageType(text) {
    const len = Buffer.byteLength(String(text || ''), 'utf8');
    return len <= 90 ? 'sms' : 'lms';
}

function getClient() {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    if (!apiKey || !apiSecret) return null;
    return new SolapiMessageService(apiKey, apiSecret);
}

function extractGroupId(result) {
    return result?.groupInfo?.groupId ?? result?.groupId ?? null;
}

function toIsoOrNull(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * @param {Record<string, unknown>} msg
 */
export function mapSolapiMessage(msg) {
    const custom = msg.customFields && typeof msg.customFields === 'object' ? msg.customFields : {};
    const studentId = custom.studentId != null ? String(custom.studentId) : '';
    const studentName = custom.studentName != null ? String(custom.studentName) : '';

    return {
        messageId: msg.messageId != null ? String(msg.messageId) : '',
        groupId: msg.groupId != null ? String(msg.groupId) : '',
        studentId,
        studentName,
        parentPhone: msg.to != null ? String(msg.to) : '',
        fromPhone: msg.from != null ? String(msg.from) : '',
        body: msg.text != null ? String(msg.text) : '',
        messageType: msg.type != null ? String(msg.type) : '',
        status: msg.status != null ? String(msg.status) : '',
        statusCode: msg.statusCode != null ? String(msg.statusCode) : '',
        reason: msg.reason != null ? String(msg.reason) : '',
        sentAt: toIsoOrNull(msg.dateCreated),
        dateReceived: toIsoOrNull(msg.dateReceived),
        sendMode: 'immediate',
        scheduledAt: null,
        groupStatus: '',
        canCancel: false,
    };
}

function mapGroupMeta(group) {
    if (!group) {
        return { sendMode: 'immediate', scheduledAt: null, groupStatus: '', canCancel: false };
    }
    const status = group.status != null ? String(group.status) : '';
    const scheduledAt = toIsoOrNull(group.scheduledDate);
    const isScheduled = status === 'SCHEDULED' || (scheduledAt && !group.dateSent);
    return {
        sendMode: isScheduled ? 'scheduled' : 'immediate',
        scheduledAt,
        groupStatus: status,
        canCancel: status === 'SCHEDULED',
    };
}

/**
 * @param {{ to: string, from: string, text: string, customFields?: Record<string, string>, scheduledDate?: string|Date }} params
 */
export async function sendSolapiMessage({ to, from, text, customFields, scheduledDate }) {
    const client = getClient();
    if (!client) {
        return { ok: false, error: 'SOLAPI_API_KEY 또는 SOLAPI_API_SECRET이 설정되지 않았습니다.' };
    }

    const toPhone = normalizePhone(to);
    const fromPhone = normalizePhone(from);
    if (!toPhone || !fromPhone) {
        return { ok: false, error: '수신·발신 번호가 올바르지 않습니다.' };
    }
    if (!text || !String(text).trim()) {
        return { ok: false, error: '문자 내용이 비어 있습니다.' };
    }

    const messageType = detectMessageType(text);
    const payload = {
        to: toPhone,
        from: fromPhone,
        text: String(text),
    };
    if (customFields && Object.keys(customFields).length) {
        payload.customFields = customFields;
    }

    const config = scheduledDate ? { scheduledDate } : undefined;

    try {
        const result = await client.send(payload, config);
        const groupId = extractGroupId(result);
        if (!groupId) {
            return { ok: false, error: '솔라피 응답에 groupId가 없습니다.', detail: result };
        }
        return { ok: true, groupId: String(groupId), messageType };
    } catch (err) {
        const msg = err?.message || err?.errorMessage || String(err);
        return { ok: false, error: msg, detail: err };
    }
}

/**
 * @param {string} groupId
 */
export async function cancelSolapiReservation(groupId) {
    const client = getClient();
    if (!client) {
        return { ok: false, error: 'SOLAPI_API_KEY 또는 SOLAPI_API_SECRET이 설정되지 않았습니다.' };
    }
    if (!groupId) {
        return { ok: false, error: 'groupId가 필요합니다.' };
    }

    try {
        const result = await client.removeReservationToGroup(groupId);
        return { ok: true, group: result };
    } catch (err) {
        const msg = err?.message || err?.errorMessage || String(err);
        return { ok: false, error: msg, detail: err };
    }
}

/**
 * @param {Array<ReturnType<typeof mapSolapiMessage>>} messages
 */
export async function enrichMessagesWithGroups(messages) {
    const client = getClient();
    if (!client || !messages?.length) return messages || [];

    const groupIds = [...new Set(messages.map(function (m) { return m.groupId; }).filter(Boolean))];
    const groupMap = new Map();

    await Promise.all(groupIds.map(async function (groupId) {
        try {
            const group = await client.getGroup(groupId);
            groupMap.set(groupId, group);
        } catch {
            groupMap.set(groupId, null);
        }
    }));

    return messages.map(function (m) {
        const meta = mapGroupMeta(groupMap.get(m.groupId));
        return Object.assign({}, m, meta);
    });
}

/**
 * @param {{ limit?: number, startKey?: string, from?: string }} params
 */
export async function listSolapiMessages({ limit = 10, startKey, from } = {}) {
    const client = getClient();
    if (!client) {
        return { ok: false, error: 'SOLAPI_API_KEY 또는 SOLAPI_API_SECRET이 설정되지 않았습니다.' };
    }

    const query = { limit: Math.min(Math.max(limit, 1), 50) };
    if (startKey) query.startKey = startKey;
    if (from) query.from = normalizePhone(from);

    try {
        const result = await client.getMessages(query);
        const listObj = result?.messageList && typeof result.messageList === 'object' ? result.messageList : {};
        let messages = Object.values(listObj)
            .map(mapSolapiMessage)
            .sort(function (a, b) {
                const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0;
                const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0;
                return tb - ta;
            });

        messages = await enrichMessagesWithGroups(messages);

        const nextKey = result?.nextKey != null ? String(result.nextKey) : null;
        return {
            ok: true,
            messages,
            limit: result?.limit ?? query.limit,
            startKey: result?.startKey != null ? String(result.startKey) : null,
            nextKey,
            hasMore: Boolean(nextKey),
        };
    } catch (err) {
        const msg = err?.message || err?.errorMessage || String(err);
        return { ok: false, error: msg, detail: err };
    }
}
