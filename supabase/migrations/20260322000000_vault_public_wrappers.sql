-- Expose vault.create_secret and vault.update_secret through the public schema
-- so PostgREST can call them via /rpc/. Service role only.

CREATE OR REPLACE FUNCTION public.vault_create_secret(secret text, name text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vault.create_secret(secret, name);
$$;

CREATE OR REPLACE FUNCTION public.vault_update_secret(secret_id uuid, new_secret text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM vault.update_secret(secret_id, new_secret);
END;
$$;

-- Revoke from public, only service role should call these
REVOKE ALL ON FUNCTION public.vault_create_secret(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.vault_update_secret(uuid, text) FROM PUBLIC, anon, authenticated;
