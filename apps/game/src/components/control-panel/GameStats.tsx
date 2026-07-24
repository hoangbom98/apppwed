interface GameStatsData {
  totalGames: number;
  topGame: string;
}

interface Props {
  stats: GameStatsData;
}

export default function GameStats({ stats }: Props) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/5 p-4">
      <h2 className="text-sm font-semibold text-white mb-3">Thống kê game</h2>
      <p className="text-xs text-gray-400">Tổng lượt chơi: <span className="text-white font-medium">{stats.totalGames}</span></p>
      <p className="text-xs text-gray-400 mt-1">Game hot nhất: <span className="text-amber-400 font-medium">{stats.topGame}</span></p>
    </div>
  );
}

