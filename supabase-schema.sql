-- ============================================================
-- Finflow — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- ============================================================

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount      NUMERIC NOT NULL,
  category    TEXT NOT NULL,
  description TEXT DEFAULT '',
  date        DATE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Budgets table (one row per user + category)
-- NOTE: "limit" is a reserved keyword in PostgreSQL, so it must be
-- double-quoted everywhere it appears.
CREATE TABLE IF NOT EXISTS budgets (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  "limit"  NUMERIC NOT NULL,
  color    TEXT NOT NULL,
  UNIQUE(user_id, category)
);

-- Custom categories table
CREATE TABLE IF NOT EXISTS custom_categories (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  color    TEXT NOT NULL,
  icon     TEXT NOT NULL DEFAULT 'Tag',
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies: users can only access their own rows
CREATE POLICY "users_crud_transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_crud_budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_crud_categories" ON custom_categories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
