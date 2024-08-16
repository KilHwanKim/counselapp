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
  const [data, setData] = React.useState(() => props.userList);
  const [selectRows, setSelectRows] = React.useState({});
  const [rowModesModel, setRowModesModel] = React.useState({});

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };


  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow};
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
    try {
      const response = await fetch('api/post/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), // 수정된 데이터를 서버로 전송
      });

      if (!response.ok) {
        throw new Error('데이터 저장 실패');
      }

      const result = await response.json();
      console.log('저장된 데이터:', result);
      
    } catch (error) {
      console.error('AJAX 요청 오류:', error);
      throw error;
    }
  };
  const handleDelete = async () => {
      // const selectedRows = getSelectedRows();
      console.log(selectRows);
  //   try {
  //     const response = await fetch('api/post/edit', {
  //       method: 'DELETE',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data), // 수정된 데이터를 서버로 전송
  //     });

  //     if (!response.ok) {
  //       throw new Error('데이터 저장 실패');
  //     }

  //     const result = await response.json();
  //     console.log('저장된 데이터:', result);
      
  //   } catch (error) {
  //     console.error('AJAX 요청 오류:', error);
  //     throw error;
  //   }
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
          <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700" 
          onClick={handleDelete}>
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
          processRowUpdate={processRowUpdate}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 30,
              },
            },
          }}
          onRowSelectionModelChange={(ids) => {
            setSelectRows(ids.map((id) => data.find((row) => row.id === id)));
            
            
          }}


          pageSizeOptions={[30]}
          checkboxSelection
          disableRowSelectionOnClick
        />
      </Box>
    </div>
  )
}