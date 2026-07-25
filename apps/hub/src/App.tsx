import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { InstallPrompt, UpdateBanner } from '@ui';

import MainLayout from '@/layouts/MainLayout';

const HomePage       = lazy(() => import('@/pages/HomePage'));
const GamesPage      = lazy(() => import('@/pages/GamesPage'));
const NewsPage       = lazy(() => import('@/pages/NewsPage'));
const LoginPage      = lazy(() => import('@/pages/LoginPage'));
const NotFoundPage   = lazy(() => import('@/pages/NotFoundPage'));
const DownloadPage   = lazy(() => import('@/pages/DownloadPage'));
const WebsitesPage   = lazy(() => import('@/pages/WebsitesPage'));
const ToolsPage      = lazy(() => import('@/pages/ToolsPage'));
const ToolDetailPage = lazy(() => import('@/pages/ToolDetailPage'));
const NewsDetailPage = lazy(() => import('@/pages/NewsDetailPage'));
const GameDetailPage = lazy(() => import('@/pages/GameDetailPage'));
const CmsPage        = lazy(() => import('@/pages/CmsPage'));
const SearchPage     = lazy(() => import('@/pages/SearchPage'));
const ContactPage    = lazy(() => import('@/pages/ContactPage'));
const RegisterPage   = lazy(() => import('@/pages/RegisterPage'));
const ProfilePage    = lazy(() => import('@/pages/ProfilePage'));
const AboutPage      = lazy(() => import('@/pages/AboutPage'));
const PolicyPage     = lazy(() => import('@/pages/PolicyPage'));
const FaqPage        = lazy(() => import('@/pages/FaqPage'));
const FavoritesPage  = lazy(() => import('@/pages/FavoritesPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <>
    <InstallPrompt appName="LKVIP Hub" appIcon="/logo-152-152.png" />
    <UpdateBanner />
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index              element={<HomePage />} />
          <Route path="games"       element={<GamesPage />} />
          <Route path="games/:slug" element={<GameDetailPage />} />
          <Route path="websites"    element={<WebsitesPage />} />
          <Route path="tools"       element={<ToolsPage />} />
          <Route path="tools/:slug" element={<ToolDetailPage />} />
          <Route path="news"        element={<NewsPage />} />
          <Route path="news/:slug"  element={<NewsDetailPage />} />
          <Route path="pages/:slug" element={<CmsPage />} />
          <Route path="search"      element={<SearchPage />} />
          <Route path="contact"     element={<ContactPage />} />
          <Route path="login"       element={<LoginPage />} />
          <Route path="register"    element={<RegisterPage />} />
          <Route path="profile"     element={<ProfilePage />} />
          <Route path="download"    element={<DownloadPage />} />
          <Route path="about"       element={<AboutPage />} />
          <Route path="policy"      element={<PolicyPage />} />
          <Route path="faq"         element={<FaqPage />} />
          <Route path="favorites"   element={<FavoritesPage />} />
          <Route path="*"           element={<NotFoundPage />} />
        </Route>

        {/* Admin panel lives in a separate app (frontend/admin-dashboard).
            Any /admin/* requests here redirect to NotFound so users can't
            accidentally reach a non-existent admin panel. */}
        <Route path="admin/*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
    </>
  );
}
