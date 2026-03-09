-- Update get_random_commanders RPC to support advanced filters:
-- cmc_min/cmc_max, keyword_filter, type_filter

-- Add indexes to support new filter queries
CREATE INDEX IF NOT EXISTS idx_commanders_keywords ON public.commanders USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_commanders_type_line ON public.commanders USING gin(type_line gin_trgm_ops);

-- Drop and recreate with new signature
DROP FUNCTION IF EXISTS public.get_random_commanders(TEXT[], INTEGER);

CREATE OR REPLACE FUNCTION public.get_random_commanders(
  color_filter TEXT[] DEFAULT NULL,
  cmc_min NUMERIC DEFAULT NULL,
  cmc_max NUMERIC DEFAULT NULL,
  keyword_filter TEXT[] DEFAULT NULL,
  type_filter TEXT[] DEFAULT NULL,
  result_limit INTEGER DEFAULT 3
)
RETURNS SETOF public.commanders
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.*
  FROM commanders c
  WHERE
    -- Color identity filter: if provided, commander's colors must be a subset
    (color_filter IS NULL OR c.color_identity <@ color_filter)
    -- CMC range
    AND (cmc_min IS NULL OR c.cmc >= cmc_min)
    AND (cmc_max IS NULL OR c.cmc <= cmc_max)
    -- Keyword filter: commander must have ALL specified keywords
    AND (keyword_filter IS NULL OR c.keywords @> keyword_filter)
    -- Type filter: commander type_line must contain ANY of the specified types
    AND (
      type_filter IS NULL
      OR EXISTS (
        SELECT 1 FROM unnest(type_filter) AS tf(t)
        WHERE lower(c.type_line) LIKE '%' || t || '%'
      )
    )
    -- Exclude recently swiped commanders for authenticated users
    AND (
      auth.uid() IS NULL
      OR c.scryfall_id NOT IN (
        SELECT sh.commander_id
        FROM swipe_history sh
        WHERE sh.user_id = auth.uid()
          AND sh.created_at > now() - interval '30 days'
      )
    )
  ORDER BY random()
  LIMIT LEAST(result_limit, 10);
$$;

-- Grant execute to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION public.get_random_commanders(TEXT[], NUMERIC, NUMERIC, TEXT[], TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_random_commanders(TEXT[], NUMERIC, NUMERIC, TEXT[], TEXT[], INTEGER) TO anon;
