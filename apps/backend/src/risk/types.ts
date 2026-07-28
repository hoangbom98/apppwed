/**
 * Shared types for the risk engine.
 * Uses duck-typed prisma to avoid direct coupling to any specific generated client.
 */

/** Duck-typed Prisma client accepted by all risk classes */
export interface AnyPrismaClient {
  user:         { findUnique: Function; update: Function; updateMany: Function; findMany: Function; count: Function };
  userDevice:   { findUnique: Function; update: Function; create: Function; count: Function; findFirst: Function; findMany: Function };
  riskAlert:    { create: Function; count: Function };
  riskRule:     { findFirst: Function; create: Function };
  riskScore:    { upsert: Function; create: Function };
  amlAlert:     { count: Function; create: Function; findFirst: Function };
  securityLog:  { create: Function; count: Function };
  transaction:  { aggregate: Function; findMany: Function; count: Function; findFirst: Function };
  ipBlacklist:  { findFirst: Function; upsert: Function };
  [key: string]: any;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown';

export interface RiskResult {
  risk: RiskLevel;
  reason: string | null;
  [key: string]: unknown;
}

export interface FraudResult {
  risk: RiskLevel;
  reason: string | null;
  count?: number;
}

export interface BotDetectResult {
  isBot: boolean;
  reason: string | null;
  confidence: number;
}

export interface LocationResult {
  risk: RiskLevel;
  reason: string | null;
  country: string | null;
  [key: string]: unknown;
}

export interface ComplianceResult {
  action: 'ok' | 'kyc_required' | 'blocked' | 'aml_alert';
  reason: string | null;
}

export interface BruteForceResult {
  blocked: boolean;
  reason: string | null;
  severity: string;
}

export interface DdosResult {
  blocked: boolean;
  reason: string | null;
}

export interface RiskScoreResult {
  score: number;
  level: string;
  actions: string[];
}

export interface SessionMeta {
  clickCount?:     number;
  timeSpent?:      number;
  mouseMovements?: number;
  eventSequence?:  string[];
}
