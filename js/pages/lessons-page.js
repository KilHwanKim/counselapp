import {
    LESSON_COLOR_PALETTE,
    getLessonColor,
    normalizeHexColor,
    darkenColor
} from '../utils/color.js';

import { initAppShell } from '../app-header.js';

export function mountLessonsPage() {
    const START_HOUR = 9;
    const END_HOUR = 18;

    let lessonsMap = {};
    const timeLabels = document.getElementById('timeLabels');
    const gridBg = document.getElementById('gridBg');
    const lessonLayer = document.getElementById('lessonLayer');
    const loadErrorBanner = document.getElementById('loadErrorBanner');
    const registerBtn = document.getElementById('registerBtn');
    const slotModal = document.getElementById('slotModal');
    const slotModalTitle = document.getElementById('slotModalTitle');
    const slotEditStartTime = document.getElementById('slotEditStartTime');
    const slotEditDay = document.getElementById('slotEditDay');
    const slotStudentRow = document.getElementById('slotStudentRow');
    const slotDay = document.getElementById('slotDay');
    const slotStartHour = document.getElementById('slotStartHour');
    const slotStartMin = document.getElementById('slotStartMin');
    const slotEndHour = document.getElementById('slotEndHour');
    const slotEndMin = document.getElementById('slotEndMin');
    const slotStudentName = document.getElementById('slotStudentName');
    const slotStudentId = document.getElementById('slotStudentId');
    const slotPickStudent = document.getElementById('slotPickStudent');
    const slotColor = document.getElementById('slotColor');
    const slotColorPalette = document.getElementById('slotColorPalette');
    const slotSaveBtn = document.getElementById('slotSaveBtn');
    const slotCancelBtn = document.getElementById('slotCancelBtn');
    const slotModalBackdrop = document.getElementById('slotModalBackdrop');

    const HOUR_OPTIONS = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) HOUR_OPTIONS.push(h);
    const MIN_OPTIONS = [0, 10, 20, 30, 40, 50];
    function pad2(n) { return (n < 10 ? '0' + n : '' + n); }

    function buildTimeGrid() {
        timeLabels.innerHTML = '';
        const colFragment = document.createDocumentFragment();
        for (let i = 0; i < 5; i++) {
            const col = document.createElement('div');
            col.className = 'grid-column';
            for (let h = START_HOUR; h <= END_HOUR; h++) {
                const row = document.createElement('div');
                row.className = 'hour-row';
                col.appendChild(row);
            }
            colFragment.appendChild(col);
        }
        gridBg.appendChild(colFragment);
        for (let h = START_HOUR; h <= END_HOUR; h++) {
            const row = document.createElement('div');
            row.className = 'hour-row';
            row.textContent = h + ':00';
            timeLabels.appendChild(row);
        }
    }
    buildTimeGrid();

    function getHourHeight() {
        const first = timeLabels.querySelector('.hour-row');
        return first ? first.getBoundingClientRect().height : 80;
    }

    function key(d, t) { return d + '-' + t; }
    function nextHour(t) {
        var parts = (t || '09:00').split(':').map(Number);
        var h = parts[0] || 0, m = parts[1] || 0;
        var total = h * 60 + m + 60;
        var h2 = Math.floor(total / 60);
        var m2 = total % 60;
        if (h2 > END_HOUR || (h2 === END_HOUR && m2 > 0)) return pad2(END_HOUR) + ':00';
        return pad2(h2) + ':' + pad2(m2);
    }

    function setSelectedColor(color) {
        var normalized = normalizeHexColor(color) || LESSON_COLOR_PALETTE[0];
        slotColor.value = normalized;
        slotColorPalette.querySelectorAll('.color-option').forEach(function (button) {
            button.classList.toggle('active', button.getAttribute('data-color') === normalized);
        });
    }

    function renderColorPalette() {
        slotColorPalette.innerHTML = LESSON_COLOR_PALETTE.map(function (color) {
            return '<button type="button" class="color-option" data-color="' + color + '" style="background-color:' + color + ';" title="' + color + '"></button>';
        }).join('');
        slotColorPalette.querySelectorAll('.color-option').forEach(function (button) {
            button.addEventListener('click', function () {
                setSelectedColor(button.getAttribute('data-color'));
            });
        });
    }

    renderColorPalette();
    setSelectedColor(LESSON_COLOR_PALETTE[0]);

    function loadLessons() {
        return fetch('/api/lessons')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) throw new Error(data.error || '조회 실패');
                lessonsMap = {};
                (data.lessons || []).forEach(function (l) {
                    lessonsMap[key(l.day_of_week, l.start_time)] = l;
                });
            });
    }

    function renderLessons() {
        document.querySelectorAll('.lesson-slot').forEach(function (slot) { slot.innerHTML = ''; });
        const hourHeight = getHourHeight();
        Object.values(lessonsMap).forEach(function (l) {
            const daySlot = document.querySelector('.lesson-slot[data-day="' + l.day_of_week + '"]');
            if (!daySlot) return;

            const startTime = l.start_time || '09:00';
            const endTime = l.end_time || nextHour(startTime);
            const [sh, sm] = startTime.split(':').map(Number);
            const [eh, em] = endTime.split(':').map(Number);

            const top = ((sh - START_HOUR) * 60 + (sm || 0)) / 60 * hourHeight;
            const durationMinutes = (eh * 60 + (em || 0)) - (sh * 60 + (sm || 0));
            const height = Math.max(4, (durationMinutes / 60) * hourHeight - 4);

            const card = document.createElement('div');
            const lessonColor = getLessonColor(l);
            card.className = 'lesson-card';
            card.style.top = top + 'px';
            card.style.height = height + 'px';
            card.style.backgroundColor = lessonColor;
            card.style.borderLeftColor = darkenColor(lessonColor, 0.28);
            card.setAttribute('data-day', l.day_of_week);
            card.setAttribute('data-start-time', startTime);
            card.innerHTML = '<div class="font-bold truncate">' + (l.student_name || '') + '</div>' +
                '<div class="text-[10px] opacity-90">' + startTime + ' - ' + endTime + '</div>' +
                '<button type="button" class="lesson-delete-btn" title="삭제">&#215;</button>';

            card.addEventListener('click', function (e) {
                if (e.target.closest('.lesson-delete-btn')) return;
                openEditModal(l);
            });
            const deleteBtn = card.querySelector('.lesson-delete-btn');
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!confirm('이 수업을 삭제할까요?')) return;
                fetch('/api/lessons?day_of_week=' + l.day_of_week + '&start_time=' + encodeURIComponent(startTime), { method: 'DELETE' })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        if (!data.ok) throw new Error(data.error || '삭제 실패');
                        return loadLessons();
                    })
                    .then(renderLessons)
                    .then(function () { alert('수업이 삭제되었습니다.'); })
                    .catch(function (err) { alert(err.message); });
            });
            daySlot.appendChild(card);
        });
    }

    function fillHourMinSelects(startHHMM, endHHMM) {
        var s = (startHHMM || '09:00').split(':').map(Number);
        var e = (endHHMM || '10:00').split(':').map(Number);
        slotStartHour.innerHTML = HOUR_OPTIONS.map(function (h) { return '<option value="' + h + '"' + (h === s[0] ? ' selected' : '') + '>' + h + '</option>'; }).join('');
        slotStartMin.innerHTML = MIN_OPTIONS.map(function (m) { return '<option value="' + m + '"' + (m === s[1] ? ' selected' : '') + '>' + pad2(m) + '</option>'; }).join('');
        slotEndHour.innerHTML = HOUR_OPTIONS.map(function (h) { return '<option value="' + h + '"' + (h === e[0] ? ' selected' : '') + '>' + h + '</option>'; }).join('');
        slotEndMin.innerHTML = MIN_OPTIONS.map(function (m) { return '<option value="' + m + '"' + (m === e[1] ? ' selected' : '') + '>' + pad2(m) + '</option>'; }).join('');
    }
    function getStartTime() {
        return pad2(parseInt(slotStartHour.value, 10)) + ':' + pad2(parseInt(slotStartMin.value, 10));
    }
    function getEndTime() {
        return pad2(parseInt(slotEndHour.value, 10)) + ':' + pad2(parseInt(slotEndMin.value, 10));
    }

    function timeToMinutes(t) {
        var p = (t || '00:00').split(':').map(Number);
        return (p[0] || 0) * 60 + (p[1] || 0);
    }
    function overlaps(s1, e1, s2, e2) {
        var a = timeToMinutes(s1), b = timeToMinutes(e1);
        var c = timeToMinutes(s2), d = timeToMinutes(e2);
        return a < d && c < b;
    }
    function lessonsForDay(day) {
        return Object.keys(lessonsMap).filter(function (k) { return k.startsWith(day + '-'); }).map(function (k) { return lessonsMap[k]; });
    }
    function hasOverlap(day, startTime, endTime, excludeStartTime) {
        var list = lessonsForDay(day);
        var end = endTime || nextHour(startTime);
        for (var i = 0; i < list.length; i++) {
            var l = list[i];
            if (excludeStartTime && l.start_time === excludeStartTime) continue;
            var le = l.end_time || nextHour(l.start_time);
            if (overlaps(startTime, end, l.start_time, le)) return true;
        }
        return false;
    }

    function openModal() {
        slotModalTitle.textContent = '수업 등록';
        slotEditStartTime.value = '';
        slotEditDay.value = '';
        slotStudentRow.style.display = '';
        slotPickStudent.style.display = '';
        slotDay.value = '1';
        fillHourMinSelects('09:00', '10:00');
        slotStudentId.value = '';
        slotStudentName.value = '';
        slotStudentName.placeholder = '학생 선택';
        setSelectedColor(LESSON_COLOR_PALETTE[0]);
        slotModal.classList.remove('hidden');
    }

    function openEditModal(lesson) {
        slotModalTitle.textContent = '수업 수정';
        slotEditStartTime.value = lesson.start_time || '';
        slotEditDay.value = String(lesson.day_of_week || 1);
        slotStudentRow.style.display = '';
        slotPickStudent.style.display = 'none';
        slotStudentId.value = lesson.student_id || '';
        slotStudentName.value = lesson.student_name || '';
        slotStudentName.placeholder = '';
        slotDay.value = String(lesson.day_of_week || 1);
        var endVal = lesson.end_time || nextHour(lesson.start_time);
        fillHourMinSelects(lesson.start_time || '09:00', endVal);
        setSelectedColor(getLessonColor(lesson));
        slotModal.classList.remove('hidden');
    }

    function closeModal() {
        slotModal.classList.add('hidden');
    }

    registerBtn.addEventListener('click', openModal);
    slotModalBackdrop.addEventListener('click', closeModal);
    slotCancelBtn.addEventListener('click', closeModal);

    StudentPicker.bindButton(slotPickStudent, {
        nameEl: slotStudentName,
        idEl: slotStudentId,
    });

    slotSaveBtn.addEventListener('click', function () {
        var day = parseInt(slotDay.value, 10);
        var startTime = getStartTime();
        var endTime = getEndTime();
        var isEdit = slotEditStartTime && slotEditStartTime.value;
        var studentId = slotStudentId.value ? parseInt(slotStudentId.value, 10) : 0;
        if (!isEdit && !studentId) { alert('학생을 선택하세요.'); return; }
        if (isEdit) studentId = studentId || 0;
        if (!isEdit && !studentId) return;
        var excludeStart = isEdit ? slotEditStartTime.value : null;
        var originalDay = isEdit && slotEditDay && slotEditDay.value ? parseInt(slotEditDay.value, 10) : null;
        if (hasOverlap(day, startTime, endTime, excludeStart)) {
            alert('선택한 시간이 이미 등록된 수업과 겹칩니다. 다른 시간을 선택하세요.');
            return;
        }
        function doPost() {
            var payload = {
                day_of_week: day,
                start_time: startTime,
                end_time: endTime,
                student_id: studentId,
                color: slotColor.value
            };
            if (isEdit && originalDay != null && excludeStart) {
                payload.original_day_of_week = originalDay;
                payload.original_start_time = excludeStart;
            }
            return fetch('/api/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function (r) { return r.json(); });
        }
        doPost()
            .then(function (data) {
                if (!data.ok) throw new Error(data.error || '저장 실패');
                alert(isEdit ? '수업이 수정되었습니다.' : '수업이 등록되었습니다.');
                return loadLessons();
            })
            .then(function () { renderLessons(); closeModal(); })
            .catch(function (err) { alert(err.message); });
    });

    loadLessons()
        .then(function () { renderLessons(); loadErrorBanner.classList.add('hidden'); })
        .catch(function (err) {
            loadErrorBanner.textContent = '수업 목록을 불러올 수 없습니다. (' + err.message + ')';
            loadErrorBanner.classList.remove('hidden');
            renderLessons();
        });
}

export function initLessonsPage() {
    initAppShell('lessons');
    mountLessonsPage();
}
