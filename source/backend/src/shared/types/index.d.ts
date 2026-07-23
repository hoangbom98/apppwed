/**
 * source/backend/src/shared/types/index.d.ts
 *
 * TypeScript ambient declarations for the LKVIP GROUP Backend (CommonJS / plain JS).
 *
 * Augments the Express Request type so req.user, req.project, req.prisma,
 * and req.configService are properly typed throughout the backend.
 */

// ── Project identifiers (mirrors @lkvip/constants PROJECT_IDS) ─────────────────

export type ProjectId = 'hub' | 'game' | 'trade' | 'dating' | 'sports' | 'admin';

// ── JWT payload shape (set by auth.ts middleware) ─────────────────────────────

export interface JwtPayload {
  id:       number | string;
  email?:   string | null;
  role:     string;
  project:  ProjectId;
  status?:  string;
  iat?:     number;
  exp?:     number;
}

// ── Config service interface (set by configResolver middleware) ────────────────

export interface IConfigService {
  get(projectCode: string, module: string, group: string, key: string, defaultValue?: unknown): Promise<unknown>;
  getModule(projectCode: string, module: string): Promise<Record<string, Record<string, unknown>>>;
  getProjectConfigs(projectCode: string, group?: string | null): Promise<Record<string, unknown>>;
  isEnabled(projectCode: string, module: string, group: string, key: string, defaultValue?: boolean): Promise<boolean>;
  isFeatureEnabled(projectCode: string, featureKey: string, defaultValue?: boolean): Promise<boolean>;
  getMaintenance(projectCode: string): Promise<{ mode: boolean; message: string | null }>;
  set(projectCode: string, module: string, group: string, key: string, value: unknown): Promise<void>;
}

// ── Express Request augmentation ──────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      /** Decoded JWT payload — set by auth.ts middleware */
      user?: JwtPayload;

      /** Resolved project ID — set by projectResolver middleware */
      project?: ProjectId;

      /**
       * Prisma client for the resolved project — set by projectResolver.
       * Typed as `any` because each project has its own generated client
       * that shares no common interface at the TypeScript level.
       */
      prisma?: any;

      /** Config service accessor — set by configResolver middleware */
      configService?: IConfigService;
    }
  }
}
