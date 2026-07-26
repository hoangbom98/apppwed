/**
 * GameGrid.tsx — BoYue V5 game card grid
 * Canonical component (renamed from GameGridBoYue for shorter imports).
 * GameContainer and all views should import from here.
 */
import React from 'react';

export interface GameItem {
  id: string;
  name: string;
  icon: string;
  link?: string;
}

interface GameGridProps {
  games: GameItem[];
  onGameClick?: (game: GameItem) => void;
}

const GameGrid: React.FC<GameGridProps> = ({ games, onGameClick }) => {
  if (!games || games.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--game-text-secondary)', fontSize: 13 }}>
        Không có game nào
      </div>
    );
  }
  return (
    <div className="game-grid">
      {games.map((game) => (
        <div
          key={game.id}
          className="game-item"
          onClick={() => onGameClick?.(game)}
        >
          <div className="img-box">
            <img
              src={game.icon}
              alt={game.name}
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0.25';
              }}
            />
          </div>
          <div className="name">{game.name}</div>
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
