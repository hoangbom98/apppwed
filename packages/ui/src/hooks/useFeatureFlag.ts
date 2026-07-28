/**
 * useFeatureFlag — client-side hook to check if a feature is enabled.
 *
 * Fetches /api/shared/features?project=<project> once per minute and caches
 * the result. Multiple flags from the same project share a single network request.
 *
 * Usage:
 *   const isEnabled = useFeatureFlag('trading_view_chart', 'trade');
 *   if (isEnabled) return <TradingViewWidget ... />;
 */
import { useQuery } from '@tanstack/react-query';

interface FeatureFlagEntry {
  key:     string;
  project: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

async function fetchFlags(project: string): Promise<FeatureFlagEntry[]> {
  const res = await fetch(`/api/shared/features?project=${encodeURIComponent(project)}`, {
    credentials: 'same-origin',
  });
  if (!res.ok) return [];
  const body = await res.json();
  return (body?.data ?? []) as FeatureFlagEntry[];
}

export function useFeatureFlag(key: string, project: string): boolean {
  const { data } = useQuery<FeatureFlagEntry[]>({
    queryKey:  ['feature-flags', project],
    queryFn:   () => fetchFlags(project),
    staleTime: 60 * 1000,  // 1 minute
    retry:     false,
  });

  const flag = data?.find(f => f.key === key);
  return flag?.enabled ?? false;
}

export function useFeatureFlags(project: string): FeatureFlagEntry[] {
  const { data } = useQuery<FeatureFlagEntry[]>({
    queryKey:  ['feature-flags', project],
    queryFn:   () => fetchFlags(project),
    staleTime: 60 * 1000,
    retry:     false,
  });
  return data ?? [];
}
