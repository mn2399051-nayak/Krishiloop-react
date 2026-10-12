-- ==============================================================================
-- KrishiLoop Supabase PostgreSQL Database Schema & Security Architecture
-- ==============================================================================
-- Circular Agriculture & Stubble-to-Resource Platform (Punjab Pilot)
--
-- Features:
-- 1. Profiles linked directly to auth.users with RBAC ('Farmer', 'Collector', 'Processor', 'Buyer', 'Admin')
-- 2. Farms registered per farmer with GPS centroids & crop area
-- 3. Produce/Residue Lots with lifecycle stages ('Listed' -> 'Matched' -> 'Collection planned' -> 'Collected' -> 'Processed')
-- 4. Processor/Buyer Demands for stubble feedstock
-- 5. Match Requests with algorithmic compatibility scoring & deal logging
-- 6. Collection Jobs for cluster route aggregation and digital weighbridge tracking
-- 7. Processor Intake Records for traceability
-- 8. Sensitive KYC Documents stored with private Supabase Storage paths & audit reviews
-- 9. Comprehensive Row-Level Security (RLS) on all tables & storage objects
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE (Linked to auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'Farmer' CHECK (role IN ('Farmer', 'Collector', 'Processor', 'Buyer', 'Admin')),
  district TEXT DEFAULT 'Sangrur',
  village TEXT DEFAULT 'Dhuri',
  org TEXT DEFAULT 'Independent Farmer',
  bio TEXT,
  badge TEXT DEFAULT 'Verified Member',
  avatar_url TEXT,
  avatar_bg TEXT DEFAULT '#059669',
  avatar_color TEXT DEFAULT '#ffffff',
  cover_url TEXT DEFAULT '/images/hero_harvest.jpg',
  initials TEXT,
  is_verified BOOLEAN DEFAULT false,
  kyc_status TEXT DEFAULT 'Pending' CHECK (kyc_status IN ('Pending', 'Verified', 'Rejected')),
  id_proof_type TEXT DEFAULT 'Aadhaar Card',
  id_proof_number_masked TEXT,
  id_proof_verified_at TIMESTAMPTZ,
  auth_method TEXT DEFAULT 'phone_otp',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- Helper function: Check if current user is Admin
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to keep updated_at synchronized
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 2. FARMS TABLE (Farm parcels registered by farmers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  district TEXT NOT NULL DEFAULT 'Sangrur',
  village TEXT NOT NULL,
  area_acres NUMERIC(6, 2) DEFAULT 10.0,
  primary_crop TEXT DEFAULT 'Paddy & Wheat',
  latitude NUMERIC(10, 6),
  longitude NUMERIC(10, 6),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_farms_updated
BEFORE UPDATE ON public.farms
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 3. PRODUCE / RESIDUE LOTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.produce_lots (
  id TEXT PRIMARY KEY, -- e.g. 'L-101', 'L-201'
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_name TEXT NOT NULL,
  village TEXT NOT NULL,
  location TEXT,
  district TEXT DEFAULT 'Sangrur',
  residue TEXT NOT NULL DEFAULT 'Paddy straw',
  est NUMERIC(8, 2) NOT NULL, -- Estimated quantity in tonnes
  act NUMERIC(8, 2),          -- Actual recorded tonnes
  unit TEXT DEFAULT 'tonnes',
  price NUMERIC(10, 2) DEFAULT 1800, -- ₹ / tonne
  from_date TEXT,
  until_date TEXT,
  quality TEXT DEFAULT 'Standard',
  moisture TEXT DEFAULT '12.5%',
  bale_type TEXT DEFAULT 'Mechanized Bales',
  status TEXT NOT NULL DEFAULT 'Listed' CHECK (status IN ('Listed', 'Matched', 'Collection planned', 'Collected', 'Processed')),
  pickup_job_id TEXT,
  image_url TEXT DEFAULT '/images/straw_bales.jpg',
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_produce_lots_updated
BEFORE UPDATE ON public.produce_lots
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 4. PROCESSOR & BUYER DEMANDS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.demands (
  id TEXT PRIMARY KEY, -- e.g. 'D-201'
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processor_name TEXT NOT NULL,
  residue TEXT NOT NULL DEFAULT 'Paddy straw',
  quantity NUMERIC(8, 2) NOT NULL,
  due_date TEXT,
  location TEXT NOT NULL,
  price NUMERIC(10, 2) DEFAULT 1800,
  status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
  facility_type TEXT DEFAULT 'Bio-Pellet Plant',
  image_url TEXT DEFAULT '/images/biomass_plant.jpg',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_demands_updated
BEFORE UPDATE ON public.demands
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 5. MATCH REQUESTS & DEAL INQUIRIES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.match_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id TEXT REFERENCES public.produce_lots(id) ON DELETE CASCADE NOT NULL,
  processor_id TEXT NOT NULL, -- e.g. 'P1', 'P2', 'P3'
  processor_name TEXT NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  compatibility_score INTEGER DEFAULT 90,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Accepted', 'Declined', 'Completed')),
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_match_requests_updated
BEFORE UPDATE ON public.match_requests
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 6. COLLECTION JOBS TABLE (Collector route planning & pickup)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.collection_jobs (
  id TEXT PRIMARY KEY, -- e.g. 'J-201'
  collector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  collector_name TEXT NOT NULL,
  lot_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Collected', 'Cancelled')),
  route_description TEXT,
  distance_km NUMERIC(6, 1),
  scheduled_date TEXT,
  actual_quantity NUMERIC(8, 2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_collection_jobs_updated
BEFORE UPDATE ON public.collection_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- 7. PROCESSOR INTAKE RECORDS TABLE (Traceability & Gate Weight)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.intake_records (
  id TEXT PRIMARY KEY, -- e.g. 'R-201'
  lot_id TEXT REFERENCES public.produce_lots(id) ON DELETE SET NULL,
  processor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processor_name TEXT NOT NULL,
  quantity NUMERIC(8, 2) NOT NULL,
  category TEXT DEFAULT 'Biomass feedstock',
  recorded_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 8. SENSITIVE KYC DOCUMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('Aadhaar Card', 'Kisan Credit Card', 'Voter ID', 'PAN Card')),
  document_name TEXT NOT NULL,
  storage_path TEXT NOT NULL, -- Private Supabase Storage object path (never public URL)
  id_number_masked TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'Verified' CHECK (review_status IN ('Pending', 'Verified', 'Rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_kyc_documents_updated
BEFORE UPDATE ON public.kyc_documents
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- 1. PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view profiles (needed for partner matching, farmer contact, etc.)
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Allow public read of profiles for demo / unauthenticated preview if desired
CREATE POLICY "Profiles viewable by anon for public listings"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- Users can insert their own profile upon registration
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update only their own profile, Admins can update any
CREATE POLICY "Users can update own profile or admin can update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- 2. FARMS RLS
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Farms viewable by authenticated users"
  ON public.farms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Farmers can manage own farms"
  ON public.farms FOR ALL
  TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

-- 3. PRODUCE LOTS RLS
ALTER TABLE public.produce_lots ENABLE ROW LEVEL SECURITY;

-- Anyone (public or authenticated) can view published residue lots
CREATE POLICY "Residue lots viewable by all"
  ON public.produce_lots FOR SELECT
  TO anon, authenticated
  USING (true);

-- Authenticated users (Farmers) can insert lots
CREATE POLICY "Farmers can publish residue lots"
  ON public.produce_lots FOR INSERT
  TO authenticated
  WITH CHECK (farmer_id = auth.uid() OR farmer_id IS NULL OR public.is_admin());

-- Farmers can update their own lots; Collectors and Processors can update lot status during pickup/intake; Admins can update any
CREATE POLICY "Authorized users can update residue lots"
  ON public.produce_lots FOR UPDATE
  TO authenticated
  USING (
    farmer_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Collector', 'Processor', 'Admin')
    )
  )
  WITH CHECK (true);

-- 4. DEMANDS RLS
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demands viewable by all"
  ON public.demands FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Processors/Buyers can post demands"
  ON public.demands FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid() OR buyer_id IS NULL OR public.is_admin());

CREATE POLICY "Buyers can update own demands or Admin"
  ON public.demands FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR public.is_admin());

-- 5. MATCH REQUESTS RLS
ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Match requests viewable by participants or admin"
  ON public.match_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.produce_lots l
      WHERE l.id = match_requests.lot_id AND l.farmer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('Processor', 'Admin')
    )
  );

CREATE POLICY "Authenticated users can create match inquiries"
  ON public.match_requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid() OR requester_id IS NULL OR public.is_admin());

CREATE POLICY "Participants can update match requests"
  ON public.match_requests FOR UPDATE
  TO authenticated
  USING (requester_id = auth.uid() OR public.is_admin());

-- 6. COLLECTION JOBS RLS
ALTER TABLE public.collection_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Collection jobs viewable by authenticated users"
  ON public.collection_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Collectors and Admins can create and update collection jobs"
  ON public.collection_jobs FOR ALL
  TO authenticated
  USING (
    collector_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Collector', 'Admin')
    )
  )
  WITH CHECK (true);

-- 7. INTAKE RECORDS RLS
ALTER TABLE public.intake_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Intake records viewable by authenticated users"
  ON public.intake_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Processors and Admins can record intake"
  ON public.intake_records FOR INSERT
  TO authenticated
  WITH CHECK (
    processor_id = auth.uid()
    OR processor_id IS NULL
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('Processor', 'Admin')
    )
  );

