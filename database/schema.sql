CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_meta (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_meta (key, value)
VALUES ('schema_version', '1.2.0-public')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- Identity is owned by the external OW login portal. Never store passwords here.
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_subject text NOT NULL UNIQUE,
  email text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  business_name text NOT NULL DEFAULT '',
  business_email text NOT NULL DEFAULT '',
  business_phone text NOT NULL DEFAULT '',
  business_address text NOT NULL DEFAULT '',
  default_currency varchar(3) NOT NULL DEFAULT 'USD',
  logo_object_key text,
  avatar_url text NOT NULL DEFAULT '',
  signature_enabled boolean NOT NULL DEFAULT false,
  signature_mode text NOT NULL DEFAULT 'typed' CHECK (signature_mode IN ('typed','drawn')),
  signature_value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (default_currency ~ '^[A-Z]{3}$')
);

CREATE TABLE IF NOT EXISTS document_counters (
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('invoice', 'receipt')),
  issue_year integer NOT NULL,
  last_sequence integer NOT NULL DEFAULT 0 CHECK (last_sequence >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, document_type, issue_year)
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  request_id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_type text NOT NULL CHECK (document_type IN ('invoice', 'receipt')),
  document_number text NOT NULL,
  sequence integer NOT NULL CHECK (sequence > 0),
  issue_year integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'void')),
  issue_date date NOT NULL,
  due_date date,
  client_name text NOT NULL,
  client_email text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  client_address text NOT NULL DEFAULT '',
  currency varchar(3) NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  tax_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  discount_total numeric(14,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  delivery_fee numeric(14,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total numeric(14,2) NOT NULL CHECK (total >= 0),
  payment_method text NOT NULL DEFAULT '',
  transaction_reference text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, request_id),
  UNIQUE (user_id, document_type, document_number),
  CHECK (currency ~ '^[A-Z]{3}$'),
  CHECK (due_date IS NULL OR due_date >= issue_date),
  CHECK (jsonb_typeof(items) = 'array'),
  CHECK (round((subtotal + tax_total + delivery_fee - discount_total)::numeric, 2) = total)
);

CREATE INDEX IF NOT EXISTS documents_user_recent_idx
  ON documents (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_user_type_idx
  ON documents (user_id, document_type, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_user_status_idx
  ON documents (user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS documents_user_client_idx
  ON documents (user_id, lower(client_name));

CREATE TABLE IF NOT EXISTS client_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text NOT NULL DEFAULT '',
  client_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_presets_user_name_idx ON client_presets (user_id, lower(client_name));

CREATE TABLE IF NOT EXISTS audit_events (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_events_user_recent_idx ON audit_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  rate_key char(64) NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL DEFAULT 1 CHECK (request_count > 0),
  PRIMARY KEY (rate_key, action, window_start)
);

CREATE TABLE IF NOT EXISTS document_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  object_key text NOT NULL UNIQUE,
  sha256 char(64) NOT NULL,
  byte_count integer NOT NULL CHECK (byte_count > 0 AND byte_count <= 3145728),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id)
);

-- Optional analytics only; PayPal remains the payment processor and source of truth.
CREATE TABLE IF NOT EXISTS support_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  provider text NOT NULL DEFAULT 'paypal' CHECK (provider = 'paypal'),
  provider_reference text UNIQUE,
  amount numeric(14,2) CHECK (amount IS NULL OR amount > 0),
  currency varchar(3) CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  status text NOT NULL DEFAULT 'opened' CHECK (status IN ('opened', 'completed', 'cancelled', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);


