import { escapeHtml } from '../utils/dom.js';
import {
    buildVariableMap,
    applyVariables,
    bindStudentPickers,
    createToast,
    fetchPendingScheduled,
    fetchSmsTemplates,
    renderVariableChips,
    renderTemplateOptions,
    truncatePreview,
    formatScheduledDisplay,
    toDatetimeLocalValue,
} from '../sms/shared.js';
import { formatDate } from '../utils/date.js';

export function mountSmsScheduledPage() {
    const smsStudentName = document.getElementById('smsStudentName');
    const smsStudentId = document.getElementById('smsStudentId');
    const smsParentPhone = document.getElementById('smsParentPhone');
    const smsPhoneDisplay = document.getElementById('smsPhoneDisplay');
    const smsPhoneWarning = document.getElementById('smsPhoneWarning');
    const smsTemplateSelect = document.getElementById('smsTemplateSelect');
    const smsApplyTemplate = document.getElementById('smsApplyTemplate');
    const smsLessonDate = document.getElementById('smsLessonDate');
    const smsLessonTime = document.getElementById('smsLessonTime');
    const smsBody = document.getElementById('smsBody');
    const smsCharCount = document.getElementById('smsCharCount');
    const smsVariableChips = document.getElementById('smsVariableChips');
    const smsPreview = document.getElementById('smsPreview');
    const smsScheduledAt = document.getElementById('smsScheduledAt');
    const smsFormError = document.getElementById('smsFormError');
    const smsScheduleBtn = document.getElementById('smsScheduleBtn');
    const smsScheduledCount = document.getElementById('smsScheduledCount');
    const smsScheduledEmpty = document.getElementById('smsScheduledEmpty');
    const smsScheduledList = document.getElementById('smsScheduledList');
    const smsScheduledPreviewModal = document.getElementById('smsScheduledPreviewModal');
    const smsScheduledPreviewModalBackdrop = document.getElementById('smsScheduledPreviewModalBackdrop');
    const smsScheduledPreviewModalClose = document.getElementById('smsScheduledPreviewModalClose');
    const smsScheduledPreviewModalText = document.getElementById('smsScheduledPreviewModalText');
    const smsToast = document.getElementById('smsToast');

    let templates = [];
    let scheduled = [];
    let selectedStudent = null;
    /** @type {string[]} */
    let scheduledPreviewTexts = [];
    const showToast = createToast(smsToast);

    function hideFormError() {
        smsFormError.classList.add('hidden');
        smsFormError.textContent = '';
    }

    function showFormError(msg) {
        smsFormError.textContent = msg;
        smsFormError.classList.remove('hidden');
    }

    function getComposeState() {
        return {
            studentId: smsStudentId.value || '',
            studentName: smsStudentName.value || '',
            parentPhone: smsParentPhone.value || '',
            lessonDate: smsLessonDate.value || '',
            lessonTime: smsLessonTime.value || '',
        };
    }

    function updatePreviewAndCount() {
        const map = buildVariableMap(getComposeState());
        const resolved = applyVariables(smsBody.value, map);
        smsCharCount.textContent = resolved.length + '자';
        if (!smsPreview) return;
        if (!smsBody.value.trim()) {
            smsPreview.textContent = '내용을 입력하면 미리보기가 표시됩니다.';
            return;
        }
        if (!selectedStudent) {
            smsPreview.textContent = applyVariables(smsBody.value, Object.assign({}, map, {
                child_name: '(학생 이름)',
                parent_phone: '(전화번호)',
            }));
            return;
        }
        smsPreview.textContent = resolved;
    }

    function updateStudentDisplay(student) {
        selectedStudent = student;
        if (!student) {
            smsPhoneDisplay.classList.add('hidden');
            smsPhoneWarning.classList.add('hidden');
            updatePreviewAndCount();
            return;
        }
        const phone = (student.parent_phone || '').trim();
        if (phone) {
            smsPhoneDisplay.textContent = '수신 번호: ' + phone;
            smsPhoneDisplay.classList.remove('hidden');
            smsPhoneWarning.classList.add('hidden');
        } else {
            smsPhoneDisplay.classList.add('hidden');
            smsPhoneWarning.classList.remove('hidden');
        }
        updatePreviewAndCount();
    }

    function getResolvedBody(state) {
        return applyVariables(smsBody.value, buildVariableMap(state || getComposeState()));
    }

    function openScheduledPreviewModal(index) {
        const text = scheduledPreviewTexts[index];
        if (!text || !smsScheduledPreviewModal || !smsScheduledPreviewModalText) return;
        smsScheduledPreviewModalText.textContent = text;
        smsScheduledPreviewModal.classList.remove('hidden');
    }

    function closeScheduledPreviewModal() {
        if (smsScheduledPreviewModal) smsScheduledPreviewModal.classList.add('hidden');
    }

    function refreshScheduledList() {
        return fetchPendingScheduled().then(function (list) {
            scheduled = list;
            renderScheduledList();
        });
    }

    function renderScheduledList() {
        smsScheduledCount.textContent = scheduled.length + '건';
        if (!scheduled.length) {
            smsScheduledEmpty.classList.remove('hidden');
            smsScheduledList.classList.add('hidden');
            smsScheduledList.innerHTML = '';
            scheduledPreviewTexts = [];
            return;
        }
        smsScheduledEmpty.classList.add('hidden');
        smsScheduledList.classList.remove('hidden');
        smsScheduledList.innerHTML = scheduled.map(function (item, index) {
            const previewFull = item.body || '';
            const preview = truncatePreview(previewFull, 56);
            return ''
                + '<article class="px-4 py-4 md:px-5 hover:bg-gray-50/80" data-id="' + escapeHtml(item.id) + '">'
                + '  <div class="flex items-start justify-between gap-3">'
                + '    <div class="min-w-0 flex-1">'
                + '      <div class="flex flex-wrap items-center gap-2">'
                + '        <span class="font-semibold text-gray-900 text-sm">' + escapeHtml(item.studentName || '(학생 없음)') + '</span>'
                + '        <span class="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">예약</span>'
                + '      </div>'
                + '      <p class="mt-1 text-xs text-gray-500">' + escapeHtml(formatScheduledDisplay(item.scheduledAt)) + '</p>'
                + '      <button type="button" class="sms-scheduled-preview-btn mt-2 block w-full text-left text-sm text-gray-700 hover:text-[#00a832]" data-index="' + index + '" title="클릭하면 전체 내용을 볼 수 있습니다">'
                + '        <span class="line-clamp-2 whitespace-pre-wrap break-words">' + escapeHtml(preview) + '</span>'
                + '      </button>'
                + '    </div>'
                + '    <div class="flex shrink-0 gap-1.5">'
                + '      <button type="button" class="sms-delete-btn rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100" data-id="' + escapeHtml(item.id) + '">삭제</button>'
                + '    </div>'
                + '  </div>'
                + '</article>';
        }).join('');

        scheduledPreviewTexts = scheduled.map(function (item) { return item.body || ''; });

        smsScheduledList.querySelectorAll('.sms-scheduled-preview-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                if (Number.isFinite(index)) openScheduledPreviewModal(index);
            });
        });

        smsScheduledList.querySelectorAll('.sms-delete-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteScheduled(btn.getAttribute('data-id'));
            });
        });
    }

    function validateCompose() {
        hideFormError();
        if (!selectedStudent) {
            showFormError('학생을 선택해 주세요.');
            return false;
        }
        if (!(selectedStudent.parent_phone || '').trim()) {
            showFormError('부모님 전화번호가 없어 예약할 수 없습니다.');
            return false;
        }
        if (!smsBody.value.trim()) {
            showFormError('문자 내용을 입력해 주세요.');
            return false;
        }
        if (!smsScheduledAt.value) {
            showFormError('예약 일시를 선택해 주세요.');
            return false;
        }
        const at = new Date(smsScheduledAt.value);
        if (isNaN(at.getTime()) || at.getTime() <= Date.now()) {
            showFormError('예약 일시는 현재 시각 이후여야 합니다.');
            return false;
        }
        return true;
    }

    function handleSchedule() {
        if (!validateCompose()) return;
        const state = getComposeState();
        const resolvedBody = getResolvedBody(state);
        const scheduledAtIso = new Date(smsScheduledAt.value).toISOString();

        smsScheduleBtn.disabled = true;

        fetch('/api/sms/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: parseInt(state.studentId, 10),
                body: resolvedBody,
                scheduled_at: scheduledAtIso,
            }),
        })
            .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
            .then(function ({ res, data }) {
                smsScheduleBtn.disabled = false;
                if (!res.ok || !data.ok) {
                    showFormError(data.error || '예약 등록에 실패했습니다.');
                    return;
                }
                showToast('예약이 등록되었습니다. 발송 내역에서 확인·취소할 수 있습니다.');
                const d = new Date(Date.now() + 60 * 60 * 1000);
                smsScheduledAt.value = toDatetimeLocalValue(d.toISOString());
                return refreshScheduledList();
            })
            .catch(function () {
                smsScheduleBtn.disabled = false;
                showFormError('예약 등록에 실패했습니다.');
            });
    }

    function deleteScheduled(id) {
        const item = scheduled.find(function (x) { return String(x.id) === String(id); });
        if (!item) return;
        if (!window.confirm('「' + (item.studentName || '학생') + '」 예약 문자를 삭제할까요?')) return;

        if (!item.groupId) {
            showToast('예약 정보를 찾을 수 없습니다.');
            return;
        }

        fetch('/api/sms/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: item.groupId }),
        })
            .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
            .then(function ({ res, data }) {
                if (!res.ok || !data.ok) {
                    showToast(data.error || '예약 취소에 실패했습니다.');
                    return;
                }
                showToast('예약이 삭제되었습니다.');
                return refreshScheduledList();
            })
            .catch(function () {
                showToast('예약 취소에 실패했습니다.');
            });
    }

    bindStudentPickers({
        pickBtn: document.getElementById('smsPickStudent'),
        clearBtn: document.getElementById('smsClearStudent'),
        nameEl: smsStudentName,
        idEl: smsStudentId,
        phoneEl: smsParentPhone,
        onChange: updateStudentDisplay,
    });

    smsApplyTemplate.addEventListener('click', function () {
        const id = smsTemplateSelect.value;
        if (!id) {
            showToast('템플릿을 선택해 주세요.');
            return;
        }
        const tpl = templates.find(function (t) { return String(t.id) === String(id); });
        if (!tpl) return;
        smsBody.value = tpl.body;
        updatePreviewAndCount();
        showToast('「' + tpl.name + '」 템플릿을 적용했습니다.');
    });

    smsTemplateSelect.addEventListener('change', function () {
        const id = smsTemplateSelect.value;
        if (!id) return;
        const tpl = templates.find(function (t) { return String(t.id) === String(id); });
        if (tpl) {
            smsBody.value = tpl.body;
            updatePreviewAndCount();
        }
    });

    smsBody.addEventListener('input', updatePreviewAndCount);
    smsLessonDate.addEventListener('change', updatePreviewAndCount);
    smsLessonTime.addEventListener('change', updatePreviewAndCount);
    smsScheduleBtn.addEventListener('click', handleSchedule);

    if (smsScheduledPreviewModalBackdrop) {
        smsScheduledPreviewModalBackdrop.addEventListener('click', closeScheduledPreviewModal);
    }
    if (smsScheduledPreviewModalClose) {
        smsScheduledPreviewModalClose.addEventListener('click', closeScheduledPreviewModal);
    }

    smsLessonDate.value = formatDate(new Date());
    const defaultSchedule = new Date(Date.now() + 60 * 60 * 1000);
    smsScheduledAt.value = toDatetimeLocalValue(defaultSchedule.toISOString());
    fetchSmsTemplates().then(function (list) {
        templates = list;
        renderTemplateOptions(smsTemplateSelect, templates);
    });
    renderVariableChips(smsVariableChips, smsBody, updatePreviewAndCount);
    refreshScheduledList();
    updatePreviewAndCount();
}
