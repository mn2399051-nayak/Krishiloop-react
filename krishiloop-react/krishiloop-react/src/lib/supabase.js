import { createClient } from "@supabase/supabase-js";

// Read Supabase credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not default placeholders
export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === "string" &&
    typeof supabaseAnonKey === "string" &&
    supabaseUrl.trim().length > 0 &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseUrl.includes("your-project-id") &&
    !supabaseUrl.includes("your-project-ref") &&
    !supabaseAnonKey.includes("your-anon-")
  );
};

// Safe client creation: if unconfigured, initialize a dummy client or null to avoid crashing
let client = null;

if (isSupabaseConfigured()) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.warn("KrishiLoop: Failed to initialize Supabase client:", err);
  }
} else {
  // Helpful console hint for developer without interrupting UI
  console.info(
    "KrishiLoop: Supabase environment variables not configured. Operating in local resilient demo mode. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local to enable live backend."
  );
}

export const supabase = client;
export { supabaseUrl, supabaseAnonKey };
