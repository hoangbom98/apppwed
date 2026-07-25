// @ts-nocheck
// frontend/admin-dashboard/src/modules/registry.ts
// Central Module Registry — each sub-project module self-registers here.
// AdminLayout reads from `modules` instead of hard-coding NAV_GROUPS.
// To add a new project: create modules/newproject/index.ts and call registerModule().
import type { ComponentType } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface MenuItem {
  to:    string;
  label: string;
  /** Lucide icon component */
  icon:  ComponentType<{ size?: number; className?: string }>;
  /** react-router end matching (exact) */
  end?:  boolean;
}

export interface MenuGroup {
  /** Unique key for keyed rendering */
  key:   string;
  /** null = no section header (always visible) */
  label: string | null;
  items: MenuItem[];
}

export interface ModuleConfig {
  /** Unique project id: 'game' | 'hub' | 'dating' | 'sports' | 'trade' | 'ops' */
  id:       string;
  /** Human-readable name for debugging */
  name:     string;
  /**
   * Minimum role required to see this module's menu groups.
   * undefined = visible to all authenticated admins.
   */
  minRole?: 'admin' | 'super_admin';
  /**
   * Optional: list of project IDs the user must have access to.
   * When set, menu is hidden unless user.modules includes this id.
   * Relies on JWT payload: { modules: string[] }
   */
  projectId?: string;
  menuGroups: MenuGroup[];
}

// ── Registry ───────────────────────────────────────────────────────────────────

export const modules: ModuleConfig[] = [];

export function registerModule(module: ModuleConfig): void {
  // Guard against double-registration (e.g. HMR in dev)
  if (modules.some(m => m.id === module.id)) return;
  modules.push(module);
}

/**
 * Returns menu groups visible to the given user.
 * @param user  JWT decoded payload { role, modules?: string[] }
 */
export function getVisibleMenuGroups(
  user: { role: string; modules?: string[] } | null
): MenuGroup[] {
  if (!user) return [];
  return modules
    .filter(m => {
      // super_admin sees everything
      if (user.role === 'super_admin') return true;
      // role gate
      if (m.minRole === 'super_admin') return false;
      // project access gate (if modules[] in JWT)
      if (m.projectId && user.modules) {
        return user.modules.includes(m.projectId);
      }
      return true;
    })
    .flatMap(m => m.menuGroups);
}
