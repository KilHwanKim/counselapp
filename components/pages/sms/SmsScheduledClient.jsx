'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountSmsScheduledPage } from '@/js/pages/sms-scheduled-page.js';
import { installStudentPickerGlobal } from '@/lib/student-picker.js';
import SmsToast, { SmsPageHeader } from '@/components/pages/sms/SmsShared';

export default function SmsScheduledClient() {
    const mount = useCallback(() => {
        installStudentPickerGlobal();
        mountSmsScheduledPage();
    }, []);

    return (
        <>
            <LegacyMount mount={mount} />
            <main className="flex-1 p-4 md:p-6 overflow-hidden min-h-0">
                <div className="flex h-full min-h-0 flex-col gap-4">
                    <SmsPageHeader
                        title="예약 발송"
                        description="예약 일시를 지정해 문자를 등록합니다. 예약 취소는 발송 내역에서 할 수 있습니다."
                    />
                    <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-3 md:px-5">
                                <h3 className="text-base font-bold text-gray-900">예약 등록</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5 space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">수신 학생 <span className="text-red-500">*</span></label>
                                    <div className="flex flex-wrap items-stretch gap-2">
                                        <input type="text" id="smsStudentName" readOnly placeholder="학생을 선택해 주세요" className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm" />
                                        <input type="hidden" id="smsStudentId" defaultValue="" />
                                        <input type="hidden" id="smsParentPhone" defaultValue="" />
                                        <button type="button" id="smsPickStudent" className="shrink-0 rounded-xl bg-[#00c73c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00a832]">학생 선택</button>
                                        <button type="button" id="smsClearStudent" className="shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">초기화</button>
                                    </div>
                                    <p id="smsPhoneDisplay" className="mt-1.5 text-sm text-gray-500 hidden" />
                                    <p id="smsPhoneWarning" className="mt-1.5 text-sm text-amber-700 hidden">부모님 전화번호가 없습니다.</p>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">문자 템플릿</label>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <select id="smsTemplateSelect" className="min-w-[180px] flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm" defaultValue="">
                                            <option value="">— 템플릿 선택 —</option>
                                        </select>
                                        <button type="button" id="smsApplyTemplate" className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">적용</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-gray-700">수업 날짜</span>
                                        <input type="date" id="smsLessonDate" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm" />
                                    </label>
                                    <label className="block">
                                        <span className="mb-1.5 block text-sm font-medium text-gray-700">수업 시간</span>
                                        <input type="time" id="smsLessonTime" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm" />
                                    </label>
                                </div>
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-700">문자 내용</label>
                                        <span id="smsCharCount" className="text-xs text-gray-400">0자</span>
                                    </div>
                                    <textarea id="smsBody" rows={5} placeholder="문자 내용을 입력하세요." className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm resize-y min-h-[120px]" />
                                    <div className="mt-2 flex flex-wrap gap-1.5" id="smsVariableChips" />
                                </div>
                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">미리보기</p>
                                    <p id="smsPreview" className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800" />
                                </div>
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">예약 일시 <span className="text-red-500">*</span></span>
                                    <input type="datetime-local" id="smsScheduledAt" className="w-full max-w-xs rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm" />
                                </label>
                            </div>
                            <div className="border-t border-gray-100 px-4 py-3 md:px-5 flex justify-end gap-2">
                                <p id="smsFormError" className="mr-auto text-sm text-red-600 hidden" />
                                <button type="button" id="smsScheduleBtn" className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">예약 등록</button>
                            </div>
                        </section>

                        <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-3 md:px-5 flex items-center justify-between gap-2">
                                <h3 className="text-base font-bold text-gray-900">예약 목록</h3>
                                <span id="smsScheduledCount" className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">0건</span>
                            </div>
                            <div id="smsScheduledEmpty" className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-gray-500">
                                예약된 문자가 없습니다.
                            </div>
                            <div id="smsScheduledList" className="hidden flex-1 overflow-y-auto divide-y divide-gray-100" />
                        </section>
                    </div>
                </div>
            </main>

            <div id="smsScheduledPreviewModal" className="fixed inset-0 z-50 hidden">
                <div className="absolute inset-0 bg-black/50" id="smsScheduledPreviewModalBackdrop" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-gray-900">미리보기</h3>
                            <button type="button" id="smsScheduledPreviewModalClose" className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">닫기</button>
                        </div>
                        <div className="p-5 overflow-y-auto">
                            <p id="smsScheduledPreviewModalText" className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800" />
                        </div>
                    </div>
                </div>
            </div>
            <SmsToast />
        </>
    );
}
