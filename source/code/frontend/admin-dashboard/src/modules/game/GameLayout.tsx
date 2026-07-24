// Stub layout — replaced by per-page components in routes/index.jsx.
// Uses SchemaForm for demonstration only; real forms are in pages/GameConfig.jsx.
import React from 'react';
import SchemaForm from '@admin/modules/shared/components/SchemaForm';

const gameSchema = [
  { key: 'gameName',   label: 'Tên game', type: 'text',   required: true },
  { key: 'rtp',        label: 'RTP (%)',   type: 'number', required: true, min: 0, max: 100 },
  { key: 'volatility', label: 'Volatility', type: 'select',
    options: [
      { label: 'Thấp',  value: 'low' },
      { label: 'Trung', value: 'medium' },
      { label: 'Cao',   value: 'high' },
    ],
  },
];

export default function GameLayout() {
  const [values, setValues] = React.useState({});
  const handleChange = (key: string, val: unknown) => setValues(v => ({ ...v, [key]: val }));
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.warn('Game Data:', values);
  };
  return (
    <div className="p-4 max-w-xl">
      <h1 className="text-xl font-bold mb-4 text-white">Game Management</h1>
      <SchemaForm schema={gameSchema} values={values} onChange={handleChange} onSubmit={handleSubmit} />
    </div>
  );
}
