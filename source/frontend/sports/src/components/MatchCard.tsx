import React from 'react';
import { Link } from 'react-router-dom';
import { MATCH_STATUS } from '../utils/constants';
import { formatMatchTime, formatScore } from '../utils/formatters';

interface Match {
  id: number;
  homeTeam: { name: string; logo?: string };
  awayTeam: { name: string; logo?: string };
  startTime: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  league?: { name: string; logo?: string };
}

export default function MatchCard({ match }: { match: Match }) {
  const statusCfg = MATCH_STATUS[match.status] || MATCH_STATUS.scheduled;
  const isLive = match.status === 'live';

  return (
    <Link to={`/matches/${match.id}`} className="block">
      <div className={`bg-gray-800 rounded-xl p-3 ${isLive ? 'ring-1 ring-green-500/40' : ''}`}>
        {/* League + Time row */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 truncate max-w-[60%]">
            {match.league?.name || ''}
          </span>
          <span className={`text-xs font-semibold ${statusCfg.color} ${isLive ? 'animate-pulse' : ''}`}>
            {isLive ? '● LIVE' : match.status === 'finished' ? statusCfg.label : formatMatchTime(match.startTime)}
          </span>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-2">
          {/* Home */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            {match.homeTeam.logo
              ? <img src={match.homeTeam.logo} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
              : <div className="w-7 h-7 bg-gray-600 rounded-full flex-shrink-0" />}
            <span className="text-sm font-medium truncate">{match.homeTeam.name}</span>
          </div>

          {/* Score */}
          <div className="flex-shrink-0 text-center min-w-[52px]">
            {match.status === 'scheduled' ? (
              <span className="text-gray-400 text-xs">{formatMatchTime(match.startTime)}</span>
            ) : (
              <span className="text-lg font-bold tabular-nums">
                {formatScore(match.homeScore, match.awayScore)}
              </span>
            )}
          </div>

          {/* Away */}
          <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
            <span className="text-sm font-medium truncate text-right">{match.awayTeam.name}</span>
            {match.awayTeam.logo
              ? <img src={match.awayTeam.logo} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
              : <div className="w-7 h-7 bg-gray-600 rounded-full flex-shrink-0" />}
          </div>
        </div>
      </div>
    </Link>
  );
}
