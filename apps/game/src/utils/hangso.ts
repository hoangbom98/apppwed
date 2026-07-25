export const PAYMENT_METHODS = [
  { id: 'usdt',    label: 'USDT (TRC20)',           icon: 'USDT' },
  { id: 'banking', label: 'Chuyển khoản ngân hàng', icon: 'Bank' },
  { id: 'momo',    label: 'MoMo',                   icon: 'MoMo' },
];

export const QUICK_DEPOSIT_AMOUNTS = [
  100_000, 200_000, 500_000, 1_000_000, 2_000_000, 5_000_000,
];

export const VIP_COLORS: Record<number, string> = {
  1: 'from-orange-700 to-yellow-600',
  2: 'from-slate-500 to-slate-400',
  3: 'from-yellow-600 to-yellow-400',
  4: 'from-cyan-600 to-blue-400',
  5: 'from-purple-600 to-pink-400',
};

export const CATEGORY_ICONS: Record<string, string> = {
  slots:   'Slots',
  casino:  'Casino',
  sports:  'Sports',
  lottery: 'Lottery',
  fishing: 'Fishing',
  cards:   'Cards',
  live:    'Live',
  all:     'Tất cả',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
