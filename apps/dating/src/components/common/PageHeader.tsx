import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  title?: string;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
  transparent?: boolean;
}

export default function PageHeader({ title, rightSlot, onBack, transparent }: Props) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  return (
    <header className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${transparent ? '' : 'bg-white border-b border-gray-100'}`}>
      <button onClick={handleBack} className="p-1.5 -ml-1.5 rounded-full text-gray-600 hover:bg-gray-100">
        <ChevronLeft size={22} />
      </button>
      {title && <h1 className="font-bold text-base text-gray-900 absolute left-1/2 -translate-x-1/2">{title}</h1>}
      <div className="min-w-[32px] flex justify-end">{rightSlot}</div>
    </header>
  );
}
