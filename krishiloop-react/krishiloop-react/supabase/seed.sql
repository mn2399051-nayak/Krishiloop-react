-- ==============================================================================
-- KrishiLoop Pilot Seed Data for Supabase
-- ==============================================================================
-- Seeds the initial supply lots, buyer demands, sample collection jobs, and
-- farms for the Punjab pilot (Sangrur, Malerkotla, Patiala, Barnala).
-- ==============================================================================

-- 1. Insert Initial Produce / Residue Lots
INSERT INTO public.produce_lots (id, farmer_name, village, location, district, residue, est, act, unit, price, from_date, until_date, quality, moisture, bale_type, status, image_url, history)
VALUES
  ('L-101', 'Gurpreet Singh', 'Longowal', 'Longowal', 'Sangrur', 'Paddy straw', 4.0, 3.8, 'tonnes', 1800, '12 Oct', '31 Oct', 'Standard', '11.8%', 'Square Bales', 'Processed', '/images/straw_bales.jpg', '[{"status": "Processed", "at": "2026-10-12T09:00:00Z"}]'::jsonb),
  ('L-102', 'Harjinder Kaur', 'Sunam', 'Sunam', 'Sangrur', 'Paddy straw', 6.5, 6.1, 'tonnes', 1800, '14 Oct', '31 Oct', 'Standard', '13.2%', 'Round Bales', 'Collected', '/images/hero_harvest.jpg', '[{"status": "Collected", "at": "2026-10-12T09:00:00Z"}]'::jsonb),
  ('L-103', 'Balwinder Singh', 'Bhawanigarh', 'Bhawanigarh', 'Sangrur', 'Paddy straw', 3.2, NULL, 'tonnes', 1800, '15 Oct', '31 Oct', 'Standard', '14.0%', 'Mechanized Bales', 'Collection planned', '/images/drone_fields.jpg', '[{"status": "Collection planned", "at": "2026-10-12T09:00:00Z"}]'::jsonb),
  ('L-104', 'Jasmeet Kaur', 'Dhuri', 'Dhuri', 'Sangrur', 'Paddy straw', 5.0, NULL, 'tonnes', 1800, '16 Oct', '31 Oct', 'Standard', '12.5%', 'Dense Bales', 'Matched', '/images/straw_bales.jpg', '[{"status": "Matched", "at": "2026-10-12T09:00:00Z"}]'::jsonb),
  ('L-105', 'Amarjit Singh', 'Lehragaga', 'Lehragaga', 'Sangrur', 'Paddy straw', 2.8, NULL, 'tonnes', 1800, '18 Oct', '31 Oct', 'Standard', '13.8%', 'Mechanized Bales', 'Listed', '/images/hero_harvest.jpg', '[{"status": "Listed", "at": "2026-10-12T09:00:00Z"}]'::jsonb),
  ('L-106', 'Sukhdev Singh', 'Malerkotla', 'Malerkotla', 'Malerkotla', 'Paddy straw', 7.4, NULL, 'tonnes', 1800, '18 Oct', '31 Oct', 'Standard', '12.0%', 'High Density Bales', 'Listed', '/images/drone_fields.jpg', '[{"status": "Listed", "at": "2026-10-12T09:00:00Z"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  act = EXCLUDED.act,
  est = EXCLUDED.est;

-- 2. Insert Processor / Buyer Demands
INSERT INTO public.demands (id, processor_name, residue, quantity, due_date, location, price, status, facility_type, image_url)
VALUES
  ('D-201', 'Sangrur Biomass Pellets', 'Paddy straw', 80.0, '2026-11-10', 'Sangrur', 1900, 'Open', 'Bio-Pellet Plant', '/images/biomass_plant.jpg'),
  ('D-202', 'Malerkotla Bio-CNG Unit', 'Paddy straw', 45.0, '2026-11-18', 'Malerkotla', 1750, 'Open', 'Bio-CNG Facility', '/images/biomass_plant.jpg'),
  ('D-203', 'Patiala Paper Board Mill', 'Wheat straw', 30.0, '2026-12-02', 'Patiala', 1600, 'Open', 'Pulp & Paper Mill', '/images/straw_bales.jpg')
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  status = EXCLUDED.status;

-- 3. Insert Initial Collection Job
INSERT INTO public.collection_jobs (id, collector_name, lot_ids, status, route_description, distance_km, scheduled_date, actual_quantity, completed_at)
VALUES
  ('J-201', 'Malwa Bio-Logistics Fleet', '["L-101", "L-102"]'::jsonb, 'Collected', 'Longowal → Sunam → Sangrur Biomass Depot', 32.5, '2026-10-12', 9.9, '2026-10-12T11:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Initial Intake Record
INSERT INTO public.intake_records (id, lot_id, processor_name, quantity, category, recorded_at)
VALUES
  ('R-201', 'L-101', 'Sangrur Biomass Pellets', 3.8, 'Biomass feedstock', '2026-10-12T13:20:00Z')
ON CONFLICT (id) DO NOTHING;
