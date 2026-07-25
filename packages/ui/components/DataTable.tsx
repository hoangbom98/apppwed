// @ts-nocheck
import React from 'react';

export const DataTable = ({ columns, data }) => {
  return (
    <table className="min-w-full bg-white border border-gray-200">
      <thead>
        <tr className="bg-gray-50">
          {columns.map(col => <th key={col.key} className="p-3 border-b text-left">{col.label}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-b">
            {columns.map(col => <td key={col.key} className="p-3">{row[col.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
