import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

// ==============================================================================
// 1. AUTHENTICATION SERVICE
// ==============================================================================
export const authService = {
  // Sign up with email & password
  async signUp(email, password, metadata = {}) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error("Supabase is not configured.") };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: metadata.fullName || metadata.name || "",
          role: metadata.role || "Farmer",
          phone: metadata.phone || "",
          district: metadata.district || "Sangrur",
          village: metadata.village || "Dhuri",
        },
      },
    });
    return { data, error };
  },

  // Sign in with email & password
  async signIn(email, password) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error("Supabase is not configured.") };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Send OTP to Phone
  async signInWithOtp(phone) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error("Supabase is not configured.") };
    }
    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
    });
    return { data, error };
  },

  // Verify Phone OTP
  async verifyOtp(phone, token) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error("Supabase is not configured.") };
    }
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    return { data, error };
  },

  // Sign out
  async signOut() {
    if (!isSupabaseConfigured()) return { error: null };
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current active session
  async getSession() {
    if (!isSupabaseConfigured()) return { data: { session: null }, error: null };
    return await supabase.auth.getSession();
  },

  // Get current authenticated user
  async getUser() {
    if (!isSupabaseConfigured()) return { data: { user: null }, error: null };
    return await supabase.auth.getUser();
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    if (!isSupabaseConfigured()) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ==============================================================================
// 2. PROFILES SERVICE
// ==============================================================================
export const profileService = {
  // Fetch a user profile by ID
  async getProfile(userId) {
    if (!isSupabaseConfigured() || !userId) return { data: null, error: null };
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return { data, error };
  },

  // Update a profile
  async updateProfile(userId, profileData) {
    if (!isSupabaseConfigured() || !userId) return { data: null, error: null };
    const { data, error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", userId)
      .select()
      .single();
    return { data, error };
  },

  // Upsert profile (for registration or sync)
  async upsertProfile(profileData) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profileData)
      .select()
      .single();
    return { data, error };
  },

  // Fetch all profiles (for Admin KYC Management)
  async getAllProfiles() {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    return { data, error };
  },
};

// ==============================================================================
// 3. PRODUCE / RESIDUE LOTS SERVICE
// ==============================================================================
export const lotsService = {
  // Fetch all produce lots
  async fetchLots() {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("produce_lots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: null, error };

    // Format DB rows into the shape used by the React app
    const lots = data.map(row => ({
      id: row.id,
      farmer: row.farmer_name,
      farmerId: row.farmer_id || row.farmer_name,
      village: row.village,
      location: row.location || row.village,
      district: row.district || "Sangrur",
      residue: row.residue,
      est: Number(row.est),
      act: row.act !== null ? Number(row.act) : null,
      unit: row.unit || "tonnes",
      price: Number(row.price || 1800),
      from: row.from_date || "Flexible",
      availableFrom: row.from_date || "Flexible",
      availableUntil: row.until_date || "Flexible",
      quality: row.quality || "Standard",
      moisture: row.moisture || "12.5%",
      baleType: row.bale_type || "Mechanized Bales",
      status: row.status,
      pickupJob: row.pickup_job_id,
      image: row.image_url || "/images/straw_bales.jpg",
      history: Array.isArray(row.history) ? row.history : [],
    }));

    return { data: lots, error: null };
  },

  // Insert a new produce lot
  async createLot(lot) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const dbRow = {
      id: lot.id,
      farmer_id: lot.farmerId && lot.farmerId.length === 36 ? lot.farmerId : null,
      farmer_name: lot.farmer,
      village: lot.village,
      location: lot.location || lot.village,
      district: lot.district || "Sangrur",
      residue: lot.residue || "Paddy straw",
      est: Number(lot.est),
      act: lot.act ? Number(lot.act) : null,
      unit: "tonnes",
      price: Number(lot.price || 1800),
      from_date: lot.availableFrom || lot.from,
      until_date: lot.availableUntil || "31 Oct",
      quality: lot.quality || "Standard",
      moisture: lot.moisture || "12.5%",
      bale_type: lot.baleType || "Mechanized Bales",
      status: lot.status || "Listed",
      pickup_job_id: lot.pickupJob || null,
      image_url: lot.image || "/images/straw_bales.jpg",
      history: lot.history || [{ status: "Listed", at: new Date().toISOString() }],
    };

    const { data, error } = await supabase
      .from("produce_lots")
      .insert([dbRow])
      .select()
      .single();

    return { data, error };
  },

  // Update a lot status or fields
  async updateLot(lotId, updates) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const dbUpdates = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.act !== undefined) dbUpdates.act = Number(updates.act);
    if (updates.est !== undefined) dbUpdates.est = Number(updates.est);
    if (updates.pickupJob !== undefined) dbUpdates.pickup_job_id = updates.pickupJob;
    if (updates.history !== undefined) dbUpdates.history = updates.history;

    const { data, error } = await supabase
      .from("produce_lots")
      .update(dbUpdates)
      .eq("id", lotId)
      .select()
      .single();

    return { data, error };
  },

  // Delete a lot
  async deleteLot(lotId) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("produce_lots")
      .delete()
      .eq("id", lotId);
    return { data, error };
  },
};

