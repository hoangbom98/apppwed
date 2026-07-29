-- =============================================================================
-- Supabase RLS Policies — LKVIP External Apps
-- =============================================================================
-- Run this SQL in Supabase Dashboard → SQL Editor
-- Or via: psql $DATABASE_URL -f rls-policies.sql
--
-- External apps covered:
--   1. BankApp       — Users, Accounts, Transactions, Cards, KYC
--   2. Academy       — Courses, Lessons, Enrollments, Progress
--   3. Invest        — Packages, Investments, Returns, Wallet
--   4. Market        — Products, Categories, Orders, Cart
--   5. Chat          — Rooms, Members, Messages
--   6. Todo          — Tasks, Labels, Assignments
--   7. Expense Tracker — Expenses, Categories, Budgets
--
-- Convention:
--   - Every table has: id UUID PK, user_id UUID REFERENCES auth.users(id), timestamps
--   - auth.uid() = currently authenticated Supabase user
--   - Service role key bypasses ALL RLS (for backend admin operations)
-- =============================================================================

-- ── Helper: enable RLS on all external app tables ────────────────────────────

-- =============================================================================
-- 1. BANKAPP
-- =============================================================================

-- 1.1 users (extended profile, not Supabase auth.users)
CREATE TABLE IF NOT EXISTS bankapp_users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  phone        TEXT,
  tier         TEXT NOT NULL DEFAULT 'standard',
  kyc_status   TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE bankapp_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bankapp_users: owner read/update"
  ON bankapp_users
  FOR ALL
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- 1.2 accounts
CREATE TABLE IF NOT EXISTS bankapp_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES bankapp_users(id) ON DELETE CASCADE,
  account_no   TEXT NOT NULL UNIQUE,
  type         TEXT NOT NULL DEFAULT 'checking',
  balance      NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency     TEXT NOT NULL DEFAULT 'VND',
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bankapp_accounts_user_id ON bankapp_accounts(user_id);
ALTER TABLE bankapp_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bankapp_accounts: owner read"
  ON bankapp_accounts FOR SELECT
  USING (user_id IN (SELECT id FROM bankapp_users WHERE auth_id = auth.uid()));

CREATE POLICY "bankapp_accounts: owner insert"
  ON bankapp_accounts FOR INSERT
  WITH CHECK (user_id IN (SELECT id FROM bankapp_users WHERE auth_id = auth.uid()));

-- 1.3 transactions
CREATE TABLE IF NOT EXISTS bankapp_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES bankapp_accounts(id),
  type         TEXT NOT NULL,
  amount       NUMERIC(18,2) NOT NULL,
  balance_after NUMERIC(18,2) NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'completed',
  reference_id TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bankapp_txn_account_id ON bankapp_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_bankapp_txn_created_at ON bankapp_transactions(created_at DESC);
ALTER TABLE bankapp_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bankapp_transactions: owner read"
  ON bankapp_transactions FOR SELECT
  USING (account_id IN (
    SELECT a.id FROM bankapp_accounts a
    JOIN bankapp_users u ON u.id = a.user_id
    WHERE u.auth_id = auth.uid()
  ));

-- 1.4 cards
CREATE TABLE IF NOT EXISTS bankapp_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID NOT NULL REFERENCES bankapp_accounts(id) ON DELETE CASCADE,
  card_number  TEXT NOT NULL,
  expiry_month INT NOT NULL,
  expiry_year  INT NOT NULL,
  cardholder   TEXT NOT NULL,
  network      TEXT NOT NULL DEFAULT 'visa',
  is_virtual   BOOLEAN NOT NULL DEFAULT FALSE,
  is_frozen    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE bankapp_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bankapp_cards: owner read"
  ON bankapp_cards FOR SELECT
  USING (account_id IN (
    SELECT a.id FROM bankapp_accounts a
    JOIN bankapp_users u ON u.id = a.user_id
    WHERE u.auth_id = auth.uid()
  ));

-- =============================================================================
-- 2. ACADEMY
-- =============================================================================

