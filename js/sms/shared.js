import { escapeHtml } from '../utils/dom.js';
import { formatDisplayDate, formatDate } from '../utils/date.js';
import { SMS_VARIABLES } from '../constants/sms.js';

export function newId(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export function formatTimeDisplay(value) {
    if (!value) return '';
    const s = String(value).slice(0, 5);
    return /^\d{2}:\d{2}$/.test(s) ? s : String(value);
}

export function formatScheduledDisplay(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return y + '-' + m + '-' + day + ' ' + h + ':' + min;
}

export function toDatetimeLocalValue(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return y + '-' + m + '-' + day + 'T' + h + ':' + min;
}

export function buildVariableMap(state) {
    const today = formatDate(new Date());
    const lessonDateRaw = state.lessonDate || today;
    return {
        child_name: state.studentName || '',
        parent_phone: state.parentPhone || '',
        today_date: formatDisplayDate(today),
        lesson_date: lessonDateRaw ? formatDisplayDate(lessonDateRaw) : '',
        lesson_time: formatTimeDisplay(state.lessonTime),
    };
}

export function applyVariables(text, map) {
    let out = String(text || '');
    Object.keys(map).forEach(function (key) {
        out = out.split('{' + key + '}').join(map[key] != null ? String(map[key]) : '');
    });
    return out;
}

export function truncate(str, max) {
    const s = String(str || '').replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    return s.slice(0, max) + '…';
}

/** 줄바꿈 유지, 말줄임표만 추가 */
export function truncatePreview(str, max) {
    const s = String(str || '');
    if (s.length <= max) return s;
    return s.slice(0, max) + '…';
}

export function fetchSmsTemplates() {
    return fetch('/api/sms/templates')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data.ok) return [];
            return data.templates || [];
        })
        .catch(function () { return []; });
}

export function saveSmsTemplate({ id, name, body }) {
    const payload = { name: name, body: body };
    if (id != null && id !== '') payload.id = id;
    return fetch('/api/sms/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); });
}

export function deleteSmsTemplate(id) {
    return fetch('/api/sms/templates?id=' + encodeURIComponent(String(id)), {
        method: 'DELETE',
    }).then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); });
}

export function fetchPendingScheduled() {
    return fetch('/api/sms/history?limit=50&pendingOnly=1')
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (!data.ok) return [];
            return (data.messages || []).map(function (m) {
                return {
                    id: m.groupId || m.messageId || '',
                    groupId: m.groupId || '',
                    studentName: m.studentName || '',
                    parentPhone: m.parentPhone || '',
                    body: m.body || '',
                    scheduledAt: m.scheduledAt || m.sentAt || '',
                };
            });
        })
        .catch(function () { return []; });
}

export function createToast(toastEl) {
    let toastTimer = null;
    return function showToast(message) {
        if (!toastEl) return;
        toastEl.textContent = message;
        toastEl.classList.remove('hidden');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toastEl.classList.add('hidden');
        }, 2800);
    };
}

export function bindStudentPickers({ pickBtn, clearBtn, nameEl, idEl, phoneEl, onChange }) {
    if (pickBtn) {
        pickBtn.addEventListener('click', function () {
            StudentPicker.open(function (student) {
                if (idEl) idEl.value = String(student.id);
                if (nameEl) nameEl.value = student.name || '';
                if (phoneEl) phoneEl.value = student.parent_phone || '';
                if (typeof onChange === 'function') onChange(student);
            });
        });
    }
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (idEl) idEl.value = '';
            if (nameEl) {
                nameEl.value = '';
                nameEl.placeholder = '학생을 선택해 주세요';
            }
            if (phoneEl) phoneEl.value = '';
            if (typeof onChange === 'function') onChange(null);
        });
    }
}

export function renderVariableChips(container, bodyEl, onUpdate) {
    if (!container || !bodyEl) return;
    container.innerHTML = SMS_VARIABLES.map(function (v) {
        return '<button type="button" class="sms-var-chip rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-green-50 hover:border-green-200 hover:text-[#00a832]" data-key="' + escapeHtml(v.key) + '" title="' + escapeHtml(v.label) + '">{' + escapeHtml(v.key) + '}</button>';
    }).join('');
    bindVariableInsert(container, bodyEl, onUpdate);
}

function bindVariableInsert(container, bodyEl, onUpdate) {
    container.querySelectorAll('.sms-var-chip').forEach(function (btn) {
        btn.addEventListener('click', function () {
            insertVariableToken(bodyEl, btn.getAttribute('data-key'));
            if (typeof onUpdate === 'function') onUpdate();
        });
    });
}

export function insertVariableToken(bodyEl, key) {
    if (!bodyEl || !key) return;
    const token = '{' + key + '}';
    const start = bodyEl.selectionStart;
    const end = bodyEl.selectionEnd;
    const val = bodyEl.value;
    if (typeof start === 'number' && typeof end === 'number') {
        bodyEl.value = val.slice(0, start) + token + val.slice(end);
        bodyEl.focus();
        const pos = start + token.length;
        bodyEl.setSelectionRange(pos, pos);
    } else {
        bodyEl.value = val + token;
        bodyEl.focus();
    }
}

export function buildSampleVariableMap() {
    return buildVariableMap({
        studentName: '홍길동',
        parentPhone: '010-1234-5678',
        lessonDate: '2026-06-20',
        lessonTime: '14:00',
    });
}

export function renderTemplateOptions(selectEl, templates, selectedId) {
    if (!selectEl) return;
    selectEl.innerHTML = '<option value="">— 템플릿 선택 —</option>'
        + templates.map(function (t) {
            return '<option value="' + escapeHtml(String(t.id)) + '">' + escapeHtml(t.name) + '</option>';
        }).join('');
    if (selectedId != null && selectedId !== '' && templates.some(function (t) { return String(t.id) === String(selectedId); })) {
        selectEl.value = String(selectedId);
    }
}
