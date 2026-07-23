export const ROUTES = {
  HOME:          '/',
  SCHEDULE:      '/schedule',
  MATCH:         '/matches/:id',
  STANDINGS:     '/standings',
  HIGHLIGHTS:    '/highlights',
  HIGHLIGHT:     '/highlights/:slug',
  VIDEOS:        '/videos',
  NEWS:          '/news',
  ARTICLE:       '/news/:slug',
  COMMUNITY:     '/community',
  STREAMS:       '/streams',
  STREAM:        '/streams/:id',
  PROFILE:       '/profile',
  NOTIFICATIONS: '/notifications',
  SEARCH:        '/search',
  LOGIN:         '/login',
  REGISTER:      '/register',
} as const;

export const MATCH_STATUS: Record<string, { label: string; color: string }> = {
  scheduled:  { label: 'Sắp diễn ra', color: 'text-gray-400'  },
  live:       { label: 'LIVE',         color: 'text-green-400' },
  finished:   { label: 'KT',           color: 'text-blue-400'  },
  cancelled:  { label: 'Hủy',          color: 'text-red-400'   },
  postponed:  { label: 'Hoãn',         color: 'text-yellow-400'},
};

export const NEWS_CATEGORIES: Record<string, string> = {
  news:     'Tin tức',
  transfer: 'Chuyển nhượng',
  analysis: 'Phân tích',
  interview:'Phỏng vấn',
  opinion:  'Bình luận',
};
