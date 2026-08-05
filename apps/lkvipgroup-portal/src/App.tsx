import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Trang chủ lkvipgroup-portal</div>} />
      </Routes>
    </BrowserRouter>
  );
}
