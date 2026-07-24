-- =============================================================================
-- database/indexes.sql — v2.1 Performance indexes cho toàn bộ hệ thống
-- Chạy sau khi prisma migrate deploy để bổ sung composite indexes
-- Tất cả tên bảng đã dùng snake_case theo @@map() trong schema v2.1
-- =============================================================================

USE admin_db;

-- Transactions: lọc nhanh theo user + status + ngày
CREATE INDEX IF NOT EXISTS idx_transactions_user_status_created
  ON transactions(user_id, status, created_at);

-- Transactions: lọc theo loại và ngày (báo cáo tài chính)
CREATE INDEX IF NOT EXISTS idx_transactions_type_created
  ON transactions(type, created_at);

-- Notifications: user chưa đọc, sắp xếp mới nhất
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, is_read, created_at);

-- AuditLogs: theo action + project
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_project_created
  ON audit_logs(action, project, created_at);

-- DepositOrders: trạng thái + ngày
CREATE INDEX IF NOT EXISTS idx_deposit_orders_status_created
  ON deposit_orders(status, created_at);

-- WithdrawOrders: trạng thái + ngày
CREATE INDEX IF NOT EXISTS idx_withdraw_orders_status_created
  ON withdraw_orders(status, created_at);

-- RiskAlerts: status để admin review
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status_created
  ON risk_alerts(status, created_at);

-- ProjectConfig: lookup by project + group
CREATE INDEX IF NOT EXISTS idx_project_configs_project_group
  ON project_configs(project_code, group_name, status);

-- =============================================================================
USE hub_db;

-- News: category + status + publishedAt (listing page)
CREATE INDEX IF NOT EXISTS idx_news_category_status_published
  ON news(category_id, status, published_at);

-- News fulltext search
ALTER TABLE news
  ADD FULLTEXT INDEX IF NOT EXISTS ft_news_title_content (title, content);

-- Notifications: user + isRead
CREATE INDEX IF NOT EXISTS idx_hub_notifications_user_read
  ON notifications(user_id, is_read, created_at);

-- AnalyticsLog: type + createdAt (reports)
CREATE INDEX IF NOT EXISTS idx_analytics_type_target_created
  ON analytics_logs(type, target_id, created_at);

-- SupportMessages: pagination
CREATE INDEX IF NOT EXISTS idx_support_messages_room_created
  ON support_messages(room_id, created_at);

-- KnowledgeArticle fulltext
ALTER TABLE knowledge_articles
  ADD FULLTEXT INDEX IF NOT EXISTS ft_knowledge_title_content (title, content);

-- =============================================================================
USE game_db;

-- GameSessions: user + status + ngày (lịch sử chơi)
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_status_created
  ON game_sessions(user_id, status, created_at);

-- GameTransactions: user + type + ngày
CREATE INDEX IF NOT EXISTS idx_game_txn_user_type_created
  ON game_transactions(user_id, type, created_at);

-- LotteryBets: draw + status (tính kết quả)
CREATE INDEX IF NOT EXISTS idx_lottery_bets_draw_status
  ON lottery_bets(draw_id, status);

-- LotteryDraws: typeId + drawTime (lấy kỳ hiện tại)
CREATE INDEX IF NOT EXISTS idx_lottery_draw_type_time
  ON lottery_draws(type_id, draw_time);

-- VirtualAccounts: webhook matching
CREATE INDEX IF NOT EXISTS idx_virtual_accounts_prefix_status
  ON virtual_accounts(prefix, status, expires_at);

-- WithdrawalRequests: admin dashboard
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_method_status
  ON withdrawal_requests(method, status, created_at);

-- =============================================================================
USE dating_db;

-- Users: lọc theo giới tính và vị trí (matchmaking)
CREATE INDEX IF NOT EXISTS idx_users_gender_status
  ON users(gender, status);

-- Likes: receiver + createdAt (thông báo like mới)
CREATE INDEX IF NOT EXISTS idx_likes_receiver_created
  ON likes(receiver_id, created_at);

-- Matches: user1 + status
CREATE INDEX IF NOT EXISTS idx_matches_user1_status
  ON matches(user1_id, status);

-- Matches: user2 + status
CREATE INDEX IF NOT EXISTS idx_matches_user2_status
  ON matches(user2_id, status);

-- Messages: roomId + createdAt (chat history paging)
CREATE INDEX IF NOT EXISTS idx_messages_room_created
  ON messages(room_id, created_at);

-- GiftSends: receiverId + createdAt (thu nhập streamer)
CREATE INDEX IF NOT EXISTS idx_gift_sends_receiver_created
  ON gift_sends(receiver_id, created_at);

