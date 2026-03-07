-- =============================================================================
-- Migration: 20250201000002_add_admin_role
-- Description: Add admin role support and admin-only views
-- =============================================================================

-- Add is_admin column to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.user_profiles.is_admin IS 'Whether user has admin privileges';

-- Create index for admin lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin
  ON public.user_profiles(is_admin) WHERE is_admin = true;

-- Set initial admin user
-- First ensure the user has a profile
INSERT INTO public.user_profiles (user_id, is_admin)
SELECT id, true
FROM auth.users
WHERE email = 'tobias.becker.olsson@gmail.com'
ON CONFLICT (user_id)
DO UPDATE SET is_admin = true;

-- =============================================================================
-- ADMIN STATS VIEW
-- Comprehensive stats for admin dashboard (extends user_stats)
-- =============================================================================
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > now() - interval '7 days') as active_users_7d,
  (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > now() - interval '30 days') as active_users_30d,
  (SELECT COUNT(*) FROM auth.users WHERE created_at > now() - interval '7 days') as new_users_7d,
  (SELECT COUNT(*) FROM public.liked_commanders WHERE unliked_at IS NULL) as total_likes,
  (SELECT COUNT(*) FROM public.swipe_history) as total_swipes,
  (SELECT COUNT(*) FROM public.decks) as total_decks,
  (SELECT ROUND(
    COUNT(*) FILTER (WHERE action = 'like')::numeric /
    NULLIF(COUNT(*)::numeric, 0) * 100, 1
  ) FROM public.swipe_history) as overall_like_rate;

COMMENT ON VIEW public.admin_stats IS 'High-level statistics for admin dashboard';

-- =============================================================================
-- Function to check if current user is admin
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- RLS Policies for admin access to views
-- =============================================================================

-- Allow admins to read user_stats view
CREATE POLICY "Admins can view user_stats"
  ON public.user_profiles FOR SELECT
  USING (public.is_admin() OR auth.uid() = user_id);

-- Allow admins to read analytics_events
CREATE POLICY "Admins can view analytics_events"
  ON public.analytics_events FOR SELECT
  USING (public.is_admin());
