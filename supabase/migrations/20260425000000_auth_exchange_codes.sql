-- SEC-01: one-time exchange codes for extension auth token relay.
-- Tokens are stored server-side for ≤30 seconds, retrieved via POST (never URL).
CREATE TABLE auth_exchange_codes (
  code        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token  TEXT      NOT NULL,
  refresh_token TEXT      NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 seconds',
  used        BOOLEAN     NOT NULL DEFAULT FALSE
);

-- Only the service role touches this table — no user-facing RLS policies.
ALTER TABLE auth_exchange_codes ENABLE ROW LEVEL SECURITY;

-- Auto-purge expired/used codes older than 5 minutes to keep the table tiny.
CREATE OR REPLACE FUNCTION purge_expired_exchange_codes() RETURNS void
  LANGUAGE sql SECURITY DEFINER AS $$
    DELETE FROM auth_exchange_codes
    WHERE used = TRUE OR expires_at < NOW() - INTERVAL '5 minutes';
  $$;
