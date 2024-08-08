'use client'
import React, { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import { DataGrid, GridRowEditStopReasons} from '@mui/x-data-grid';
import { v4 as uuidv4 } from 'uuid';
export default function UserGrid(props) {
  
  // 헤더 칼럼 정보 
  const columns = [
    {
      field: 'status',
      headerName: '상태',
      width: 150,
    },
    {
      field: 'name',
      headerName: '이름',
      width: 150,
      editable: true,
    },
    {
      field: 'phoneNumber',
      headerName: '전화번호',
      width: 150,
      editable: true,
    },
    {
      field: 'birth',
      headerName: '생년월일',
      type: 'date',
      width: 110,
      editable: true,
    },

  ];
  // useState
  const [data, setData] = React.useState(() => props.userList
  );
  const [rowModesModel, setRowModesModel] = React.useState({});

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };


  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    setData(data.map((row) => (row.id === newRow.id ? updatedRow : row)));
    
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };


  // Event handler for adding a new row
  const handleAddRow = () => {
    const newRow = {
      id: uuidv4(), // Generate a unique ID for the new row
      status: 'insert',
      name: '',
      phoneNumber: '',
      birth: null,
    };
    setData((prevData) => [...prevData, newRow]);
  };
  //수정중이던 그리드가 저장되게
  const handleCellEditCommit = useCallback((params) => {
    setData((prevData) =>
      prevData.map((row) => (row.id === params.id ? { ...row, [params.field]: params.value } : row))
    );
  }, []);


  const handleSave = async () => {
    // 데이터 저장 로직 추가
    console.log('저장된 데이터:', data);
    // 실제로는 서버에 저장하는 API 호출 등을 여기에 추가
  };
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">학생 관리</h1>
        <div className="flex space-x-2">
          <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          onClick={handleAddRow}>
            추가
          </button>
          <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700" >
            삭제
          </button>
          <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
      
      {/* 그리드 영역 */}
      <Box sx={{ height: '90%', width: '100%' }}>
        <DataGrid
          rows={data}
 
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 30,
              },
            },
          }}
          pageSizeOptions={[30]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>
    </div>
  )
}