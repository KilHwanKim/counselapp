import {
    buildVariableMap,
    applyVariables,
    bindStudentPickers,
    createToast,
    fetchSmsTemplates,
    renderTemplateOptions,
    renderVariableChips,
} from '../sms/shared.js';
import { formatDate } from '../utils/date.js';

export function mountSmsSendPage() {
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
    const smsFormError = document.getElementById('smsFormError');
    const smsSendBtn = document.getElementById('smsSendBtn');
    const smsCopyBtn = document.getElementById('smsCopyBtn');
    const smsToast = document.getElementById('smsToast');

    let templates = [];
    let selectedStudent = null;
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

    function getResolvedBody() {
        return applyVariables(smsBody.value, buildVariableMap(getComposeState()));
    }

    function updatePreviewAndCount() {
        const map = buildVariableMap(getComposeState());
        const resolved = applyVariables(smsBody.value, map);
        smsCharCount.textContent = resolved.length + '자';
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

    function validateCompose() {
        hideFormError();
        if (!selectedStudent) {
            showFormError('학생을 선택해 주세요.');
            return false;
        }
        if (!(selectedStudent.parent_phone || '').trim()) {
            showFormError('부모님 전화번호가 없어 발송할 수 없습니다.');
            return false;
        }
        if (!smsBody.value.trim()) {
            showFormError('문자 내용을 입력해 주세요.');
            return false;
        }
        return true;
    }

    function handleSend() {
        if (!validateCompose()) return;
        const state = getComposeState();
        const resolved = getResolvedBody();
        if (!window.confirm('아래 내용으로 즉시 발송합니다.\n\n' + resolved)) {
            return;
        }
        smsSendBtn.disabled = true;
        fetch('/api/sms/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: parseInt(state.studentId, 10),
                body: resolved,
                body_template: smsBody.value,
                lesson_date: state.lessonDate || null,
                lesson_time: state.lessonTime || null,
            }),
        })
            .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
            .then(function ({ res, data }) {
                if (!res.ok || !data.ok) {
                    showFormError(data.error || '문자 발송에 실패했습니다.');
                    return;
                }
                showToast(data.dryRun ? '테스트 모드로 발송을 기록했습니다.' : '문자를 발송했습니다.');
            })
            .catch(function () {
                showFormError('문자 발송 요청 중 오류가 발생했습니다.');
            })
            .finally(function () {
                smsSendBtn.disabled = false;
            });
    }

    function copyResolvedBody() {
        const text = getResolvedBody();
        if (!text.trim()) {
            showToast('복사할 내용이 없습니다.');
            return;
        }
        navigator.clipboard.writeText(text).then(function () {
            showToast('미리보기 문구를 복사했습니다.');
        }).catch(function () {
            showToast('복사에 실패했습니다.');
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
    smsSendBtn.addEventListener('click', handleSend);
    smsCopyBtn.addEventListener('click', copyResolvedBody);

    smsLessonDate.value = formatDate(new Date());
    fetchSmsTemplates().then(function (list) {
        templates = list;
        renderTemplateOptions(smsTemplateSelect, templates);
    });
    renderVariableChips(smsVariableChips, smsBody, updatePreviewAndCount);
    updatePreviewAndCount();
}
