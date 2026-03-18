-- Add engagement stats and daily stats RPC functions for admin dashboard
-- Replaces direct daily_stats view query (broken by RLS for admins)
-- Adds new engagement/retention metrics

-- ============================================================
-- 1. get_daily_stats RPC — admin-only, bypasses RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_daily_stats(day_count INTEGER DEFAULT 14)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_data ORDER BY date DESC)
  FROM (
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
    WHERE created_at > now() - make_interval(days => LEAST(day_count, 90))
    GROUP BY date_trunc('day', created_at)::date
    ORDER BY date DESC
  ) row_data INTO result;

  RETURN COALESCE(result, '[]'::json);
END;
$$;

REVOKE ALL ON FUNCTION public.get_daily_stats(INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_daily_stats(INTEGER) TO authenticated;

-- ============================================================
-- 2. get_engagement_stats RPC — admin-only engagement metrics
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_engagement_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    -- Active user counts
    'dau', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.swipe_history
      WHERE created_at > now() - interval '24 hours'
    ),
    'wau', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.swipe_history
      WHERE created_at > now() - interval '7 days'
    ),
    'mau', (
      SELECT COUNT(DISTINCT user_id)
      FROM public.swipe_history
      WHERE created_at > now() - interval '30 days'
    ),

    -- New vs returning users (7d window)
    'new_users_active_7d', (
      SELECT COUNT(DISTINCT sh.user_id)
      FROM public.swipe_history sh
      JOIN auth.users u ON u.id = sh.user_id
      WHERE sh.created_at > now() - interval '7 days'
        AND u.created_at > now() - interval '7 days'
    ),
    'returning_users_7d', (
      SELECT COUNT(DISTINCT sh.user_id)
      FROM public.swipe_history sh
      JOIN auth.users u ON u.id = sh.user_id
      WHERE sh.created_at > now() - interval '7 days'
        AND u.created_at <= now() - interval '7 days'
    ),

    -- Deeply engaged: swipe + like + deck in last 30d
    'deeply_engaged_30d', (
      SELECT COUNT(*)
      FROM (
        SELECT user_id
        FROM public.swipe_history
        WHERE created_at > now() - interval '30 days'
        GROUP BY user_id
        HAVING user_id IN (
          SELECT user_id FROM public.liked_commanders
          WHERE created_at > now() - interval '30 days' AND unliked_at IS NULL
        )
        AND user_id IN (
          SELECT user_id FROM public.decks
          WHERE created_at > now() - interval '30 days'
        )
      ) engaged
    ),

    -- Avg swipes per active user (7d)
    'avg_swipes_per_user_7d', (
      SELECT COALESCE(ROUND(AVG(cnt)::numeric, 1), 0)
      FROM (
        SELECT COUNT(*) as cnt
        FROM public.swipe_history
        WHERE created_at > now() - interval '7 days'
        GROUP BY user_id
      ) per_user
    ),

    -- Week-over-week: current week (last 7d) vs previous week (7-14d ago)
    'curr_week_swipes', (
      SELECT COUNT(*) FROM public.swipe_history
      WHERE created_at > now() - interval '7 days'
    ),
    'prev_week_swipes', (
      SELECT COUNT(*) FROM public.swipe_history
      WHERE created_at > now() - interval '14 days'
        AND created_at <= now() - interval '7 days'
    ),
    'curr_week_likes', (
      SELECT COUNT(*) FROM public.swipe_history
      WHERE created_at > now() - interval '7 days' AND action = 'like'
    ),
    'prev_week_likes', (
      SELECT COUNT(*) FROM public.swipe_history
      WHERE created_at > now() - interval '14 days'
        AND created_at <= now() - interval '7 days' AND action = 'like'
    ),
    'curr_week_active', (
      SELECT COUNT(DISTINCT user_id) FROM public.swipe_history
      WHERE created_at > now() - interval '7 days'
    ),
    'prev_week_active', (
      SELECT COUNT(DISTINCT user_id) FROM public.swipe_history
      WHERE created_at > now() - interval '14 days'
        AND created_at <= now() - interval '7 days'
    ),
    'curr_week_new_users', (
      SELECT COUNT(*) FROM auth.users
      WHERE created_at > now() - interval '7 days'
    ),
    'prev_week_new_users', (
      SELECT COUNT(*) FROM auth.users
      WHERE created_at > now() - interval '14 days'
        AND created_at <= now() - interval '7 days'
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_engagement_stats() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_engagement_stats() TO authenticated;
