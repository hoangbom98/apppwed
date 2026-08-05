import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Trang chủ invest</div>} />
      </Routes>
    </BrowserRouter>
  );
}
