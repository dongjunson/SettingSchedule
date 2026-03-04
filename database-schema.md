# Supabase Database Schema

## Tables

### `sites`
Project sites (사업소).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `text` | **Primary Key**. Site identifier (e.g., 'anyang-bakdal') |
| `name` | `text` | Display name of the site (e.g., '안양 박달 사업소') |
| `stage` | `text` | Project stage: `null` = hidden from "구축중 프로젝트" list, `'구축중'` = shown there |
| `site_url` | `text` | 프로젝트별 사이트 주소 (풀 URL, 예: `http://106.246.226.26:48000/`). nullable. |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |

### `timeline_items`
Tasks within the timeline for each site.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. Auto-incrementing identity |
| `site_id` | `text` | **Foreign Key** referencing `sites.id` |
| `step` | `text` | Step identifier (e.g., '1-01') |
| `task` | `text` | Task description (e.g., 'Kick-Off') |
| `section` | `text` | Major section (e.g., '구축 및 설치') |
| `subsection` | `text` | Subsection (nullable) |
| `status` | `text` | Status: 'pending', 'working', 'completed' |
| `role` | `text` | Responsible role: 'field', 'rnd', 'both' |
| `start_date` | `date` | Start date (nullable) |
| `completion_date` | `date` | Completion date (nullable) |
| `completed_at` | `timestamptz` | Completion timestamp (nullable) |
| `completed_by` | `text` | Completed by (group/user label) (nullable) |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |

### `checklist_items`
Checklist items for system verification.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. Auto-incrementing identity |
| `site_id` | `text` | **Foreign Key** referencing `sites.id` |
| `text` | `text` | Checklist item description |
| `checked` | `boolean` | Completion status (default: `false`) |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |

### `income_statements`
Income statement header per site.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. Auto-incrementing identity |
| `site_id` | `text` | **Foreign Key** referencing `sites.id` (unique per site) |
| `expected_amount` | `numeric` | Expected amount (nullable) |
| `contract_amount` | `numeric` | Contract amount (nullable) |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |
| `updated_at` | `timestamptz` | Update timestamp (default: `now()`) |

### `income_statement_items`
Income statement line items (sales/expense).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. Auto-incrementing identity |
| `statement_id` | `bigint` | **Foreign Key** referencing `income_statements.id` |
| `type` | `text` | Item type: `sales` or `expense` |
| `group_name` | `text` | Expense group: `variable` or `field_ops` (nullable for sales) |
| `category` | `text` | Expense category (nullable for sales) |
| `name` | `text` | Item name |
| `amount` | `numeric` | Amount (default: `0`) |
| `note` | `text` | Note (nullable) |
| `order_index` | `int` | Display order |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |

### `income_statements`
Income statement header per site.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. Auto-incrementing identity |
| `site_id` | `text` | **Foreign Key** referencing `sites.id` (unique per site) |
| `expected_amount` | `numeric` | Expected amount input |
| `contract_amount` | `numeric` | Contract amount input |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |
| `updated_at` | `timestamptz` | Update timestamp (default: `now()`) |

### `income_statement_items`
Income statement line items (sales/expense).

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `bigint` | **Primary Key**. Auto-incrementing identity |
| `statement_id` | `bigint` | **Foreign Key** referencing `income_statements.id` |
| `type` | `text` | 'sales' or 'expense' |
| `name` | `text` | Item name |
| `amount` | `numeric` | Item amount (default: `0`) |
| `note` | `text` | Optional note |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |

### `app_users`
Pre-issued users for ID/password distribution login.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `text` | **Primary Key**. Login ID (e.g., 'admin', 'rnd', 'system') |
| `group_name` | `text` | Display group name (e.g., '관리자', 'R&D', '사업지원팀') |
| `password_hash` | `text` | Password hash (pgcrypto `crypt`) |
| `email` | `text` | Optional. Auth 이메일 (`id` + '@pms.local'). [supabase-setup-manual.md](supabase-setup-manual.md)의 업데이트 쿼리로 채움. |
| `created_at` | `timestamptz` | Creation timestamp (default: `now()`) |

## SQL Initialization

```sql
-- Create sites table
CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  stage TEXT,
  site_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create timeline_items table
CREATE TABLE timeline_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
  step TEXT NOT NULL,
  task TEXT NOT NULL,
  section TEXT NOT NULL,
  subsection TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'working', 'completed')),
  role TEXT DEFAULT 'field' CHECK (role IN ('field', 'rnd', 'both')),
  start_date DATE,
  completion_date DATE,
  completed_at TIMESTAMPTZ,
  completed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create checklist_items table
CREATE TABLE checklist_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  site_id TEXT REFERENCES sites(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Drop income statement tables if they already exist
DROP TABLE IF EXISTS income_statement_items CASCADE;
DROP TABLE IF EXISTS income_statements CASCADE;

-- Create income_statements table
CREATE TABLE income_statements (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  site_id TEXT UNIQUE REFERENCES sites(id) ON DELETE CASCADE,
  expected_amount NUMERIC,
  contract_amount NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create income_statement_items table
CREATE TABLE income_statement_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  statement_id BIGINT REFERENCES income_statements(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('sales', 'expense')),
  group_name TEXT,
  category TEXT,
  name TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  note TEXT,
  payment_type TEXT,
  spent_at DATE,
  description TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Field ops expense details (group_name = 'field_ops') use:
-- payment_type (지출 종류), spent_at (일자), description (상세 내용)

-- Create app_users table (pre-issued accounts)
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE TABLE app_users (
  id TEXT PRIMARY KEY,
  group_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Login RPC (returns 1 row on success, 0 rows on failure)
CREATE OR REPLACE FUNCTION pms_login(p_user_id TEXT, p_password TEXT)
RETURNS TABLE(user_id TEXT, user_group TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.group_name
  FROM app_users u
  WHERE u.id = p_user_id
    AND u.password_hash = extensions.crypt(p_password, u.password_hash);
END;
$$;

-- Login by email (uses app_users.email; used by app when user enters email)
CREATE OR REPLACE FUNCTION pms_login_by_email(p_email TEXT, p_password TEXT)
RETURNS TABLE(user_id TEXT, user_group TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.group_name
  FROM app_users u
  WHERE u.email = p_email
    AND u.password_hash = extensions.crypt(p_password, u.password_hash);
END;
$$;

-- Enable RLS
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated only: 로그인 후 Supabase Auth 세션이 있어야 접근 가능)
CREATE POLICY "Authenticated read write sites"
  ON sites FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read write timeline_items"
  ON timeline_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read write checklist_items"
  ON checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read write income_statements"
  ON income_statements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated read write income_statement_items"
  ON income_statement_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users table should not be readable from clients; allow only the login RPC.
CREATE POLICY "Deny all access to app_users" ON app_users FOR ALL USING (false) WITH CHECK (false);
REVOKE ALL ON TABLE app_users FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION pms_login(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION pms_login_by_email(TEXT, TEXT) TO anon, authenticated;
```

### Migration: sites에 site_url 추가 (기존 DB)

이미 `sites` 테이블이 있는 경우, Supabase SQL Editor에서 아래만 실행하면 됩니다.

```sql
ALTER TABLE sites ADD COLUMN IF NOT EXISTS site_url TEXT;
```
