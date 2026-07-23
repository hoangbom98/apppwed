import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import DatingLayout from '@/layouts/DatingLayout';
import IncomingCallOverlay from '@/components/call/IncomingCallOverlay';
import { ASSET_NAV } from '@/utils/constants';
import { InstallPrompt } from '@ui/pwa/install';
import { UpdateBanner }  from '@ui/pwa/update';

// ── Auth ────────────────────────────────────────────────────────────────────
const Login           = lazy(() => import('@/pages/Login'));
const Register        = lazy(() => import('@/pages/Register'));
const Verify          = lazy(() => import('@/pages/Verify'));
const Onboarding      = lazy(() => import('@/pages/Onboarding'));
const DownloadPage    = lazy(() => import('@/pages/Download'));

// ── Main tabs ───────────────────────────────────────────────────────────────
const Home            = lazy(() => import('@/pages/Home'));
const Discovery       = lazy(() => import('@/pages/Discovery'));
const Swipe           = lazy(() => import('@/pages/Swipe'));
const Matches         = lazy(() => import('@/pages/Matches'));
const Live            = lazy(() => import('@/pages/Live'));
const LiveRoom        = lazy(() => import('@/pages/LiveRoom'));
const Broadcast       = lazy(() => import('@/pages/Broadcast'));
const Feed            = lazy(() => import('@/pages/Feed'));
const Stories         = lazy(() => import('@/pages/Stories'));
const Shorts          = lazy(() => import('@/pages/Shorts'));

// ── Chat / Calls ────────────────────────────────────────────────────────────
const ChatList        = lazy(() => import('@/pages/ChatList'));
const ChatRoom        = lazy(() => import('@/pages/ChatRoom'));
const VoiceCall       = lazy(() => import('@/pages/VoiceCall'));
const VideoCall       = lazy(() => import('@/pages/VideoCall'));

// ── Wallet / VIP / Shop ─────────────────────────────────────────────────────
const Wallet          = lazy(() => import('@/pages/Wallet'));
const Recharge        = lazy(() => import('@/pages/Recharge'));
const Vip             = lazy(() => import('@/pages/Vip'));
const Shop            = lazy(() => import('@/pages/Shop'));

// ── Gamification ─────────────────────────────────────────────────────────────
const Daily           = lazy(() => import('@/pages/Daily'));
const Level           = lazy(() => import('@/pages/Level'));

// ── Profile / Social ─────────────────────────────────────────────────────────
const Profile         = lazy(() => import('@/pages/Profile'));
const UserProfile     = lazy(() => import('@/pages/UserProfile'));
const EditProfile     = lazy(() => import('@/pages/EditProfile'));
const Settings        = lazy(() => import('@/pages/Settings'));
const Notifications   = lazy(() => import('@/pages/Notifications'));

// ── Discovery extras ─────────────────────────────────────────────────────────
const Community       = lazy(() => import('@/pages/Community'));
const Nearby          = lazy(() => import('@/pages/Nearby'));
const Search          = lazy(() => import('@/pages/Search'));
const Referral        = lazy(() => import('@/pages/Referral'));
const Support         = lazy(() => import('@/pages/Support'));
const PartyRoom       = lazy(() => import('@/pages/PartyRoom'));
const PremiumDating   = lazy(() => import('@/pages/PremiumDating'));
const Events          = lazy(() => import('@/pages/Events'));
const Creator         = lazy(() => import('@/pages/Creator'));