-- Transactions: user + type + ngày
CREATE INDEX IF NOT EXISTS idx_dating_txn_user_type_created
  ON transactions(user_id, type, created_at);

-- Albums: user + status
CREATE INDEX IF NOT EXISTS idx_albums_user_status
  ON albums(user_id, status);

-- Follows: composite lookup
CREATE INDEX IF NOT EXISTS idx_follows_follower
  ON follows(follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_following
  ON follows(following_id);

-- VipMemberships: expired check
CREATE INDEX IF NOT EXISTS idx_vip_memberships_user_end
  ON vip_memberships(user_id, end_date, status);

-- =============================================================================
USE sports_db;

-- Matches: status + startTime (listing + live dashboard)
CREATE INDEX IF NOT EXISTS idx_matches_status_start
  ON matches(status, start_time);

-- Matches: league + status + startTime (filtered listing)
CREATE INDEX IF NOT EXISTS idx_matches_league_status_start
  ON matches(league_id, status, start_time);

-- LiveUpdates: matchId + createdAt (real-time feed)
CREATE INDEX IF NOT EXISTS idx_live_updates_match_created
  ON live_updates(match_id, created_at);

-- Comments: matchId + createdAt
CREATE INDEX IF NOT EXISTS idx_comments_match_created
  ON comments(match_id, created_at);

-- LiveChats: streamId + createdAt
CREATE INDEX IF NOT EXISTS idx_live_chats_stream_created
  ON live_chats(stream_id, created_at);

-- LiveChats: userId (history)
CREATE INDEX IF NOT EXISTS idx_live_chats_user_created
  ON live_chats(user_id, created_at);

-- NewsComments: newsId + parentId (threaded)
CREATE INDEX IF NOT EXISTS idx_news_comments_news_parent
  ON news_comments(news_id, parent_id, created_at);

-- BetMarkets: match + marketType (odds lookup)
CREATE INDEX IF NOT EXISTS idx_bet_markets_match_type
  ON bet_markets(match_id, market_type, status);

-- BetOdds: market + status
CREATE INDEX IF NOT EXISTS idx_bet_odds_market_status
  ON bet_odds(market_id, status);

-- BetSlips: user + status + ngày (bet history)
CREATE INDEX IF NOT EXISTS idx_bet_slips_user_status_created
  ON bet_slips(user_id, status, created_at);

-- BetSlipItems: settlement
CREATE INDEX IF NOT EXISTS idx_bet_slip_items_market_result
  ON bet_slip_items(market_id, result);

-- News: category + status + publishedAt
CREATE INDEX IF NOT EXISTS idx_sports_news_cat_status_pub
  ON news(category, status, published_at);

-- News fulltext search
ALTER TABLE news
  ADD FULLTEXT INDEX IF NOT EXISTS ft_sports_news_title (title, content);

-- =============================================================================
USE trade_db;

-- Orders: user + status + ngày
CREATE INDEX IF NOT EXISTS idx_orders_user_status_created
  ON orders(user_id, status, created_at);

-- Orders: symbol + status (order book)
CREATE INDEX IF NOT EXISTS idx_orders_symbol_status
  ON orders(symbol_id, status, created_at);

-- Positions: user + status + ngày
CREATE INDEX IF NOT EXISTS idx_positions_user_status_created
  ON positions(user_id, status, created_at);

-- Positions: symbol + status (risk management)
CREATE INDEX IF NOT EXISTS idx_positions_symbol_status
  ON positions(symbol_id, status);

-- PriceHistory: symbol + interval + timestamp (chart data)
CREATE INDEX IF NOT EXISTS idx_price_history_symbol_interval_ts
  ON price_history(symbol_id, `interval`, `timestamp`);

-- Transactions: user + type + ngày
CREATE INDEX IF NOT EXISTS idx_trade_txn_user_type_created
  ON transactions(user_id, type, created_at);

-- Withdrawals: user + status + ngày
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_status_created
  ON withdrawals(user_id, status, created_at);

-- PriceAlerts: symbol + status (trigger check)
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol_status
  ON price_alerts(symbol_id, status);

-- Notifications: user + isRead
CREATE INDEX IF NOT EXISTS idx_trade_notifications_user_read
  ON notifications(user_id, is_read, created_at);

-- =============================================================================
-- VERIFY (run after applying)
-- SHOW INDEX FROM admin_db.transactions;
-- SHOW INDEX FROM game_db.game_sessions;
-- SHOW INDEX FROM sports_db.bet_slips;
-- =============================================================================
