import React from 'react';
import { useTable } from 'react-table';

const getStatusStyle = (status) => {
  switch (status) {
    case 'insert':
      return 'bg-green-100 text-green-800';
    case 'delete':
      return 'bg-red-100 text-red-800';
    case 'update':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const Table = ({ columns, data }) => {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable({ columns, data });

  return (
    <div className="overflow-x-auto">
      <table {...getTableProps()} className="min-w-full bg-white border border-gray-200">
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              <th className="px-1 py-2 border-b border-gray-200 bg-gray-100 text-left text-sm font-medium text-gray-900">
                상태
              </th>
              {headerGroup.headers.map(column => (
                <th
                  {...column.getHeaderProps()}
                  className="px-4 py-2 border-b border-gray-200 bg-gray-100 text-left text-sm font-medium text-gray-900"
                >
                  {column.render('Header')}
                </th>
              ))}

            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map(row => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} className="even:bg-gray-50">
                                <td
                  className={`px-1 py-2 border-b border-gray-200 text-sm ${getStatusStyle(row.original.status)}`}
                >
                  {row.original.status}
                </td>
                {row.cells.map(cell => (
                  <td
                    {...cell.getCellProps()}
                    className="px-4 py-2 border-b border-gray-200 text-sm text-gray-700"
                  >
                    {cell.render('Cell')}
                  </td>
                ))}

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
