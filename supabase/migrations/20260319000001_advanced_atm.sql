-- Advanced ATM: Airspace Scheduling, 4D Routing, Traffic Management, Vertiport Coordination

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Airspace Segments — corridors with capacity limits
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.airspace_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  altitude_band TEXT NOT NULL DEFAULT 'low',
  capacity_per_hour INTEGER NOT NULL DEFAULT 8,
  current_load INTEGER NOT NULL DEFAULT 0,
  is_no_fly BOOLEAN NOT NULL DEFAULT false,
  no_fly_reason TEXT,
  no_fly_start TIMESTAMPTZ,
  no_fly_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Time Slots — allocated departure/corridor entry windows
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES public.airspace_segments(id) ON DELETE CASCADE,
  flight_intent_id UUID REFERENCES public.flight_intents(id) ON DELETE CASCADE,
  aircraft_id TEXT NOT NULL,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  priority INTEGER NOT NULL DEFAULT 40,  -- 100=emergency, 80=tier1, 60=tier2, 40=standard
  status TEXT NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated','active','completed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Vertiports — takeoff/landing sites with capacity
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vertiports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  city TEXT,
  lat NUMERIC NOT NULL DEFAULT 0,
  lon NUMERIC NOT NULL DEFAULT 0,
  max_departures_per_hour INTEGER NOT NULL DEFAULT 4,
  max_arrivals_per_hour INTEGER NOT NULL DEFAULT 4,
  pad_count INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Vertiport Slots — scheduled departure/arrival events
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.vertiport_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vertiport_id UUID REFERENCES public.vertiports(id) ON DELETE CASCADE,
  flight_intent_id UUID REFERENCES public.flight_intents(id) ON DELETE CASCADE,
  aircraft_id TEXT NOT NULL,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('departure','arrival')),
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','active','completed','cancelled','delayed')),
  delay_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Flight Decisions — single GO/DELAY/REROUTE per flight
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.flight_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_intent_id UUID REFERENCES public.flight_intents(id) ON DELETE CASCADE,
  aircraft_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('GO','DELAY','REROUTE')),
  reason TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 80 CHECK (confidence BETWEEN 0 AND 100),
  departure_time TIMESTAMPTZ,
  delay_minutes INTEGER DEFAULT 0,
  route_id UUID REFERENCES public.routes(id) ON DELETE SET NULL,
  simulation_result JSONB,
  weather_risk TEXT DEFAULT 'low',
  airspace_load INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Trajectory Updates — real-time position tracking
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.trajectory_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_intent_id UUID REFERENCES public.flight_intents(id) ON DELETE CASCADE,
  aircraft_id TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lon NUMERIC NOT NULL,
  altitude_ft INTEGER NOT NULL DEFAULT 500,
  speed_kmh NUMERIC NOT NULL DEFAULT 90,
  heading_deg NUMERIC DEFAULT 0,
  is_on_route BOOLEAN DEFAULT true,
  deviation_meters NUMERIC DEFAULT 0,
  battery_pct NUMERIC DEFAULT 100,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Anomalies — detected deviations and risks
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_intent_id UUID REFERENCES public.flight_intents(id) ON DELETE CASCADE,
  aircraft_id TEXT NOT NULL,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('route_deviation','unexpected_slowdown','battery_risk','weather_spike','airspace_breach','conflict_proximity')),
  severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low','moderate','high','critical')),
  description TEXT NOT NULL,
  lat NUMERIC,
  lon NUMERIC,
  detected_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Default Vertiports
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.vertiports (name, city, lat, lon, max_departures_per_hour, max_arrivals_per_hour, pad_count) VALUES
  ('Downtown Vertiport', 'City Center', 40.7128, -74.0060, 6, 6, 3),
  ('Airport Vertiport North', 'North District', 40.7580, -73.9855, 8, 8, 4),
  ('Bay Vertiport', 'Waterfront', 40.6892, -74.0445, 4, 4, 2),
  ('Uptown Hub', 'Uptown', 40.7831, -73.9712, 5, 5, 3),
  ('East Corridor Hub', 'East Side', 40.7282, -73.9442, 4, 4, 2);

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Default Airspace Segments
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.airspace_segments (name, altitude_band, capacity_per_hour) VALUES
  ('North Corridor', 'low', 8),
  ('North Corridor', 'mid', 10),
  ('North Corridor', 'high', 6),
  ('South Corridor', 'low', 8),
  ('South Corridor', 'mid', 10),
  ('East Corridor', 'low', 6),
  ('East Corridor', 'mid', 8),
  ('West Corridor', 'low', 6),
  ('Central Hub', 'low', 12),
  ('Central Hub', 'mid', 15);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS Policies (open read, auth-gated write matching existing pattern)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.airspace_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read airspace_segments" ON public.airspace_segments FOR SELECT USING (true);

ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read time_slots" ON public.time_slots FOR SELECT USING (true);
CREATE POLICY "Public insert time_slots" ON public.time_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update time_slots" ON public.time_slots FOR UPDATE USING (true);

ALTER TABLE public.vertiports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read vertiports" ON public.vertiports FOR SELECT USING (true);

ALTER TABLE public.vertiport_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read vertiport_slots" ON public.vertiport_slots FOR SELECT USING (true);
CREATE POLICY "Public insert vertiport_slots" ON public.vertiport_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update vertiport_slots" ON public.vertiport_slots FOR UPDATE USING (true);

ALTER TABLE public.flight_decisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read flight_decisions" ON public.flight_decisions FOR SELECT USING (true);
CREATE POLICY "Public insert flight_decisions" ON public.flight_decisions FOR INSERT WITH CHECK (true);

ALTER TABLE public.trajectory_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read trajectory_updates" ON public.trajectory_updates FOR SELECT USING (true);
CREATE POLICY "Public insert trajectory_updates" ON public.trajectory_updates FOR INSERT WITH CHECK (true);

ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read anomalies" ON public.anomalies FOR SELECT USING (true);
CREATE POLICY "Public insert anomalies" ON public.anomalies FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update anomalies" ON public.anomalies FOR UPDATE USING (true);
