import React from 'react';
import SchemaForm from '@admin/modules/shared/components/SchemaForm';

const tradeSchema = [
  { key: 'symbol',   label: 'Cặp tiền tệ (VD: BTC/USDT)', type: 'text',   required: true },
  { key: 'leverage', label: 'Đòn bẩy',                    type: 'number', required: true, min: 1, max: 100 },
  { key: 'maxOrder', label: 'Lệnh tối đa/user',           type: 'number', min: 1 },
];

export default function TradeLayout() {
  const [values, setValues] = React.useState({});
  const handleChange = (key: string, val: unknown) => setValues(v => ({ ...v, [key]: val }));
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); console.log('Trade Data:', values); };
  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-xl font-bold mb-4 text-white">Trade Management</h1>
      <SchemaForm schema={tradeSchema} values={values} onChange={handleChange} onSubmit={handleSubmit} />
    </div>
  );
}
