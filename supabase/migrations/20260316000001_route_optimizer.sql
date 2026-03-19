-- Route Optimizer Migration
-- Creates routes, route_patterns, and route_score_config tables

-- ──────────────────────────────────────────────
-- 1. routes table
-- ──────────────────────────────────────────────
CREATE TABLE public.routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flight_intent_id UUID REFERENCES public.flight_intents(id) ON DELETE SET NULL,
  aircraft_id TEXT NOT NULL,
  operator_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  altitude_band TEXT NOT NULL,
  primary_route JSONB,
  alternate_routes JSONB,
  overall_score NUMERIC,
  safety_score NUMERIC,
  weather_score NUMERIC,
  traffic_score NUMERIC,
  efficiency_score NUMERIC,
  conflict_details JSONB,
  weather_conditions JSONB,
  weather_risk TEXT DEFAULT 'low',
  selection_reason TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read routes"
ON public.routes
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert routes"
ON public.routes
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update routes"
ON public.routes
FOR UPDATE
USING (true);

-- ──────────────────────────────────────────────
-- 2. route_patterns table
-- ──────────────────────────────────────────────
CREATE TABLE public.route_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origin_key TEXT NOT NULL,
  destination_key TEXT NOT NULL,
  altitude_band TEXT NOT NULL,
  flight_count INTEGER DEFAULT 0,
  avg_overall_score NUMERIC DEFAULT 0,
  avg_safety_score NUMERIC DEFAULT 0,
  avg_weather_score NUMERIC DEFAULT 0,
  avg_traffic_score NUMERIC DEFAULT 0,
  avg_efficiency_score NUMERIC DEFAULT 0,
  preferred_waypoints JSONB,
  last_updated TIMESTAMPTZ DEFAULT now(),
  UNIQUE(origin_key, destination_key, altitude_band)
);

ALTER TABLE public.route_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read route_patterns"
ON public.route_patterns
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert route_patterns"
ON public.route_patterns
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update route_patterns"
ON public.route_patterns
FOR UPDATE
USING (true);

-- ──────────────────────────────────────────────
-- 3. route_score_config table
-- ──────────────────────────────────────────────
CREATE TABLE public.route_score_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weight_safety NUMERIC DEFAULT 0.35,
  weight_weather NUMERIC DEFAULT 0.25,
  weight_traffic NUMERIC DEFAULT 0.25,
  weight_efficiency NUMERIC DEFAULT 0.15,
  min_safe_separation_km NUMERIC DEFAULT 0.5,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.route_score_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read route_score_config"
ON public.route_score_config
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert route_score_config"
ON public.route_score_config
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update route_score_config"
ON public.route_score_config
FOR UPDATE
USING (true);

-- Insert the single default scoring weights row
INSERT INTO public.route_score_config (weight_safety, weight_weather, weight_traffic, weight_efficiency, min_safe_separation_km)
VALUES (0.35, 0.25, 0.25, 0.15, 0.5);
