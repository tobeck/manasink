-- Fix Supabase security advisories:
-- 1. auth_users_exposed: user_stats and admin_stats expose auth.users to anon
-- 2. security_definer_view: all 4 views use SECURITY DEFINER
--
-- Strategy:
-- - Replace user_stats and admin_stats views with SECURITY DEFINER RPC functions
--   (they need auth.users access, but functions give us explicit access control)
-- - Recreate daily_stats and popular_commanders as SECURITY INVOKER views
-- - Revoke anon access from admin-only objects

-- ============================================================
-- 1. Drop the problematic views
-- ============================================================
DROP VIEW IF EXISTS public.admin_stats;
DROP VIEW IF EXISTS public.user_stats;
DROP VIEW IF EXISTS public.daily_stats;
DROP VIEW IF EXISTS public.popular_commanders;

-- ============================================================
-- 2. Replace admin_stats with an RPC function (admin-only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only admins can call this
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'active_users_7d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > now() - interval '7 days'),
    'active_users_30d', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > now() - interval '30 days'),
    'new_users_7d', (SELECT COUNT(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
    'total_likes', (SELECT COUNT(*) FROM public.liked_commanders WHERE unliked_at IS NULL),
    'total_swipes', (SELECT COUNT(*) FROM public.swipe_history),
    'total_decks', (SELECT COUNT(*) FROM public.decks),
    'overall_like_rate', (SELECT ROUND(
      COUNT(*) FILTER (WHERE action = 'like')::numeric /
      NULLIF(COUNT(*)::numeric, 0) * 100, 1
    ) FROM public.swipe_history)
  ) INTO result;

  RETURN result;
END;
$$;

-- Only authenticated users can call (admin check is inside the function)
REVOKE ALL ON FUNCTION public.get_admin_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- ============================================================
-- 3. Replace user_stats with an RPC function (admin-only)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_stats(result_limit INTEGER DEFAULT 20)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only admins can call this
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_data ORDER BY total_swipes DESC)
  FROM (
    SELECT
      u.id as user_id,
      u.email,
      u.raw_user_meta_data->>'full_name' as full_name,
      u.raw_user_meta_data->>'avatar_url' as avatar_url,
      u.created_at as joined_at,
      u.last_sign_in_at,
      COALESCE(l.liked_count, 0) as liked_count,
      COALESCE(s.total_swipes, 0) as total_swipes,
      COALESCE(s.like_count, 0) as swipe_likes,
      COALESCE(s.pass_count, 0) as swipe_passes,
      COALESCE(d.deck_count, 0) as deck_count,
      COALESCE(d.total_cards_in_decks, 0) as total_cards_in_decks
    FROM auth.users u
    LEFT JOIN (
      SELECT user_id, COUNT(*) as liked_count
      FROM public.liked_commanders
      WHERE unliked_at IS NULL
      GROUP BY user_id
    ) l ON l.user_id = u.id
    LEFT JOIN (
      SELECT user_id,
        COUNT(*) as total_swipes,
        COUNT(*) FILTER (WHERE action = 'like') as like_count,
        COUNT(*) FILTER (WHERE action = 'pass') as pass_count
      FROM public.swipe_history
      GROUP BY user_id
    ) s ON s.user_id = u.id
    LEFT JOIN (
      SELECT user_id,
        COUNT(*) as deck_count,
        SUM(COALESCE(jsonb_array_length(cards), 0)) as total_cards_in_decks
      FROM public.decks
      GROUP BY user_id
    ) d ON d.user_id = u.id
    LIMIT LEAST(result_limit, 100)
  ) row_data;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_stats(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_stats(INTEGER) TO authenticated;

-- ============================================================
-- 4. Recreate daily_stats as SECURITY INVOKER view (no auth.users)
-- ============================================================
CREATE OR REPLACE VIEW public.daily_stats
WITH (security_invoker = true)
AS
SELECT
  date_trunc('day', created_at)::date as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_swipes,
  COUNT(*) FILTER (WHERE action = 'like') as likes,
  COUNT(*) FILTER (WHERE action = 'pass') as passes,
  ROUND(
    COUNT(*) FILTER (WHERE action = 'like')::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100,
    1
  ) as like_rate_pct
FROM public.swipe_history
GROUP BY date_trunc('day', created_at)::date
ORDER BY date DESC;

-- Only authenticated users (admin check via RLS on swipe_history)
REVOKE ALL ON public.daily_stats FROM anon;
GRANT SELECT ON public.daily_stats TO authenticated;

-- ============================================================
-- 5. Recreate popular_commanders as SECURITY INVOKER view (no auth.users)
-- ============================================================
CREATE OR REPLACE VIEW public.popular_commanders
WITH (security_invoker = true)
AS
SELECT
  commander_id,
  commander_data->>'name' as name,
  commander_data->'colorIdentity' as color_identity,
  commander_data->>'typeLine' as type_line,
  commander_data->>'priceUsd' as price_usd,
  COUNT(*) as like_count,
  COUNT(DISTINCT user_id) as unique_users
FROM public.liked_commanders
WHERE unliked_at IS NULL
GROUP BY commander_id, commander_data
ORDER BY like_count DESC;

-- Only authenticated users (admin check via RLS on liked_commanders)
REVOKE ALL ON public.popular_commanders FROM anon;
GRANT SELECT ON public.popular_commanders TO authenticated;
