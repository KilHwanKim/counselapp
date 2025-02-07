'use client';
import React, { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한글 로케일 불러오기
import DataTable from "./datatable";
// 글로벌로 한글 로케일 설정
dayjs.locale("ko");

const Calendar = ({ data }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(null);

  // 현재 월의 일 수와 시작 요일 계산
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = currentMonth.startOf("month").day();

  // 날짜 생성
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 데이터가 있는 날짜 확인 함수
  const hasData = (date) =>
    data.some(
      (item) => item.date === currentMonth.date(date).format("YYYY-MM-DD")
    );

  // 날짜 선택 함수
  const onDateSelect = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/3">
        <div className="w-full p-4 border-r">
          {/* 월 이동 버튼 및 현재 월 */}
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
              className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
            >
              {"<"}
            </button>
            <h2 className="text-lg font-bold">
              {currentMonth.format("MMMM YYYY")} {/* "11월 2023" */}
            </h2>
            <button
              onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}
              className="px-2 py-1 bg-gray-300 rounded hover:bg-gray-400"
            >
              {">"}
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 text-center font-semibold">
            {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* 날짜 렌더링 */}
          <div className="grid grid-cols-7 gap-2">
            {/* 시작 요일 앞에 빈 칸 추가 */}
            {Array(startDay)
              .fill(null)
              .map((_, index) => (
                <div key={`empty-${index}`} />
              ))}

            {/* 날짜 표시 */}
            {dates.map((date) => (
              <button
                key={date}
                className={`p-2 text-center rounded ${hasData(date) ? "bg-blue-200" : "bg-gray-100"
                  } hover:bg-blue-300`}
                onClick={() =>
                  onDateSelect(currentMonth.date(date).format("YYYY-MM-DD"))
                }
              >
                {date}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="w-2/3">
        <DataTable selectedDate={selectedDate} initialData={data} />
      </div>
    </div>
  );
};

export default Calendar;
