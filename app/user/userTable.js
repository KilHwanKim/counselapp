'use client';
import React, { useState } from "react";
import * as XLSX from "xlsx";

const UserTable = ({ data }) => {
    const [users, setUsers] = useState(data);
    const [selectedRow, setSelectedRow] = useState(null);

    // Excel Import
    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        
        // 파일 있는 지 체크
        if (!file) {
            console.log('Please select a file.');
            return;
        }
        //form 만들기
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                alert("새롭게 저장되었습니다.");
                
            } else {
                console.log(result.error || 'Something went wrong.');
            }
        } catch (error) {
            console.log(error);
            console.log('Error uploading file.');
        }
    };

    // Excel Export
    const handleExportExcel = async () => {
        try {
            const response = await fetch("/api/excel", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    type: "user",
                    data: users
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to download Excel file');
            }

            // 응답을 Blob으로 변환
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            // 파일 다운로드 처리
            const a = document.createElement('a');
            a.href = url;
            a.download = `user_data.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Error saving data:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    
    return (
        <div className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">사용자 정보</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                        Excel 내보내기
                    </button>
                    <label className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 cursor-pointer">
                        Excel 가져오기
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleImportExcel}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>
            <table className="w-full border-collapse border border-gray-200">
                <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">이름</th>
                        <th className="border border-gray-300 p-2">부모 전화번호</th>
                        <th className="border border-gray-300 p-2">생년월일</th>
                        <th className="border border-gray-300 p-2">생활연령</th>
                        <th className="border border-gray-300 p-2">비고 </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user._id}
                            className={`cursor-pointer`}
                            onClick={() => setSelectedRow(user.id)}
                        >
                            {/* 이름 */}
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="text"
                                    value={user.name}
                                    readOnly
                                    className="w-full p-1 border border-gray-300 rounded"
                                />
                            </td>
                            {/* 부모 전화번호 */}
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="text"
                                    value={user.phoneNumber}
                                    readOnly
                                    className="w-full p-1 border border-gray-300 rounded"
                                />
                            </td>
                            {/* 생년월일 */}
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="date"
                                    value={user.birth}
                                    readOnly
                                    className="w-full p-1 border border-gray-300 rounded"
                                />
                            </td>
                            {/* 생활연령 */}
                            <td className="border border-gray-300 p-2 text-center">
                                {user.age}
                            </td>

                            <td className="border border-gray-300 p-2">
                                <input
                                    type="text"
                                    value={user.notes}
                                    readOnly
                                    className="w-full p-1 border border-gray-300 rounded"
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;
