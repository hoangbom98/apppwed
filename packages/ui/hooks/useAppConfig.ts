// @ts-nocheck
/**
 * useAppConfig.js
 * Shared hook to fetch per-project UI / branding configuration from
 *   GET /api/shared/config?group=<group>
 *
 * Uses React Query for caching (staleTime 10 min, refetchOnWindowFocus off).
 * The X-Project header is automatically sent by the shared api client
 * (set via VITE_PROJECT env var).
 *
 * Usage:
 *   const { data: config, isLoading } = useAppConfig();
 *   const { data: brand }             = useAppConfig('brand');
 *   const { data: social }            = useAppConfig('social');
 *   const { data: feature }           = useAppConfig('feature');
 */
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

/**
 * @param {string|null} group  - filter by group: 'brand'|'colors'|'social'|'feature'|null (all)
 * @param {object}      opts   - extra React Query options
 */
export function useAppConfig(group = null, opts = {}) {
  return useQuery({
    queryKey: ['appConfig', group],
    queryFn: () =>
      api
        .get('/shared/config', { params: group ? { group } : undefined })
        .then(res => res.data?.data ?? res.data ?? {}),
    staleTime:            10 * 60 * 1000, // 10 phút
    refetchOnWindowFocus: false,
    retry:                false,
    ...opts,
  });
}

/**
 * Synchronously apply CSS custom properties from a colors config object.
 * Call inside a useEffect when colors config changes.
 *
 * @param {{ primary_color?: string, secondary_color?: string, accent_color?: string }} colors
 */
export function applyColorConfig(colors) {
  if (!colors || typeof document === 'undefined') return;
  const root = document.documentElement;
  if (colors.primary_color)   root.style.setProperty('--color-primary',   colors.primary_color);
  if (colors.secondary_color) root.style.setProperty('--color-secondary', colors.secondary_color);
  if (colors.accent_color)    root.style.setProperty('--color-accent',    colors.accent_color);
}
