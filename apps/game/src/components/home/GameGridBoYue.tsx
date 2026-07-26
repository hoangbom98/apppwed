import React from 'react';

export interface GameItemBoYue {
  id: string;
  name: string;
  icon: string;
  link?: string;
}

interface GameGridBoYueProps {
  games: GameItemBoYue[];
  onGameClick?: (game: GameItemBoYue) => void;
}

const GameGridBoYue: React.FC<GameGridBoYueProps> = ({ games, onGameClick }) => {
  if (!games || games.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: 'var(--game-text-secondary)' }}>
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
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.3'; }}
            />
          </div>
          <div className="name">{game.name}</div>
        </div>
      ))}
    </div>
  );
};

export default GameGridBoYue;
