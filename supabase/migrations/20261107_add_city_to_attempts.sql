-- Additive migration: existing submissions remain unchanged and may have NULL city.
ALTER TABLE public.attempts
ADD COLUMN IF NOT EXISTS city TEXT;
