'use client'
import React, { useState, useEffect } from 'react';
import Calendar from "./calendar";
import DataTable from "./datatable";

const Home = () => {
  const [selectedDate, setSelectedDate] = useState(null);

  const mockData = [
    { id: 1,time:"9:00",  date: "2024-11-20", description: "한달 동안 수업한 횟수", name:'장재신' },
    { id: 2,time:"10:00", date: "2024-11-21", description: "Event 2" , name:'노현성'},
    { id: 3,time:"12:00", date: "2024-11-22", description: "Event 3" , name:'이한길'},
    { id: 4,time:"9:00",  date: "2024-11-20", description: "Event 1", name:'김성겸' },
    { id: 5,time:"10:00", date: "2024-11-20", description: "Event 2" , name:'노현성'},
    { id: 6,time:"12:00", date: "2024-11-20", description: "Event 3" , name:'이한길'},
  ];

  return (
    <div className="flex h-screen">
      <div className="w-1/3">
        {/* <Calendar data={mockData} onDateSelect={setSelectedDate} /> */}
      </div>
      <div className="w-2/3">
        {/* <DataTable selectedDate={selectedDate} initialData={mockData} /> */}
      </div>
    </div>
  );
};

export default Home;
