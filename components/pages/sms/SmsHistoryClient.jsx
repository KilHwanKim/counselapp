'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountSmsHistoryPage } from '@/js/pages/sms-history-page.js';
import SmsToast from '@/components/pages/sms/SmsShared';

export default function SmsHistoryClient() {
    const mount = useCallback(() => {
        mountSmsHistoryPage();
    }, []);

    return (
        <>
            <LegacyMount mount={mount} />
            <main className="flex-1 p-4 md:p-6 overflow-hidden min-h-0">
                <div className="flex h-full min-h-0 flex-col gap-4">
                    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">SMS</p>
                                <h2 className="mt-2 text-2xl font-bold text-gray-900">발송 내역</h2>
                                <p className="mt-2 text-sm text-gray-500">솔라피 발송 기록입니다. 미리보기를 클릭하면 전체 내용을 볼 수 있습니다.</p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <span id="smsHistoryCount" className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">0건</span>
                                <button type="button" id="smsHistoryRefreshBtn" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">새로고침</button>
                            </div>
                        </div>
                    </section>
                    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div id="smsHistoryEmpty" className="hidden flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-gray-500">
                            발송 내역이 없습니다.
                        </div>
                        <div id="smsHistoryLoading" className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-gray-500">
                            불러오는 중...
                        </div>
                        <div id="smsHistoryTableWrap" className="hidden flex min-h-0 flex-1 flex-col">
                            <div className="flex-1 overflow-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        <tr>
                                            <th className="whitespace-nowrap px-4 py-3 md:px-5">일시</th>
                                            <th className="whitespace-nowrap px-4 py-3 md:px-5">구분</th>
                                            <th className="whitespace-nowrap px-4 py-3 md:px-5">학생</th>
                                            <th className="whitespace-nowrap px-4 py-3 md:px-5">수신번호</th>
                                            <th className="min-w-[200px] px-4 py-3 md:px-5">미리보기</th>
                                            <th className="whitespace-nowrap px-4 py-3 md:px-5">유형</th>
                                            <th className="whitespace-nowrap px-4 py-3 md:px-5">상태</th>
                                            <th className="whitespace-nowrap px-4 py-3 md:px-5">작업</th>
                                        </tr>
                                    </thead>
                                    <tbody id="smsHistoryTableBody" className="divide-y divide-gray-100 text-gray-800" />
                                </table>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 md:px-5">
                                <p id="smsHistoryPageInfo" className="text-sm text-gray-500">페이지 1</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button type="button" id="smsHistoryPrevBtn" className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" disabled>이전</button>
                                    <div id="smsHistoryPageNumbers" className="flex flex-wrap gap-1" />
                                    <button type="button" id="smsHistoryNextBtn" className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed" disabled>다음</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <div id="smsHistoryBodyModal" className="fixed inset-0 z-50 hidden">
                <div className="absolute inset-0 bg-black/50" id="smsHistoryBodyModalBackdrop" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-gray-900">미리보기</h3>
                            <button type="button" id="smsHistoryBodyModalClose" className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">닫기</button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <p id="smsHistoryBodyModalText" className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800" />
                        </div>
                    </div>
                </div>
            </div>
            <SmsToast />
        </>
    );
}
