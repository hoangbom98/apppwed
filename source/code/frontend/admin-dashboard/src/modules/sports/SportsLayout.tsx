import React from 'react';
import SchemaForm from '@admin/modules/shared/components/SchemaForm';

const sportsSchema = [
  { key: 'matchName', label: 'Tên trận đấu', type: 'text',   required: true },
  { key: 'odds',      label: 'Tỷ lệ cược',  type: 'number', required: true, min: 1 },
  { key: 'league',    label: 'Giải đấu',    type: 'text' },
];

export default function SportsLayout() {
  const [values, setValues] = React.useState({});
  const handleChange = (key: string, val: unknown) => setValues(v => ({ ...v, [key]: val }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log('Sports Data:', values); };
  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-xl font-bold mb-4 text-white">Sports Management</h1>
      <SchemaForm schema={sportsSchema} values={values} onChange={handleChange} onSubmit={handleSubmit} />
    </div>
  );
}
