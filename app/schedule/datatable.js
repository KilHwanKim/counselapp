'use client';
import React, { useState, useEffect } from "react";
import EditorPopup from "./EditorPopup"; // Quill 팝업 컴포넌트

const DataTable = ({ selectedDate, initialData = [] }) => {
  const [data, setData] = useState(
    initialData.map((item) => ({ ...item, status: "original" }))
  );
  const [originalData, setOriginalData] = useState(initialData);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  // 브라우저에서만 실행되는 로직은 useEffect로 이동
  useEffect(() => {
    console.log("DataTable has been mounted in the browser.");
  }, []);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const filteredData = selectedDate
    ? data.filter((item) => item.date === selectedDate && item.status !== "deleted")
    : [];

  const handleAddRow = () => {
    if (!selectedDate) {
      alert("날짜를 선택해주세요.");
      return;
    }
    const newRow = {
      id: Date.now(),
      date: selectedDate,
      time: "00:00",
      name: "새 이름",
      description: "수업 상태",
      status: "new",
    };
    setData((prevData) => [...prevData, newRow]);
  };

  const handleDeleteRow = () => {
    if (selectedRow) {
      setData((prevData) =>
        prevData.map((item) =>
          item.id === selectedRow ? { ...item, status: "deleted" } : item
        )
      );
      setSelectedRow(null);
    } else {
      alert("삭제할 행을 선택해주세요.");
    }
  };

  const handleSaveData = () => {
    alert("저장되었습니다!");
    setOriginalData(data.filter((item) => item.status !== "deleted"));
    setData((prevData) =>
      prevData.map((item) =>
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
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
            onClick={openPopup}
          >
            글 수정하기
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
              <th className="border border-gray-300 p-2">일지</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr
                key={item.id}
                className={`cursor-pointer ${selectedRow === item.id ? "bg-gray-100" : ""
                  }`}
                onClick={() => setSelectedRow(item.id)}
              >
                <td className="border border-gray-300 p-2">
                  <input
                    type="text"
                    value={item.time}
                    onChange={(e) =>
                      setData((prevData) =>
                        prevData.map((dataItem) =>
                          dataItem.id === item.id
                            ? { ...dataItem, time: e.target.value }
                            : dataItem
                        )
                      )
                    }
                    className="w-full p-1 border border-gray-300 rounded"
                  />
                </td>
                <td className="border border-gray-300 p-2">{item.name}</td>
                <td className="border border-gray-300 p-2">{item.description}</td>
                <td className="border border-gray-300 p-2">
                  <button onClick={openPopup}>일지</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>{selectedDate ? "데이터가 없습니다." : "날짜를 선택해주세요."}</p>
      )}
      {isPopupOpen && <EditorPopup isPopupOpen={isPopupOpen} closePopup={closePopup} />}
    </div>
  );
};

export default DataTable;
