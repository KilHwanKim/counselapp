import { escapeHtml } from '../utils/dom.js';
import {
    createToast,
    formatScheduledDisplay,
    truncatePreview,
    buildVariableMap,
    applyVariables,
} from '../sms/shared.js';

const PAGE_SIZE = 10;

export function mountSmsHistoryPage() {
    const smsHistoryEmpty = document.getElementById('smsHistoryEmpty');
    const smsHistoryLoading = document.getElementById('smsHistoryLoading');
    const smsHistoryTableWrap = document.getElementById('smsHistoryTableWrap');
    const smsHistoryTableBody = document.getElementById('smsHistoryTableBody');
    const smsHistoryCount = document.getElementById('smsHistoryCount');
    const smsHistoryRefreshBtn = document.getElementById('smsHistoryRefreshBtn');
    const smsHistoryPageInfo = document.getElementById('smsHistoryPageInfo');
    const smsHistoryPageNumbers = document.getElementById('smsHistoryPageNumbers');
    const smsHistoryPrevBtn = document.getElementById('smsHistoryPrevBtn');
    const smsHistoryNextBtn = document.getElementById('smsHistoryNextBtn');
    const smsHistoryBodyModal = document.getElementById('smsHistoryBodyModal');
    const smsHistoryBodyModalBackdrop = document.getElementById('smsHistoryBodyModalBackdrop');
    const smsHistoryBodyModalClose = document.getElementById('smsHistoryBodyModalClose');
    const smsHistoryBodyModalText = document.getElementById('smsHistoryBodyModalText');
    const smsToast = document.getElementById('smsToast');

    const showToast = createToast(smsToast);

    let currentPage = 1;
    /** @type {(string|null)[]} startKey per page (1-indexed: cursors[0] = page 1) */
    let pageCursors = [null];
    let hasMore = false;
    /** @type {Array<{ body?: string }>} */
    let currentMessages = [];

    function statusLabel(item) {
        if (item.sendMode === 'scheduled' && item.canCancel) return '예약 대기';
        if (item.groupStatus === 'FAILED' && item.sendMode === 'scheduled') return '예약 취소';
        if (item.statusCode === '4000' || item.reason === '정상 처리') return '성공';
        if (item.status === 'COMPLETE' && !item.reason) return '완료';
        if (item.status === 'PENDING') return '대기';
        if (item.status === 'SENDING') return '전송중';
        if (item.reason) return item.reason;
        return item.status || '-';
    }

    function statusClass(item) {
        if (item.sendMode === 'scheduled' && item.canCancel) {
            return 'rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700';
        }
        if (item.groupStatus === 'FAILED' && item.sendMode === 'scheduled') {
            return 'rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600';
        }
        if (item.statusCode === '4000' || item.reason === '정상 처리') {
            return 'rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-[#00a832]';
        }
        if (item.status === 'PENDING' || item.status === 'SENDING') {
            return 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700';
        }
        return 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600';
    }

    function modeLabel(item) {
        return item.sendMode === 'scheduled' ? '예약' : '즉시';
    }

    function modeClass(item) {
        return item.sendMode === 'scheduled'
            ? 'rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700'
            : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600';
    }

    function formatStudentCell(item) {
        const name = (item.studentName || '').trim();
        const id = (item.studentId || '').trim();
        if (name && id) return name + ' (' + id + ')';
        if (name) return name;
        if (id) return '(' + id + ')';
        return '-';
    }

    function formatPhone(phone) {
        const d = String(phone || '').replace(/\D/g, '');
        if (d.length === 11) return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
        return phone || '-';
    }

    function displayDateTime(item) {
        if (item.sendMode === 'scheduled' && item.scheduledAt) {
            return formatScheduledDisplay(item.scheduledAt);
        }
        return formatScheduledDisplay(item.sentAt || '');
    }

    function setLoading(on) {
        if (smsHistoryLoading) smsHistoryLoading.classList.toggle('hidden', !on);
        if (on) {
            if (smsHistoryEmpty) smsHistoryEmpty.classList.add('hidden');
            if (smsHistoryTableWrap) smsHistoryTableWrap.classList.add('hidden');
        }
    }

    function resolveHistoryBody(item) {
        const map = buildVariableMap({
            studentName: item.studentName,
            parentPhone: item.parentPhone,
            lessonDate: '',
            lessonTime: '',
        });
        return applyVariables(item.body || '', map);
    }

    function openBodyModal(index) {
        const item = currentMessages[index];
        if (!item || !smsHistoryBodyModal || !smsHistoryBodyModalText) return;
        smsHistoryBodyModalText.textContent = item.displayBody || resolveHistoryBody(item);
        smsHistoryBodyModal.classList.remove('hidden');
    }

    function closeBodyModal() {
        if (smsHistoryBodyModal) smsHistoryBodyModal.classList.add('hidden');
    }

    function renderTable(messages) {
        if (!smsHistoryTableBody) return;
        currentMessages = (messages || []).map(function (item) {
            return Object.assign({}, item, { displayBody: resolveHistoryBody(item) });
        });
        smsHistoryTableBody.innerHTML = currentMessages.map(function (item, index) {
            const cancelBtn = item.canCancel && item.groupId
                ? '<button type="button" class="sms-cancel-reservation-btn rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100" data-group-id="' + escapeHtml(item.groupId) + '">예약 취소</button>'
                : '<span class="text-xs text-gray-300">-</span>';
            const previewText = item.displayBody || '';
            const bodyPreview = truncatePreview(previewText, 56);
            const bodyCell = '<button type="button" class="sms-history-body-btn block w-full max-w-xs text-left text-gray-700 hover:text-[#00a832] cursor-pointer" data-index="' + index + '" title="클릭하면 전체 내용을 볼 수 있습니다">'
                + '<span class="line-clamp-2 whitespace-pre-wrap break-words">' + escapeHtml(bodyPreview || '-') + '</span>'
                + '</button>';
            return ''
                + '<tr class="hover:bg-gray-50/80" data-group-id="' + escapeHtml(item.groupId || '') + '">'
                + '<td class="whitespace-nowrap px-4 py-3 md:px-5 text-gray-600">' + escapeHtml(displayDateTime(item)) + '</td>'
                + '<td class="whitespace-nowrap px-4 py-3 md:px-5"><span class="' + modeClass(item) + '">' + escapeHtml(modeLabel(item)) + '</span></td>'
                + '<td class="whitespace-nowrap px-4 py-3 md:px-5 font-medium text-gray-900">' + escapeHtml(formatStudentCell(item)) + '</td>'
                + '<td class="whitespace-nowrap px-4 py-3 md:px-5 text-gray-600">' + escapeHtml(formatPhone(item.parentPhone)) + '</td>'
                + '<td class="px-4 py-3 md:px-5">' + bodyCell + '</td>'
                + '<td class="whitespace-nowrap px-4 py-3 md:px-5 text-gray-500">' + escapeHtml((item.messageType || '-').toUpperCase()) + '</td>'
                + '<td class="whitespace-nowrap px-4 py-3 md:px-5"><span class="sms-history-status ' + statusClass(item) + '">' + escapeHtml(statusLabel(item)) + '</span></td>'
                + '<td class="whitespace-nowrap px-4 py-3 md:px-5">' + cancelBtn + '</td>'
                + '</tr>';
        }).join('');

        smsHistoryTableBody.querySelectorAll('.sms-history-body-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                if (Number.isFinite(index)) openBodyModal(index);
            });
        });

        smsHistoryTableBody.querySelectorAll('.sms-cancel-reservation-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                cancelReservation(btn.getAttribute('data-group-id'));
            });
        });
    }

    function cancelReservation(groupId) {
        if (!groupId) return;
        if (!window.confirm('예약 발송을 취소할까요? 취소 후에는 복구할 수 없습니다.')) return;

        fetch('/api/sms/cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId: groupId }),
        })
            .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
            .then(function ({ res, data }) {
                if (!res.ok || !data.ok) {
                    showToast(data.error || '예약 취소에 실패했습니다.');
                    return;
                }
                showToast('예약이 취소되었습니다.');
                return loadPage(currentPage);
            })
            .catch(function () {
                showToast('예약 취소에 실패했습니다.');
            });
    }

    function renderPager() {
        if (smsHistoryPageInfo) {
            smsHistoryPageInfo.textContent = '페이지 ' + currentPage + (hasMore ? '' : ' (마지막)');
        }
        if (smsHistoryPrevBtn) {
            smsHistoryPrevBtn.disabled = currentPage <= 1;
        }
        if (smsHistoryNextBtn) {
            smsHistoryNextBtn.disabled = !hasMore;
        }
        if (smsHistoryPageNumbers) {
            smsHistoryPageNumbers.innerHTML = '';
            for (let p = 1; p <= pageCursors.length; p++) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.textContent = String(p);
                btn.className = p === currentPage
                    ? 'min-w-[2rem] rounded-lg bg-[#00c73c] px-2 py-1.5 text-sm font-semibold text-white'
                    : 'min-w-[2rem] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50';
                btn.addEventListener('click', function () {
                    if (p !== currentPage) loadPage(p);
                });
                smsHistoryPageNumbers.appendChild(btn);
            }
        }
    }

    function loadPage(page) {
        currentPage = page;
        setLoading(true);

        const startKey = pageCursors[page - 1] ?? null;
        const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (startKey) qs.set('startKey', startKey);

        return fetch('/api/sms/history?' + qs.toString())
            .then(function (res) { return res.json().then(function (data) { return { res: res, data: data }; }); })
            .then(function ({ res, data }) {
                setLoading(false);
                if (!res.ok || !data.ok) {
                    if (smsHistoryEmpty) {
                        smsHistoryEmpty.classList.remove('hidden');
                        smsHistoryEmpty.textContent = data.error || '발송 내역을 불러오지 못했습니다.';
                    }
                    if (smsHistoryTableWrap) smsHistoryTableWrap.classList.add('hidden');
                    if (smsHistoryCount) smsHistoryCount.textContent = '0건';
                    return;
                }

                const messages = data.messages || [];
                hasMore = Boolean(data.hasMore);

                if (data.nextKey && pageCursors.length === page) {
                    pageCursors.push(data.nextKey);
                }

                if (smsHistoryCount) {
                    smsHistoryCount.textContent = messages.length + '건';
                }

                if (!messages.length && page === 1) {
                    if (smsHistoryEmpty) {
                        smsHistoryEmpty.classList.remove('hidden');
                        smsHistoryEmpty.textContent = '발송 내역이 없습니다.';
                    }
                    if (smsHistoryTableWrap) smsHistoryTableWrap.classList.add('hidden');
                    renderPager();
                    return;
                }

                if (smsHistoryEmpty) smsHistoryEmpty.classList.add('hidden');
                if (smsHistoryTableWrap) smsHistoryTableWrap.classList.remove('hidden');
                renderTable(messages);
                renderPager();
            })
            .catch(function () {
                setLoading(false);
                if (smsHistoryEmpty) {
                    smsHistoryEmpty.classList.remove('hidden');
                    smsHistoryEmpty.textContent = '발송 내역을 불러오지 못했습니다.';
                }
                if (smsHistoryTableWrap) smsHistoryTableWrap.classList.add('hidden');
            });
    }

    function resetAndLoad() {
        currentPage = 1;
        pageCursors = [null];
        hasMore = false;
        return loadPage(1);
    }

    if (smsHistoryRefreshBtn) {
        smsHistoryRefreshBtn.addEventListener('click', function () {
            resetAndLoad().then(function () {
                showToast('발송 내역을 새로고침했습니다.');
            });
        });
    }

    if (smsHistoryPrevBtn) {
        smsHistoryPrevBtn.addEventListener('click', function () {
            if (currentPage > 1) loadPage(currentPage - 1);
        });
    }

    if (smsHistoryNextBtn) {
        smsHistoryNextBtn.addEventListener('click', function () {
            if (hasMore) loadPage(currentPage + 1);
        });
    }

    if (smsHistoryBodyModalBackdrop) {
        smsHistoryBodyModalBackdrop.addEventListener('click', closeBodyModal);
    }
    if (smsHistoryBodyModalClose) {
        smsHistoryBodyModalClose.addEventListener('click', closeBodyModal);
    }

    resetAndLoad();
}
