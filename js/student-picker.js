/**
 * 공통 학생 선택 팝업. 여러 페이지에서 재사용.
 * 사용법: StudentPicker.open(function(student) { ... })  // student = { id, name, birth_date, ... }
 */
(function () {
    var modal = null;
    var listEl = null;
    var searchEl = null;
    var onSelect = null;

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

    function renderList(students, filter) {
        if (!listEl) return;
        var q = (filter || '').trim().toLowerCase();
        var filtered = q ? students.filter(function (s) { return (s.name || '').toLowerCase().indexOf(q) !== -1; }) : students;
        listEl.innerHTML = filtered.length === 0
            ? '<p class="px-3 py-4 text-gray-500 text-sm">검색 결과가 없습니다.</p>'
            : '<table class="w-full text-sm"><thead><tr class="border-b border-gray-200 bg-gray-50"><th class="text-left px-3 py-2 font-semibold text-gray-700">이름</th><th class="text-left px-3 py-2 font-semibold text-gray-700">생활연령</th></tr></thead><tbody>'
            + filtered.map(function (s) {
                var age = ageFromBirthDate(s.birth_date);
                return '<tr class="student-picker-item border-b border-gray-100 hover:bg-[#00c73c]/10 cursor-pointer" data-id="' + s.id + '"><td class="px-3 py-2.5 font-medium text-gray-800">' + escapeHtml(s.name || '') + '</td><td class="px-3 py-2.5 text-gray-600">' + escapeHtml(age) + '</td></tr>';
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
                '<div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">' +
                '<div class="p-4 border-b border-gray-200">' +
                '<h3 class="text-lg font-bold text-gray-800">이름과 생활연령 (예: 1년 5개월)</h3>' +
                '<input type="text" id="student-picker-search" placeholder="이름 검색" class="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]">' +
                '</div>' +
                '<div id="student-picker-list" class="flex-1 overflow-y-auto min-h-[200px]"></div>' +
                '<div class="p-4 border-t border-gray-200">' +
                '<button type="button" id="student-picker-cancel" class="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md">취소</button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>';
            document.body.appendChild(t);
            modal = t;
            listEl = document.getElementById('student-picker-list');
            searchEl = document.getElementById('student-picker-search');
            document.getElementById('student-picker-backdrop').addEventListener('click', close);
            document.getElementById('student-picker-cancel').addEventListener('click', close);
            searchEl.addEventListener('input', function () { renderList(window.__studentPickerStudents || [], searchEl.value); });
        }
        modal.classList.remove('hidden');
        listEl.innerHTML = '<p class="px-3 py-4 text-gray-500 text-sm">로딩 중...</p>';
        searchEl.value = '';
        fetch('/api/students')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (!data.ok) throw new Error(data.error || '조회 실패');
                var list = data.students || [];
                window.__studentPickerStudents = list;
                renderList(list, '');
            })
            .catch(function (err) {
                listEl.innerHTML = '<p class="px-3 py-4 text-red-500 text-sm">' + escapeHtml(err.message) + '</p>';
            });
    }

    window.StudentPicker = { open: open, close: close };
})();
