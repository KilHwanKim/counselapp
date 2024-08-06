"use client"
import React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
export default function UserMng() {
  const columns = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'firstName',
      headerName: 'First name',
      width: 150,
      editable: true,
    },
    {
      field: 'lastName',
      headerName: 'Last name',
      width: 150,
      editable: true,
    },
    {
      field: 'age',
      headerName: 'Age',
      type: 'number',
      width: 110,
      editable: true,
    },
    {
      field: 'fullName',
      headerName: 'Full name',
      description: 'This column has a value getter and is not sortable.',
      sortable: false,
      width: 160,
      valueGetter: (value, row) => `${row.firstName || ''} ${row.lastName || ''}`,
    },
  ];
  
  //선택된 첵크박스
  const [rowSelectionModel, setRowSelectionModel] =
  React.useState<GridRowSelectionModel>([]);

  const createInsertRow = (prevRows) => {
    
    return { id: prevRows.length+1, firstName: "test", age: 1 };
  };

  const [data, setData] = React.useState(() => [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 14 , status:"normal"},
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 31 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 31 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 11 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
  ]);

  const handleAddRow = () => {
    setData((prevRows) => [...prevRows, createInsertRow(prevRows)]);
  };
  
  return (
    <main className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="flex space-x-2">
        <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"  onClick={handleAddRow}>
          추가
        </button>
        <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700" >
          삭제
        </button>
        <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
          저장
          
        </button>
      </div>
    </div>
    {/* <Table columns={columns} data={data} /> */}
    <Box sx={{ height: '100%', width: '100%' }}>
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
        rowSelectionModel={rowSelectionModel}
      />


    </Box>

    
  </main>
  );
}
