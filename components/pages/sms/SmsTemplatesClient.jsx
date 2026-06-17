'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountSmsTemplatesPage } from '@/js/pages/sms-templates-page.js';
import SmsToast, { SmsPageHeader } from '@/components/pages/sms/SmsShared';

export default function SmsTemplatesClient() {
    const mount = useCallback(() => {
        mountSmsTemplatesPage();
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
                                <h2 className="mt-2 text-2xl font-bold text-gray-900">템플릿 관리</h2>
                                <p className="mt-2 text-sm text-gray-500">자주 쓰는 문자 문구를 저장해 두고, 발송·예약 화면에서 불러와 사용합니다.</p>
                            </div>
                            <button type="button" id="smsNewTemplateBtn" className="shrink-0 rounded-xl bg-[#00c73c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#00a832]">+ 템플릿 추가</button>
                        </div>
                    </section>
                    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div id="smsTemplatesEmpty" className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-gray-500">
                            등록된 템플릿이 없습니다.
                        </div>
                        <div id="smsTemplatesList" className="hidden flex-1 overflow-y-auto" />
                    </section>
                </div>
            </main>

            <div id="smsTemplateModal" className="fixed inset-0 z-50 hidden">
                <div className="absolute inset-0 bg-black/50" id="smsTemplateModalBackdrop" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                        <div className="p-5 border-b border-gray-100 shrink-0">
                            <h3 id="smsTemplateModalTitle" className="text-lg font-bold text-gray-900">템플릿 추가</h3>
                        </div>
                        <form id="smsTemplateForm" className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <input type="hidden" id="smsTemplateEditId" defaultValue="" />
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-700">템플릿 이름</label>
                                    <input type="text" id="smsTemplateName" required placeholder="예: 보강 안내" className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100" />
                                </div>
                                <div>
                                    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                                        <label className="text-sm font-medium text-gray-700">문자 내용</label>
                                        <span id="smsTemplateCharCount" className="text-xs text-gray-400">0자</span>
                                    </div>
                                    <textarea id="smsTemplateBody" rows={7} required placeholder="템플릿을 작성하세요. 아래 변수를 클릭해 삽입할 수 있습니다." className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#00a832] focus:ring-2 focus:ring-green-100 resize-y min-h-[140px]" />
                                    <div className="mt-2 flex flex-wrap gap-1.5" id="smsTemplateVariableChips" />
                                </div>
                                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">미리보기</p>
                                    <p id="smsTemplatePreview" className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800" />
                                </div>
                            </div>
                            <div className="flex gap-2 p-5 border-t border-gray-100 shrink-0">
                                <button type="submit" className="flex-1 rounded-xl bg-[#00c73c] py-2.5 text-sm font-semibold text-white hover:bg-[#00a832]">저장</button>
                                <button type="button" id="smsTemplateModalCancel" className="flex-1 rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">취소</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <SmsToast />
        </>
    );
}
