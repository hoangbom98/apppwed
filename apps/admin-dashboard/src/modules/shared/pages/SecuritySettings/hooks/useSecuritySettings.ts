// @ts-nocheck
/**
 * useSecuritySettings.js
 * Custom hook — loads, caches, and saves security settings.
 * Uses TanStack Query for server state + local draft state for unsaved edits.
 */
import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { securityApi } from '../security.api';
import { DEFAULT_SETTINGS } from '../types';

const QUERY_KEY = ['security-settings'];

/**
 * Deep-set a value at a dot-path inside an object (immutably).
 * e.g. setPath({a:{b:1}}, 'a.b', 2) → {a:{b:2}}
 */
function setPath(obj, path, value) {
  const keys  = path.split('.');
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let cur = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    cur[k] = Array.isArray(cur[k]) ? [...cur[k]] : { ...cur[k] };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return clone;
}

export function useSecuritySettings() {
  const qc = useQueryClient();
  // local draft keeps unsaved edits on top of server state
  const [draft, setDraft] = useState(null);

  // ── Fetch ───────────────────────────────────────────────────────────────
  const { data: serverData, isLoading, isError } = useQuery({
    queryKey: QUERY_KEY,
    queryFn:  securityApi.getSecuritySettings,
    // If API fails fall back to defaults so the form still renders
    placeholderData: DEFAULT_SETTINGS,
    onError: () => {}, // suppress console error — handled by isError flag
  });

  // Effective settings = draft (if any edits) OR server data OR defaults
  const settings = draft ?? serverData ?? DEFAULT_SETTINGS;

  // ── Field change ────────────────────────────────────────────────────────
  const handleChange = useCallback((path, value) => {
    setDraft(prev => setPath(prev ?? settings, path, value));
  }, [settings]);

  // ── Save ────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (data) => securityApi.saveSecuritySettings(data),
    onSuccess: (_, saved) => {
      qc.setQueryData(QUERY_KEY, saved);
      setDraft(null);
    },
  });

  const save = useCallback(() => {
    if (draft) saveMutation.mutate(draft);
  }, [draft, saveMutation]);

  // ── Reset to default (server-side) ──────────────────────────────────────
  const resetMutation = useMutation({
    mutationFn: securityApi.resetToDefault,
    onSuccess: () => {
      setDraft(null);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // ── Discard local draft ─────────────────────────────────────────────────
  const discardDraft = useCallback(() => setDraft(null), []);

  return {
    settings,
    isLoading,
    isError,
    isDirty:      draft !== null,
    isSaving:     saveMutation.isPending,
    isResetting:  resetMutation.isPending,
    saveError:    saveMutation.error?.response?.data?.message ?? saveMutation.error?.message,
    handleChange,
    save,
    discardDraft,
    resetToDefault: resetMutation.mutate,
  };
}
