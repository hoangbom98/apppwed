import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMatch, addMatchComment } from '../api/sports';
import { formatScore, formatDate, formatMatchTime } from '../utils/formatters';
import { MATCH_STATUS } from '../utils/constants';
import { getSocket } from '../hooks/useSocket';
import CommentItem from '../components/CommentItem';
import { useAuthStore } from '../store/authStore';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function StatBar({ label, home, away }: { label: string; home: number; away: number }) {
  const total = home + away || 1;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold">{home}</span>
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold">{away}</span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden">
        <div className="bg-green-500 transition-all" style={{ width: `${(home / total) * 100}%` }} />
        <div className="bg-blue-500 flex-1" />
      </div>
    </div>
  );
}

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', card: '🟨', substitution: '↕️', var: '📺', penalty: '⚽', red_card: '🟥',
};

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const matchId = Number(id);
  const { isLoggedIn } = useAuthStore();
  const qc = useQueryClient();

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: () => getMatch(matchId),
    staleTime: 30_000,
  });

  // Subscribe to live updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('join_match', matchId);
    const onUpdate = () => qc.invalidateQueries({ queryKey: ['match', matchId] });
    window.addEventListener('sports:match_update', onUpdate);
    return () => {
      socket.emit('leave_match', matchId);
      window.removeEventListener('sports:match_update', onUpdate);
    };
  }, [matchId, qc]);

  const [commentText, setCommentText] = React.useState('');
  const commentMutation = useMutation({
    mutationFn: (content: string) => addMatchComment(matchId, { content }),
    onSuccess: () => {
      setCommentText('');
      qc.invalidateQueries({ queryKey: ['match', matchId] });
    },
  });

  if (isLoading) return (
    <div className="p-4 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-800 rounded-xl animate-pulse" />)}
    </div>
  );
  if (!match) return <div className="p-4 text-gray-400">Không tìm thấy trận đấu.</div>;

  const stats = match.stats || {};
  const status = MATCH_STATUS[match.status] || MATCH_STATUS.scheduled;

  return (
    <div className="pb-6">
      {/* Scoreboard */}
      <div className="bg-gray-900 p-4 text-center">
        <p className="text-xs text-gray-500 mb-1">{match.league?.name}</p>
        <div className="flex items-center justify-center gap-4 my-3">
          <div className="flex-1 text-center">
            {match.homeTeam?.logo && <img src={match.homeTeam.logo} className="w-12 h-12 mx-auto mb-1 object-contain" alt="" />}
            <p className="text-sm font-semibold">{match.homeTeam?.name}</p>
          </div>
          <div className="text-center min-w-[80px]">
            <p className="text-3xl font-black tabular-nums">{formatScore(match.homeScore, match.awayScore)}</p>
            <p className={`text-xs mt-1 font-semibold ${status.color} ${match.status === 'live' ? 'animate-pulse' : ''}`}>
              {match.status === 'live' ? '● LIVE' : status.label}
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">{formatMatchTime(match.startTime)} · {formatDate(match.startTime)}</p>
          </div>
          <div className="flex-1 text-center">
            {match.awayTeam?.logo && <img src={match.awayTeam.logo} className="w-12 h-12 mx-auto mb-1 object-contain" alt="" />}
            <p className="text-sm font-semibold">{match.awayTeam?.name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Live Events Timeline */}
        {match.liveUpdates?.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Sự kiện</h3>
            <div className="space-y-2">
              {match.liveUpdates.map((e: any) => (
                <div key={e.id} className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500 text-xs w-8 text-right">{e.time}'</span>
                  <span>{EVENT_ICONS[e.type] || '•'}</span>
                  <span className="text-gray-300">{e.player}</span>
                  {e.description && <span className="text-xs text-gray-500">({e.description})</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        {stats.possession && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Thống kê</h3>
            <StatBar label="Kiểm soát bóng (%)" home={stats.possession?.home || 50} away={stats.possession?.away || 50} />
            {stats.shots && <StatBar label="Cú sút" home={stats.shots.home} away={stats.shots.away} />}
            {stats.corners && <StatBar label="Phạt góc" home={stats.corners.home} away={stats.corners.away} />}
          </section>
        )}

        {/* Highlights */}
        {match.highlights?.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Highlights</h3>
            <div className="space-y-2">
              {match.highlights.map((h: any) => (
                <a key={h.id} href={h.videoUrl} target="_blank" rel="noopener noreferrer"
                   className="flex gap-3 bg-gray-800 rounded-lg p-2">
                  {h.thumbnail && <img src={h.thumbnail} className="w-20 h-12 object-cover rounded" alt="" />}
                  <p className="text-sm">{h.title}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Comments */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Bình luận ({match.comments?.length || 0})</h3>
          {isLoggedIn && (
            <div className="flex gap-2 mb-4">
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Viết bình luận..."
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
              />
              <button
                onClick={() => commentText.trim() && commentMutation.mutate(commentText.trim())}
                className="px-4 py-2 bg-green-600 rounded-lg text-sm font-semibold hover:bg-green-500 disabled:opacity-50"
                disabled={commentMutation.isPending}
              >Gửi</button>
            </div>
          )}
          <div>{match.comments?.map((c: any) => <CommentItem key={c.id} comment={c} />)}</div>
        </section>
      </div>
    </div>
  );
}
