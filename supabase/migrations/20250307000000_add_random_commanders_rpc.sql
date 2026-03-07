-- RPC function to fetch random commanders from the commanders table.
-- Uses auth.uid() internally for secure swipe history exclusion.

CREATE OR REPLACE FUNCTION public.get_random_commanders(
  color_filter TEXT[] DEFAULT NULL,
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
GRANT EXECUTE ON FUNCTION public.get_random_commanders(TEXT[], INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_random_commanders(TEXT[], INTEGER) TO anon;
