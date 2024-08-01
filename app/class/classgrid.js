'use client'
import React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
export default function ClassGrid(props) {
  // client에서 가져올 경우 검색엔진 노출 안됨
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
  console.log(props)
  const [data, setData] = React.useState(() => props.userList

  );
  return (
    <div>
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