// ==============================================================================
// 4. DEMANDS SERVICE
// ==============================================================================
export const demandsService = {
  // Fetch all buyer/processor demands
  async fetchDemands() {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("demands")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: null, error };

    const demands = data.map(row => ({
      id: row.id,
      buyerId: row.buyer_id,
      processor: row.processor_name,
      residue: row.residue,
      quantity: Number(row.quantity),
      due: row.due_date,
      location: row.location,
      price: Number(row.price || 1800),
      status: row.status,
      type: row.facility_type,
      image: row.image_url || "/images/biomass_plant.jpg",
    }));

    return { data: demands, error: null };
  },

  // Insert a new demand requirement
  async createDemand(demand) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const dbRow = {
      id: demand.id,
      buyer_id: demand.buyerId && demand.buyerId.length === 36 ? demand.buyerId : null,
      processor_name: demand.processor,
      residue: demand.residue || "Paddy straw",
      quantity: Number(demand.quantity),
      due_date: demand.due || "2026-11-30",
      location: demand.location || "Sangrur",
      price: Number(demand.price || 1800),
      status: demand.status || "Open",
      facility_type: demand.type || "Bio-Pellet Plant",
      image_url: demand.image || "/images/biomass_plant.jpg",
    };

    const { data, error } = await supabase
      .from("demands")
      .insert([dbRow])
      .select()
      .single();

    return { data, error };
  },

  // Update demand status (e.g. "Closed")
  async updateDemandStatus(demandId, status) {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("demands")
      .update({ status })
      .eq("id", demandId)
      .select()
      .single();
    return { data, error };
  },
};

