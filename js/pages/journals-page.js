import { escapeHtml } from '../utils/dom.js';
import { formatDisplayDate, formatLifeAge } from '../utils/date.js';
import { getLessonColor } from '../utils/color.js';
import { getLessonTimeText, compareLessons } from '../utils/lesson.js';
import { JOURNAL_AMOUNT_OPTIONS } from '../constants/journal.js';
import { mountJournalAttachmentPanel } from '../journal-attachment-panel.js';

import { initAppShell } from '../app-header.js';

export function mountJournalsPage() {
    const journalStudentName = document.getElementById('journalStudentName');
    const journalStudentId = document.getElementById('journalStudentId');
    const journalPickStudent = document.getElementById('journalPickStudent');
    const journalClearStudent = document.getElementById('journalClearStudent');
    const monthFilter = document.getElementById('monthFilter');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const listSummary = document.getElementById('listSummary');
    const listCount = document.getElementById('listCount');
    const journalList = document.getElementById('journalList');
    const listError = document.getElementById('listError');
    const detailTitle = document.getElementById('detailTitle');
    const detailSubtitle = document.getElementById('detailSubtitle');
    const detailStatusBadge = document.getElementById('detailStatusBadge');
    const journalDetailSaveBtn = document.getElementById('journalDetailSaveBtn');
    const detailBody = document.getElementById('detailBody');

    const now = new Date();
    const currentMonthValue = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    monthFilter.value = currentMonthValue;

    let monthLessons = [];
    let filteredLessons = [];
    let selectedLessonId = null;
    let journalAttachmentPanel = null;

    function getUnifiedLessonStatusMeta(lesson) {
        const cancelled = String(lesson.status || 'scheduled').toLowerCase() === 'cancelled';
        if (cancelled) {
            return { label: '수업취소', className: 'bg-red-50 text-red-600' };
        }
        if (lesson.journal_exists) {
            return { label: '일지작성', className: 'bg-green-50 text-[#00a832]' };
        }
        return { label: '미작성', className: 'bg-amber-50 text-amber-800 border border-amber-200' };
    }

    function getSelectedStudentId() {
        const raw = (journalStudentId && journalStudentId.value) ? String(journalStudentId.value).trim() : '';
        if (!raw) return null;
        const n = parseInt(raw, 10);
        return Number.isInteger(n) && n > 0 ? n : null;
    }

    function getSelectedStudentSummaryText() {
        const id = getSelectedStudentId();
        if (!id) return '전체 학생';
        const name = (journalStudentName && journalStudentName.value) ? String(journalStudentName.value).trim() : '';
        return name || ('학생 #' + id);
    }

    function renderList() {
        listCount.textContent = String(filteredLessons.length);
        const selectedStudentText = getSelectedStudentSummaryText();
        listSummary.textContent = selectedStudentText + ' · ' + (monthFilter.value || '-') + ' · ' + filteredLessons.length + '건';

        if (!filteredLessons.length) {
            journalList.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">조건에 맞는 일지 대상 수업이 없습니다.</div>';
            return;
        }

        const rowsHtml = filteredLessons.map((lesson) => {
            const lessonColor = getLessonColor(lesson);
            const unifiedMeta = getUnifiedLessonStatusMeta(lesson);
            const selectedClass = lesson.id === selectedLessonId
                ? 'bg-green-50/80'
                : 'bg-white hover:bg-gray-50';
            const rowBorderColor = lesson.id === selectedLessonId ? '#86EFAC' : lessonColor;
            return ''
                + '<tr class="journal-list-row cursor-pointer border-b border-gray-100 last:border-b-0 transition ' + selectedClass + '" data-id="' + lesson.id + '">'
                + '  <td class="px-4 py-3 text-sm font-semibold text-gray-900" style="border-left:4px solid ' + rowBorderColor + ';">' + escapeHtml(lesson.student_name || '(이름 없음)') + '</td>'
                + '  <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">' + escapeHtml(formatDisplayDate(lesson.lesson_date)) + '</td>'
                + '  <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">' + escapeHtml(getLessonTimeText(lesson)) + '</td>'
                + '  <td class="px-4 py-3 text-sm">'
                + '    <span class="rounded-full px-3 py-1 text-xs font-semibold ' + unifiedMeta.className + '">' + escapeHtml(unifiedMeta.label) + '</span>'
                + '  </td>'
                + '  <td class="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">' + escapeHtml(formatLifeAge(lesson.student_birth_date, lesson.lesson_date)) + '</td>'
                + '</tr>';
        }).join('');

        journalList.innerHTML = ''
            + '<div class="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">'
            + '  <div class="overflow-x-auto">'
            + '      <table class="min-w-full">'
            + '          <thead class="bg-gray-50">'
            + '              <tr>'
            + '                  <th class="w-[30%] min-w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">학생명</th>'
            + '                  <th class="w-[26%] min-w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">날짜</th>'
            + '                  <th class="w-[18%] min-w-[110px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">시간</th>'
            + '                  <th class="w-[14%] min-w-[110px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">상태</th>'
            + '                  <th class="w-[12%] min-w-[110px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">생활연령</th>'
            + '              </tr>'
            + '          </thead>'
            + '          <tbody>'
            +                rowsHtml
            + '          </tbody>'
            + '      </table>'
            + '  </div>'
            + '</div>';

        journalList.querySelectorAll('.journal-list-row').forEach((row) => {
            row.addEventListener('click', () => {
                selectedLessonId = parseInt(row.getAttribute('data-id'), 10);
                renderList();
                renderDetail();
            });
        });
    }

    function renderDetail() {
        const lesson = filteredLessons.find((item) => item.id === selectedLessonId);
        if (!lesson) {
            detailTitle.textContent = '일지를 선택하세요';
            detailSubtitle.textContent = '좌측 목록에서 수업을 선택하면 상세 내용이 표시됩니다.';
            detailStatusBadge.className = 'hidden rounded-full px-3 py-1 text-xs font-semibold';
            journalDetailSaveBtn.classList.add('hidden');
            journalDetailSaveBtn.onclick = null;
            detailBody.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">선택된 수업이 없습니다.</div>';
            return;
        }

        const unifiedMeta = getUnifiedLessonStatusMeta(lesson);
        const journal = lesson.journal || {};
        detailTitle.textContent = (lesson.student_name || '(이름 없음)') + ' 일지';
        detailSubtitle.textContent = formatDisplayDate(lesson.lesson_date) + ' · ' + getLessonTimeText(lesson);
        detailStatusBadge.className = 'rounded-full px-3 py-1 text-xs font-semibold ' + unifiedMeta.className;
        detailStatusBadge.textContent = unifiedMeta.label;

        detailBody.innerHTML = ''
            + '<div class="grid grid-cols-1 gap-4 md:grid-cols-2">'
            + '  <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '      <p class="text-xs font-semibold tracking-[0.14em] text-gray-400 uppercase">학생 정보</p>'
            + '      <div class="mt-3 space-y-3 text-sm text-gray-700">'
            + '          <div><span class="font-semibold text-gray-900">학생명</span><p class="mt-1 text-gray-600">' + escapeHtml(lesson.student_name || '(이름 없음)') + '</p></div>'
            + '          <div><span class="font-semibold text-gray-900">생활연령</span><p class="mt-1 text-gray-600">' + escapeHtml(formatLifeAge(lesson.student_birth_date, lesson.lesson_date)) + '</p></div>'
            + '          <div><span class="font-semibold text-gray-900">상태</span><p class="mt-1 text-gray-600">' + escapeHtml(unifiedMeta.label) + '</p></div>'
            + '      </div>'
            + '  </div>'
            + '  <div class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '      <p class="text-xs font-semibold tracking-[0.14em] text-gray-400 uppercase">수업 정보</p>'
            + '      <div class="mt-3 space-y-3 text-sm text-gray-700">'
            + '          <div><span class="font-semibold text-gray-900">날짜</span><p class="mt-1 text-gray-600">' + escapeHtml(formatDisplayDate(lesson.lesson_date)) + '</p></div>'
            + '          <div><span class="font-semibold text-gray-900">시간</span><p class="mt-1 text-gray-600">' + escapeHtml(getLessonTimeText(lesson)) + '</p></div>'
            + '          <div><span class="font-semibold text-gray-900">수업 색상</span><p class="mt-1 text-gray-600">' + escapeHtml(getLessonColor(lesson)) + '</p></div>'
            + '      </div>'
            + '  </div>'
            + '</div>'
            + '<div class="grid grid-cols-1 gap-4 mt-2">'
            + '  <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '      <p class="text-sm font-semibold text-gray-900 mb-2">수업내용</p>'
            + '      <textarea id="journalDetailLessonContent" rows="6" placeholder="수업내용을 입력해 주세요." class="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"></textarea>'
            + '  </section>'
            + '  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">'
            + '      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '          <p class="text-sm font-semibold text-gray-900 mb-2">금액</p>'
            + '          <select id="journalDetailAmountType" class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"></select>'
            + '      </section>'
            + '      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '          <p class="text-sm font-semibold text-gray-900 mb-2">시간</p>'
            + '          <input id="journalDetailLessonTime" type="text" placeholder="예: 14:00 - 14:40" class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100">'
            + '      </section>'
            + '  </div>'
            + '  <div class="grid grid-cols-1 gap-4 md:grid-cols-2">'
            + '      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '          <p class="text-sm font-semibold text-gray-900 mb-2">승인번호</p>'
            + '          <input id="journalDetailApprovalNumber" type="text" placeholder="승인번호를 입력해 주세요." class="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100">'
            + '      </section>'
            + '      <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '          <p class="text-sm font-semibold text-gray-900 mb-2">부모상담</p>'
            + '          <textarea id="journalDetailParentConsultation" rows="3" placeholder="부모상담 내용을 입력해 주세요." class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"></textarea>'
            + '      </section>'
            + '  </div>'
            + '  <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '      <p class="text-sm font-semibold text-gray-900 mb-2">숙제</p>'
            + '      <textarea id="journalDetailHomework" rows="3" placeholder="숙제를 입력해 주세요." class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"></textarea>'
            + '  </section>'
            + '  <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">'
            + '      <p class="text-sm font-semibold text-gray-900 mb-2">첨부파일</p>'
            + '      <div id="journalDetailAttachmentRoot"></div>'
            + '  </section>'
            + '</div>';

        const contentEl = document.getElementById('journalDetailLessonContent');
        const amountEl = document.getElementById('journalDetailAmountType');
        const timeEl = document.getElementById('journalDetailLessonTime');
        const approvalEl = document.getElementById('journalDetailApprovalNumber');
        const parentEl = document.getElementById('journalDetailParentConsultation');
        const homeworkEl = document.getElementById('journalDetailHomework');

        if (amountEl) {
            const options = JOURNAL_AMOUNT_OPTIONS.map((o) => {
                const selected = o.value === (journal.amount_type || '') ? ' selected' : '';
                return '<option value="' + escapeHtml(o.value) + '"' + selected + '>' + escapeHtml(o.label + ' · ' + o.amount) + '</option>';
            }).join('');
            amountEl.innerHTML = options;
            if (!journal.amount_type && JOURNAL_AMOUNT_OPTIONS[0] && JOURNAL_AMOUNT_OPTIONS[0].value) {
                amountEl.value = JOURNAL_AMOUNT_OPTIONS[0].value;
            }
        }

        if (contentEl) contentEl.value = journal.lesson_content || '';
        if (timeEl) timeEl.value = journal.lesson_time || '';
        if (approvalEl) approvalEl.value = journal.approval_number || '';
        if (parentEl) parentEl.value = journal.parent_consultation || '';
        if (homeworkEl) homeworkEl.value = journal.homework || '';

        const attachRoot = document.getElementById('journalDetailAttachmentRoot');
        if (journalAttachmentPanel) {
            journalAttachmentPanel.destroy();
            journalAttachmentPanel = null;
        }
        if (attachRoot) {
            journalAttachmentPanel = mountJournalAttachmentPanel(attachRoot, { actualLessonId: lesson.id });
            journalAttachmentPanel.load();
        }

        journalDetailSaveBtn.classList.remove('hidden');
        journalDetailSaveBtn.textContent = lesson.journal_exists ? '수정' : '저장';
        journalDetailSaveBtn.className =
            'inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold '
            + (lesson.journal_exists ? 'bg-[#00a832] text-white hover:bg-green-700' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100');

        journalDetailSaveBtn.onclick = async () => {
            const payload = {
                actual_lesson_id: lesson.id,
                lesson_content: contentEl ? contentEl.value || '' : '',
                amount_type: amountEl ? amountEl.value || '' : '',
                lesson_time: timeEl ? timeEl.value || '' : '',
                approval_number: approvalEl ? approvalEl.value || '' : '',
                parent_consultation: parentEl ? parentEl.value || '' : '',
                homework: homeworkEl ? homeworkEl.value || '' : ''
            };

            const hasText =
                [payload.lesson_content, payload.approval_number, payload.parent_consultation, payload.homework]
                    .some((v) => String(v || '').trim().length > 0);
            const hasAttachments = journalAttachmentPanel ? journalAttachmentPanel.hasAnyAttachments() : false;
            const hasWritten = hasText || hasAttachments;

            try {
                if (!hasWritten) {
                    const delRes = await fetch('/api/lesson-journals?actual_lesson_id=' + encodeURIComponent(String(lesson.id)), { method: 'DELETE' });
                    const delData = await delRes.json().catch(() => ({}));
                    if (!delRes.ok || !delData.ok) throw new Error(delData.error || '일지 삭제 실패');
                } else {
                    const res = await fetch('/api/lesson-journals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data.ok) throw new Error(data.error || '일지 저장 실패');

                    if (journalAttachmentPanel && journalAttachmentPanel.hasPendingFiles()) {
                        await journalAttachmentPanel.uploadPending({
                            journalId: data.journal_id,
                            actualLessonId: lesson.id,
                        });
                    }
                }

                selectedLessonId = lesson.id;
                await loadMonthLessons();
                alert(!hasWritten ? '일지가 삭제되었습니다.' : '일지가 저장되었습니다.');
            } catch (err) {
                alert(err.message || '일지 저장/수정 실패');
            }
        };
    }

    function applyFilters() {
        const studentId = getSelectedStudentId();
        filteredLessons = monthLessons
            .filter((lesson) => !studentId || lesson.student_id === studentId)
            .sort(compareLessons);

        if (!filteredLessons.some((lesson) => lesson.id === selectedLessonId)) {
            selectedLessonId = filteredLessons.length ? filteredLessons[0].id : null;
        }

        renderList();
        renderDetail();
    }

    function loadMonthLessons() {
        const monthValue = monthFilter.value || currentMonthValue;
        const parts = monthValue.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);

        listError.classList.add('hidden');
        journalList.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">월간 수업 데이터를 불러오는 중입니다.</div>';

        return fetch('/api/actual-lessons?year=' + year + '&month=' + month)
            .then((r) => r.json())
            .then((data) => {
                if (!data.ok) throw new Error(data.error || '수업 목록을 불러오지 못했습니다.');
                monthLessons = data.actual_lessons || [];
                applyFilters();
            })
            .catch((err) => {
                monthLessons = [];
                filteredLessons = [];
                selectedLessonId = null;
                listSummary.textContent = '조회 실패';
                listCount.textContent = '0';
                listError.textContent = err.message || '수업 목록을 불러오지 못했습니다.';
                listError.classList.remove('hidden');
                renderList();
                renderDetail();
            });
    }

    resetFiltersBtn.addEventListener('click', () => {
        journalStudentId.value = '';
        journalStudentName.value = '';
        journalStudentName.placeholder = '전체 학생';
        monthFilter.value = currentMonthValue;
        loadMonthLessons();
    });

    StudentPicker.bindButton(journalPickStudent, {
        nameEl: journalStudentName,
        idEl: journalStudentId,
        clearPlaceholder: '전체 학생',
        onSelect: () => applyFilters(),
    });

    journalClearStudent.addEventListener('click', () => {
        journalStudentId.value = '';
        journalStudentName.value = '';
        journalStudentName.placeholder = '전체 학생';
        applyFilters();
    });

    monthFilter.addEventListener('change', loadMonthLessons);

    loadMonthLessons();
}

export function initJournalsPage() {
    initAppShell('journals');
    mountJournalsPage();
}
