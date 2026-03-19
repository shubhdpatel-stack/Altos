-- Add user_id to flight_intents so each flight is tied to an auth user
ALTER TABLE public.flight_intents
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the old open policies
DROP POLICY IF EXISTS "Anyone can read flight intents" ON public.flight_intents;
DROP POLICY IF EXISTS "Anyone can insert flight intents" ON public.flight_intents;
DROP POLICY IF EXISTS "Anyone can update flight intents" ON public.flight_intents;

-- New policies: users can only see/manage their own intents
CREATE POLICY "Users read own intents"
ON public.flight_intents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own intents"
ON public.flight_intents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own intents"
ON public.flight_intents FOR UPDATE
USING (auth.uid() = user_id);