CREATE TABLE IF NOT EXISTS academy_courses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  thumbnail_url TEXT,
  price        NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  author_id    UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academy_courses_published ON academy_courses(is_published);
ALTER TABLE academy_courses ENABLE ROW LEVEL SECURITY;

-- Published courses: everyone can read
CREATE POLICY "academy_courses: public read published"
  ON academy_courses FOR SELECT
  USING (is_published = TRUE);

-- Author can manage their own courses
CREATE POLICY "academy_courses: author manage"
  ON academy_courses FOR ALL
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE TABLE IF NOT EXISTS academy_lessons (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  video_url    TEXT,
  duration_sec INT,
  position     INT NOT NULL DEFAULT 0,
  is_preview   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_course_id ON academy_lessons(course_id);
ALTER TABLE academy_lessons ENABLE ROW LEVEL SECURITY;

-- Preview lessons: everyone; full lessons: enrolled users
CREATE POLICY "academy_lessons: preview read"
  ON academy_lessons FOR SELECT
  USING (
    is_preview = TRUE
    OR course_id IN (
      SELECT course_id FROM academy_enrollments
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

CREATE TABLE IF NOT EXISTS academy_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'active',
  enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ,
  UNIQUE (user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_user_id ON academy_enrollments(user_id);
ALTER TABLE academy_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_enrollments: owner read"
  ON academy_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "academy_enrollments: owner insert"
  ON academy_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS academy_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES academy_lessons(id) ON DELETE CASCADE,
  watched_sec  INT NOT NULL DEFAULT 0,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  last_watched TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS idx_academy_progress_user_id ON academy_progress(user_id);
ALTER TABLE academy_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "academy_progress: owner all"
  ON academy_progress FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 3. INVEST
-- =============================================================================

CREATE TABLE IF NOT EXISTS invest_packages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  description  TEXT,
  min_amount   NUMERIC(18,2) NOT NULL,
  max_amount   NUMERIC(18,2),
  roi_percent  NUMERIC(6,2) NOT NULL,
  duration_days INT NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE invest_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invest_packages: public read active"
  ON invest_packages FOR SELECT
  USING (is_active = TRUE);

CREATE TABLE IF NOT EXISTS invest_investments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id   UUID NOT NULL REFERENCES invest_packages(id),
  amount       NUMERIC(18,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active',
  start_date   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  maturity_date TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invest_investments_user_id ON invest_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_invest_investments_status ON invest_investments(status);
ALTER TABLE invest_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invest_investments: owner all"
  ON invest_investments FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS invest_returns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id  UUID NOT NULL REFERENCES invest_investments(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES auth.users(id),
  amount         NUMERIC(18,2) NOT NULL,
  paid_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invest_returns_user_id ON invest_returns(user_id);
ALTER TABLE invest_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invest_returns: owner read"
  ON invest_returns FOR SELECT
  USING (user_id = auth.uid());

-- =============================================================================
-- 4. MARKET
-- =============================================================================

CREATE TABLE IF NOT EXISTS market_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  parent_id    UUID REFERENCES market_categories(id),
  position     INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE market_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_categories: public read"
  ON market_categories FOR SELECT USING (is_active = TRUE);

CREATE TABLE IF NOT EXISTS market_products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  UUID REFERENCES market_categories(id),
  name         TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  description  TEXT,
  price        NUMERIC(12,2) NOT NULL,
  stock        INT NOT NULL DEFAULT 0,
  images       TEXT[],
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_products_category ON market_products(category_id);
CREATE INDEX IF NOT EXISTS idx_market_products_active ON market_products(is_active);
ALTER TABLE market_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_products: public read active"
  ON market_products FOR SELECT USING (is_active = TRUE);

CREATE TABLE IF NOT EXISTS market_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total        NUMERIC(12,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  shipping_addr JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_orders_user_id ON market_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_market_orders_status ON market_orders(status);
ALTER TABLE market_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_orders: owner all"
  ON market_orders FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS market_order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES market_orders(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES market_products(id),
  quantity     INT NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_order_items_order ON market_order_items(order_id);
ALTER TABLE market_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_order_items: owner read"
  ON market_order_items FOR SELECT
  USING (order_id IN (SELECT id FROM market_orders WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS market_cart (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id   UUID NOT NULL REFERENCES market_products(id),
  quantity     INT NOT NULL DEFAULT 1,
  added_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);
ALTER TABLE market_cart ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_cart: owner all"
  ON market_cart FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- 5. CHAT
-- =============================================================================

CREATE TABLE IF NOT EXISTS chat_rooms (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT,
  type         TEXT NOT NULL DEFAULT 'direct',
  created_by   UUID NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_rooms: member read"
  ON chat_rooms FOR SELECT
  USING (id IN (SELECT room_id FROM chat_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS chat_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (room_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON chat_members(user_id);
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_members: self read"
  ON chat_members FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "chat_members: room member read others"
  ON chat_members FOR SELECT
  USING (room_id IN (SELECT room_id FROM chat_members WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id      UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES auth.users(id),
  body         TEXT,
  type         TEXT NOT NULL DEFAULT 'text',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  edited_at    TIMESTAMPTZ,
  deleted_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id, created_at DESC);
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages: room member read"
  ON chat_messages FOR SELECT
  USING (room_id IN (SELECT room_id FROM chat_members WHERE user_id = auth.uid()));
CREATE POLICY "chat_messages: sender insert"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND room_id IN (SELECT room_id FROM chat_members WHERE user_id = auth.uid())
  );
CREATE POLICY "chat_messages: sender update own"
  ON chat_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- =============================================================================
-- 6. TODO
-- =============================================================================

CREATE TABLE IF NOT EXISTS todo_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'todo',
  priority     TEXT NOT NULL DEFAULT 'medium',
  due_date     TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_user_id ON todo_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_tasks_status ON todo_tasks(status);
ALTER TABLE todo_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todo_tasks: owner all"
  ON todo_tasks FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS todo_labels (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  color        TEXT NOT NULL DEFAULT '#6366f1',
  UNIQUE (user_id, name)
);
ALTER TABLE todo_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todo_labels: owner all"
  ON todo_labels FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS todo_task_labels (
  task_id      UUID NOT NULL REFERENCES todo_tasks(id) ON DELETE CASCADE,
  label_id     UUID NOT NULL REFERENCES todo_labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);
ALTER TABLE todo_task_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todo_task_labels: owner all"
  ON todo_task_labels FOR ALL
  USING (task_id IN (SELECT id FROM todo_tasks WHERE user_id = auth.uid()));

-- =============================================================================
-- 7. EXPENSE TRACKER
-- =============================================================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  icon         TEXT,
  color        TEXT NOT NULL DEFAULT '#10b981',
  is_system    BOOLEAN NOT NULL DEFAULT FALSE  -- system categories have user_id = NULL
);
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_categories: system or owner read"
  ON expense_categories FOR SELECT
  USING (is_system = TRUE OR user_id = auth.uid());
CREATE POLICY "expense_categories: owner manage custom"
  ON expense_categories FOR ALL
  USING (is_system = FALSE AND user_id = auth.uid())
  WITH CHECK (is_system = FALSE AND user_id = auth.uid());

CREATE TABLE IF NOT EXISTS expense_expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES expense_categories(id),
  amount       NUMERIC(12,2) NOT NULL,
  currency     TEXT NOT NULL DEFAULT 'VND',
  description  TEXT,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expense_expenses_user_id ON expense_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_expenses_date ON expense_expenses(date DESC);
ALTER TABLE expense_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_expenses: owner all"
  ON expense_expenses FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS expense_budgets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES expense_categories(id),
  amount       NUMERIC(12,2) NOT NULL,
  period       TEXT NOT NULL DEFAULT 'monthly',
  start_date   DATE NOT NULL,
  end_date     DATE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expense_budgets_user_id ON expense_budgets(user_id);
ALTER TABLE expense_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expense_budgets: owner all"
  ON expense_budgets FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- Realtime: enable for chat (instant messaging)
-- =============================================================================
-- Run in Supabase Dashboard → Database → Replication → Tables
-- Or uncomment if using Supabase CLI:
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_members;
