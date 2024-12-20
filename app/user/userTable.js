'use client';
import React, { useState } from "react";
import * as XLSX from "xlsx";

const UserTable = ({ data }) => {
    const [users, setUsers] = useState(data);
    const [selectedRow, setSelectedRow] = useState(null);

    // 새로운 행 추가
    const handleAddRow = () => {
        const newRow = {
            _id: Date.now(),
            name: "",
            parentPhone: "",
            birthday: "",
            notes: "",
            status: "new",
        };
        setUsers((prevUsers) => [...prevUsers, newRow]);
    };

    // 행 삭제
    const handleDeleteRow = () => {
        if (selectedRow) {
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user.id === selectedRow ? { ...user, status: "deleted" } : user
                )
            );
            setSelectedRow(null);
        } else {
            alert("삭제할 행을 선택해주세요.");
        }
    };

    // 데이터 저장
    const handleSaveData = async () => {
        const dataToSave = users.filter((user) => user.status !== "original");
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(dataToSave),
            });
            if (response.ok) {
                alert("데이터 저장 성공!");
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.status === "new" || user.status === "modified"
                            ? { ...user, status: "original" }
                            : user
                    )
                );
            } else {
                alert("저장에 실패했습니다.");
            }
        } catch (error) {
            console.error("Error saving data:", error);
            alert("저장 중 오류가 발생했습니다.");
        }
    };

    // Excel Import
    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const importedData = XLSX.utils.sheet_to_json(sheet).map((row) => ({
                _id: Date.now() + Math.random(),
                name: row["name"] || "",
                parentPhone: row["phoneNumber"] || "",
                birthday: row["birthday"] || "",
                notes: row["notes"] || "",
                status: "new",
            }));
            setUsers((prevUsers) => [...prevUsers, ...importedData]);
        };
        reader.readAsArrayBuffer(file);
    };

    // Excel Export
    const handleExportExcel = () => {
        const exportData = users.map(({ _id, ...rest }) => rest);
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
        XLSX.writeFile(workbook, "users.xlsx");
    };

    // 상태에 따른 색상 클래스 지정
    const getStatusClass = (status) => {
        switch (status) {
            case "new":
                return "bg-blue-100";
            case "modified":
                return "bg-yellow-100";
            case "deleted":
                return "bg-red-100 line-through";
            default:
                return "";
        }
    };

    return (
        <div className="w-full p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">사용자 정보</h2>
                <div className="flex gap-2">
                    <button
                        onClick={handleAddRow}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        추가
                    </button>
                    <button
                        onClick={handleDeleteRow}
                        className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${!selectedRow ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        disabled={!selectedRow}
                    >
                        삭제
                    </button>
                    <button
                        onClick={handleSaveData}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                        저장
                    </button>
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
                        <th className="border border-gray-300 p-2">생일</th>
                        <th className="border border-gray-300 p-2">특이사항</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user._id}
                            className={`cursor-pointer ${getStatusClass(user.status)} ${selectedRow === user.id ? "ring-2 ring-gray-300" : ""
                                }`}
                            onClick={() => setSelectedRow(user.id)}
                        >
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="text"
                                    value={user.name}
                                    onChange={(e) =>
                                        setUsers((prevUsers) =>
                                            prevUsers.map((u) =>
                                                u.id === user.id
                                                    ? { ...u, name: e.target.value, status: "modified" }
                                                    : u
                                            )
                                        )
                                    }
                                    className="w-full p-1 border border-gray-300 rounded"
                                />
                            </td>
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="text"
                                    value={user.parentPhone}
                                    onChange={(e) =>
                                        setUsers((prevUsers) =>
                                            prevUsers.map((u) =>
                                                u.id === user.id
                                                    ? { ...u, parentPhone: e.target.value, status: "modified" }
                                                    : u
                                            )
                                        )
                                    }
                                    className="w-full p-1 border border-gray-300 rounded"
                                />
                            </td>
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="date"
                                    value={user.birthday}
                                    onChange={(e) =>
                                        setUsers((prevUsers) =>
                                            prevUsers.map((u) =>
                                                u.id === user.id
                                                    ? { ...u, birthday: e.target.value, status: "modified" }
                                                    : u
                                            )
                                        )
                                    }
                                    className="w-full p-1 border border-gray-300 rounded"
                                />
                            </td>
                            <td className="border border-gray-300 p-2">
                                <input
                                    type="text"
                                    value={user.notes}
                                    onChange={(e) =>
                                        setUsers((prevUsers) =>
                                            prevUsers.map((u) =>
                                                u.id === user.id
                                                    ? { ...u, notes: e.target.value, status: "modified" }
                                                    : u
                                            )
                                        )
                                    }
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
