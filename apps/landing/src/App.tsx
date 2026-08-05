import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Ví dụ lazy loading trang Index
const Index = lazy(() => import('./pages/Index'));

function App() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <Routes>
        <Route path="/" element={<Index />} />
        {/* Các routes khác sẽ được thêm vào đây */}
      </Routes>
    </Suspense>
  );
}

export default App;
