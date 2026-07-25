/**
 * @lkvip/types — src/agent.ts
 *
 * Agent & multi-level commission types.
 * Replaces BoYue: caipiao_agent_relation / caipiao_agent_commission_log / caipiao_agent_rate.
 *
 * Usage:
 *   import type { IAgent, IAgentCommission, IAgentTree } from '@lkvip/types';
 */

// ─────────────────────────────────────────────────────────────────────────────
// AGENT PROFILE  (BoYue: caipiao_agent_relation)
// ─────────────────────────────────────────────────────────────────────────────

export interface IAgent {
  id:             string;
  userId:         string;
  /** ID of the parent agent (null = top-level) */
  parentAgentId:  string | null;
  /** Tree depth: 1 = direct under platform, 2 = sub-agent, 3 = sub-sub-agent */
  level:          number;
  /** Commission percentage, e.g. 0.0500 = 5% */
  commissionRate: number;
  totalCommission: number;
  /** active | suspended | pending | rejected */
  status:         string;
  createdAt:      Date;
  updatedAt:      Date;
  // Populated on demand
  user?: {
    id:       string;
    username: string | null;
    fullName: string | null;
    email:    string | null;
    balance:  number;
    totalBet: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMISSION RECORD  (BoYue: caipiao_agent_commission_log)
// ─────────────────────────────────────────────────────────────────────────────

export interface IAgentCommission {
  id:        string;
  agentId:   string;
  /** YYYY-MM (monthly) or YYYY-MM-DD (daily) */
  period:    string;
  totalBet:  number;
  netProfit: number;
  /** Rate applied for this period */
  rate:      number;
  amount:    number;
  /** pending | paid | cancelled */
  status:    string;
  settledAt: Date | null;
  createdAt: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT TREE NODE  (for hierarchical display)
// ─────────────────────────────────────────────────────────────────────────────

export interface IAgentTreeNode {
  agentId:       string;
  userId:        string;
  username:      string | null;
  level:         number;
  commissionRate: number;
  totalCommission: number;
  directMemberCount: number;
  children:      IAgentTreeNode[];
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT STATS SUMMARY
// ─────────────────────────────────────────────────────────────────────────────

export interface IAgentStats {
  totalMembers:       number;
  activeMembers:      number;
  totalBetVolume:     number;
  totalCommissionPaid: number;
  pendingCommission:   number;
}
