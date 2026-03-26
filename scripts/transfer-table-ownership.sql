-- Transfer ownership of all public schema tables to the connected user.
-- Run once to fix ownership after switching to a dedicated schema role.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO %I', r.tablename, current_user);
  END LOOP;
END $$;
