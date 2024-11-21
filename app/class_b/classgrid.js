'use client'
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { v4 as uuidv4 } from 'uuid';

export default function ClassGrid(props) {
  // 학생 데이터
  const [students, setStudents] = useState([
    { id: uuidv4(), name: 'John Doe', age: 20, major: 'Computer Science' },
    { id: uuidv4(), name: 'Jane Smith', age: 22, major: 'Mathematics' },
    { id: uuidv4(), name: 'Michael Johnson', age: 21, major: 'Physics' },
  ]);

  // 수업 데이터
  const [classes, setClasses] = useState([
    { id: uuidv4(), studentId: students[0]?.id, className: 'Algorithms', schedule: 'MWF 10:00-11:00' },
    { id: uuidv4(), studentId: students[0]?.id, className: 'Data Structures', schedule: 'TTh 14:00-15:30' },
    { id: uuidv4(), studentId: students[1]?.id, className: 'Calculus', schedule: 'MWF 09:00-10:00' },
    { id: uuidv4(), studentId: students[1]?.id, className: 'Linear Algebra', schedule: 'TTh 13:00-14:30' },
    { id: uuidv4(), studentId: students[2]?.id, className: 'Quantum Mechanics', schedule: 'MWF 11:00-12:00' },
  ]);

  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [filteredClasses, setFilteredClasses] = useState([]);

  // 학생 선택 시 수업 필터링
  useEffect(() => {
    if (selectedStudentId) {
      const studentClasses = classes.filter((c) => c.studentId === selectedStudentId);
      setFilteredClasses(studentClasses);
    } else {
      setFilteredClasses([]);
    }
  }, [selectedStudentId, classes]);

  const studentColumns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'age', headerName: 'Age', width: 100 },
    { field: 'major', headerName: 'Major', width: 200 },
  ];

  const classColumns = [
    { field: 'className', headerName: 'Class Name', width: 200 },
    { field: 'schedule', headerName: 'Schedule', width: 300 },
  ];
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', height: '90vh', width: '100%', boxSizing: 'border-box' }}>
    {/* 학생 조회 그리드 */}
    <Box sx={{ flex: 1, height: '100%', padding: 1 }}>
      <h2>학생 조회</h2>
      <DataGrid
        rows={students}
        columns={studentColumns}
        pageSizeOptions={[5]}
        onRowSelectionModelChange={(ids) => {
          setSelectedStudentId(ids[0]);
        }}
        checkboxSelection={false}
      />
    </Box>

    {/* 수업 조회 그리드 */}
    <Box sx={{ flex: 1, height: '100%', padding: 1 }}>
      <h2>수업 조회</h2>
      <DataGrid
        rows={filteredClasses}
        columns={classColumns}
        pageSizeOptions={[5]}
        disableSelectionOnClick
      />
    </Box>
  </Box>
  )
}