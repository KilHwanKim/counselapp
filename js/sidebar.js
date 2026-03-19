/**
 * 공통 좌측 메뉴. 각 페이지에서 Sidebar.render() 호출하여 사용.
 * 사용법: <div id="sidebar-container"></div> 그리고 <span id="sidebar-toggle"></span> (헤더 왼쪽 등)
 * 그 다음: Sidebar.render(document.getElementById('sidebar-container'), { activeMenu: 'students', togglePlaceholder: document.getElementById('sidebar-toggle') });
 */
(function () {
    const STORAGE_KEY = 'counselapp-sidebar-collapsed';

    function getStyles() {
        return `
            .sidebar-item:hover { background-color: #3e4d61; }
            .active-menu { background-color: #2c3949; border-left: 4px solid #00c73c; }
            #sidebar-container { min-height: 100vh; }
            #app-sidebar { min-height: 100vh; transition: width 0.2s ease, min-width 0.2s ease; }
            #app-sidebar.sidebar-collapsed { width: 0; min-width: 0; overflow: hidden; }
        `;
    }

    function getSidebarHtml(activeMenu) {
        const base = (window.location.pathname || '').replace(/\/$/, '') || '/';
        const homeHref = base === '' || base === '/' ? '/index.html' : '/index.html';
        const studentsCls = activeMenu === 'students' ? ' active-menu' : '';
        const lessonsCls = activeMenu === 'lessons' ? ' active-menu' : '';
        const journalsCls = activeMenu === 'journals' ? ' active-menu' : '';
        return `
        <aside id="app-sidebar" class="w-64 min-w-[16rem] bg-[#4a5a69] text-white flex-shrink-0 flex flex-col min-h-screen">
            <div class="p-5 bg-[#3e4d61] flex items-center justify-between flex-shrink-0">
                <a href="${homeHref}" class="font-bold text-lg tracking-tight text-white no-underline">상담센터 <span class="text-[#00c73c]">Admin</span></a>
                <button type="button" id="sidebar-close-btn" class="text-white hover:bg-white/10 p-1 rounded transition" title="메뉴 숨기기">◀</button>
            </div>
            <nav class="mt-2 overflow-y-auto">
                <div class="px-5 py-3 text-xs text-gray-400 uppercase font-bold">매니지먼트</div>
                <a href="/students.html" class="sidebar-item${studentsCls} block px-5 py-3 flex items-center gap-3 transition">
                    <span>📋</span> 학생 등록/조회
                </a>
                <a href="/lessons.html" class="sidebar-item${lessonsCls} block px-5 py-3 flex items-center gap-3 transition">
                    <span>📅</span> 수업 등록/수정
                </a>
                <a href="/journals.html" class="sidebar-item${journalsCls} block px-5 py-3 flex items-center gap-3 transition">
                    <span>📝</span> 일지 조회
                </a>
                <div class="px-5 py-3 mt-4 text-xs text-gray-400 uppercase font-bold">커뮤니케이션</div>
                <a href="#" class="sidebar-item block px-5 py-3 flex items-center gap-3 transition">
                    <span>💬</span> 문자 발송 관리
                </a>
                <a href="#" class="sidebar-item block px-5 py-3 flex items-center gap-3 transition">
                    <span>📊</span> 통계 분석
                </a>
            </nav>
        </aside>
        `;
    }

    function applyCollapsed(aside, collapsed) {
        if (collapsed) aside.classList.add('sidebar-collapsed'); else aside.classList.remove('sidebar-collapsed');
        try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch (e) {}
    }

    function isCollapsed() {
        try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { return false; }
    }

    window.Sidebar = {
        render: function (container, options) {
            if (!container) return;
            var activeMenu = (options && options.activeMenu) || null;
            var togglePlaceholder = (options && options.togglePlaceholder) || null;

            var style = document.createElement('style');
            style.textContent = getStyles();
            document.head.appendChild(style);

            container.innerHTML = getSidebarHtml(activeMenu);
            var aside = container.querySelector('#app-sidebar');
            var closeBtn = container.querySelector('#sidebar-close-btn');
            if (!aside) return;

            var collapsed = isCollapsed();
            applyCollapsed(aside, collapsed);

            function toggle() {
                collapsed = aside.classList.contains('sidebar-collapsed');
                applyCollapsed(aside, !collapsed);
                collapsed = !collapsed;
                if (togglePlaceholder) updateToggleLabel();
            }

            function updateToggleLabel() {
                if (!togglePlaceholder || !toggleBtn) return;
                toggleBtn.textContent = aside.classList.contains('sidebar-collapsed') ? '☰ 메뉴' : '◀ 접기';
            }

            if (closeBtn) closeBtn.addEventListener('click', toggle);

            var toggleBtn = null;
            if (togglePlaceholder) {
                togglePlaceholder.innerHTML = '';
                toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100 transition';
                toggleBtn.addEventListener('click', toggle);
                togglePlaceholder.appendChild(toggleBtn);
                updateToggleLabel();
            }
        }
    };
})();
