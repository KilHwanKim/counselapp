/**
 * 공통 상단 헤더 + 사이드바 초기화 (모든 페이지 동일).
 * HTML: <div id="app-header-container"></div>, <div id="sidebar-container"></div>
 * 페이지 JS: import { initAppShell } from '/js/app-header.js'; initAppShell('students');
 */
export function initAppShell(activeMenu) {
    const headerContainer = document.getElementById('app-header-container');
    const sidebarContainer = document.getElementById('sidebar-container');
    const toggle = renderAppHeader(headerContainer);
    Sidebar.render(sidebarContainer, {
        activeMenu: activeMenu || null,
        togglePlaceholder: toggle
    });
}

function renderAppHeader(container) {
    if (!container) return null;
    container.innerHTML = ''
        + '<header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">'
        + '  <div class="flex items-center gap-2">'
        + '      <span id="sidebar-toggle"></span>'
        + '      <span class="text-sm font-medium text-gray-600">김길환 매니저님, 환영합니다.</span>'
        + '  </div>'
        + '  <div class="flex items-center gap-4">'
        + '      <button type="button" class="flex items-center gap-2 bg-[#FEE500] hover:bg-[#fada0a] text-[#191919] px-3 py-1.5 rounded-md text-sm font-bold shadow-sm transition">'
        + '          <img src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png" class="w-4 h-4" alt="카카오"> 카카오 계정 연결'
        + '      </button>'
        + '  </div>'
        + '</header>';
    return container.querySelector('#sidebar-toggle');
}
