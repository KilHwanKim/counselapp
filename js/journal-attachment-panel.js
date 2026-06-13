import { escapeHtml } from './utils/dom.js';
import { uploadAndRegisterJournalAttachments } from './journal-attachment-upload.js';

const DEFAULT_MAX_FILES = 5;
const DEFAULT_MAX_BYTES = 20 * 1024 * 1024;
const DEFAULT_ACCEPT = '.pdf,.hwp,application/pdf,application/x-hwp,application/haansofthwp,application/vnd.hancom.hwp';

function formatFileSize(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / (1024 * 1024)).toFixed(1) + ' MB';
}

function uid() {
    return 'ja-' + Math.random().toString(36).slice(2, 11);
}

function getFileExtension(filename) {
    const name = String(filename || '').trim();
    const idx = name.lastIndexOf('.');
    if (idx < 0) return '';
    return name.slice(idx + 1).toLowerCase();
}

function attachmentDownloadUrl(attachmentId) {
    return '/api/journal-attachments/download?id=' + encodeURIComponent(String(attachmentId));
}

function isAllowedFile(file) {
    const ext = getFileExtension(file && file.name);
    if (ext !== 'pdf' && ext !== 'hwp') {
        return 'PDF 또는 HWP 파일만 첨부할 수 있습니다.';
    }
    return '';
}

