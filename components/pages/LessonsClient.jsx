'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountLessonsPage } from '@/js/pages/lessons-page.js';
import { installStudentPickerGlobal } from '@/lib/student-picker.js';

export default function LessonsClient() {
    const mount = useCallback(() => {
        installStudentPickerGlobal();
        mountLessonsPage();
    }, []);

    return (
        <>
            <LegacyMount mount={mount} />
            <div className="lessons-page">
                <main className="main-content p-6">
                    <div className="flex justify-between items-end mb-4 flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">주간 수업 일정</h2>
                            <p className="text-gray-500 text-sm">9:00 - 18:00 (높이로 시간 표시)</p>
                        </div>
                        <button type="button" id="registerBtn" className="bg-[#00c73c] text-white px-5 py-2.5 rounded-lg font-bold hover:shadow-lg transition">+ 수업 등록</button>
                    </div>
                    <div id="loadErrorBanner" className="hidden mb-3 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm" />

                    <div className="calendar-header">
                        <div /><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div>
                    </div>

                    <div className="calendar-container">
                        <div className="calendar-body w-full">
                            <div className="time-labels flex-1 flex flex-col min-h-0" id="timeLabels" />
                            <div className="calendar-right">
                                <div className="grid-background" id="gridBg" />
                                <div className="lesson-layer" id="lessonLayer">
                                    <div className="lesson-slot" data-day="1" />
                                    <div className="lesson-slot" data-day="2" />
                                    <div className="lesson-slot" data-day="3" />
                                    <div className="lesson-slot" data-day="4" />
                                    <div className="lesson-slot" data-day="5" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <div id="slotModal" className="fixed inset-0 z-50 hidden">
                <div className="absolute inset-0 bg-black/50" id="slotModalBackdrop" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 id="slotModalTitle" className="text-lg font-bold text-gray-800 mb-4">수업 등록</h3>
                            <input type="hidden" id="slotEditStartTime" defaultValue="" />
                            <input type="hidden" id="slotEditDay" defaultValue="" />
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">요일</label>
                                    <select id="slotDay" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]">
                                        <option value="1">월</option>
                                        <option value="2">화</option>
                                        <option value="3">수</option>
                                        <option value="4">목</option>
                                        <option value="5">금</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                                    <div className="flex items-center gap-2">
                                        <select id="slotStartHour" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                        <span className="text-gray-500">시</span>
                                        <select id="slotStartMin" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                        <span className="text-gray-500">분</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">끝나는 시간</label>
                                    <div className="flex items-center gap-2">
                                        <select id="slotEndHour" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                        <span className="text-gray-500">시</span>
                                        <select id="slotEndMin" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm" />
                                        <span className="text-gray-500">분</span>
                                    </div>
                                </div>
                                <div id="slotStudentRow">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">학생</label>
                                    <div className="flex gap-2">
                                        <input type="text" id="slotStudentName" readOnly placeholder="학생 선택" className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50" />
                                        <input type="hidden" id="slotStudentId" defaultValue="" />
                                        <button type="button" id="slotPickStudent" className="px-4 py-2 bg-[#00c73c] hover:bg-[#00a832] text-white text-sm font-medium rounded-md">선택</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">색상</label>
                                    <input type="hidden" id="slotColor" defaultValue="" />
                                    <div id="slotColorPalette" className="flex flex-wrap gap-2" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4 mt-4 border-t border-gray-200">
                                <button type="button" id="slotSaveBtn" className="flex-1 bg-[#00c73c] hover:bg-[#00a832] text-white font-medium py-2 rounded-md">저장</button>
                                <button type="button" id="slotCancelBtn" className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-md">취소</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
