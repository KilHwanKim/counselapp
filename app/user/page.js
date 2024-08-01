"use client"
import React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
//import { connectDB } from "@/util/database";

export default function UserMng() {
  // //db에서 전체 학생 조회
  // let db = (await connectDB).db('counsel')
  // let result = await db.collection('user').find().toArray();
  // //id 변경
  // result = result.map((a)=>{
  //   a._id = a._id.toString()
  //   return a
  // })

  
  const columns = [
    { field: '_id', headerName: 'ID', width: 90 },
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
  

  const createInsertRow = (prevRows) => {
    return { id: prevRows.length+1, firstName: "test", age: 1 };
  };

  // const [data, setData] = React.useState(() => [
  //   { id: 1, lastName: 'Snow', firstName: 'Jon', age: 14 , status:"normal"},
  //   { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 31 },
  //   { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 31 },
  //   { id: 4, lastName: 'Stark', firstName: 'Arya', age: 11 },
  //   { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
  //   { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
  //   { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
  //   { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
  //   { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
  // ]);
  const data = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 14 , status:"normal"},
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 31 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 31 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 11 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
  ]
  // const handleAddRow = () => {
  //   setData((prevRows) => [...prevRows, createInsertRow(prevRows)]);
  // };
  
  return (
    <main className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="flex space-x-2">
        <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"  >
          추가onClick=handleAddRow
        </button>
        <button className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700">
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
      />


    </Box>

    
  </main>
  );
}
