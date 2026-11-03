ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_url text NOT NULL DEFAULT '';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS signature_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS signature_mode text NOT NULL DEFAULT 'typed' CHECK(signature_mode IN('typed','drawn'));
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS signature_value text NOT NULL DEFAULT '';
CREATE TABLE IF NOT EXISTS client_presets(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,client_name text NOT NULL,client_phone text NOT NULL DEFAULT '',client_email text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS client_presets_user_name_idx ON client_presets(user_id,lower(client_name));
CREATE TABLE IF NOT EXISTS audit_events(id bigserial PRIMARY KEY,user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,action text NOT NULL,metadata jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS audit_events_user_recent_idx ON audit_events(user_id,created_at DESC);
INSERT INTO app_meta(key,value,updated_at) VALUES('schema_version','1.2.0-public',now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now();