export function mountJournalAttachmentPanel(container, options) {
    if (!container) {
        throw new Error('mountJournalAttachmentPanel: container is required');
    }

    const opts = options || {};
    const maxFiles = opts.maxFiles != null ? Number(opts.maxFiles) : DEFAULT_MAX_FILES;
    const maxSizeBytes = opts.maxSizeBytes != null ? Number(opts.maxSizeBytes) : DEFAULT_MAX_BYTES;
    const accept = opts.accept != null ? String(opts.accept) : DEFAULT_ACCEPT;
    const onError = typeof opts.onError === 'function' ? opts.onError : null;

    let actualLessonId = opts.actualLessonId != null ? Number(opts.actualLessonId) : null;
    let existing = [];
    let pending = [];
    let loading = false;

    const instanceId = uid();
    const existingListId = instanceId + '-existing';
    const pendingListId = instanceId + '-pending';
    const errorId = instanceId + '-error';
    const inputId = instanceId + '-input';
    const summaryId = instanceId + '-summary';
    const pickBtnId = instanceId + '-pick';

    container.innerHTML =
        '<div class="journal-attachment-panel space-y-3" data-panel-id="' + escapeHtml(instanceId) + '">'
        + '  <div>'
        + '    <p class="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">저장된 첨부</p>'
        + '    <ul id="' + escapeHtml(existingListId) + '" class="mt-2 space-y-2"></ul>'
        + '  </div>'
        + '  <div class="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-4">'
        + '    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">'
        + '      <div class="min-w-0 flex-1">'
        + '        <p class="text-sm font-medium text-gray-700">새 파일 추가</p>'
        + '        <p id="' + escapeHtml(summaryId) + '" class="mt-1 truncate text-sm text-gray-500">추가할 파일 없음</p>'
        + '      </div>'
        + '      <label id="' + escapeHtml(pickBtnId) + '" class="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">'
        + '        파일 추가'
        + '        <input type="file" id="' + escapeHtml(inputId) + '" class="hidden" multiple>'
        + '      </label>'
        + '    </div>'
        + '    <ul id="' + escapeHtml(pendingListId) + '" class="mt-3 hidden space-y-2"></ul>'
        + '  </div>'
        + '  <p id="' + escapeHtml(errorId) + '" class="hidden text-xs text-red-600"></p>'
        + '  <p class="text-xs text-gray-400">PDF·HWP, 파일당 최대 ' + escapeHtml(formatFileSize(maxSizeBytes)) + ', 일지당 최대 ' + escapeHtml(String(maxFiles)) + '개</p>'
        + '</div>';

    const existingListEl = container.querySelector('#' + existingListId);
    const pendingListEl = container.querySelector('#' + pendingListId);
    const errorEl = container.querySelector('#' + errorId);
    const inputEl = container.querySelector('#' + inputId);
    const summaryEl = container.querySelector('#' + summaryId);
    const pickLabel = container.querySelector('#' + pickBtnId);

    if (accept) inputEl.setAttribute('accept', accept);

    function showError(msg) {
        if (!errorEl) return;
        if (!msg) {
            errorEl.textContent = '';
            errorEl.classList.add('hidden');
            return;
        }
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        if (onError) onError(msg);
    }

    function totalCount() {
        return existing.length + pending.length;
    }

    function remainingSlots() {
        return Math.max(0, maxFiles - totalCount());
    }

    function updatePickDisabled() {
        const atMax = remainingSlots() <= 0;
        if (inputEl) inputEl.disabled = loading || atMax;
        if (pickLabel) {
            pickLabel.classList.toggle('opacity-50', loading || atMax);
            pickLabel.classList.toggle('pointer-events-none', loading || atMax);
            pickLabel.classList.toggle('cursor-not-allowed', loading || atMax);
        }
    }

    function renderExisting() {
        if (!existingListEl) return;

        if (!existing.length) {
            existingListEl.innerHTML = '<li class="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-500">저장된 첨부파일이 없습니다.</li>';
            updatePickDisabled();
            return;
        }

        existingListEl.innerHTML = existing.map((item) => {
            return '<li class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5" data-existing-id="' + escapeHtml(String(item.id)) + '">'
                + '<span class="shrink-0 text-lg" aria-hidden="true">📎</span>'
                + '<div class="min-w-0 flex-1">'
                + '  <a href="' + escapeHtml(attachmentDownloadUrl(item.id)) + '" target="_blank" rel="noopener noreferrer" class="truncate text-sm font-medium text-[#00a832] hover:underline">' + escapeHtml(item.original_name || '이름 없음') + '</a>'
                + '  <p class="text-xs text-gray-500">' + escapeHtml(formatFileSize(item.size_bytes)) + '</p>'
                + '</div>'
                + '<button type="button" class="journal-attachment-delete shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700" data-delete-id="' + escapeHtml(String(item.id)) + '">삭제</button>'
                + '</li>';
        }).join('');

        existingListEl.querySelectorAll('.journal-attachment-delete').forEach((btn) => {
            btn.addEventListener('click', async () => {
                if (loading) return;
                const deleteId = btn.getAttribute('data-delete-id');
                if (!deleteId) return;
                if (!window.confirm('이 첨부파일을 삭제할까요? 저장소에서도 제거됩니다.')) return;

                loading = true;
                updatePickDisabled();
                showError('');
                try {
                    const res = await fetch('/api/journal-attachments?id=' + encodeURIComponent(deleteId), { method: 'DELETE' });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data.ok) throw new Error(data.error || '첨부파일 삭제 실패');
                    existing = existing.filter((item) => String(item.id) !== String(deleteId));
                    renderExisting();
                    renderPending();
                } catch (err) {
                    showError(err.message || '첨부파일 삭제 실패');
                } finally {
                    loading = false;
                    updatePickDisabled();
                }
            });
        });

        updatePickDisabled();
    }

    function renderPending() {
        if (!pendingListEl || !summaryEl) return;

        if (!pending.length) {
            pendingListEl.innerHTML = '';
            pendingListEl.classList.add('hidden');
            summaryEl.textContent = '추가할 파일 없음';
            updatePickDisabled();
            return;
        }

        pendingListEl.classList.remove('hidden');
        summaryEl.textContent = pending.length + '개 파일 추가 예정';
        pendingListEl.innerHTML = pending.map((item) => {
            const f = item.file;
            return '<li class="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5" data-pending-id="' + escapeHtml(item.id) + '">'
                + '<span class="shrink-0 text-lg" aria-hidden="true">📝</span>'
                + '<div class="min-w-0 flex-1">'
                + '  <p class="truncate text-sm font-medium text-gray-800">' + escapeHtml(f.name || '이름 없음') + '</p>'
                + '  <p class="text-xs text-gray-500">' + escapeHtml(formatFileSize(f.size)) + ' · 저장 시 업로드</p>'
                + '</div>'
                + '<button type="button" class="journal-attachment-pending-remove shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700" data-remove-id="' + escapeHtml(item.id) + '">제거</button>'
                + '</li>';
        }).join('');

        pendingListEl.querySelectorAll('.journal-attachment-pending-remove').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (loading) return;
                const removeId = btn.getAttribute('data-remove-id');
                pending = pending.filter((item) => item.id !== removeId);
                showError('');
                renderPending();
            });
        });

        updatePickDisabled();
    }

    function addPendingFiles(fileList) {
        if (!fileList || !fileList.length) return;
        showError('');

        for (let i = 0; i < fileList.length; i += 1) {
            const file = fileList[i];
            if (!file) continue;

            if (remainingSlots() <= 0) {
                showError('첨부파일은 최대 ' + maxFiles + '개까지 등록할 수 있습니다.');
                break;
            }

            const typeError = isAllowedFile(file);
            if (typeError) {
                showError(typeError);
                continue;
            }

            if (file.size > maxSizeBytes) {
                showError('"' + (file.name || '파일') + '"은(는) 크기 제한을 초과했습니다.');
                continue;
            }

            const duplicate = pending.some((item) =>
                item.file.name === file.name
                && item.file.size === file.size
                && item.file.lastModified === file.lastModified
            );
            if (duplicate) continue;

            pending.push({ id: uid(), file });
        }

        renderPending();
    }

    inputEl.addEventListener('change', () => {
        addPendingFiles(inputEl.files);
        inputEl.value = '';
    });

    const api = {
        setActualLessonId(value) {
            actualLessonId = value != null ? Number(value) : null;
        },
        async load() {
            if (!actualLessonId) {
                existing = [];
                renderExisting();
                return;
            }

            loading = true;
            updatePickDisabled();
            showError('');
            try {
                const res = await fetch('/api/journal-attachments?actual_lesson_id=' + encodeURIComponent(String(actualLessonId)));
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.ok) throw new Error(data.error || '첨부파일 목록을 불러오지 못했습니다.');
                existing = data.attachments || [];
                renderExisting();
                renderPending();
            } catch (err) {
                existing = [];
                renderExisting();
                showError(err.message || '첨부파일 목록을 불러오지 못했습니다.');
            } finally {
                loading = false;
                updatePickDisabled();
            }
        },
        getNewFiles() {
            return pending.map((item) => item.file);
        },
        hasPendingFiles() {
            return pending.length > 0;
        },
        hasAnyAttachments() {
            return existing.length > 0 || pending.length > 0;
        },
        clearPending() {
            pending = [];
            renderPending();
        },
        async uploadPending({ journalId, actualLessonId: lessonId }) {
            const files = pending.map((item) => item.file);
            if (!files.length) return [];
            const targetLessonId = lessonId != null ? Number(lessonId) : actualLessonId;
            if (!journalId || !targetLessonId) {
                throw new Error('일지 저장 후 첨부파일을 업로드할 수 있습니다.');
            }
            if (existing.length + files.length > maxFiles) {
                throw new Error('첨부파일은 최대 ' + maxFiles + '개까지 등록할 수 있습니다.');
            }

            loading = true;
            updatePickDisabled();
            try {
                const uploaded = await uploadAndRegisterJournalAttachments({
                    journalId,
                    actualLessonId: targetLessonId,
                    files,
                });
                pending = [];
                existing = existing.concat(uploaded);
                renderExisting();
                renderPending();
                return uploaded;
            } finally {
                loading = false;
                updatePickDisabled();
            }
        },
        destroy() {
            container.innerHTML = '';
            existing = [];
            pending = [];
        },
    };

    renderExisting();
    renderPending();
    return api;
}
