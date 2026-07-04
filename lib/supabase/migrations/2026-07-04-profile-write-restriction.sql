-- ─────────────────────────────────────────────────────────────────────────────
-- Security: restrict profile UPDATE to display fields only
--
-- Problem: the "profiles: own row" FOR ALL policy allows any authenticated user
-- to UPDATE subscription_tier, subscription_status, stripe_customer_id, etc.
-- via the Supabase client with the anon key. A free user can self-upgrade by
-- calling: supabase.from('profiles').update({ subscription_tier: 'pro' })
--
-- Fix: a BEFORE UPDATE trigger resets sensitive columns to their OLD values
-- when the caller is not the service_role. The service_role (used by webhook
-- and admin routes) is unaffected.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only enforce restrictions on non-service-role callers
  IF current_setting('role') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Authenticated users may only change display_name and avatar_url.
  -- Any attempt to write the fields below is silently reverted to the old value.
  NEW.subscription_tier          := OLD.subscription_tier;
  NEW.subscription_status        := OLD.subscription_status;
  NEW.subscription_period_end    := OLD.subscription_period_end;
  NEW.stripe_customer_id         := OLD.stripe_customer_id;
  NEW.word_conversions_this_month := OLD.word_conversions_this_month;
  NEW.word_conversions_reset_at   := OLD.word_conversions_reset_at;
  NEW.email                      := OLD.email;

  RETURN NEW;
END;
$$;

-- Attach trigger (idempotent)
DROP TRIGGER IF EXISTS profiles_protect_sensitive_fields ON public.profiles;
CREATE TRIGGER profiles_protect_sensitive_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- Comment for Supabase dashboard audit
COMMENT ON FUNCTION public.protect_profile_sensitive_fields() IS
  'Prevents authenticated users from updating subscription/payment columns directly. '
  'Only service_role callers (API routes using the admin client) can modify these fields.';
