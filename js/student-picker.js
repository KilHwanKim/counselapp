/**
 * 공통 학생 선택 팝업. 여러 페이지에서 재사용.
 * 사용법: StudentPicker.open(function(student) { ... })  // student = { id, name, birth_date, ... }
 */
(function () {
    var modal = null;
    var listEl = null;
    var searchEl = null;
    var countEl = null;
    var onSelect = null;
    var escHandler = null;

    function escapeHtml(str) {
        if (str == null) return '';
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function ageFromBirthDate(birthDateStr) {
        var s = String(birthDateStr || '').slice(0, 10);
        if (s.length < 10) return '';
        var parts = s.split('-').map(Number);
        var by = parts[0], bm = parts[1], bd = parts[2];
        if (!by || isNaN(by)) return '';
        var today = new Date();
        var ty = today.getFullYear(), tm = today.getMonth() + 1, td = today.getDate();
        var months = (ty - by) * 12 + (tm - (bm || 1));
        if (td < (bd || 1)) months -= 1;
        if (months < 0) return '';
        var years = Math.floor(months / 12);
        var monthsPart = months % 12;
        return years + '년 ' + monthsPart + '개월';
    }

    function updateCount(total, shown) {
        if (!countEl) return;
        if (!total) {
            countEl.textContent = '등록된 학생이 없습니다.';
            return;
        }
        if (shown === total) {
            countEl.textContent = '총 ' + total + '명';
            return;
        }
        countEl.textContent = total + '명 중 ' + shown + '명 표시';
    }

    function renderList(students, filter) {
        if (!listEl) return;
        var q = (filter || '').trim().toLowerCase();
        var filtered = q ? students.filter(function (s) { return (s.name || '').toLowerCase().indexOf(q) !== -1; }) : students;
        updateCount(students.length, filtered.length);
        listEl.innerHTML = filtered.length === 0
            ? '<p class="px-4 py-8 text-center text-sm text-gray-500">검색 결과가 없습니다.</p>'
            : '<table class="w-full text-sm"><thead class="sticky top-0 z-10 bg-gray-50 shadow-[0_1px_0_0_rgb(229,231,235)]"><tr><th class="text-left px-4 py-2.5 font-semibold text-gray-700">이름</th><th class="text-left px-4 py-2.5 font-semibold text-gray-700">생활연령</th></tr></thead><tbody>'
            + filtered.map(function (s) {
                var age = ageFromBirthDate(s.birth_date);
                return '<tr class="student-picker-item border-b border-gray-100 hover:bg-[#00c73c]/10 cursor-pointer transition-colors" data-id="' + s.id + '"><td class="px-4 py-2.5 font-medium text-gray-800">' + escapeHtml(s.name || '') + '</td><td class="px-4 py-2.5 text-gray-600">' + escapeHtml(age || '—') + '</td></tr>';
            }).join('')
            + '</tbody></table>';
        listEl.querySelectorAll('.student-picker-item').forEach(function (el) {
            el.addEventListener('click', function () {
                var id = parseInt(el.getAttribute('data-id'), 10);
                var s = students.find(function (x) { return x.id === id; });
                if (s && typeof onSelect === 'function') onSelect(s);
                close();
            });
        });
    }

    function close() {
        if (modal) modal.classList.add('hidden');
        onSelect = null;
        if (escHandler) {
            document.removeEventListener('keydown', escHandler);
            escHandler = null;
        }
    }

    function open(callback) {
        onSelect = callback;
        if (!modal) {
            var t = document.createElement('div');
            t.id = 'student-picker-modal';
            t.className = 'fixed inset-0 z-[60] hidden';
            t.innerHTML =
                '<div class="absolute inset-0 bg-black/50" id="student-picker-backdrop"></div>' +
                '<div class="absolute inset-0 flex items-center justify-center p-4">' +
                '<div class="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[min(520px,85vh)] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="student-picker-title">' +
                '<div class="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-200 shrink-0">' +
                '<div class="min-w-0">' +
                '<h3 id="student-picker-title" class="text-base font-bold text-gray-900">학생 선택</h3>' +
                '<p id="student-picker-count" class="mt-0.5 text-xs text-gray-500"></p>' +
                '</div>' +
                '<button type="button" id="student-picker-close" class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="닫기">' +
                '<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>' +
                '</button>' +
                '</div>' +
                '<div class="px-4 py-3 border-b border-gray-100 shrink-0">' +
                '<input type="search" id="student-picker-search" placeholder="이름으로 검색" autocomplete="off" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]">' +
                '</div>' +
                '<div id="student-picker-list" class="flex-1 min-h-0 overflow-y-auto"></div>' +
                '<div class="px-4 py-3 border-t border-gray-200 shrink-0 flex justify-end">' +
                '<button type="button" id="student-picker-cancel" class="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200">취소</button>' +
                '</div></div></div></div>';
            document.body.appendChild(t);
            modal = t;
            listEl = document.getElementById('student-picker-list');
            searchEl = document.getElementById('student-picker-search');
            countEl = document.getElementById('student-picker-count');
            document.getElementById('student-picker-backdrop').addEventListener('click', close);
            document.getElementById('student-picker-cancel').addEventListener('click', close);
            document.getElementById('student-picker-close').addEventListener('click', close);
            searchEl.addEventListener('input', function () { renderList(window.__studentPickerStudents || [], searchEl.value); });
        }
        modal.classList.remove('hidden');
        listEl.innerHTML = '<p class="px-4 py-8 text-center text-sm text-gray-500">로딩 중...</p>';
        if (countEl) countEl.textContent = '';
        searchEl.value = '';
        escHandler = function (e) { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', escHandler);
        setTimeout(function () { searchEl.focus(); }, 0);
        fetch('/api/students')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) throw new Error(data.error || '조회 실패');
                var list = data.students || [];
                window.__studentPickerStudents = list;
                renderList(list, '');
            })
            .catch(function (err) {
                listEl.innerHTML = '<p class="px-4 py-8 text-center text-sm text-red-500">' + escapeHtml(err.message) + '</p>';
                updateCount(0, 0);
            });
    }

    window.StudentPicker = { open: open, close: close };
})();
