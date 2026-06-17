'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'counselapp-sidebar-collapsed';

function activeMenuFromPath(pathname) {
    if (pathname === '/students') return 'students';
    if (pathname === '/lessons') return 'lessons';
    if (pathname === '/journals') return 'journals';
    if (pathname === '/sms/send' || pathname === '/sms') return 'sms-send';
    if (pathname === '/sms/scheduled') return 'sms-scheduled';
    if (pathname === '/sms/templates') return 'sms-templates';
    if (pathname === '/sms/history') return 'sms-history';
    return null;
}

export default function AppShell({ children }) {
    const pathname = usePathname();
    const activeMenu = activeMenuFromPath(pathname);
    const [collapsed, setCollapsed] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
        } catch {
            setCollapsed(false);
        }
        setHydrated(true);
    }, []);

    const toggleSidebar = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            } catch {
                /* ignore */
            }
            return next;
        });
    }, []);

    const studentsCls = activeMenu === 'students' ? ' active-menu' : '';
    const lessonsCls = activeMenu === 'lessons' ? ' active-menu' : '';
    const journalsCls = activeMenu === 'journals' ? ' active-menu' : '';
    const smsSendCls = activeMenu === 'sms-send' ? ' active-menu' : '';
    const smsScheduledCls = activeMenu === 'sms-scheduled' ? ' active-menu' : '';
    const smsTemplatesCls = activeMenu === 'sms-templates' ? ' active-menu' : '';
    const smsHistoryCls = activeMenu === 'sms-history' ? ' active-menu' : '';

    const sidebarWidth = hydrated && collapsed
        ? 'w-0 min-w-0 overflow-hidden'
        : 'w-64 min-w-[16rem]';

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
            <aside
                id="app-sidebar"
                className={`${sidebarWidth} bg-[#4a5a69] text-white flex-shrink-0 flex flex-col min-h-screen transition-[width,min-width] duration-200 ease-in-out`}
            >
                <div className="p-5 bg-[#3e4d61] flex items-center justify-between flex-shrink-0">
                    <Link href="/" className="font-bold text-lg tracking-tight text-white no-underline whitespace-nowrap">
                        상담센터 <span className="text-[#00c73c]">Admin</span>
                    </Link>
                    <button
                        type="button"
                        onClick={toggleSidebar}
                        className="text-white hover:bg-white/10 p-1 rounded transition"
                        title="메뉴 숨기기"
                    >
                        ◀
                    </button>
                </div>
                <nav className="mt-2 overflow-y-auto">
                    <div className="px-5 py-3 text-xs text-gray-400 uppercase font-bold">매니지먼트</div>
                    <Link href="/students" className={`sidebar-item${studentsCls} block px-5 py-3 flex items-center gap-3 transition no-underline text-white`}>
                        <span>📋</span> 학생 등록/조회
                    </Link>
                    <Link href="/lessons" className={`sidebar-item${lessonsCls} block px-5 py-3 flex items-center gap-3 transition no-underline text-white`}>
                        <span>📅</span> 수업 등록/수정
                    </Link>
                    <Link href="/journals" className={`sidebar-item${journalsCls} block px-5 py-3 flex items-center gap-3 transition no-underline text-white`}>
                        <span>📝</span> 일지 조회
                    </Link>
                    <div className="px-5 py-3 mt-4 text-xs text-gray-400 uppercase font-bold">문자관리</div>
                    <Link href="/sms/send" className={`sidebar-item${smsSendCls} block px-5 py-3 flex items-center gap-3 transition no-underline text-white`}>
                        <span>📤</span> 문자 발송
                    </Link>
                    <Link href="/sms/scheduled" className={`sidebar-item${smsScheduledCls} block px-5 py-3 flex items-center gap-3 transition no-underline text-white`}>
                        <span>⏰</span> 예약 발송
                    </Link>
                    <Link href="/sms/templates" className={`sidebar-item${smsTemplatesCls} block px-5 py-3 flex items-center gap-3 transition no-underline text-white`}>
                        <span>📄</span> 템플릿 관리
                    </Link>
                    <Link href="/sms/history" className={`sidebar-item${smsHistoryCls} block px-5 py-3 flex items-center gap-3 transition no-underline text-white`}>
                        <span>📋</span> 발송 내역
                    </Link>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100 transition text-sm"
                        >
                            {hydrated && collapsed ? '☰ 메뉴' : '◀ 접기'}
                        </button>
                        <span className="text-sm font-medium text-gray-600">김길환 매니저님, 환영합니다.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            className="flex items-center gap-2 bg-[#FEE500] hover:bg-[#fada0a] text-[#191919] px-3 py-1.5 rounded-md text-sm font-bold shadow-sm transition"
                        >
                            <img
                                src="https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png"
                                className="w-4 h-4"
                                alt="카카오"
                            />
                            카카오 계정 연결
                        </button>
                    </div>
                </header>
                {children}
            </div>
        </div>
    );
}
