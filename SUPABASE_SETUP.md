# KrishiLoop Supabase Backend Integration Guide

This guide walks you through setting up a live Supabase PostgreSQL database, authentication system, and private cloud storage for the **KrishiLoop** circular agriculture platform.

---

## 1. Overview & Architecture

KrishiLoop connects farmers, baler collectors, bio-energy processors, and residue buyers across Punjab. The frontend seamlessly interfaces with Supabase for:

| Feature | Supabase Technology | Description |
| :--- | :--- | :--- |
| **User Identity** | Supabase Auth (`auth.users`) | Secure email/password and phone OTP login. |
| **Profiles & RBAC** | `profiles` table + Postgres RLS | Strict role enforcement (`farmer`, `collector`, `processor`, `buyer`, `admin`). |
| **Farms & Supply Lots** | `farms`, `produce_lots` | Geo-tagged residue supply with status lifecycle tracking. |
| **Processor Demand** | `demands` | Offtaker feedstock volume and procurement specs. |
| **Deal Matching** | `match_requests` | Platform inquiries and buyer-seller deal matching. |
| **Logistics & Traceability** | `collection_jobs`, `intake_records` | Mechanized baler dispatch, pickup verification, and mill intake records. |
| **Private e-KYC Vault** | `kyc_documents` + Storage | Encrypted storage bucket (`kyc-documents`) with time-limited signed URLs (TTL). |

> **Graceful Degradation:** The application is architected so that if Supabase credentials are not configured, it operates smoothly in **Local Demo Mode** using realistic Punjab pilot data. As soon as valid credentials are provided in `.env.local`, the topbar badge switches to **Supabase Online** and synchronizes all CRUD operations directly to PostgreSQL.

---

## 2. Prerequisites

