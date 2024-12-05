'use client';
import React from "react";
import Quill from "react-quill";
import "react-quill/dist/quill.snow.css";

const EditorPopup = ({ isPopupOpen, closePopup }) => {
  const [name, setName] = React.useState(""); // 이름
  const [content, setContent] = React.useState("<p>수업 내용을 입력하세요</p>");
  const [attendance, setAttendance] = React.useState("present"); // 출석/결석
  const [birthDate, setBirthDate] = React.useState(""); // 생일
  const [age, setAge] = React.useState({ years: null, months: null }); // 나이와 개월
  const [payment, setPayment] = React.useState(""); // 결제 금액
  const [remarks, setRemarks] = React.useState(""); // 비고
  const [parentNote, setParentNote] = React.useState(""); // 부모 상담
  const [homework, setHomework] = React.useState(""); // 숙제

  // 생일 변경 시 나이 계산
  const handleBirthDateChange = (e) => {
    const selectedDate = e.target.value;
    setBirthDate(selectedDate);

    if (selectedDate) {
      const today = new Date();
      const birth = new Date(selectedDate);

      let years = today.getFullYear() - birth.getFullYear();
      let months = today.getMonth() - birth.getMonth();

      // 생일이 아직 안 지났으면 나이 - 1
      if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
        years -= 1;
        months += 12;
      }

      // 개월 단위 계산
      if (today.getDate() < birth.getDate()) {
        months -= 1;
        if (months < 0) {
          years -= 1;
          months += 12;
        }
      }

      setAge({ years, months });
    } else {
      setAge({ years: null, months: null }); // 생일이 입력되지 않았을 때
    }
  };

  const saveContent = () => {
    const savedData = {
      name,
      attendance,
      birthDate,
      age,
      content,
      payment,
      remarks,
      parentNote,
      homework,
    };
    alert("저장된 내용: " + JSON.stringify(savedData, null, 2));
    closePopup();
  };

  if (!isPopupOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-3/4 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">수업 정보 입력</h2>

        {/* 스크롤 가능 영역 */}
        <div className="overflow-y-auto max-h-[70vh] pr-4">
          {/* 이름 입력 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">이름</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="border p-2 rounded w-full"
            />
          </div>

          {/* 출석/결석 선택 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">출석 여부</h3>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="attendance"
                  value="present"
                  checked={attendance === "present"}
                  onChange={() => setAttendance("present")}
                />
                <span>출석</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="attendance"
                  value="absent"
                  checked={attendance === "absent"}
                  onChange={() => setAttendance("absent")}
                />
                <span>결석</span>
              </label>
            </div>
          </div>

          {/* 생일 입력 및 나이와 개월 표시 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">생일</h3>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={birthDate}
                onChange={handleBirthDateChange}
                className="border p-2 rounded w-2/3"
              />
              <span className="text-gray-700">
                {age.years !== null
                  ? `나이: ${age.years}세 ${age.months}개월`
                  : "생일을 입력해주세요"}
              </span>
            </div>
          </div>

          {/* 수업 내용 작성 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">수업 내용</h3>
            <Quill
              theme="snow"
              value={content}
              onChange={setContent}
              className="mb-4"
            />
          </div>

          {/* 결제 금액 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">결제 금액</h3>
            <input
              type="text"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              placeholder="금액을 입력하세요"
              className="border p-2 rounded w-full"
            />
          </div>

          {/* 비고 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">비고</h3>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="비고를 입력하세요"
              className="border p-2 rounded w-full"
            />
          </div>

          {/* 부모 상담 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">부모 상담</h3>
            <textarea
              value={parentNote}
              onChange={(e) => setParentNote(e.target.value)}
              placeholder="부모 상담 내용을 입력하세요"
              className="border p-2 rounded w-full"
            />
          </div>

          {/* 숙제 */}
          <div className="mb-4">
            <h3 className="font-bold mb-2">숙제</h3>
            <textarea
              value={homework}
              onChange={(e) => setHomework(e.target.value)}
              placeholder="숙제 내용을 입력하세요"
              className="border p-2 rounded w-full"
            />
          </div>
        </div>

        {/* 버튼들 */}
        <div className="flex justify-end space-x-4 mt-4">
          <button
            className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            onClick={closePopup}
          >
            취소
          </button>
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={saveContent}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorPopup;
