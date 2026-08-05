import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Import providers/layouts
import RootLayout from './layouts/RootLayout'; // Assuming I move layout logic here

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RootLayout>
          <Routes>
            <Route path="/" element={<div>Trang chủ Academy</div>} />
            <Route path="/login" element={<div>Trang đăng nhập</div>} />
            {/* Add routes for /courses, /my based on existing structure */}
          </Routes>
        </RootLayout>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}
