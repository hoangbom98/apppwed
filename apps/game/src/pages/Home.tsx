import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BannerCarousel from '../components/home/BannerCarousel';
import NoticeBar from '../components/home/NoticeBar';
import AuthQuickPanel from '../components/home/AuthQuickPanel';
import GameContainer from '../components/home/GameContainer';
import {
  getBanners,
  getNotices,
  getCategories,
  getGames,
  getPlatformBanners,
} from '../data/mockData';
import type { GameItemBoYue } from '../components/home/GameGridBoYue';

const PageHome: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();

  const [banners, setBanners]               = useState<{ id: string; image: string }[]>([]);
  const [notices, setNotices]               = useState<string[]>([]);
  const [categories, setCategories]         = useState<{ key: string; label: string; icon: string }[]>([]);
  const [games, setGames]                   = useState<Record<string, GameItemBoYue[]>>({});
  const [platformBanners, setPlatformBanners] = useState<{ image: string }[]>([]);

  useEffect(() => {
    setBanners(getBanners());
    setNotices(getNotices());
    setCategories(getCategories());
    setGames(getGames());
    setPlatformBanners(getPlatformBanners());
  }, []);

  return (
    <>
      <BannerCarousel banners={banners} />
      <NoticeBar notices={notices} />
      <AuthQuickPanel
        isLoggedIn={isLoggedIn}
        user={user ?? undefined}
        onLogin={() => navigate('/login')}
        onRegister={() => navigate('/register')}
      />
      <GameContainer
        categories={categories}
        games={games}
        platformBanners={platformBanners}
      />
    </>
  );
};

export default PageHome;
