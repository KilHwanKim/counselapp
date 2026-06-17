'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountSmsSendPage } from '@/js/pages/sms-send-page.js';
import { installStudentPickerGlobal } from '@/lib/student-picker.js';
import SmsToast, { SmsPageHeader } from '@/components/pages/sms/SmsShared';

export default function SmsSendClient() {
    const mount = useCallback(() => {
        installStudentPickerGlobal();
        mountSmsSendPage();
    }, []);

    return (
        <>
            <LegacyMount mount={mount} />
            <main className="flex-1 p-4 md:p-6 overflow-hidden min-h-0">
                <div className="flex h-full min-h-0 flex-col gap-4">
                    <SmsPageHeader
                        title="문자 발송"
                        description="학생을 선택하고 내용을 작성한 뒤 즉시 발송합니다. 템플릿은 적용만 가능하며, 관리는 템플릿 관리 메뉴에서 합니다."
                    />
                    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-5 md:py-5 space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">수신 학생 <span className="text-red-500">*</span></label>
                                <div className="flex flex-wrap items-stretch gap-2">
                                    <input type="text" id="smsStudentName" readOnly placeholder="학생을 선택해 주세요" className="min-w-0 flex-1 rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100" />
                                    <input type="hidden" id="smsStudentId" defaultValue="" />
                                    <input type="hidden" id="smsParentPhone" defaultValue="" />
                                    <button type="button" id="smsPickStudent" className="shrink-0 rounded-xl bg-[#00c73c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#00a832]">학생 선택</button>
                                    <button type="button" id="smsClearStudent" className="shrink-0 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">초기화</button>
                                </div>
                                <p id="smsPhoneDisplay" className="mt-1.5 text-sm text-gray-500 hidden" />
                                <p id="smsPhoneWarning" className="mt-1.5 text-sm text-amber-700 hidden">부모님 전화번호가 없습니다. 학생 관리에서 등록해 주세요.</p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700">문자 템플릿</label>
                                <div className="flex flex-wrap items-center gap-2">
                                    <select id="smsTemplateSelect" className="min-w-[180px] flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100" defaultValue="">
                                        <option value="">— 템플릿 선택 —</option>
                                    </select>
                                    <button type="button" id="smsApplyTemplate" className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">적용</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">수업 날짜 <span className="text-gray-400 font-normal">({'{lesson_date}'})</span></span>
                                    <input type="date" id="smsLessonDate" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100" />
                                </label>
                                <label className="block">
                                    <span className="mb-1.5 block text-sm font-medium text-gray-700">수업 시간 <span className="text-gray-400 font-normal">({'{lesson_time}'})</span></span>
                                    <input type="time" id="smsLessonTime" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100" />
                                </label>
                            </div>

                            <div>
                                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                                    <label className="text-sm font-medium text-gray-700">문자 내용</label>
                                    <span id="smsCharCount" className="text-xs text-gray-400">0자</span>
                                </div>
                                <textarea id="smsBody" rows={7} placeholder="템플릿을 선택하거나 직접 입력하세요." className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100 resize-y min-h-[140px]" />
                                <div className="mt-2 flex flex-wrap gap-1.5" id="smsVariableChips" />
                            </div>

                            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">미리보기</p>
                                <p id="smsPreview" className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800" />
                            </div>
                        </div>
                        <div className="border-t border-gray-100 px-4 py-3 md:px-5 flex flex-wrap items-center justify-between gap-3">
                            <p id="smsFormError" className="text-sm text-red-600 hidden" />
                            <div className="ml-auto flex flex-wrap gap-2">
                                <button type="button" id="smsCopyBtn" className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">문구 복사</button>
                                <button type="button" id="smsSendBtn" className="rounded-xl bg-[#00c73c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00a832]">즉시 발송</button>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
            <SmsToast />
        </>
    );
}
