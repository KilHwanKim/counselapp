'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountIndexPage } from '@/js/pages/index-page.js';

export default function IndexClient() {
    const mount = useCallback(() => {
        mountIndexPage();
    }, []);

    return (
        <>
            <LegacyMount mount={mount} />
            <main className="flex-1 p-4 md:p-6 overflow-hidden min-h-0">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)] gap-4 h-full min-h-0">
                    <section className="min-w-0 bg-white rounded-2xl shadow-sm border border-gray-200 p-5 md:p-6 flex flex-col min-h-0">
                        <div className="flex items-start justify-between gap-4 mb-5">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.18em] text-gray-400 uppercase mb-2">Monthly Calendar</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 id="monthTitle" className="text-[28px] leading-none font-bold text-gray-900" />
                                    <button type="button" id="goTodayBtn" className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-[#00a832] hover:bg-green-100">오늘</button>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">날짜를 선택하면 오른쪽에 실제 수업 상세가 표시됩니다.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button type="button" id="prevMonthBtn" className="w-10 h-10 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">◀</button>
                                <button type="button" id="nextMonthBtn" className="w-10 h-10 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50">▶</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="text-xs font-medium text-gray-500">이번 달 실제 수업</p>
                                <p id="monthLessonCount" className="text-lg font-bold text-gray-900 mt-1">0건</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="text-xs font-medium text-gray-500">수업 있는 날짜</p>
                                <p id="monthActiveDays" className="text-lg font-bold text-gray-900 mt-1">0일</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 md:block hidden">
                                <p className="text-xs font-medium text-gray-500">선택 상태</p>
                                <p id="selectedDaySummary" className="text-lg font-bold text-[#00a832] mt-1">0</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 mb-3">
                            <div className="text-red-500">일</div>
                            <div>월</div>
                            <div>화</div>
                            <div>수</div>
                            <div>목</div>
                            <div>금</div>
                            <div className="text-blue-500">토</div>
                        </div>

                        <div id="calendarGrid" className="calendar-grid gap-2 flex-1 min-h-0" />
                    </section>

                    <section className="min-w-0 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-h-0">
                        <div className="p-4 md:p-5 border-b border-gray-200 flex-shrink-0">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase mb-2">Day Detail</p>
                                    <h3 id="detailTitle" className="text-xl font-bold text-gray-900">날짜를 선택하세요</h3>
                                    <p id="detailSubtitle" className="text-sm text-gray-500 mt-1">달력에서 날짜를 클릭해 주세요.</p>
                                </div>
                                <div className="shrink-0 rounded-2xl bg-green-50 px-4 py-3 text-center min-w-[88px]">
                                    <p className="text-[11px] font-medium text-gray-500">총 수업 수</p>
                                    <p id="detailCount" className="text-2xl font-bold text-[#00a832] leading-none mt-1">0</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                                <p id="bulkHint" className="text-xs text-gray-400" />
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button type="button" id="makeupBtn" className="hidden rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">보강</button>
                                    <button type="button" id="bulkCancelBtn" className="hidden rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100">일괄 취소</button>
                                    <button type="button" id="bulkRestoreBtn" className="hidden rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">일괄 복구</button>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-5 min-h-0 bg-gray-50/60">
                            <div id="loadErrorBanner" className="hidden mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" />
                            <div id="detailBody" className="space-y-2.5">
                                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">
                                    월간 수업 데이터를 불러오면 여기에 날짜별 상세가 표시됩니다.
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <div id="makeupModal" className="fixed inset-0 z-50 hidden">
                <div id="makeupModalBackdrop" className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm" />
                <div className="relative flex h-full items-center justify-center p-4 md:p-6">
                    <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
                        <div className="border-b border-gray-200 px-5 py-4 md:px-6 md:py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">Makeup Lesson</p>
                                    <h3 className="mt-2 text-xl font-bold text-gray-900">보강 등록</h3>
                                    <p className="mt-1 text-sm text-gray-500">선택한 날짜에 추가 수업을 등록합니다.</p>
                                </div>
                                <button type="button" id="makeupModalCloseBtn" className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">닫기</button>
                            </div>
                        </div>
                        <form id="makeupForm" className="space-y-4 px-5 py-5 md:px-6 bg-gray-50/70">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-gray-700">날짜</span>
                                <input type="text" id="makeupDate" readOnly className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700 outline-none" />
                            </label>
                            <div className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-gray-700">학생</span>
                                <input type="search" id="makeupStudentQuery" placeholder="이름으로 검색" autoComplete="off" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                                <input type="hidden" id="makeupStudentId" defaultValue="" />
                                <div id="makeupStudentResults" className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-gray-200 bg-white hidden" />
                                <p id="makeupStudentSelected" className="mt-2 hidden text-sm font-semibold text-violet-700" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">시작</span>
                                    <input type="time" id="makeupStartTime" required className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">종료</span>
                                    <input type="time" id="makeupEndTime" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
                                </label>
                            </div>
                            <p className="text-xs text-gray-400">취소된 시간대는 겹쳐도 등록할 수 있습니다. 예정 수업과 겹치면 등록되지 않습니다.</p>
                            <p id="makeupFormError" className="hidden text-sm font-medium text-red-600" />
                        </form>
                        <div className="flex justify-end gap-2 border-t border-gray-200 bg-white px-5 py-4 md:px-6">
                            <button type="button" id="makeupModalCancelBtn" className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">취소</button>
                            <button type="submit" form="makeupForm" id="makeupSubmitBtn" className="rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-700">등록</button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="journalModal" className="fixed inset-0 z-50 hidden">
                <div id="journalModalBackdrop" className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm" />
                <div className="relative flex h-full items-center justify-center p-4 md:p-6">
                    <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
                        <div className="border-b border-gray-200 px-5 py-4 md:px-6 md:py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">Lesson Journal</p>
                                    <h3 id="journalModalTitle" className="mt-2 text-xl font-bold text-gray-900">일지 작성</h3>
                                    <p id="journalModalSubtitle" className="mt-1 text-sm text-gray-500">수업별 일지를 입력할 수 있습니다.</p>
                                </div>
                                <button type="button" id="journalModalCloseBtn" className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 hover:bg-gray-50">닫기</button>
                            </div>
                        </div>

                        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto bg-gray-50/70 px-5 py-5 md:px-6">
                            <form id="journalForm" className="space-y-5">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-semibold text-gray-700">날짜</span>
                                        <input type="text" id="journalDate" readOnly className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700 outline-none" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-semibold text-gray-700">생활연령</span>
                                        <input type="text" id="journalAge" readOnly className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700 outline-none" />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">수업내용</span>
                                    <textarea id="journalLessonContent" rows={6} placeholder="수업내용을 입력해 주세요." className="w-full rounded-2xl border border-green-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                                </label>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-semibold text-gray-700">금액</span>
                                        <select id="journalAmountType" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-semibold text-gray-700">시간</span>
                                        <input type="text" id="journalTime" placeholder="예: 14:00 - 14:40" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                                    </label>
                                </div>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">승인번호</span>
                                    <input type="text" id="journalApprovalNumber" placeholder="승인번호를 입력해 주세요." className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">부모상담</span>
                                    <textarea id="journalParentConsultation" rows={4} placeholder="부모상담 내용을 입력해 주세요." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                                </label>

                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">숙제</span>
                                    <textarea id="journalHomework" rows={3} placeholder="숙제를 입력해 주세요." className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100" />
                                </label>

                                <div>
                                    <span className="mb-1.5 block text-sm font-semibold text-gray-700">첨부파일</span>
                                    <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-4 md:flex-row md:items-center md:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-700">첨부파일 UI</p>
                                            <p id="journalAttachmentName" className="mt-1 truncate text-sm text-gray-500">선택된 파일 없음</p>
                                        </div>
                                        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">
                                            파일 선택
                                            <input type="file" id="journalAttachment" className="hidden" />
                                        </label>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-400">첨부파일은 UI만 제공되며, 현재 저장은 텍스트 필드만 지원합니다.</p>
                                </div>
                            </form>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-gray-200 bg-white px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                            <p className="text-xs text-gray-400">현재 일지 팝업은 UI만 구현되어 있으며 입력값은 저장되지 않습니다.</p>
                            <button type="button" id="journalModalConfirmBtn" className="inline-flex items-center justify-center rounded-full bg-[#00a832] px-5 py-2 text-sm font-semibold text-white hover:bg-green-700">확인</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
