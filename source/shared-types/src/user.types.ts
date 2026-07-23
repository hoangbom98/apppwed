/**
 * @lkvip/types — src/user.types.ts
 *
 * User, profile, VIP, KYC, referral and loyalty types used across all 6 projects.
 */

// ── Enumerations ────────────────────────────────────────────────────────────

export type UserRole     = 'user' | 'vip' | 'agent' | 'admin' | 'super_admin';
export type UserStatus   = 'active' | 'inactive' | 'suspended' | 'banned' | 'deleted';
export type KycLevel     = 'unverified' | 'basic' | 'verified' | 'enhanced';
export type KycStatus    = 'not_submitted' | 'pending' | 'approved' | 'rejected';
export type KycDocumentType = 'national_id' | 'passport' | 'driver_license';
export type VipTierName  = 'member' | 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7' | 'v8' | 'v9' | 'v10';
export type LoyaltyTierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// ── Core user ───────────────────────────────────────────────────────────────

export interface IUser {
  id:            string | number;
  username?:     string;
  email:         string;
  fullName?:     string | null;
  phone?:        string | null;
  avatar?:       string | null;
  role:          UserRole;
  status:        UserStatus;
  kycLevel:      KycLevel;
  project?:      string;
  is_active?:    boolean;
  is_banned?:    boolean;
  riskScore?:    number;
  createdAt:     string | Date;
  updatedAt?:    string | Date;
}

export interface UserBasic {
  id:       string | number;
  username: string;
  email:    string;
  avatar?:  string | null;
  role:     string;
}

export interface IUserProfile extends IUser {
  vipLevel?:      number;
  vipName?:       string;
  referralCode?:  string | null;
  walletBalance?: number;
  coins?:         number;
  diamonds?:      number;
  totalBet?:      number;
  totalWin?:      number;
}

// ── JWT payload ─────────────────────────────────────────────────────────────

export interface IJwtPayload {
  id:      number;
  email:   string;
  role:    UserRole;
  project: string;
  iat:     number;
  exp:     number;
}

export type JwtPayload = IJwtPayload;

export interface LoginCredentials {
  email?:    string;
  username?: string;
  password:  string;
}

export interface IAuthTokens {
  access_token:  string;
  refresh_token: string;
  expires_in?:   number;
}

export interface AuthTokens {
  accessToken:   string;
  refreshToken?: string;
}

// ── VIP ─────────────────────────────────────────────────────────────────────

export interface IVipConfig {
  id:           number;
  level:        number;
  name:         string;
  betRequired:  number;
  rewardAmount: number;
  color?:       string | null;
  iconUrl?:     string | null;
  benefits?:    Record<string, unknown> | null;
}

export interface IVipStatus {
  currentLevel: number;
  currentName:  string;
  nextLevel?:   number;
  nextName?:    string;
  totalBet:     number;
  betRequired:  number;
  progress:     number;  // 0–100
}

// ── KYC ─────────────────────────────────────────────────────────────────────

export interface IKycDocument {
  id:             string;
  user_id:        number;
  type:           KycDocumentType;
  front_url:      string;
  back_url?:      string | null;
  selfie_url?:    string | null;
  status:         KycStatus;
  reviewer_id?:   number | null;
  reviewer_note?: string | null;
  submitted_at:   string | Date;
  reviewed_at?:   string | Date | null;
}

// ── Referral ─────────────────────────────────────────────────────────────────

export interface IReferral {
  id:            string;
  referrer_id:   number;
  referee_id:    number;
  code:          string;
  status:        'pending' | 'completed' | 'expired';
  reward_amount?: number;
  created_at:    string | Date;
  completed_at?: string | Date | null;
}

export interface IReferralStats {
  total_referrals:     number;
  completed_referrals: number;
  pending_referrals:   number;
  total_earned:        number;
  referral_code:       string;
  referral_url:        string;
}

// ── Loyalty ──────────────────────────────────────────────────────────────────

export interface ILoyaltyTier {
  id:          number;
  name:        LoyaltyTierName;
  min_points:  number;
  max_points:  number;
  multiplier:  number;
  benefits:    string[];
}

export interface ILoyaltyEvent {
  id:           string;
  user_id:      number;
  event_type:   string;
  points:       number;
  description?: string;
  created_at:   string | Date;
}

export interface ILoyaltyProfile {
  user_id:           number;
  tier:              LoyaltyTierName;
  total_points:      number;
  available_points:  number;
  tier_expires_at?:  string | Date | null;
}

// ── Support ──────────────────────────────────────────────────────────────────

export type TicketStatus   = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory =
  | 'account'
  | 'payment'
  | 'technical'
  | 'game'
  | 'kyc'
  | 'other';

export interface ISupportTicket {
  id:           string;
  user_id:      number;
  subject:      string;
  category:     TicketCategory;
  priority:     TicketPriority;
  status:       TicketStatus;
  project:      string;
  created_at:   string | Date;
  updated_at:   string | Date;
  resolved_at?: string | Date | null;
}

export interface ISupportMessage {
  id:           string;
  ticket_id:    string;
  sender_id:    number;
  sender_role:  'user' | 'agent' | 'admin';
  content:      string;
  attachments?: string[];
  created_at:   string | Date;
}

// ── Audit log ────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'login'
  | 'logout'
  | 'register'
  | 'update_profile'
  | 'change_password'
  | 'deposit'
  | 'withdraw'
  | 'transfer'
  | 'bet_place'
  | 'bet_settle'
  | 'admin_action'
  | 'ban_user'
  | 'config_change'
  | 'kyc_submit'
  | 'kyc_review';

export interface IAuditLog {
  id:           string;
  user_id?:     number | null;
  admin_id?:    number | null;
  action:       AuditAction;
  entity:       string;
  entity_id?:   string | null;
  before?:      Record<string, unknown> | null;
  after?:       Record<string, unknown> | null;
  ip_address?:  string | null;
  user_agent?:  string | null;
  project:      string;
  created_at:   string | Date;
}

// ── App catalog ──────────────────────────────────────────────────────────────

export interface IApp {
  id:             number;
  app_id:         string;
  name:           string;
  developer:      string;
  category:       'game' | 'hub' | 'dating' | 'trade' | 'sports' | 'other';
  icon_url:       string;
  rating:         number;
  reviews_count:  number;
  downloads:      string;
  android_link:   string | null;
  ios_link:       string | null;
  description:    string;
  is_published:   boolean;
  created_at?:    string | Date;
  updated_at?:    string | Date;
}

export interface AppCatalogEntry {
  id:             number;
  appId:          string;
  name:           string;
  developer?:     string | null;
  category?:      string | null;
  iconUrl?:       string | null;
  primaryColor?:  string | null;
  rating:         number;
  reviewsCount?:  string | null;
  downloads?:     string | null;
  androidLink?:   string | null;
  iosLink?:       string | null;
  description?:   string | null;
  features?:      string[] | null;
  isPublished:    boolean;
  sortOrder:      number;
  createdAt:      string | Date;
  updatedAt:      string | Date;
}