-- 8. SENSITIVE KYC DOCUMENTS RLS (CRITICAL PRIVACY ENFORCEMENT)
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Strictly private: Users can ONLY view their own documents; Admins can view all documents
CREATE POLICY "Users can view own KYC documents or Admin can view all"
  ON public.kyc_documents FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

-- Users can upload KYC records for themselves
CREATE POLICY "Users can create own KYC document entry"
  ON public.kyc_documents FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- Only Admins can update review status (approve or reject)
CREATE POLICY "Only admins can review and update KYC documents"
  ON public.kyc_documents FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- PRIVATE STORAGE BUCKET CONFIGURATION FOR SENSITIVE KYC UPLOADS
-- ==============================================================================
-- Bucket is set to private (public = false) so files cannot be accessed via direct URL.
-- Access requires signed tokenized URLs with short TTL.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Storage RLS Policies:
-- 1. Users can upload KYC documents only into their own folder (auth.uid()/*)
CREATE POLICY "Users can upload own KYC documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Users can read their own KYC documents; Admins can read all KYC documents
CREATE POLICY "Users can read own KYC documents, Admin reads all"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_phone TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Farmer');
  v_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_phone := COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '');

  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    first_name,
    role,
    district,
    village,
    is_verified,
    kyc_status,
    auth_method
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_phone,
    v_name,
    split_part(v_name, ' ', 1),
    v_role,
    COALESCE(NEW.raw_user_meta_data->>'district', 'Sangrur'),
    COALESCE(NEW.raw_user_meta_data->>'village', 'Dhuri'),
    false,
    'Pending',
    'phone_otp'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = CASE WHEN public.profiles.phone IS NULL OR public.profiles.phone = '' THEN EXCLUDED.phone ELSE public.profiles.phone END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