1. A [Supabase account](https://supabase.com).
2. Node.js 18+ and npm installed.

---

## 3. Step-by-Step Backend Setup

### Step 3.1: Create a Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com).
2. Click **New project**.
3. Enter project details:
   - **Name**: `KrishiLoop-Punjab`
   - **Database Password**: *(Generate and save a strong password)*
   - **Region**: Select **South Asia (Mumbai) `ap-south-1`** for lowest latency in India.
4. Click **Create new project** and wait ~2 minutes for provisioning.

---

### Step 3.2: Run the SQL Schema & Security Policies

1. In your Supabase dashboard, click **SQL Editor** from the left sidebar.
2. Click **New query**.
3. Open `supabase/schema.sql` from this repository.
4. Copy its entire content into the SQL Editor.
5. Click **Run** (or press `Ctrl+Enter`).

**What this creates:**
- Standard ENUM types (`user_role`, `lot_status`, `job_status`, `kyc_status`).
- Tables: `profiles`, `farms`, `produce_lots`, `demands`, `match_requests`, `collection_jobs`, `intake_records`, `kyc_documents`.
- Database helper function: `public.is_admin()` for server-side authorization.
- Trigger function: `public.handle_new_user()` to automatically create a `profiles` entry whenever a new user registers via Supabase Auth.
- Row Level Security (RLS) enabled on **100% of tables** with granular policies for farmers, buyers, collectors, and admins.
- Private storage bucket `kyc-documents` with strict upload and read policies.

---

### Step 3.3: Seed Initial Pilot Data (Optional but Recommended)

1. In the Supabase **SQL Editor**, click **New query**.
2. Copy the content from `supabase/seed.sql`.
3. Click **Run**.

**What this populates:**
- Initial sample supply lots (`L-101` to `L-106`) across Sangrur, Patiala, and Malerkotla.
- Active processor requirements (`D-201` to `D-203`) for Sangrur Biomass Pellets, Malerkotla Bio-CNG, and Patiala Paper Board Mill.
- Planned collection jobs and intake records.

---

### Step 3.4: Configure the Private Storage Bucket

The SQL schema automatically executes bucket creation, but verify it in your dashboard:

1. In the Supabase dashboard, navigate to **Storage**.
2. Confirm the bucket `kyc-documents` exists.
3. Verify that **Public Bucket** is set to **OFF** (Private).
4. Verify the Storage Policies:
   - **Users can upload their own KYC docs**: `bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text`
   - **Users can read their own KYC docs**: `bucket_id = 'kyc-documents' AND (storage.foldername(name))[1] = auth.uid()::text`
   - **Admins can view all KYC docs**: `bucket_id = 'kyc-documents' AND is_admin()`

> 🔒 **Security Guarantee**: Private documents are **NEVER** accessible via public URLs (`getPublicUrl`). The frontend requests temporary time-limited signed URLs (`createSignedUrl(path, 300)`) with a 5-minute expiry only after identity verification.

---

## 4. Frontend Environment Setup

1. In your terminal, navigate to the React app folder:
   ```bash
   cd krishiloop-react/krishiloop-react
   ```

2. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

3. Open `.env.local` and paste your project credentials from **Project Settings > API**:
   ```env
   # Supabase Project URL (e.g., https://xyzcompany.supabase.co)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co

   # Supabase Anonymous Client Key (public anon key)
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

> ⚠️ **CRITICAL SECURITY RULE:** Never put the Supabase `service_role` key in `.env.local` or any browser code. Only the public `anon` key belongs in client-side applications. Admin permissions are securely enforced database-side via Postgres Row Level Security.

4. Start the development server:
   ```bash
   npm run dev
   ```

5. When you open the application:
   - The topbar will show `🟢 Supabase Online`.
   - Real data is fetched from PostgreSQL.
   - Any new lots published, demands posted, or collection jobs created are automatically committed to Supabase.

---

## 5. Security & Row Level Security (RLS) Specification

All tables enforce PostgreSQL Row Level Security:

| Table | SELECT | INSERT | UPDATE | DELETE |
| :--- | :--- | :--- | :--- | :--- |
| `profiles` | Authenticated users can view basic profiles | Authenticated user can create own profile | Own user ID or Admin (`is_admin()`) | Admin only |
| `farms` | Public / Authenticated | Owner or Admin | Owner or Admin | Owner or Admin |
| `produce_lots` | All authenticated users | Own `farmer_id` or Admin | Own `farmer_id`, assigned collector, or Admin | Own `farmer_id` or Admin |
| `demands` | All authenticated users | Processor/Buyer or Admin | Demand creator or Admin | Demand creator or Admin |
| `match_requests` | Request buyer, lot farmer, or Admin | Authenticated buyer or Admin | Request buyer, lot farmer, or Admin | Admin only |
| `collection_jobs` | Authenticated users | Collector or Admin | Assigned collector or Admin | Admin only |
| `intake_records` | Authenticated users | Processor or Admin | Processor or Admin | Admin only |
| `kyc_documents` | Document owner or Admin | Document owner | Admin only (review status) | Admin only |

---

## 6. Verification Checklist

To verify your integration:

1. **Database Connectivity:**
   - Sign in using the **⚡ Supabase Auth** tab or Phone OTP.
   - Publish a new residue lot from **My lots** (`＋ List residue`).
   - Check the `produce_lots` table in the Supabase Table Editor to verify the record was inserted.

2. **Deal Inquiry / Match Requests:**
   - Go to **Matching**, click **🤝 Contact Deal Partner**, and submit a deal inquiry.
   - Verify the record in the `match_requests` table.

3. **Secure KYC Upload:**
   - In **User Verification** (as Admin or during registration), upload an Aadhaar / KCC document.
   - Check the `kyc-documents` bucket in Supabase Storage.
   - Notice the document is stored in `<user_id>/<timestamp>-<filename>`.
   - Click "View Document" in the Admin KYC Desk and verify it opens via a signed URL (`token=...&expires=...`).
