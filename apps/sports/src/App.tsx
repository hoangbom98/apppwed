import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';
import SportsLayout from './layouts/SportsLayout';
import { InstallPrompt } from '@ui/pwa/install';
import { UpdateBanner }  from '@ui/pwa/update';

// ── Auth & standalone pages ───────────────────────────────────────────────────
const LoginPage       = lazy(() => import('./pages/Login'));
const RegisterPage    = lazy(() => import('./pages/Register'));
const DownloadPage    = lazy(() => import('./pages/Download'));

// ── Main pages ────────────────────────────────────────────────────────────────
const HomePage        = lazy(() => import('./pages/Home'));
const SchedulePage    = lazy(() => import('./pages/Schedule'));
const MatchDetailPage = lazy(() => import('./pages/MatchDetail'));
const StandingsPage   = lazy(() => import('./pages/Standings'));
const HighlightsPage  = lazy(() => import('./pages/Highlights'));
const VideoFeedPage   = lazy(() => import('./pages/VideoFeed'));
const NewsPage        = lazy(() => import('./pages/News'));
const ArticleDetail   = lazy(() => import('./pages/ArticleDetail'));
const CommunityPage   = lazy(() => import('./pages/Community'));
const StreamsPage     = lazy(() => import('./pages/Streams'));
const StreamDetail    = lazy(() => import('./pages/StreamDetail'));
const SearchPage      = lazy(() => import('./pages/Search'));
const KnowledgePage   = lazy(() => import('./pages/Knowledge'));
const KnowledgeDetail = lazy(() => import('./pages/KnowledgeDetail'));
const BettingPage      = lazy(() => import('./pages/Betting'));
const LeagueDetailPage = lazy(() => import('./pages/LeagueDetail'));
const LeaguesPage      = lazy(() => import('./pages/Leagues'));
const TeamsPage        = lazy(() => import('./pages/Teams'));
const TeamDetailPage   = lazy(() => import('./pages/TeamDetail'));
const FavoritesPage    = lazy(() => import('./pages/Favorites'));

// ── Protected pages ───────────────────────────────────────────────────────────
const ProfilePage       = lazy(() => import('./pages/Profile'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const SettingsPage      = lazy(() => import('./pages/Settings'));
const SupportPage       = lazy(() => import('./pages/Support'));
const WalletPage        = lazy(() => import('./pages/WalletPage'));

// ── Guards ────────────────────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />;
}

// ── Loading spinner ────────────────────────────────────────────────────────────
function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) fetchProfile();
  }, []); // eslint-disable-line

  useSocket();

  return (
    <Suspense fallback={<Loading />}>
      <InstallPrompt appName="LKVIP Sports" appIcon="/icons/app-icon.svg" />
      <UpdateBanner />
      <Routes>
        {/* ── Standalone auth pages ── */}
        <Route path="login"    element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="download" element={<DownloadPage />} />

        {/* ── Main app layout ── */}
        <Route element={<SportsLayout />}>
          {/* Public */}
          <Route index                       element={<HomePage />} />
          <Route path="schedule"             element={<SchedulePage />} />
          <Route path="matches/:id"          element={<MatchDetailPage />} />
          <Route path="standings"            element={<StandingsPage />} />
          <Route path="highlights"           element={<HighlightsPage />} />
          <Route path="highlights/:slug"     element={<HighlightsPage />} />
          <Route path="videos"               element={<VideoFeedPage />} />
          <Route path="news"                 element={<NewsPage />} />
          <Route path="news/:slug"           element={<ArticleDetail />} />
          <Route path="community"            element={<CommunityPage />} />
          <Route path="streams"              element={<StreamsPage />} />
          <Route path="streams/:id"          element={<StreamDetail />} />
          <Route path="search"               element={<SearchPage />} />
          <Route path="knowledge"            element={<KnowledgePage />} />
          <Route path="knowledge/:slug"      element={<KnowledgeDetail />} />
          <Route path="betting"              element={<BettingPage />} />
          <Route path="leagues/:slug"        element={<LeagueDetailPage />} />
          <Route path="leagues"              element={<LeaguesPage />} />
          <Route path="teams"                element={<TeamsPage />} />
          <Route path="teams/:slug"          element={<TeamDetailPage />} />
          <Route path="favorites"            element={<FavoritesPage />} />

          {/* Protected */}
          <Route path="profile"       element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="settings"      element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="support"       element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
          <Route path="wallet"        element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
