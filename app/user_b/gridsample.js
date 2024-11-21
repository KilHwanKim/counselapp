'use client'
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
  GridRowModes,
  DataGrid,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from '@mui/x-data-grid';
import {
  randomCreatedDate,
  randomTraderName,
  randomId,
  randomArrayItem,
} from '@mui/x-data-grid-generator';

const roles = ['Market', 'Finance', 'Development'];
const randomRole = () => {
  return randomArrayItem(roles);
};



function EditToolbar(props) {
  const { setRows, setRowModesModel } = props;

  const handleClick = () => {
    const id = randomId();
    setRows((oldRows) => [...oldRows, { id, name: '', age: '', isNew: true }]);
    setRowModesModel((oldModel) => ({
      ...oldModel,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
    }));
  };

  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={handleClick}>
        Add record
      </Button>
    </GridToolbarContainer>
  );
}

export default function FullFeaturedCrudGrid(props) {
  
  const initialRows = props.userList
  const [rows, setRows] = React.useState(initialRows);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [updatedRows, setUpdatedRows] = React.useState([]); // 추적할 수정된 데이터

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
  };

  // const handleSaveClick = (id) => () => {
  //   setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  //   console.log("테스트");
  //   console.log(rows);
  // };


  const handleSaveClick = (id) => async () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });

    // AJAX 요청을 통해 서버에 데이터 저장
    try {
      await saveUpdatedRows(); // saveUpdatedRows 함수를 통해 데이터 저장
      alert('데이터가 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('데이터 저장 중 오류 발생:', error);
      alert('데이터 저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteClick = (id) => () => {
    setRows(rows.filter((row) => row.id !== id));
    console.log(id);
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = rows.find((row) => row.id === id);
    if (editedRow.isNew) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  // const processRowUpdate = (newRow) => {
  //   const updatedRow = { ...newRow, isNew: false };
  //   setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));
  //   console.log(rows);
  //   return updatedRow;
  // };

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    setRows(rows.map((row) => (row.id === newRow.id ? updatedRow : row)));

    // 수정된 데이터를 추적
    setUpdatedRows((prevUpdatedRows) => {
      const existingRowIndex = prevUpdatedRows.findIndex((row) => row.id === newRow.id);
      if (existingRowIndex >= 0) {
        // 이미 수정된 데이터가 있으면 덮어쓰기
        const newUpdatedRows = [...prevUpdatedRows];
        newUpdatedRows[existingRowIndex] = updatedRow;
        return newUpdatedRows;
      } else {
        // 새로 수정된 데이터를 추가
        return [...prevUpdatedRows, updatedRow];
      }
    });

    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    
    setRowModesModel(newRowModesModel);
    //수정함수 만들려고 합니다.

  };
  //저장함수 
  const saveUpdatedRows = async () => {
    try {
      const response = await fetch('api/post/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rows), // 수정된 데이터를 서버로 전송
      });

      if (!response.ok) {
        throw new Error('데이터 저장 실패');
      }

      const result = await response.json();
      console.log('저장된 데이터:', result);
      setUpdatedRows([]); // 성공적으로 저장되면 수정된 데이터 배열 초기화
    } catch (error) {
      console.error('AJAX 요청 오류:', error);
      throw error;
    }
  };

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
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      cellClassName: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;

        if (isInEditMode) {
          return [
            <GridActionsCellItem
              icon={<SaveIcon />}
              label="Save"
              sx={{
                color: 'primary.main',
              }}
              onClick={handleSaveClick(id)}
            />,
            <GridActionsCellItem
              icon={<CancelIcon />}
              label="Cancel"
              className="textPrimary"
              onClick={handleCancelClick(id)}
              color="inherit"
            />,
          ];
        }

        return [
          <GridActionsCellItem
            icon={<EditIcon />}
            label="Edit"
            className="textPrimary"
            onClick={handleEditClick(id)}
            color="inherit"
          />,
          <GridActionsCellItem
            icon={<DeleteIcon />}
            label="Delete"
            onClick={handleDeleteClick(id)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <Box
      sx={{
        height: 500,
        width: '100%',
        '& .actions': {
          color: 'text.secondary',
        },
        '& .textPrimary': {
          color: 'text.primary',
        },
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={handleRowModesModelChange}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        slots={{
          toolbar: EditToolbar,
        }}
        slotProps={{
          toolbar: { setRows, setRowModesModel },
        }}
      />
    </Box>
  );
}