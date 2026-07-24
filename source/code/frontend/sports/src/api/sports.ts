import api from './client';

const P = 'sports';

// ── Leagues ───────────────────────────────────────────────────────
export const getLeagues    = (p?: object) => api.get(`/${P}/leagues`, { params: p }).then(r => r.data);
export const getLeague     = (slug: string) => api.get(`/${P}/leagues/${slug}`).then(r => r.data.data);

// ── Teams ─────────────────────────────────────────────────────────
export const getTeams      = (p?: object) => api.get(`/${P}/teams`, { params: p }).then(r => r.data);
export const getTeam       = (slug: string) => api.get(`/${P}/teams/${slug}`).then(r => r.data.data);

// ── Matches ───────────────────────────────────────────────────────
export const getMatches    = (p?: object) => api.get(`/${P}/matches`, { params: p }).then(r => r.data);
export const getLiveMatches = () => api.get(`/${P}/matches/live`).then(r => r.data.data);
export const getTodayMatches = () => api.get(`/${P}/matches/today`).then(r => r.data.data);
export const getMatch      = (id: number) => api.get(`/${P}/matches/${id}`).then(r => r.data.data);
export const addMatchComment = (id: number, data: object) => api.post(`/${P}/matches/${id}/comments`, data).then(r => r.data);

// ── Standings ─────────────────────────────────────────────────────
export const getStandings  = (leagueId: number, season?: string) =>
  api.get(`/${P}/standings/${leagueId}`, { params: season ? { season } : {} }).then(r => r.data.data);

// ── Highlights ───────────────────────────────────────────────────
export const getHighlights = (p?: object) => api.get(`/${P}/highlights`, { params: p }).then(r => r.data);
export const getHighlight  = (slug: string) => api.get(`/${P}/highlights/${slug}`).then(r => r.data.data);

// ── Short Videos ─────────────────────────────────────────────────
export const getShortVideos = (p?: object) => api.get(`/${P}/videos`, { params: p }).then(r => r.data);
export const getShortVideo  = (id: number) => api.get(`/${P}/videos/${id}`).then(r => r.data.data);
export const likeVideo      = (id: number) => api.post(`/${P}/videos/${id}/like`).then(r => r.data);

// ── Articles ─────────────────────────────────────────────────────
export const getArticles   = (p?: object) => api.get(`/${P}/news`, { params: p }).then(r => r.data);
export const getArticle    = (slug: string) => api.get(`/${P}/news/${slug}`).then(r => r.data.data);
export const getArticleComments = (id: number) => api.get(`/${P}/news/${id}/comments`).then(r => r.data.data);
export const addArticleComment  = (data: object) => api.post(`/${P}/news/comments`, data).then(r => r.data);

// ── Community Posts ───────────────────────────────────────────────
export const getPosts      = (p?: object) => api.get(`/${P}/posts`, { params: p }).then(r => r.data);
export const getPost       = (id: number) => api.get(`/${P}/posts/${id}`).then(r => r.data.data);
export const createPost    = (data: object) => api.post(`/${P}/posts`, data).then(r => r.data);
export const likePost      = (id: number) => api.post(`/${P}/posts/${id}/like`).then(r => r.data);
export const getPostComments = (id: number) => api.get(`/${P}/posts/${id}/comments`).then(r => r.data.data);
export const addPostComment  = (data: object) => api.post(`/${P}/posts/comments`, data).then(r => r.data);

// ── Live Streams ──────────────────────────────────────────────────
export const getStreams    = (p?: object) => api.get(`/${P}/streams`, { params: p }).then(r => r.data);
export const getStream     = (id: number) => api.get(`/${P}/streams/${id}`).then(r => r.data.data);
export const getStreamChat = (id: number, p?: object) => api.get(`/${P}/streams/${id}/chat`, { params: p }).then(r => r.data.data);
export const joinStream    = (id: number) => api.post(`/${P}/streams/${id}/join`).then(r => r.data);
export const leaveStream   = (id: number) => api.post(`/${P}/streams/${id}/leave`).then(r => r.data);

// ── Favourites ────────────────────────────────────────────────────
export const getFavourites  = () => api.get(`/${P}/favorites`).then(r => r.data.data);
export const addFavourite   = (data: object) => api.post(`/${P}/favorites`, data).then(r => r.data);
export const removeFavourite = (type: string, id: number) => api.delete(`/${P}/favorites/${type}/${id}`).then(r => r.data);

// ── Notifications ─────────────────────────────────────────────────
export const getNotifications   = (p?: object) => api.get(`/${P}/notifications`, { params: p }).then(r => r.data);
export const getUnreadCount     = () => api.get(`/${P}/notifications/unread-count`).then(r => r.data.data.count as number);
export const markNotifRead      = (id: number) => api.put(`/${P}/notifications/${id}/read`).then(r => r.data);
export const markAllNotifsRead  = () => api.put(`/${P}/notifications/read-all`).then(r => r.data);

// ── Search & Ads ─────────────────────────────────────────────────
export const search    = (q: string) => api.get(`/${P}/search`, { params: { q } }).then(r => r.data.data);
export const getAds    = (position: string) => api.get(`/${P}/ads`, { params: { position } }).then(r => r.data.data.ads);

// ── Auth ─────────────────────────────────────────────────────────
export const updateProfile = (data: object) => api.put(`/${P}/auth/profile`, data).then(r => r.data.data);

// ── Betting ───────────────────────────────────────────────────────
export const getBettingEvents  = (p?: object) =>
  api.get(`/${P}/betting/events`,       { params: p }).then(r => r.data);
export const getBettingEvent   = (id: string) =>
  api.get(`/${P}/betting/events/${id}`).then(r => r.data.data);
export const getMarkets        = (eventId: string) =>
  api.get(`/${P}/betting/markets/${eventId}`).then(r => r.data.data);
export const placeBet          = (data: object) =>
  api.post(`/${P}/betting/bets`,        data).then(r => r.data);
export const getMyBets         = (p?: object) =>
  api.get(`/${P}/betting/my-bets`,      { params: p }).then(r => r.data);
export const getBetById        = (id: string) =>
  api.get(`/${P}/betting/bets/${id}`).then(r => r.data.data);

// ── Wallet ────────────────────────────────────────────────────────
export const getWallet         = () =>
  api.get(`/${P}/wallet`).then(r => r.data.data);
export const getWalletHistory  = (p?: object) =>
  api.get(`/${P}/wallet/history`,       { params: p }).then(r => r.data);
export const createDeposit     = (data: object) =>
  api.post(`/${P}/wallet/deposit`,      data).then(r => r.data);
export const createWithdrawal  = (data: object) =>
  api.post(`/${P}/wallet/withdraw`,     data).then(r => r.data);
