/**
 * 공통 다중 파일 첨부 UI. 여러 페이지·폼에서 재사용.
 *
 * 사용법:
 *   var att = FileAttachment.mount(document.getElementById('attach-root'), {
 *     label: '첨부파일',
 *     hint: '저장 API 연동 전 UI 테스트용',
 *     accept: 'image/*,.pdf',
 *     maxFiles: 10,
 *     maxSizeBytes: 10 * 1024 * 1024,
 *     onChange: function (files) { console.log(files); }
 *   });
 *   att.getFiles();  // File[]
 *   att.clear();
 *   att.destroy();
 */
(function () {
    function escapeHtml(str) {
        if (str == null) return '';
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function formatFileSize(bytes) {
        var n = Number(bytes) || 0;
        if (n < 1024) return n + ' B';
        if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
        return (n / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function uid() {
        return 'fa-' + Math.random().toString(36).slice(2, 11);
    }

    function defaultEmptyText() {
        return '선택된 파일 없음';
    }

    window.FileAttachment = {
        /**
         * @param {HTMLElement} container
         * @param {Object} [options]
         * @returns {{ getFiles: Function, getItems: Function, clear: Function, destroy: Function, setDisabled: Function }}
         */
        mount: function (container, options) {
            if (!container) {
                throw new Error('FileAttachment.mount: container is required');
            }

            var opts = options || {};
            var instanceId = uid();
            var items = [];
            var disabled = !!opts.disabled;
            var accept = opts.accept != null ? String(opts.accept) : '';
            var maxFiles = opts.maxFiles != null ? Number(opts.maxFiles) : null;
            var maxSizeBytes = opts.maxSizeBytes != null ? Number(opts.maxSizeBytes) : null;
            var label = opts.label != null ? String(opts.label) : '첨부파일';
            var hint = opts.hint != null ? String(opts.hint) : '';
            var emptyText = opts.emptyText != null ? String(opts.emptyText) : defaultEmptyText();
            var onChange = typeof opts.onChange === 'function' ? opts.onChange : null;

            var inputId = instanceId + '-input';
            var listId = instanceId + '-list';
            var summaryId = instanceId + '-summary';
            var errorId = instanceId + '-error';
            var pickBtnId = instanceId + '-pick';

            container.innerHTML =
                '<div class="file-attachment-root" data-fa-id="' + escapeHtml(instanceId) + '">'
                + (label ? '<span class="mb-1.5 block text-sm font-semibold text-gray-700">' + escapeHtml(label) + '</span>' : '')
                + '<div class="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">'
                + '  <div class="min-w-0 flex-1">'
                + '    <p class="text-sm font-medium text-gray-700">파일을 선택하세요</p>'
                + '    <p id="' + escapeHtml(summaryId) + '" class="mt-1 truncate text-sm text-gray-500">' + escapeHtml(emptyText) + '</p>'
                + '  </div>'
                + '  <label id="' + escapeHtml(pickBtnId) + '" class="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">'
                + '    파일 추가'
                + '    <input type="file" id="' + escapeHtml(inputId) + '" class="hidden" multiple>'
                + '  </label>'
                + '</div>'
                + '<p id="' + escapeHtml(errorId) + '" class="mt-2 hidden text-xs text-red-600"></p>'
                + (hint ? '<p class="mt-2 text-xs text-gray-400">' + escapeHtml(hint) + '</p>' : '')
                + '<ul id="' + escapeHtml(listId) + '" class="mt-3 hidden space-y-2"></ul>'
                + '</div>';

            var root = container.querySelector('.file-attachment-root');
            var input = container.querySelector('#' + inputId);
            var listEl = container.querySelector('#' + listId);
            var summaryEl = container.querySelector('#' + summaryId);
            var errorEl = container.querySelector('#' + errorId);
            var pickLabel = container.querySelector('#' + pickBtnId);

            if (accept) input.setAttribute('accept', accept);

            function showError(msg) {
                if (!errorEl) return;
                if (!msg) {
                    errorEl.textContent = '';
                    errorEl.classList.add('hidden');
                    return;
                }
                errorEl.textContent = msg;
                errorEl.classList.remove('hidden');
            }

            function notify() {
                if (onChange) onChange(items.map(function (it) { return it.file; }));
            }

            function updatePickDisabled() {
                var atMax = maxFiles != null && !isNaN(maxFiles) && items.length >= maxFiles;
                if (input) input.disabled = disabled || atMax;
                if (pickLabel) {
                    pickLabel.classList.toggle('opacity-50', disabled || atMax);
                    pickLabel.classList.toggle('pointer-events-none', disabled || atMax);
                    pickLabel.classList.toggle('cursor-not-allowed', disabled || atMax);
                }
            }

            function renderList() {
                if (!listEl || !summaryEl) return;

                if (items.length === 0) {
                    listEl.innerHTML = '';
                    listEl.classList.add('hidden');
                    summaryEl.textContent = emptyText;
                    updatePickDisabled();
                    return;
                }

                listEl.classList.remove('hidden');
                summaryEl.textContent = items.length + '개 파일 선택됨';
                listEl.innerHTML = items.map(function (it) {
                    var f = it.file;
                    return '<li class="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5" data-item-id="' + escapeHtml(it.id) + '">'
                        + '<span class="shrink-0 text-lg" aria-hidden="true">📎</span>'
                        + '<div class="min-w-0 flex-1">'
                        + '  <p class="truncate text-sm font-medium text-gray-800">' + escapeHtml(f.name || '이름 없음') + '</p>'
                        + '  <p class="text-xs text-gray-500">' + escapeHtml(formatFileSize(f.size)) + '</p>'
                        + '</div>'
                        + '<button type="button" class="file-attachment-remove shrink-0 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700" data-remove-id="' + escapeHtml(it.id) + '">삭제</button>'
                        + '</li>';
                }).join('');

                listEl.querySelectorAll('.file-attachment-remove').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        if (disabled) return;
                        var removeId = btn.getAttribute('data-remove-id');
                        items = items.filter(function (x) { return x.id !== removeId; });
                        showError('');
                        renderList();
                        notify();
                    });
                });

                updatePickDisabled();
            }

            function addFiles(fileList) {
                if (!fileList || !fileList.length) return;
                showError('');
                var rejected = [];

                for (var i = 0; i < fileList.length; i++) {
                    var file = fileList[i];
                    if (!file) continue;

                    if (maxFiles != null && !isNaN(maxFiles) && items.length >= maxFiles) {
                        rejected.push('최대 ' + maxFiles + '개까지 첨부할 수 있습니다.');
                        break;
                    }

                    if (maxSizeBytes != null && !isNaN(maxSizeBytes) && file.size > maxSizeBytes) {
                        rejected.push('"' + (file.name || '파일') + '"은(는) 크기 제한을 초과했습니다.');
                        continue;
                    }

                    var duplicate = items.some(function (it) {
                        return it.file.name === file.name
                            && it.file.size === file.size
                            && it.file.lastModified === file.lastModified;
                    });
                    if (duplicate) continue;

                    items.push({ id: uid(), file: file });
                }

                if (rejected.length) showError(rejected[0]);
                renderList();
                notify();
            }

            function onInputChange() {
                if (disabled) return;
                addFiles(input.files);
                input.value = '';
            }

            input.addEventListener('change', onInputChange);

            var api = {
                getFiles: function () {
                    return items.map(function (it) { return it.file; });
                },
                getItems: function () {
                    return items.slice();
                },
                clear: function () {
                    items = [];
                    showError('');
                    renderList();
                    notify();
                },
                setDisabled: function (value) {
                    disabled = !!value;
                    updatePickDisabled();
                    renderList();
                },
                destroy: function () {
                    input.removeEventListener('change', onInputChange);
                    container.innerHTML = '';
                    items = [];
                    onChange = null;
                }
            };

            renderList();
            return api;
        }
    };
})();
