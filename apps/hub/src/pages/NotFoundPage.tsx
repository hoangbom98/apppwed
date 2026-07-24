import React from 'react';
import { Link } from 'react-router-dom';
export default function NotFoundPage() {
  return (
    <div className="text-center py-24">
      <div className="text-8xl font-black text-gray-700 mb-4">404</div>
      <p className="text-gray-400 mb-6">Trang không tồn tại</p>
      <Link to="/" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-500">Về trang chủ</Link>
    </div>
  );
}
