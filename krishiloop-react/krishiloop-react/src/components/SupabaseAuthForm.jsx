import { useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { authService, profileService } from "../services/supabaseService.js";

const DISTRICTS = [
  "Sangrur",
  "Patiala",
  "Malerkotla",
  "Barnala",
  "Ludhiana",
  "Bathinda",
  "Mansa",
  "Fatehgarh Sahib"
];

const ROLES = ["Farmer", "Collector", "Processor", "Buyer", "Admin"];

export default function SupabaseAuthForm({ onComplete, onCancel }) {
  const configured = isSupabaseConfigured();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("Sangrur");
  const [role, setRole] = useState("Farmer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: authErr } = await authService.signIn(email, password);
      if (authErr) {
        setError(authErr.message || "Failed to sign in. Please verify your email and password.");
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Fetch user profile from Supabase
        const { data: profile } = await profileService.getProfile(data.user.id);
        const resolvedRole = profile?.role || "Farmer";
        const account = {
          id: data.user.id,
          name: profile?.full_name || email.split("@")[0],
          email: data.user.email,
          phone: profile?.phone || "",
          district: profile?.district || "Sangrur",
          role: resolvedRole.charAt(0).toUpperCase() + resolvedRole.slice(1).toLowerCase(),
          isAadhaarVerified: !!profile?.aadhaar_verified,
          isLiveSupabase: true
        };
        onComplete(account);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const normalizedRole = role.toLowerCase();
      const { data, error: signUpErr } = await authService.signUp(email, password, {
        full_name: fullName,
        role: normalizedRole,
        district,
        phone
      });

      if (signUpErr) {
        setError(signUpErr.message || "Registration failed.");
        setLoading(false);
        return;
      }

      if (data?.user) {
        // Ensure profile is created/upserted in the profiles table
        await profileService.upsertProfile({
          id: data.user.id,
          full_name: fullName,
          role: normalizedRole,
          district,
          phone,
          aadhaar_verified: false
        });

        // If email confirmation is required by Supabase settings:
        if (data.session) {
          const account = {
            id: data.user.id,
            name: fullName || email.split("@")[0],
            email: data.user.email,
            phone,
            district,
            role,
            isAadhaarVerified: false,
            isLiveSupabase: true
          };
          onComplete(account);
        } else {
          setSuccessMsg("Account registered successfully! If email verification is enabled on your Supabase project, check your inbox to confirm your email.");
          setMode("signin");
        }
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="kl-supabase-config-prompt">
        <div className="kl-backend-badge-notice">
          <span className="kl-backend-dot warning" />
          <b>Supabase Credentials Not Yet Configured</b>
        </div>
        <p className="kl-config-text">
          KrishiLoop is ready to connect with your real Supabase PostgreSQL database, authentication system, and secure file storage.
        </p>

        <div className="kl-config-guide-box">
          <div className="kl-guide-step">
            <span className="kl-guide-num">1</span>
            <div>
              <b>Create a project on Supabase</b>
              <small>Head to <a href="https://supabase.com" target="_blank" rel="noreferrer">supabase.com</a> and create a new project.</small>
            </div>
          </div>
          <div className="kl-guide-step">
            <span className="kl-guide-num">2</span>
            <div>
              <b>Configure environment variables</b>
              <small>Copy <code>.env.example</code> to <code>.env.local</code> in <code>krishiloop-react</code> and paste your <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</small>
            </div>
          </div>
          <div className="kl-guide-step">
            <span className="kl-guide-num">3</span>
            <div>
              <b>Run the SQL schema</b>
              <small>Execute <code>supabase/schema.sql</code> in the Supabase SQL Editor to initialize all tables, RLS security policies, and storage buckets.</small>
            </div>
          </div>
        </div>

        <div className="kl-config-actions">
          <button type="button" className="primary kl-btn-full" onClick={onCancel}>
            ← Use Demo Persona or Phone OTP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="kl-supabase-auth-card">
      <div className="kl-supabase-header">
        <div className="kl-supabase-brand">
          <span className="kl-supabase-logo">⚡</span>
          <div>
            <b>Supabase Cloud Auth</b>
            <small>Connected to PostgreSQL Backend</small>
          </div>
        </div>
        <div className="kl-auth-sub-toggle">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => { setMode("signin"); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => { setMode("signup"); setError(""); }}
          >
            Create Account
          </button>
        </div>
      </div>

      {error && (
        <div className="kl-auth-error-banner" role="alert">
          <span>⚠️</span> {error}
        </div>
      )}

      {successMsg && (
        <div className="kl-auth-success-banner" role="status">
          <span>✅</span> {successMsg}
        </div>
      )}

      {mode === "signin" ? (
        <form onSubmit={handleSignIn} className="kl-supabase-form">
          <label htmlFor="supa-email">Email Address</label>
          <input
            id="supa-email"
            type="email"
            placeholder="farmer@punjab.krishiloop.in"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="supa-password">Password</label>
          <input
            id="supa-password"
            type="password"
            placeholder="Your secure account password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="primary kl-btn-full" disabled={loading}>
            {loading ? "Authenticating with Supabase..." : "Sign In to KrishiLoop →"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSignUp} className="kl-supabase-form">
          <div className="kl-form-row-2">
            <div>
              <label htmlFor="supa-name">Full Name</label>
              <input
                id="supa-name"
                type="text"
                placeholder="Jasmeet Kaur"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="supa-phone">Phone Number</label>
              <input
                id="supa-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="kl-form-row-2">
            <div>
              <label htmlFor="supa-role">Ecosystem Role</label>
              <select
                id="supa-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="supa-district">District (Punjab)</label>
              <select
                id="supa-district"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
              >
                {DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <label htmlFor="supa-signup-email">Email Address</label>
          <input
            id="supa-signup-email"
            type="email"
            placeholder="jasmeet@farm.in"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="supa-signup-pass">Password (Min. 6 characters)</label>
          <input
            id="supa-signup-pass"
            type="password"
            placeholder="Create a strong password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="primary kl-btn-full" disabled={loading}>
            {loading ? "Registering on Supabase..." : "Create Verified Account →"}
          </button>
        </form>
      )}

      <div className="kl-supabase-foot">
        <button type="button" className="kl-inline-link" onClick={onCancel}>
          ← Switch to demo accounts or phone OTP
        </button>
      </div>
    </div>
  );
}
