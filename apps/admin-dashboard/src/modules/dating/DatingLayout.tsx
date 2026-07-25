// @ts-nocheck
import React from 'react';
import SchemaForm from '@admin/modules/shared/components/SchemaForm';

const datingSchema = [
  { key: 'profileName', label: 'Tên hiển thị', type: 'text',   required: true },
  { key: 'age',         label: 'Tuổi',         type: 'number', required: true, min: 18, max: 99 },
  { key: 'gender',      label: 'Giới tính',    type: 'select',
    options: [{ label: 'Nam', value: 'male' }, { label: 'Nữ', value: 'female' }, { label: 'Khác', value: 'other' }] },
  { key: 'bio',         label: 'Giới thiệu',   type: 'textarea', rows: 3, maxLength: 500 },
];

export default function DatingLayout() {
  const [values, setValues] = React.useState({});
  const handleChange = (key: string, val: unknown) => setValues(v => ({ ...v, [key]: val }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.warn('Dating Data:', values); };
  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-xl font-bold mb-4 text-white">Dating Management</h1>
      <SchemaForm schema={datingSchema} values={values} onChange={handleChange} onSubmit={handleSubmit} />
    </div>
  );
}
