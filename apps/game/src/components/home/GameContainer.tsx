import React, { useState } from 'react';
import SidebarNav from './SidebarNav';
import GameGrid from './GameGrid';
import type { GameItem } from './GameGrid';

interface Category {
  key: string;
  label: string;
  icon: string;
}

interface GameContainerProps {
  categories: Category[];
  games: Record<string, GameItem[]>;
  platformBanners?: Array<{ image: string; link?: string }>;
}

const GameContainer: React.FC<GameContainerProps> = ({ categories, games, platformBanners }) => {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.key || 'hot');
  const [activeSubTab, setActiveSubTab] = useState('hot');

  const currentGames = games[activeCategory] || [];

  const subTabs = [
    { key: 'hot', label: 'Hot' },
    { key: 'recent', label: 'Gần đây' },
    { key: 'favorite', label: 'Yêu thích' },
  ];

  const isHot = activeCategory === 'hot';

  return (
    <div className="game-container">
      <SidebarNav items={categories} activeKey={activeCategory} onSelect={setActiveCategory} />
      <div className="game-content">
        {isHot && (
          <div className="game-sub-tabs">
            {subTabs.map((tab) => (
              <button
                key={tab.key}
                className={`sub-tab ${activeSubTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveSubTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
        <GameGrid games={currentGames} />
        {platformBanners && platformBanners.length > 0 && (
          <div className="game-platform-banner">
            {platformBanners.map((banner, idx) => (
              <img key={idx} src={banner.image} alt="platform" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameContainer;
