"use client"
import Table from "./table";
import React from 'react';
export default function UserMng() {
  const columns = React.useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id',
      },
      {
        Header: 'Name',
        accessor: 'name',
      },
      {
        Header: 'Email',
        accessor: 'email',
      },
    ],
    []
  );

  const data = React.useMemo(
    () => [
      { id: 1, name: 'Alice', email: 'alice@example.com', status: 'normal' },
      { id: 2, name: 'Bob', email: 'bob@example.com', status: 'insert' },
      { id: 3, name: 'Charlie', email: 'charlie@example.com', status: 'update' },
      { id: 4, name: 'Charlie', email: 'charlie@example.com', status: 'delete' }
    ],
    []
  );
  return (
    <main className="p-4">
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="flex space-x-2">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
          추가
        </button>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700">
          삭제
        </button>
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700">
          저장
        </button>
      </div>
    </div>
    <Table columns={columns} data={data} />
  </main>
  );
}
