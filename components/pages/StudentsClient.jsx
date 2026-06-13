'use client';

import { useCallback } from 'react';
import LegacyMount from '@/components/LegacyMount';
import { mountStudentsPage } from '@/js/pages/students-page.js';

export default function StudentsClient() {
    const mount = useCallback(() => {
        mountStudentsPage();
    }, []);

    return (
        <>
            <LegacyMount mount={mount} />
            <main className="flex-1 p-6 overflow-hidden flex flex-col min-h-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-800">학생 관리</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <input type="text" id="searchInput" placeholder="이름, 전화번호, 유형, 장애유형, 특이사항 검색..." className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64 focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                        <button type="button" id="addBtn" className="bg-[#00c73c] hover:bg-[#00a832] text-white font-medium px-4 py-2 rounded-md transition">추가</button>
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden flex-1 min-h-0 flex flex-col">
                    <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">이름</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">부모님 전화번호</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">생활연령</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">처음온 날짜</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">유형</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">장애유형</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">특이사항</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">작업</th>
                                </tr>
                            </thead>
                            <tbody id="gridBody" className="divide-y divide-gray-200 bg-white" />
                        </table>
                    </div>
                    <div id="gridEmpty" className="hidden px-4 py-8 text-center text-gray-500 text-sm">등록된 학생이 없습니다.</div>
                    <div id="paginationBar" className="hidden border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between gap-3">
                        <p id="pageInfo" className="text-sm text-gray-600" />
                        <div className="flex items-center gap-2">
                            <button type="button" id="prevPageBtn" className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">이전</button>
                            <button type="button" id="nextPageBtn" className="px-3 py-1.5 rounded-md border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">다음</button>
                        </div>
                    </div>
                </div>
            </main>
            <div id="modal" className="fixed inset-0 z-50 hidden">
                <div className="absolute inset-0 bg-black/50" id="modalBackdrop" />
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h3 id="modalTitle" className="text-lg font-bold text-gray-800 mb-4">학생 추가</h3>
                            <form id="modalForm" className="space-y-4">
                                <input type="hidden" id="editId" defaultValue="" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                                    <input type="text" id="mName" required className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">부모님 전화번호</label>
                                    <input type="text" id="mParentPhone" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                                    <input type="date" id="mBirthDate" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">처음온 날짜</label>
                                    <input type="date" id="mFirstVisitDate" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                                </div>
                                <input type="hidden" id="mRegDate" defaultValue="" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
                                    <input type="text" id="mStudentType" placeholder="예: 바-라, 꿈이든, 일반" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">장애유형</label>
                                    <input type="text" id="mDisabilityType" placeholder="예: 자폐, 지적, 언어" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
                                    <textarea id="mNotes" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00c73c] focus:border-[#00c73c]" />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className="flex-1 bg-[#00c73c] hover:bg-[#00a832] text-white font-medium py-2 rounded-md transition">저장</button>
                                    <button type="button" id="modalCancel" className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-md transition">취소</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