// ==============================================================================
// 5. COLLECTION JOBS SERVICE
// ==============================================================================
export const jobsService = {
  // Fetch collection jobs
  async fetchJobs() {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("collection_jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { data: null, error };

    const jobs = data.map(row => ({
      id: row.id,
      collector: row.collector_name,
      collectorId: row.collector_id,
      lotIds: Array.isArray(row.lot_ids) ? row.lot_ids : [],
      status: row.status,
      route: row.route_description,
      distance: Number(row.distance_km || 0),
      schedule: row.scheduled_date,
      actualQuantity: row.actual_quantity !== null ? Number(row.actual_quantity) : null,
      completedAt: row.completed_at,
    }));

    return { data: jobs, error: null };
  },

  // Create a collection job
  async createJob(job) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const dbRow = {
      id: job.id,
      collector_id: job.collectorId && job.collectorId.length === 36 ? job.collectorId : null,
      collector_name: job.collector || "Malwa Bio-Logistics Fleet",
      lot_ids: job.lotIds || [],
      status: job.status || "Planned",
      route_description: job.route,
      distance_km: Number(job.distance || 0),
      scheduled_date: job.schedule || new Date().toISOString().slice(0, 10),
    };

    const { data, error } = await supabase
      .from("collection_jobs")
      .insert([dbRow])
      .select()
      .single();

    return { data, error };
  },

  // Confirm job pickup with actual collected quantity
  async confirmPickup(jobId, actualQuantity) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from("collection_jobs")
      .update({
        status: "Collected",
        actual_quantity: Number(actualQuantity),
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select()
      .single();

    return { data, error };
  },
};

// ==============================================================================
// 6. INTAKE RECORDS SERVICE
// ==============================================================================
export const recordsService = {
  // Fetch intake records
  async fetchRecords() {
    if (!isSupabaseConfigured()) return { data: null, error: null };
    const { data, error } = await supabase
      .from("intake_records")
      .select("*")
      .order("recorded_at", { ascending: false });

    if (error) return { data: null, error };

    const records = data.map(row => ({
      id: row.id,
      lotId: row.lot_id,
      processor: row.processor_name,
      processorId: row.processor_id,
      quantity: Number(row.quantity),
      category: row.category || "Biomass feedstock",
      at: row.recorded_at,
    }));

    return { data: records, error: null };
  },

  // Record an intake
  async createRecord(record) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const dbRow = {
      id: record.id,
      lot_id: record.lotId,
      processor_id: record.processorId && record.processorId.length === 36 ? record.processorId : null,
      processor_name: record.processor,
      quantity: Number(record.quantity),
      category: record.category || "Biomass feedstock",
      recorded_at: record.at || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("intake_records")
      .insert([dbRow])
      .select()
      .single();

    return { data, error };
  },
};

// ==============================================================================
// 7. MATCH REQUESTS & INQUIRIES SERVICE
// ==============================================================================
export const matchRequestService = {
  // Create a match inquiry / platform deal request
  async createMatchRequest(inquiry) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const dbRow = {
      lot_id: inquiry.lotId,
      processor_id: inquiry.processorId || "P1",
      processor_name: inquiry.processorName,
      requester_id: inquiry.requesterId && inquiry.requesterId.length === 36 ? inquiry.requesterId : null,
      compatibility_score: inquiry.compatibilityScore || 90,
      status: "Pending",
      contact_person: inquiry.contactPerson,
      contact_phone: inquiry.contactPhone,
      contact_email: inquiry.contactEmail,
      notes: inquiry.notes || "",
    };

    const { data, error } = await supabase
      .from("match_requests")
      .insert([dbRow])
      .select()
      .single();

    return { data, error };
  },
};

// ==============================================================================
// 8. KYC DOCUMENTS & PRIVATE STORAGE SERVICE
// ==============================================================================
export const kycService = {
  // Upload a sensitive KYC file to private storage bucket 'kyc-documents'
  // NEVER creates a public URL — only stores the private path
  async uploadKycDocument(file, userId, documentType, idNumberMasked) {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error("Supabase storage not configured.") };
    }

    if (!userId) {
      return { data: null, error: new Error("User ID is required to upload KYC documents.") };
    }

    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${userId}/${timestamp}_${safeFileName}`;

    // 1. Upload to private bucket
    const { error: uploadError } = await supabase.storage
      .from("kyc-documents")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    // 2. Insert record into kyc_documents table
    const { data: recordData, error: recordError } = await supabase
      .from("kyc_documents")
      .insert([
        {
          user_id: userId,
          document_type: documentType,
          document_name: file.name,
          storage_path: storagePath,
          id_number_masked: idNumberMasked,
          review_status: "Verified",
        },
      ])
      .select()
      .single();

    return { data: recordData, error: recordError };
  },

  // Generate a temporary time-limited signed URL for authorized viewing
  // Expires after 1 hour (3600 seconds)
  async getSignedUrl(storagePath, expiresInSeconds = 3600) {
    if (!isSupabaseConfigured() || !storagePath) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(storagePath, expiresInSeconds);

    return { signedUrl: data?.signedUrl || null, error };
  },

  // Fetch KYC documents for a user or all documents for Admin
  async fetchKycDocuments(userId = null) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    let query = supabase.from("kyc_documents").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    return { data, error };
  },

  // Review a KYC document (Admin action)
  async reviewKycDocument(docId, reviewStatus, reviewerId = null, rejectionReason = null) {
    if (!isSupabaseConfigured()) return { data: null, error: null };

    const { data, error } = await supabase
      .from("kyc_documents")
      .update({
        review_status: reviewStatus,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason,
      })
      .eq("id", docId)
      .select()
      .single();

    return { data, error };
  },
};
