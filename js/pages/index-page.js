import { escapeHtml } from '../utils/dom.js';
import { formatDate, formatDisplayDate, formatLifeAge, isSunday, isSaturday } from '../utils/date.js';
import { getLessonColor, colorWithAlpha, darkenColor } from '../utils/color.js';
import { getLessonTimeText, compareLessonsByTime, getScheduledLessons, getCancelledLessons } from '../utils/lesson.js';
import { JOURNAL_AMOUNT_OPTIONS } from '../constants/journal.js';
import { mountJournalAttachmentPanel } from '../journal-attachment-panel.js';

import { initAppShell } from '../app-header.js';

export function mountIndexPage() {
    const monthTitle = document.getElementById('monthTitle');
    const calendarGrid = document.getElementById('calendarGrid');
    const detailTitle = document.getElementById('detailTitle');
    const detailSubtitle = document.getElementById('detailSubtitle');
    const detailCount = document.getElementById('detailCount');
    const detailBody = document.getElementById('detailBody');
    const loadErrorBanner = document.getElementById('loadErrorBanner');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const goTodayBtn = document.getElementById('goTodayBtn');
    const monthLessonCount = document.getElementById('monthLessonCount');
    const monthActiveDays = document.getElementById('monthActiveDays');
    const selectedDaySummary = document.getElementById('selectedDaySummary');
    const makeupBtn = document.getElementById('makeupBtn');
    const bulkCancelBtn = document.getElementById('bulkCancelBtn');
    const bulkRestoreBtn = document.getElementById('bulkRestoreBtn');
    const bulkHint = document.getElementById('bulkHint');
    const makeupModal = document.getElementById('makeupModal');
    const makeupModalBackdrop = document.getElementById('makeupModalBackdrop');
    const makeupModalCloseBtn = document.getElementById('makeupModalCloseBtn');
    const makeupModalCancelBtn = document.getElementById('makeupModalCancelBtn');
    const makeupForm = document.getElementById('makeupForm');
    const makeupDate = document.getElementById('makeupDate');
    const makeupStudentName = document.getElementById('makeupStudentName');
    const makeupStudentId = document.getElementById('makeupStudentId');
    const makeupPickStudent = document.getElementById('makeupPickStudent');
    const makeupStartHour = document.getElementById('makeupStartHour');
    const makeupStartMin = document.getElementById('makeupStartMin');
    const makeupEndHour = document.getElementById('makeupEndHour');
    const makeupEndMin = document.getElementById('makeupEndMin');
    const MAKEUP_HOUR_OPTIONS = [];
    for (let h = 9; h <= 18; h++) MAKEUP_HOUR_OPTIONS.push(h);
    const MAKEUP_MIN_OPTIONS = [0, 10, 20, 30, 40, 50];
    function pad2(n) { return (n < 10 ? '0' + n : '' + n); }
    function fillMakeupHourMinSelects(startHHMM, endHHMM) {
        const s = (startHHMM || '14:00').split(':').map(Number);
        const e = (endHHMM || '15:00').split(':').map(Number);
        makeupStartHour.innerHTML = MAKEUP_HOUR_OPTIONS.map((h) => '<option value="' + h + '"' + (h === s[0] ? ' selected' : '') + '>' + h + '</option>').join('');
        makeupStartMin.innerHTML = MAKEUP_MIN_OPTIONS.map((m) => '<option value="' + m + '"' + (m === s[1] ? ' selected' : '') + '>' + pad2(m) + '</option>').join('');
        makeupEndHour.innerHTML = MAKEUP_HOUR_OPTIONS.map((h) => '<option value="' + h + '"' + (h === e[0] ? ' selected' : '') + '>' + h + '</option>').join('');
        makeupEndMin.innerHTML = MAKEUP_MIN_OPTIONS.map((m) => '<option value="' + m + '"' + (m === e[1] ? ' selected' : '') + '>' + pad2(m) + '</option>').join('');
    }
    function getMakeupStartTime() {
        return pad2(parseInt(makeupStartHour.value, 10)) + ':' + pad2(parseInt(makeupStartMin.value, 10));
    }
    function getMakeupEndTime() {
        return pad2(parseInt(makeupEndHour.value, 10)) + ':' + pad2(parseInt(makeupEndMin.value, 10));
    }
    const makeupFormError = document.getElementById('makeupFormError');
    const makeupSubmitBtn = document.getElementById('makeupSubmitBtn');
    const journalModal = document.getElementById('journalModal');
    const journalModalBackdrop = document.getElementById('journalModalBackdrop');
    const journalModalTitle = document.getElementById('journalModalTitle');
    const journalModalSubtitle = document.getElementById('journalModalSubtitle');
    const journalModalCloseBtn = document.getElementById('journalModalCloseBtn');
    const journalModalConfirmBtn = document.getElementById('journalModalConfirmBtn');
    const journalForm = document.getElementById('journalForm');
    const journalDate = document.getElementById('journalDate');
    const journalAge = document.getElementById('journalAge');
    const journalLessonContent = document.getElementById('journalLessonContent');
    const journalAmountType = document.getElementById('journalAmountType');
    const journalTime = document.getElementById('journalTime');
    const journalApprovalNumber = document.getElementById('journalApprovalNumber');
    const journalParentConsultation = document.getElementById('journalParentConsultation');
    const journalHomework = document.getElementById('journalHomework');
    const journalAttachmentRoot = document.getElementById('journalAttachmentRoot');
    let journalAttachmentPanel = null;

    if (journalAttachmentRoot) {
        journalAttachmentPanel = mountJournalAttachmentPanel(journalAttachmentRoot);
    }

    const now = new Date();
    const todayStr = formatDate(now);

    let viewYear = now.getFullYear();
    let viewMonth = now.getMonth() + 1;
    let selectedDate = todayStr;
    let lessonsByDate = {};
    let holidaysByDate = {};
    let currentJournalLesson = null;

    function getJournalButtonMeta(lesson) {
        const hasWritten = lesson && lesson.journal_exists != null ? !!lesson.journal_exists : false;
        if (hasWritten) {
            return {
                label: '일지 수정',
                className: 'rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[#00a832] hover:bg-green-100'
            };
        }
        return {
            label: '일지',
            className: 'rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 border border-amber-200'
        };
    }

    function buildJournalAmountOptionsHtml() {
        return JOURNAL_AMOUNT_OPTIONS.map((option) =>
            '<option value="' + escapeHtml(option.value) + '">' + escapeHtml(option.label + ' · ' + option.amount) + '</option>'
        ).join('');
    }

    function resetJournalForm() {
        journalForm.reset();
        journalDate.value = '';
        journalAge.value = '';
        if (journalAttachmentPanel) journalAttachmentPanel.clearPending();
        journalAmountType.innerHTML = buildJournalAmountOptionsHtml();
        if (JOURNAL_AMOUNT_OPTIONS.length > 0) {
            journalAmountType.value = JOURNAL_AMOUNT_OPTIONS[0].value;
        }
    }

    function openJournalModal(lesson) {
        currentJournalLesson = lesson || null;
        resetJournalForm();

        const studentName = lesson && lesson.student_name ? lesson.student_name : '학생';
        const lessonDate = lesson && lesson.lesson_date ? lesson.lesson_date : selectedDate;
        const timeText = getLessonTimeText(lesson || {});
        const isCancelled = lesson && (lesson.status || 'scheduled') === 'cancelled';

        journalModalTitle.textContent = studentName + ' 일지';
        journalModalSubtitle.textContent = isCancelled ? '결석/취소 수업 일지 팝업입니다.' : '수업 일지 팝업입니다.';
        journalDate.value = formatDisplayDate(lessonDate || '');
        journalAge.value = formatLifeAge(lesson && lesson.student_birth_date, lessonDate || todayStr);
        journalTime.value = timeText === '-' ? '' : timeText;

        // 저장된 일지가 있으면 입력값을 채웁니다.
        if (lesson && lesson.journal) {
            const journal = lesson.journal;
            journalLessonContent.value = journal.lesson_content || '';
            const defaultAmountType = JOURNAL_AMOUNT_OPTIONS[0] ? JOURNAL_AMOUNT_OPTIONS[0].value : '';
            const validAmountType = JOURNAL_AMOUNT_OPTIONS.some((o) => o.value === journal.amount_type) ? journal.amount_type : defaultAmountType;
            journalAmountType.value = validAmountType;
            journalTime.value = journal.lesson_time || journalTime.value || '';
            journalApprovalNumber.value = journal.approval_number || '';
            journalParentConsultation.value = journal.parent_consultation || '';
            journalHomework.value = journal.homework || '';
        }

        journalModal.classList.remove('hidden');

        if (journalAttachmentPanel && lesson && lesson.id) {
            journalAttachmentPanel.setActualLessonId(lesson.id);
            journalAttachmentPanel.load();
        }
    }

    function closeJournalModal() {
        currentJournalLesson = null;
        journalModal.classList.add('hidden');
        resetJournalForm();
    }

    function updateDayActionButtons(scheduledItems, cancelledItems) {
        if (!selectedDate) {
            makeupBtn.classList.add('hidden');
            bulkCancelBtn.classList.add('hidden');
            bulkRestoreBtn.classList.add('hidden');
            return;
        }
        makeupBtn.classList.remove('hidden');
        bulkCancelBtn.classList.toggle('hidden', scheduledItems.length === 0);
        bulkRestoreBtn.classList.toggle('hidden', cancelledItems.length === 0);
    }

    function resetMakeupForm() {
        makeupForm.reset();
        makeupStudentId.value = '';
        makeupStudentName.value = '';
        makeupStudentName.placeholder = '학생 선택';
        makeupFormError.classList.add('hidden');
        makeupFormError.textContent = '';
        fillMakeupHourMinSelects('14:00', '15:00');
    }

    function openMakeupModal() {
        if (!selectedDate) {
            alert('날짜를 먼저 선택해 주세요.');
            return;
        }
        resetMakeupForm();
        makeupDate.value = formatDisplayDate(selectedDate);
        makeupModal.classList.remove('hidden');
    }

    function closeMakeupModal() {
        makeupModal.classList.add('hidden');
        resetMakeupForm();
    }

    function selectMakeupStudent(student) {
        if (!student) return;
        makeupStudentId.value = String(student.id);
        makeupStudentName.value = student.name || '';
    }

    function submitMakeupLesson(event) {
        event.preventDefault();
        makeupFormError.classList.add('hidden');
        makeupFormError.textContent = '';

        const studentId = parseInt(makeupStudentId.value, 10);
        if (!Number.isInteger(studentId) || studentId < 1) {
            makeupFormError.textContent = '학생을 선택해 주세요.';
            makeupFormError.classList.remove('hidden');
            return;
        }

        const startTime = getMakeupStartTime();
        const endTime = getMakeupEndTime();
        if (!makeupStartHour.value) {
            makeupFormError.textContent = '시작 시간을 입력해 주세요.';
            makeupFormError.classList.remove('hidden');
            return;
        }

        makeupSubmitBtn.disabled = true;
        fetch('/api/actual-lessons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'makeup',
                student_id: studentId,
                lesson_date: selectedDate,
                start_time: startTime,
                end_time: endTime || undefined
            })
        })
            .then((r) => r.json().then((data) => ({ ok: r.ok, data })))
            .then(({ ok, data }) => {
                if (!ok || !data.ok) throw new Error(data.error || '보강 등록 실패');
                closeMakeupModal();
                return loadMonthLessons();
            })
            .then(() => alert('보강 수업이 등록되었습니다.'))
            .catch((err) => {
                makeupFormError.textContent = err.message || '보강 등록 실패';
                makeupFormError.classList.remove('hidden');
            })
            .finally(() => {
                makeupSubmitBtn.disabled = false;
            });
    }

    function buildLessonsMap(items) {
        const map = {};
        (items || []).forEach((item) => {
            const key = item.lesson_date || '';
            if (!key) return;
            if (!map[key]) map[key] = [];
            map[key].push(item);
        });
        Object.keys(map).forEach((key) => map[key].sort(compareLessonsByTime));
        return map;
    }

    function buildHolidayMap(items) {
        const map = {};
        (items || []).forEach((item) => {
            const key = item.date || '';
            if (!key) return;
            map[key] = item.name || '공휴일';
        });
        return map;
    }

    function ensureSelectedDateInView() {
        const inView = selectedDate && selectedDate.startsWith(viewYear + '-' + String(viewMonth).padStart(2, '0'));
        if (inView) return;
        if (viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1) {
            selectedDate = todayStr;
        } else {
            selectedDate = viewYear + '-' + String(viewMonth).padStart(2, '0') + '-01';
        }
    }

    function loadMonthLessons() {
        monthTitle.textContent = viewYear + '년 ' + viewMonth + '월';
        loadErrorBanner.classList.add('hidden');
        detailBody.innerHTML = '<div class="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center text-gray-500">월간 수업 데이터를 불러오는 중입니다.</div>';

        return Promise.all([
            fetch('/api/actual-lessons?year=' + viewYear + '&month=' + viewMonth).then((r) => r.json()),
            fetch('/api/holidays?year=' + viewYear).then((r) => r.json()).catch(() => ({ ok: false, holidays: [] }))
        ])
            .then(([lessonData, holidayData]) => {
                if (!lessonData.ok) throw new Error(lessonData.error || '수업 목록을 불러오지 못했습니다.');
                lessonsByDate = buildLessonsMap(lessonData.actual_lessons || []);
                holidaysByDate = holidayData && holidayData.ok ? buildHolidayMap(holidayData.holidays || []) : {};
                ensureSelectedDateInView();
                renderMonthSummary();
                renderCalendar();
                renderDetail();
            })
            .catch((err) => {
                lessonsByDate = {};
                holidaysByDate = {};
                renderMonthSummary();
                renderCalendar();
                renderDetail();
                loadErrorBanner.textContent = err.message || '수업 목록을 불러오지 못했습니다.';
                loadErrorBanner.classList.remove('hidden');
            });
    }

    function renderMonthSummary() {
        const totalLessonCount = Object.values(lessonsByDate).reduce((sum, items) => sum + getScheduledLessons(items).length, 0);
        const activeDayCount = Object.values(lessonsByDate).filter((items) => getScheduledLessons(items).length > 0).length;
        monthLessonCount.textContent = totalLessonCount + '건';
        monthActiveDays.textContent = activeDayCount + '일';
        const selectedItems = lessonsByDate[selectedDate] || [];
        const selectedScheduled = getScheduledLessons(selectedItems).length;
        const selectedCancelled = getCancelledLessons(selectedItems).length;
        selectedDaySummary.textContent = selectedCancelled > 0
            ? (selectedScheduled + ' / ' + selectedCancelled)
            : String(selectedScheduled);
    }

    function renderCalendar() {
        const firstDate = new Date(viewYear, viewMonth - 1, 1);
        const firstDay = firstDate.getDay();
        const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

        let html = '';
        for (let i = 0; i < 42; i++) {
            const dayNumber = i - firstDay + 1;
            if (dayNumber < 1 || dayNumber > daysInMonth) {
                html += '<div class="calendar-day empty border border-gray-200 rounded-2xl p-3"></div>';
                continue;
            }

            const dateStr = viewYear + '-' + String(viewMonth).padStart(2, '0') + '-' + String(dayNumber).padStart(2, '0');
            const lessons = lessonsByDate[dateStr] || [];
            const scheduledLessons = getScheduledLessons(lessons);
            const cancelledLessons = getCancelledLessons(lessons);
            const holidayName = holidaysByDate[dateStr] || '';
            const sunday = isSunday(dateStr);
            const saturday = isSaturday(dateStr);
            const previewLimit = 3;
            const holidayLine = holidayName
                ? '<div class="holiday-chip inline-flex max-w-full items-center rounded-full px-2 py-1 text-[11px] font-semibold">공휴일</div>'
                : '';
            const previewItems = scheduledLessons.slice(0, previewLimit).map((lesson) =>
                '<span class="day-preview-pill" style="background-color:' + colorWithAlpha(getLessonColor(lesson), 0.12) + ';border-left-color:' + getLessonColor(lesson) + ';color:' + darkenColor(getLessonColor(lesson), 0.28) + ';">' + escapeHtml(lesson.student_name || '(이름 없음)') + '</span>'
            ).join('');
            const hiddenCount = scheduledLessons.length - Math.min(scheduledLessons.length, previewLimit);
            const extraLine = hiddenCount > 0
                ? '<div class="text-[11px] leading-4 text-[#00a832] font-semibold pl-1">+' + hiddenCount + '명 더 있음</div>'
                : '';
            let countBadge = '';
            if (scheduledLessons.length === 0 && cancelledLessons.length === 0) {
                countBadge = '<span class="text-[11px] text-gray-300">비어 있음</span>';
            } else {
                const scheduledBadge = '<span class="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-[11px] font-semibold text-[#00a832]">' + scheduledLessons.length + '</span>';
                const cancelledBadge = cancelledLessons.length > 0
                    ? '<span class="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600">' + cancelledLessons.length + '</span>'
                    : '';
                countBadge = '<span class="inline-flex items-center gap-1.5">' + scheduledBadge + cancelledBadge + '</span>';
            }

            let cls = 'calendar-day border border-gray-200 rounded-2xl p-3 flex flex-col overflow-hidden text-left';
            if (selectedDate === dateStr) cls += ' selected';
            if (todayStr === dateStr) cls += ' today';
            if (scheduledLessons.length > 0) cls += ' has-lessons';
            if (holidayName) cls += ' holiday';
            if (sunday) cls += ' weekend-sun';
            if (saturday) cls += ' weekend-sat';

            html += ''
                + '<button type="button" class="' + cls + '" data-date="' + dateStr + '" title="' + escapeHtml(holidayName || dateStr) + '">'
                + '  <div class="flex items-start justify-between gap-2 mb-3">'
                + '      <span class="day-number inline-flex items-center justify-center min-w-[32px] h-8 rounded-full text-sm font-bold text-gray-500">' + dayNumber + '</span>'
                + '      ' + countBadge
                + '  </div>'
                + '  <div class="day-preview-list flex-1 overflow-hidden">'
                +        holidayLine
                +        previewItems
                +        extraLine
                + '  </div>'
                + '</button>';
        }

        calendarGrid.innerHTML = html;
        calendarGrid.querySelectorAll('[data-date]').forEach((el) => {
            el.addEventListener('click', () => {
                selectedDate = el.getAttribute('data-date');
                renderMonthSummary();
                renderCalendar();
                renderDetail();
            });
        });
    }

    function updateActualLessonStatus(id, status) {
        return fetch('/api/actual-lessons?id=' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        })
            .then((r) => r.json())
            .then((data) => {
                if (!data.ok) throw new Error(data.error || '상태 변경 실패');
                const items = lessonsByDate[selectedDate] || [];
                const target = items.find((item) => item.id === id);
                if (target) target.status = status;
                renderMonthSummary();
                renderCalendar();
                renderDetail();
            });
    }

    function updateActualLessonStatusByDate(dateStr, status) {
        return fetch('/api/actual-lessons?date=' + encodeURIComponent(dateStr), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        })
            .then((r) => r.json())
            .then((data) => {
                if (!data.ok) throw new Error(data.error || '상태 변경 실패');
                const items = lessonsByDate[dateStr] || [];
                items.forEach((item) => { item.status = status; });
                renderMonthSummary();
                renderCalendar();
                renderDetail();
            });
    }

    function renderDetail() {
        const items = lessonsByDate[selectedDate] || [];
        const scheduledItems = getScheduledLessons(items);
        const cancelledItems = getCancelledLessons(items);
        const holidayName = holidaysByDate[selectedDate] || '';
        detailTitle.textContent = selectedDate ? formatDisplayDate(selectedDate) : '날짜를 선택하세요';
        if (holidayName && scheduledItems.length) {
            detailSubtitle.textContent = holidayName + ' · 해당 날짜의 실제 수업 목록입니다.';
        } else if (holidayName) {
            detailSubtitle.textContent = holidayName + ' · 선택한 날짜에 예정된 수업이 없습니다.';
        } else {
            detailSubtitle.textContent = scheduledItems.length
                ? '해당 날짜의 실제 수업 목록입니다.'
                : '선택한 날짜에 예정된 수업이 없습니다.';
        }
        detailCount.textContent = String(scheduledItems.length);
        selectedDaySummary.textContent = cancelledItems.length > 0
            ? (scheduledItems.length + ' / ' + cancelledItems.length)
            : String(scheduledItems.length);

        if (!selectedDate) {
            detailBody.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">날짜를 선택해 주세요.</div>';
            updateDayActionButtons([], []);
            bulkHint.textContent = '';
            return;
        }

        updateDayActionButtons(scheduledItems, cancelledItems);

        if (!items.length) {
            detailBody.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">이 날짜에는 등록된 실제 수업이 없습니다.<br><span class="text-xs text-gray-400 mt-2 inline-block">보강 버튼으로 수업을 추가할 수 있습니다.</span></div>';
            bulkHint.textContent = '';
            return;
        }
        const scheduledCount = scheduledItems.length;
        const cancelledCount = cancelledItems.length;
        bulkHint.textContent = (scheduledCount === 0 && cancelledCount === 0)
            ? ''
            : (cancelledCount > 0 ? `${scheduledCount}/${cancelledCount}` : String(scheduledCount));

        let html = '';

        if (scheduledItems.length > 0) {
            html += '<div class="mb-3 flex items-center justify-between"><p class="text-xs font-semibold tracking-[0.14em] text-gray-400 uppercase">Scheduled</p><span class="text-xs font-medium text-[#00a832]">' + scheduledItems.length + '건</span></div>';
            html += scheduledItems.map((lesson) => {
                const timeText = getLessonTimeText(lesson);
                const lessonColor = getLessonColor(lesson);
                const journalMeta = getJournalButtonMeta(lesson);
                const lessonTypeLabel = lesson.is_makeup ? '보강 수업' : '실제 수업 일정';
                return ''
                    + '<div class="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm" style="border-left:4px solid ' + lessonColor + ';">'
                    + '  <div class="flex items-center justify-between gap-3">'
                    + '      <div class="min-w-0">'
                    + '          <p class="text-sm font-bold text-gray-900">' + escapeHtml(lesson.student_name || '(이름 없음)') + (lesson.is_makeup ? ' <span class="text-violet-600">· 보강</span>' : '') + '</p>'
                    + '          <p class="text-xs text-gray-500 mt-1">' + lessonTypeLabel + '</p>'
                    + '      </div>'
                    + '      <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">'
                    + '          <div class="rounded-full px-3 py-1 text-xs font-semibold" style="background-color:' + colorWithAlpha(lessonColor, 0.14) + ';color:' + darkenColor(lessonColor, 0.28) + ';">' + escapeHtml(timeText) + '</div>'
                    + '          <button type="button" class="journal-lesson-btn ' + journalMeta.className + '" data-id="' + lesson.id + '">' + escapeHtml(journalMeta.label) + '</button>'
                    + '          <button type="button" class="cancel-lesson-btn rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100" data-id="' + lesson.id + '">취소</button>'
                    + '      </div>'
                    + '  </div>'
                    + '</div>';
            }).join('');
        }

        if (cancelledItems.length > 0) {
            html += '<div class="' + (scheduledItems.length ? 'mt-5 ' : '') + 'mb-3 flex items-center justify-between"><p class="text-xs font-semibold tracking-[0.14em] text-gray-400 uppercase">Cancelled</p><span class="text-xs font-medium text-gray-500">' + cancelledItems.length + '건</span></div>';
            html += cancelledItems.map((lesson) => {
                const timeText = getLessonTimeText(lesson);
                const lessonColor = getLessonColor(lesson);
                const journalMeta = getJournalButtonMeta(lesson);
                const cancelLabel = lesson.is_makeup ? '보강 취소' : '수업 취소';
                return ''
                    + '<div class="rounded-xl border border-gray-200 bg-white/90 px-4 py-3 shadow-sm opacity-80" style="border-left:4px solid ' + lessonColor + ';">'
                    + '  <div class="flex items-center justify-between gap-3">'
                    + '      <div class="min-w-0">'
                    + '          <p class="text-sm font-bold text-gray-700">' + escapeHtml(lesson.student_name || '(이름 없음)') + (lesson.is_makeup ? ' <span class="text-violet-500">· 보강</span>' : '') + '</p>'
                    + '          <p class="text-xs text-gray-500 mt-1">' + cancelLabel + '</p>'
                    + '      </div>'
                    + '      <div class="flex items-center gap-2 shrink-0 flex-wrap justify-end">'
                    + '          <div class="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">' + escapeHtml(timeText) + '</div>'
                    + '          <button type="button" class="journal-lesson-btn ' + journalMeta.className + '" data-id="' + lesson.id + '">' + escapeHtml(journalMeta.label) + '</button>'
                    + '          <button type="button" class="restore-lesson-btn rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200" data-id="' + lesson.id + '">복구</button>'
                    + '      </div>'
                    + '  </div>'
                    + '</div>';
            }).join('');
        }

        detailBody.innerHTML = html || '<div class="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">이 날짜에는 표시할 수업이 없습니다.</div>';

        detailBody.querySelectorAll('.journal-lesson-btn').forEach((button) => {
            button.addEventListener('click', () => {
                const lessonId = parseInt(button.getAttribute('data-id'), 10);
                const lesson = items.find((item) => item.id === lessonId);
                if (lesson) openJournalModal(lesson);
            });
        });

        detailBody.querySelectorAll('.cancel-lesson-btn').forEach((button) => {
            button.addEventListener('click', () => {
                updateActualLessonStatus(parseInt(button.getAttribute('data-id'), 10), 'cancelled')
                    .catch((err) => alert(err.message || '취소 실패'));
            });
        });

        detailBody.querySelectorAll('.restore-lesson-btn').forEach((button) => {
            button.addEventListener('click', () => {
                updateActualLessonStatus(parseInt(button.getAttribute('data-id'), 10), 'scheduled')
                    .catch((err) => alert(err.message || '복구 실패'));
            });
        });
    }

    journalModalBackdrop.addEventListener('click', closeJournalModal);
    journalModalCloseBtn.addEventListener('click', closeJournalModal);
    journalModalConfirmBtn.addEventListener('click', async () => {
        if (!currentJournalLesson) {
            closeJournalModal();
            return;
        }

        const lessonId = currentJournalLesson.id;
        const payload = {
            actual_lesson_id: lessonId,
            lesson_content: journalLessonContent.value || '',
            amount_type: journalAmountType.value || '',
            lesson_time: journalTime.value || '',
            approval_number: journalApprovalNumber.value || '',
            parent_consultation: journalParentConsultation.value || '',
            homework: journalHomework.value || '',
        };

        // "미작성"은 텍스트·첨부가 모두 없을 때로 판단합니다.
        const hasText =
            [payload.lesson_content, payload.approval_number, payload.parent_consultation, payload.homework]
                .some((v) => String(v || '').trim().length > 0);
        const hasAttachments = journalAttachmentPanel ? journalAttachmentPanel.hasAnyAttachments() : false;
        const hasWritten = hasText || hasAttachments;

        try {
            if (!hasWritten) {
                const delRes = await fetch('/api/lesson-journals?actual_lesson_id=' + encodeURIComponent(String(lessonId)), {
                    method: 'DELETE'
                });
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
                        actualLessonId: lessonId,
                    });
                }
            }

            // 서버 join 값 반영을 위해 월 데이터 재로딩
            await loadMonthLessons();
            closeJournalModal();
            alert(!hasWritten ? '일지가 삭제되었습니다.' : '일지가 저장되었습니다.');
        } catch (err) {
            alert(err.message || '일지 저장/수정 실패');
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!makeupModal.classList.contains('hidden')) {
            closeMakeupModal();
            return;
        }
        if (!journalModal.classList.contains('hidden')) {
            closeJournalModal();
        }
    });
    resetJournalForm();

    makeupBtn.addEventListener('click', openMakeupModal);
    makeupModalBackdrop.addEventListener('click', closeMakeupModal);
    makeupModalCloseBtn.addEventListener('click', closeMakeupModal);
    makeupModalCancelBtn.addEventListener('click', closeMakeupModal);
    makeupForm.addEventListener('submit', submitMakeupLesson);
    makeupPickStudent.addEventListener('click', () => {
        if (typeof window.StudentPicker !== 'object' || typeof window.StudentPicker.open !== 'function') {
            alert('학생 선택 기능을 불러오지 못했습니다. 페이지를 새로고침해 주세요.');
            return;
        }
        window.StudentPicker.open(selectMakeupStudent);
    });
    bulkCancelBtn.addEventListener('click', () => {
        if (!selectedDate) return;
        if (!confirm('이 날짜의 예정 수업을 모두 취소할까요?')) return;
        updateActualLessonStatusByDate(selectedDate, 'cancelled')
            .catch((err) => alert(err.message || '일괄 취소 실패'));
    });

    bulkRestoreBtn.addEventListener('click', () => {
        if (!selectedDate) return;
        if (!confirm('이 날짜의 취소된 수업을 모두 복구할까요?')) return;
        updateActualLessonStatusByDate(selectedDate, 'scheduled')
            .catch((err) => alert(err.message || '일괄 복구 실패'));
    });

    function moveMonth(offset) {
        const next = new Date(viewYear, viewMonth - 1 + offset, 1);
        viewYear = next.getFullYear();
        viewMonth = next.getMonth() + 1;
        if (viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1) {
            selectedDate = todayStr;
        } else {
            selectedDate = viewYear + '-' + String(viewMonth).padStart(2, '0') + '-01';
        }
        loadMonthLessons();
    }

    prevMonthBtn.addEventListener('click', () => moveMonth(-1));
    nextMonthBtn.addEventListener('click', () => moveMonth(1));
    goTodayBtn.addEventListener('click', () => {
        viewYear = now.getFullYear();
        viewMonth = now.getMonth() + 1;
        selectedDate = todayStr;
        loadMonthLessons();
    });

    loadMonthLessons();
}

export function initIndexPage() {
    initAppShell(null);
    mountIndexPage();
}
