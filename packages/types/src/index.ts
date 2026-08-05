/**
 * shared-types/src/index.ts — single barrel re-export for @lkvip/types
 *
 * Usage (TypeScript):
 *   import type { IUser, ApiResponse, ProjectId } from '@lkvip/types';
 *   import type { ITransaction, IPaymentGateway } from '@lkvip/types';
 *
 * The individual sub-files remain importable for tree-shaking:
 *   import type { IBet } from '@lkvip/types/src/common.types';
 */

// ── Portal & Store types ──────────────────────────────────────────────────
export type {
  PortalNewsArticle,
  PortalEcosystemItem,
  PortalCareerPosition,
  PortalContactMessage,
} from './portal';

export type {
  ProductType,
  ProductCategory,
  StoreProduct,
  StoreProductReview,
  StoreOrder,
  StoreOrderItem,
  StoreDigitalAsset,
  StoreSubscription,
  StoreApiKey,
} from './store';

// ── Project IDs, device, build, health ────────────────────────────────────
export type {
  ProjectId,
  SortOrder, FilterOperator, IFilter, ISort,
  IPaginationInput, IPagination,
  Nullable, OmitMultiple, RequireAtLeastOne, DeepPartial, DeepReadonly, KeysOfType,
  ActiveStatus, FullStatus,
  DateLike, ISODateString,
  StringRecord, AnyRecord, NumberRecord,
  StringId, NumberId, AnyId,
  DeviceOS, DeviceType, IDeviceInfo,
  HealthCheck, HealthResult, EnvCheckResult, BuildResult,
  // Game
  GameProviderCode, GameWalletType, GameCategory,
  IGameProvider, IGameSession, IGameRound,
  // Sports
  BetStatus, MatchStatus, ILeague, ITeam, IMatch, IBet,
  // Trade
  OrderSide, OrderType, OrderStatus, PositionSide,
  ITradePair, IOrder, IPosition,
} from './common.types';

// ── API envelope & notification types ─────────────────────────────────────
export type {
  ApiResponse, ApiOkResponse, ApiErrorResponse, FieldError,
  PaginationMeta, PaginatedResponse, PaginationQuery,
  LoginRequest, LoginResponse,
  RefreshTokenRequest, RefreshTokenResponse,
  HealthResponse,
  AutoCompleteItem, AutoCompleteResult, AutoCompleteResponse,
  NotificationType, INotification, PushNotificationPayload,
  ISocketBalanceUpdate, ISocketNotificationEvent,
  ISocketLiveScore, ISocketPriceUpdate, ISocketTypingEvent,
  ISiteConfig,
} from './api.types';

// ── User, VIP, KYC, referral, loyalty, audit, support ─────────────────────
export type {
  UserRole, UserStatus, KycLevel, KycStatus, KycDocumentType,
  VipTierName, LoyaltyTierName,
  IUser, UserBasic, IUserProfile,
  IJwtPayload, JwtPayload, LoginCredentials, IAuthTokens, AuthTokens,
  IVipConfig, IVipStatus,
  IKycDocument,
  IReferral, IReferralStats,
  ILoyaltyTier, ILoyaltyEvent, ILoyaltyProfile,
  TicketStatus, TicketPriority, TicketCategory,
  ISupportTicket, ISupportMessage,
  AuditAction, IAuditLog,
  IApp, AppCatalogEntry,
} from './user.types';

// ── Payment, wallet, transaction, gateway types ────────────────────────────
// Note: TransactionType/TransactionStatus are intentionally omitted here —
// they are re-exported as enums from ./transaction below.
export type {
  VNBank,
  PaymentGatewayCode, PaymentGatewayType, PaymentGateway,
  IPaymentGateway,
  IDepositRequest, IDepositResponse,
  IWithdrawRequest,
  CurrencyCode,
  ITransaction,
  IWallet, IWalletBalance, IBankInfo,
  ILkvipDepositRequest, ILkvipWithdrawRequest,
  LkvipTransactionStatus, ILkvipTransaction,
  IMoMoIpnPayload, IZaloPayCallback, IVNPayReturnData,
  IVietQRBank, IVietQRBankListResponse,
} from './payment.types';

// ── New domain types (enum-based, additive) ────────────────────────────────
// user.ts        → Role, UserStatus (enum), User (simplified interface)
// transaction.ts → TransactionType, TransactionStatus (enum), Transaction
// game.ts        → Game (simplified interface)
// trade.ts       → TradeOrder (simplified interface)
// lottery.ts     → ILotteryDraw, ILotteryBet, ILotteryType, IOddsSetting
// agent.ts       → IAgent, IAgentCommission, IAgentTreeNode, IAgentStats
// rebate.ts      → IVipRebateRate, IRebate, IRebateSummary, DEFAULT_VIP_REBATE_RATES
// giftcode.ts    → IGiftCode, IGiftCodeRedemption, IRedeemGiftCodeRequest
// dating.ts      → DatingUser, DatingMessage, DatingConversation, etc.
export * from './user';
export * from './transaction';
export * from './game';
export * from './trade';
export * from './lottery';
export * from './agent';
export * from './rebate';
export * from './giftcode';
export * from './dating';
