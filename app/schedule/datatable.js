'use client';
import React, { useState, useEffect } from "react";

const DataTable = ({ selectedDate, initialData = [] }) => {
  // 초기 데이터 상태 관리
  const [data, setData] = useState(
    initialData.map((item) => ({ ...item, status: "original" }))
  );
  const [originalData, setOriginalData] = useState(initialData);

  const filteredData = selectedDate
    ? data.filter((item) => item.date === selectedDate && item.status !== "deleted")
    : [];

  const [selectedRow, setSelectedRow] = useState(null);

  const handleAddRow = () => {
    if (!selectedDate) {
      alert("날짜를 선택해주세요.");
      return;
    }

    const newRow = {
      id: Date.now(), // 고유 ID
      date: selectedDate,
      time: "00:00",
      name: "새 이름",
      description: "수업 상태",
      status: "new", // 새로 추가된 행
    };
    setData([...data, newRow]);
  };

  const handleDeleteRow = () => {
    if (selectedRow) {
      setData(
        data.map((item) =>
          item.id === selectedRow ? { ...item, status: "deleted" } : item
        )
      );
      setSelectedRow(null);
    } else {
      alert("삭제할 행을 선택해주세요.");
    }
  };

  const handleInputChange = (id, field, value) => {
    setData(
      data.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
              status: item.status === "new" ? "new" : "modified", // 수정된 상태 반영
            }
          : item
      )
    );
  };

  const handleSaveData = () => {
    // 상태별 데이터 분류
    const addedRows = data.filter((item) => item.status === "new");
    const modifiedRows = data.filter((item) => item.status === "modified");
    const deletedRows = originalData.filter(
      (item) => !data.some((d) => d.id === item.id)
    );
    const unchangedRows = data.filter((item) => item.status === "original");

    console.log("추가된 행:", addedRows);
    console.log("수정된 행:", modifiedRows);
    console.log("삭제된 행:", deletedRows);
    console.log("변경되지 않은 행:", unchangedRows);

    alert("저장되었습니다!");
    // 원본 데이터 업데이트
    setOriginalData(data.filter((item) => item.status !== "deleted"));
    setData(
      data.map((item) =>
        item.status === "new" || item.status === "modified"
          ? { ...item, status: "original" }
          : item
      )
    );
  };

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          날짜: {selectedDate || "날짜를 선택해주세요"}
        </h2>

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          <button
            onClick={handleAddRow}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            추가
          </button>
          <button
            onClick={handleDeleteRow}
            className={`px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 ${
              !selectedRow ? "opacity-50 cursor-not-allowed" : ""
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
        </div>
      </div>

      {filteredData.length > 0 ? (
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border border-gray-300 p-2">시간</th>
              <th className="border border-gray-300 p-2">이름</th>
              <th className="border border-gray-300 p-2">수업 상태</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className={`cursor-pointer ${
                  selectedRow === item.id ? "bg-gray-100" : ""
                }`}
                onClick={() => setSelectedRow(item.id)}
              >
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={item.time}
                    onChange={(e) =>
                      handleInputChange(item.id, "time", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) =>
                      handleInputChange(item.id, "name", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      handleInputChange(item.id, "description", e.target.value)
                    }
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{selectedDate ? "데이터가 없습니다." : "날짜를 선택해주세요."}</p>
      )}
    </div>
  );
};

export default DataTable;
