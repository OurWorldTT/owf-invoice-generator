INSERT INTO app_meta(key,value,updated_at) VALUES('schema_version','1.1.0-public',now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now();
CREATE TABLE IF NOT EXISTS api_rate_limits(rate_key char(64) NOT NULL,action text NOT NULL,window_start timestamptz NOT NULL,request_count integer NOT NULL DEFAULT 1 CHECK(request_count>0),PRIMARY KEY(rate_key,action,window_start));
CREATE INDEX IF NOT EXISTS api_rate_limits_cleanup_idx ON api_rate_limits(window_start);
