import { escapeHtml } from '../utils/dom.js';
import {
    createToast,
    fetchSmsTemplates,
    saveSmsTemplate,
    deleteSmsTemplate,
    renderVariableChips,
    applyVariables,
    buildSampleVariableMap,
} from '../sms/shared.js';

export function mountSmsTemplatesPage() {
    const smsTemplatesEmpty = document.getElementById('smsTemplatesEmpty');
    const smsTemplatesList = document.getElementById('smsTemplatesList');
    const smsNewTemplateBtn = document.getElementById('smsNewTemplateBtn');
    const smsTemplateModal = document.getElementById('smsTemplateModal');
    const smsTemplateModalBackdrop = document.getElementById('smsTemplateModalBackdrop');
    const smsTemplateForm = document.getElementById('smsTemplateForm');
    const smsTemplateEditId = document.getElementById('smsTemplateEditId');
    const smsTemplateModalTitle = document.getElementById('smsTemplateModalTitle');
    const smsTemplateName = document.getElementById('smsTemplateName');
    const smsTemplateBody = document.getElementById('smsTemplateBody');
    const smsTemplateCharCount = document.getElementById('smsTemplateCharCount');
    const smsTemplateVariableChips = document.getElementById('smsTemplateVariableChips');
    const smsTemplatePreview = document.getElementById('smsTemplatePreview');
    const smsTemplateModalCancel = document.getElementById('smsTemplateModalCancel');
    const smsToast = document.getElementById('smsToast');

    let templates = [];
    const showToast = createToast(smsToast);

    function updatePreviewAndCount() {
        const body = smsTemplateBody.value;
        const resolved = applyVariables(body, buildSampleVariableMap());
        if (smsTemplateCharCount) {
            smsTemplateCharCount.textContent = resolved.length + '자';
        }
        if (!smsTemplatePreview) return;
        if (!body.trim()) {
            smsTemplatePreview.textContent = '내용을 입력하면 미리보기가 표시됩니다.';
            return;
        }
        smsTemplatePreview.textContent = resolved;
    }

    function refreshTemplates() {
        return fetchSmsTemplates().then(function (list) {
            templates = list;
            renderList();
        });
    }

    function renderList() {
        if (!templates.length) {
            smsTemplatesEmpty.classList.remove('hidden');
            smsTemplatesList.classList.add('hidden');
            smsTemplatesList.innerHTML = '';
            return;
        }
        smsTemplatesEmpty.classList.add('hidden');
        smsTemplatesList.classList.remove('hidden');
        smsTemplatesList.innerHTML = templates.map(function (tpl) {
            return ''
                + '<article class="flex items-start justify-between gap-4 px-4 py-4 md:px-5 hover:bg-gray-50/80 border-b border-gray-100 last:border-b-0">'
                + '  <div class="min-w-0 flex-1">'
                + '    <h4 class="text-sm font-semibold text-gray-900">' + escapeHtml(tpl.name) + '</h4>'
                + '    <p class="mt-2 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">' + escapeHtml(tpl.body || '') + '</p>'
                + '  </div>'
                + '  <div class="flex shrink-0 gap-1.5">'
                + '    <button type="button" class="sms-tpl-edit rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-white" data-id="' + escapeHtml(String(tpl.id)) + '">수정</button>'
                + '    <button type="button" class="sms-tpl-delete rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100" data-id="' + escapeHtml(String(tpl.id)) + '">삭제</button>'
                + '  </div>'
                + '</article>';
        }).join('');

        smsTemplatesList.querySelectorAll('.sms-tpl-edit').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openModal(btn.getAttribute('data-id'));
            });
        });
        smsTemplatesList.querySelectorAll('.sms-tpl-delete').forEach(function (btn) {
            btn.addEventListener('click', function () {
                deleteTemplate(btn.getAttribute('data-id'));
            });
        });
    }

    function openModal(id) {
        const existing = id ? templates.find(function (t) { return String(t.id) === String(id); }) : null;
        smsTemplateEditId.value = existing ? String(existing.id) : '';
        smsTemplateModalTitle.textContent = existing ? '템플릿 수정' : '템플릿 추가';
        smsTemplateName.value = existing ? existing.name : '';
        smsTemplateBody.value = existing ? existing.body : '';
        updatePreviewAndCount();
        smsTemplateModal.classList.remove('hidden');
        smsTemplateName.focus();
    }

    function closeModal() {
        smsTemplateModal.classList.add('hidden');
    }

    function deleteTemplate(id) {
        const tpl = templates.find(function (t) { return String(t.id) === String(id); });
        if (!tpl) return;
        if (!window.confirm('「' + tpl.name + '」 템플릿을 삭제할까요?')) return;
        deleteSmsTemplate(id)
            .then(function ({ res, data }) {
                if (!res.ok || !data.ok) {
                    showToast(data.error || '템플릿 삭제에 실패했습니다.');
                    return;
                }
                showToast('템플릿이 삭제되었습니다.');
                return refreshTemplates();
            })
            .catch(function () {
                showToast('템플릿 삭제에 실패했습니다.');
            });
    }

    smsNewTemplateBtn.addEventListener('click', function () { openModal(null); });
    smsTemplateModalBackdrop.addEventListener('click', closeModal);
    smsTemplateModalCancel.addEventListener('click', closeModal);
    smsTemplateBody.addEventListener('input', updatePreviewAndCount);
    smsTemplateForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const name = smsTemplateName.value.trim();
        const body = smsTemplateBody.value.trim();
        if (!name || !body) return;
        const editId = smsTemplateEditId.value.trim();
        saveSmsTemplate({ id: editId || undefined, name: name, body: body })
            .then(function ({ res, data }) {
                if (!res.ok || !data.ok) {
                    showToast(data.error || '템플릿 저장에 실패했습니다.');
                    return;
                }
                closeModal();
                showToast('템플릿이 저장되었습니다.');
                return refreshTemplates();
            })
            .catch(function () {
                showToast('템플릿 저장에 실패했습니다.');
            });
    });

    renderVariableChips(smsTemplateVariableChips, smsTemplateBody, updatePreviewAndCount);
    refreshTemplates();
}
