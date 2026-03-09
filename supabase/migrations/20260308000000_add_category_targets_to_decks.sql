-- Add category_targets column to decks table for draft builder feature
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS category_targets jsonb DEFAULT NULL;

COMMENT ON COLUMN public.decks.category_targets IS 'User-configured target counts per deck category (ramp, draw, removal, etc.)';
