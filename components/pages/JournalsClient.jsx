'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountJournalsPage } from '@/js/pages/journals-page.js';
import { installStudentPickerGlobal } from '@/lib/student-picker.js';

export default function JournalsClient() {
    const mount = useCallback(() => {
        installStudentPickerGlobal();
        mountJournalsPage();
    }, []);

    return (
        <>
            <LegacyMount mount={mount} />
            <main className="flex-1 p-4 md:p-6 overflow-hidden min-h-0">
                <div className="flex h-full min-h-0 flex-col gap-4">
                    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">Journal Browser</p>
                                <h2 className="mt-2 text-2xl font-bold text-gray-900">학생별 월간 일지 조회</h2>
                                <p className="mt-2 text-sm text-gray-500">학생과 월을 선택하면 해당 기간의 실제 수업을 마스터-디테일 구조로 볼 수 있습니다.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1fr)_180px_auto]">
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">학생 선택</span>
                                    <div className="flex flex-wrap items-stretch gap-2">
                                        <input type="text" id="journalStudentName" readOnly placeholder="전체 학생" className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100" />
                                        <input type="hidden" id="journalStudentId" defaultValue="" />
                                        <button type="button" id="journalPickStudent" className="shrink-0 rounded-xl bg-[#00c73c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00a832]">선택</button>
                                        <button type="button" id="journalClearStudent" className="shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">전체</button>
                                    </div>
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">조회 월</span>
                                    <input type="month" id="monthFilter" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100" />
                                </label>
                                <div className="flex items-end">
                                    <button type="button" id="resetFiltersBtn" className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">초기화</button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid flex-1 min-h-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,0.95fr)_minmax(0,1.25fr)]">
                        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-4 py-4 md:px-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">Master List</p>
                                        <h3 className="mt-2 text-lg font-bold text-gray-900">일지 대상 수업 목록</h3>
                                        <p id="listSummary" className="mt-1 text-sm text-gray-500">조회 조건을 불러오는 중입니다.</p>
                                    </div>
                                    <div className="rounded-2xl bg-green-50 px-4 py-3 text-center min-w-[88px]">
                                        <p className="text-[11px] font-medium text-gray-500">총 건수</p>
                                        <p id="listCount" className="mt-1 text-2xl font-bold leading-none text-[#00a832]">0</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-gray-50/70 p-4 md:p-5 min-h-0">
                                <div id="listError" className="hidden mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" />
                                <div id="journalList">
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">일지 대상 수업을 불러오는 중입니다.</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-200 px-4 py-4 md:px-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">Detail</p>
                                        <h3 id="detailTitle" className="mt-2 text-xl font-bold text-gray-900">일지를 선택하세요</h3>
                                        <p id="detailSubtitle" className="mt-1 text-sm text-gray-500">좌측 목록에서 수업을 선택하면 상세 내용이 표시됩니다.</p>
                                    </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2 pt-0.5">
                                        <button type="button" id="journalDetailSaveBtn" className="hidden inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold">저장</button>
                                        <div id="detailStatusBadge" className="hidden rounded-full px-3 py-1 text-xs font-semibold" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto bg-gray-50/70 p-4 md:p-5 min-h-0">
                                <div id="detailBody" className="space-y-4">
                                    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-5 py-10 text-center text-gray-500">선택된 수업이 없습니다.</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