// ── Bottom nav ───────────────────────────────────────────────────────────────
const bottomNavItems = [
  { to: '/',        label: 'Trang chủ', activeSrc: ASSET_NAV.HOME_ACTIVE,  inactiveSrc: ASSET_NAV.HOME_INACTIVE  },
  { to: '/matches', label: 'Kết đôi',  activeSrc: ASSET_NAV.MATCH_ACTIVE, inactiveSrc: ASSET_NAV.MATCH_INACTIVE },
  { to: '/live',    label: 'Live',      activeSrc: ASSET_NAV.DATE_ACTIVE,  inactiveSrc: ASSET_NAV.DATE_INACTIVE  },
  { to: '/chat',    label: 'Nhắn tin',  activeSrc: ASSET_NAV.VIDEO_ACTIVE, inactiveSrc: ASSET_NAV.VIDEO_INACTIVE },
  { to: '/profile', label: 'Tôi',      activeSrc: ASSET_NAV.ME_ACTIVE,    inactiveSrc: ASSET_NAV.ME_INACTIVE    },
];

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-10 h-10 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.has_onboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function FullscreenRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { token, fetchProfile } = useAuthStore();

  useEffect(() => {
    if (token) fetchProfile();
  }, []); // eslint-disable-line

  useSocket();

  return (
    <Suspense fallback={<Loading />}>
      <InstallPrompt appName="KJC Dating" appIcon="/icons/app-icon.svg" />
      <UpdateBanner />
      <IncomingCallOverlay />
      <Routes>
        {/* ── Public auth & standalone pages ── */}
        <Route path="/login"      element={<Login />} />
        <Route path="/register"   element={<Register />} />
        <Route path="/verify"     element={<Verify />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/download"   element={<DownloadPage />} />

        {/* ── Fullscreen pages (no bottom nav) ── */}
        <Route path="/voice-call/:userId" element={<FullscreenRoute><VoiceCall /></FullscreenRoute>} />
        <Route path="/video-call/:userId" element={<FullscreenRoute><VideoCall /></FullscreenRoute>} />
        <Route path="/live/:id"           element={<FullscreenRoute><LiveRoom /></FullscreenRoute>} />
        <Route path="/broadcast"          element={<FullscreenRoute><Broadcast /></FullscreenRoute>} />
        <Route path="/chat/:userId"       element={<FullscreenRoute><ChatRoom /></FullscreenRoute>} />
        <Route path="/stories"            element={<FullscreenRoute><Stories /></FullscreenRoute>} />
        <Route path="/shorts"             element={<FullscreenRoute><Shorts /></FullscreenRoute>} />

        {/* ── Main app layout (with bottom nav) ── */}
        <Route element={<DatingLayout bottomNavItems={bottomNavItems} />}>
          <Route path="/"             element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/discovery"    element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
          <Route path="/swipe"        element={<ProtectedRoute><Swipe /></ProtectedRoute>} />
          <Route path="/matches"      element={<ProtectedRoute><Matches /></ProtectedRoute>} />
          <Route path="/live"         element={<ProtectedRoute><Live /></ProtectedRoute>} />
          <Route path="/feed"         element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/chat"         element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
          <Route path="/wallet"       element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/recharge"     element={<ProtectedRoute><Recharge /></ProtectedRoute>} />
          <Route path="/vip"          element={<ProtectedRoute><Vip /></ProtectedRoute>} />
          <Route path="/shop"         element={<ProtectedRoute><Shop /></ProtectedRoute>} />
          <Route path="/daily"        element={<ProtectedRoute><Daily /></ProtectedRoute>} />
          <Route path="/level"        element={<ProtectedRoute><Level /></ProtectedRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/profile/:id"  element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
          <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/community"    element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/nearby"       element={<ProtectedRoute><Nearby /></ProtectedRoute>} />
          <Route path="/search"       element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/referral"     element={<ProtectedRoute><Referral /></ProtectedRoute>} />
          <Route path="/support"      element={<ProtectedRoute><Support /></ProtectedRoute>} />
          <Route path="/party"        element={<ProtectedRoute><PartyRoom /></ProtectedRoute>} />
          <Route path="/premium-dating" element={<ProtectedRoute><PremiumDating /></ProtectedRoute>} />
          <Route path="/events"       element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/creator"      element={<ProtectedRoute><Creator /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
