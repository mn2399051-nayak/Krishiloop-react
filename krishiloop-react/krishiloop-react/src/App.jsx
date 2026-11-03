import { useEffect, useMemo, useState } from "react";
import { processors as seedProcessors, lots as seedLots, route, score, weights, matchFactors, VILLAGE_COORDS, DEFAULT_DEPOT } from "./data.js";
import { DEMO_ACCOUNTS, findAccountByRoleOrEmail, getAllAccounts } from "./accounts.js";
import GoogleMap from "./components/GoogleMap.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import SettingsPage from "./components/SettingsPage.jsx";
import AccountSwitcherModal from "./components/AccountSwitcherModal.jsx";
import ThemeSwitcherModal, { THEME_CONFIGS } from "./components/ThemeSwitcherModal.jsx";
import HeroTelemetryBanner from "./components/HeroTelemetryBanner.jsx";
import LiveFieldCameraWidget from "./components/LiveFieldCameraWidget.jsx";
import PhoneOtpKycFlow from "./components/PhoneOtpKycFlow.jsx";
import AdminKycManagement from "./components/AdminKycManagement.jsx";
import ContactPartnerModal from "./components/ContactPartnerModal.jsx";
import SupabaseAuthForm from "./components/SupabaseAuthForm.jsx";
import FarmerDashboard from "./components/dashboards/FarmerDashboard.jsx";
import BuyerDashboard from "./components/dashboards/BuyerDashboard.jsx";
import AdminDashboard from "./components/dashboards/AdminDashboard.jsx";
import TransporterDashboard from "./components/dashboards/TransporterDashboard.jsx";
import HelpSupportModal from "./components/HelpSupportModal.jsx";
import KrishiLoopAppIcon from "./components/KrishiLoopAppIcon.jsx";
import { isSupabaseConfigured } from "./lib/supabase.js";
import {
  authService,
  profileService,
  lotsService,
  demandsService,
  jobsService,
  recordsService
} from "./services/supabaseService.js";

const seed = {
  lots: seedLots.map((lot) => ({
    ...lot,
    residue: lot.residue || "Paddy straw",
    location: lot.village,
    availableUntil: "31 Oct",
    price: 1800,
    quality: lot.quality || "Standard",
    farmerId: lot.farmer,
    pickupJob: null,
    image: lot.image || (lot.residue === "Wheat straw" ? "/images/hero_harvest.jpg" : "/images/straw_bales.jpg"),
    moisture: lot.moisture || "12.4%",
    baleType: lot.baleType || "Mechanized Bales",
    history: [{ status: lot.status, at: "2026-10-12T09:00:00.000Z" }]
  })),
  processors: seedProcessors.map((p, i) => ({
    ...p,
    accepted: ["Paddy straw", ...(i === 2 ? ["Wheat straw"] : [])],
    capacity: p.need,
    specification: "Baled or loose, dry material",
    location: p.district,
    image: p.image || "/images/biomass_plant.jpg",
    phone: p.phone || "+91 98722 54321",
    email: p.email || "procurement@sangrurbiomass.in",
    contactPerson: p.contactPerson || "Sunil Jain (Plant Head)",
    workingHours: p.workingHours || "8:00 AM - 7:00 PM",
    type: p.type || "Biomass Processing Facility"
  })),
  jobs: [],
  records: [],
  demands: [
    { id: "D-201", processor: "Sangrur Biomass Pellets", residue: "Paddy straw", quantity: 80, due: "2026-11-10", location: "Sangrur", price: 1900, status: "Open", image: "/images/biomass_plant.jpg", type: "Bio-Pellet Plant" },
    { id: "D-202", processor: "Malerkotla Bio-CNG Unit", residue: "Paddy straw", quantity: 45, due: "2026-11-18", location: "Malerkotla", price: 1750, status: "Open", image: "/images/biomass_plant.jpg", type: "Bio-CNG Facility" },
    { id: "D-203", processor: "Patiala Paper Board Mill", residue: "Wheat straw", quantity: 30, due: "2026-12-02", location: "Patiala", price: 1600, status: "Open", image: "/images/straw_bales.jpg", type: "Pulp & Paper Mill" },
  ],
};
const key = "krishiloop-project-data-v1";
const roles = ["Farmer", "Collector", "Processor", "Buyer", "Admin"];
const navigation = {
  Farmer: ["Overview", "My lots", "Matching", "Live Feeds", "Impact", "Profile", "Settings"],
  Buyer: ["Overview", "Marketplace", "Demand board", "Live Feeds", "Impact", "Profile", "Settings"],
  Collector: ["Overview", "Pickup jobs", "Routes", "Intake", "Live Feeds", "Impact", "Profile", "Settings"],
  Transporter: ["Overview", "Pickup jobs", "Routes", "Intake", "Live Feeds", "Impact", "Profile", "Settings"],
  Processor: ["Overview", "Marketplace", "Demand board", "Intake", "Live Feeds", "Impact", "Profile", "Settings"],
  Admin: ["Overview", "User Verification", "Marketplace", "Demand board", "Pickup jobs", "Intake", "Live Feeds", "Impact", "Profile", "Settings"],
};

const getRoleNav = (role) => {
  const r = (role || "").toLowerCase();
  if (r.includes("buyer")) return navigation.Buyer;
  if (r.includes("process")) return navigation.Processor;
  if (r.includes("collect") || r.includes("transport")) return navigation.Collector;
  if (r.includes("admin")) return navigation.Admin;
  return navigation.Farmer;
};
const icons = {
  Overview: "⌂",
  "Live Feeds": "📹",
  Marketplace: "⌕",
  "My lots": "▤",
  Matching: "✳",
  "Pickup jobs": "↗",
  Routes: "⌁",
  "Demand board": "◷",
  Intake: "⇩",
  Impact: "▥",
  "User Verification": "🛡",
  Profile: "👤",
  Settings: "⚙",
};
const loadData = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(key));
    if (raw?.lots && raw?.demands) {
      const mergedProcessors = seed.processors.map(sp => {
        const existing = raw.processors?.find(p => p.id === sp.id);
        return existing
          ? {
              ...sp,
              ...existing,
              phone: existing.phone || sp.phone,
              email: existing.email || sp.email,
              contactPerson: existing.contactPerson || sp.contactPerson,
              workingHours: existing.workingHours || sp.workingHours,
              type: existing.type || sp.type
            }
          : sp;
      });
      return { ...seed, ...raw, processors: mergedProcessors };
    }
  } catch { }
  return seed;
};
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Flexible";
const id = (prefix, list) => `${prefix}-${String(201 + list.length).padStart(3, "0")}`;
const kmBetween = (a = "Sangrur", b = "Sangrur") => { const x = VILLAGE_COORDS[a] || VILLAGE_COORDS.Sangrur, y = VILLAGE_COORDS[b] || VILLAGE_COORDS.Sangrur; const dlat = (x[0] - y[0]) * 111, dlon = (x[1] - y[1]) * 96; return Math.max(1, Math.round(Math.hypot(dlat, dlon))); };
function Button({ children, onClick, secondary = false, type = "button", disabled = false }) { return <button className={secondary ? "secondary" : "primary"} onClick={onClick} type={type} disabled={disabled}>{children}</button>; }
function Metric({ label, value, hint }) { return <article className="kl-metric"><span>{label}</span><b>{value}</b><small>{hint}</small></article>; }

function Auth({ onLogin, rememberMe, setRememberMe }) {
  const [authMode, setAuthMode] = useState("phone"); // Default to Phone & OTP login
  const [role, setRole] = useState("Farmer");
  const activePreset = findAccountByRoleOrEmail(role);
  const [email, setEmail] = useState(activePreset.email);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [termsError, setTermsError] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleRoleChange = r => {
    setRole(r);
    const acc = findAccountByRoleOrEmail(r);
    if (acc) setEmail(acc.email);
  };

  const handlePhoneComplete = acc => {
    // When a user verifies via Phone OTP, immediately redirect to workspace
    setTermsError("");
    setAgreedTerms(true);
    onLogin(acc);
  };

  const handleDemoSubmit = e => {
    e.preventDefault();
    if (!agreedTerms) {
      setTermsError("Please accept the Terms & Conditions and Privacy Policy to continue");
      return;
    }
    setTermsError("");
    onLogin(email, role);
  };

  return (
    <main className="kl-auth">
      <section className="kl-auth-art">
        <div className="kl-auth-art-bg-img" />
        <div className="kl-auth-art-overlay" />
        <div className="kl-auth-art-inner">
          <a className="kl-brand" href="#home"><KrishiLoopAppIcon size={40} /><span>KrishiLoop<small>CIRCULAR AGRICULTURE & RESIDUE INTELLIGENCE</small></span></a>
          <div>
            <div className="kl-hero-badge" style={{ marginBottom: 16 }}>
              <span className="kl-pulse-dot" />
              <span className="kl-hero-badge-text">LIVE PILOT · SANGRUR & MALERKOTLA</span>
            </div>
            <div className="kl-eyebrow">A BETTER WAY TO USE EVERY HARVEST</div>
            <h1>Good for the soil.<br /><em>Great for your future.</em></h1>
            <p>Connect farmers, mechanized balers, bio-energy plants, and offtakers. Turn crop residue from field burn into measurable economic value.</p>
            <div className="kl-proof">
              <span className="kl-proof-icon">🌾</span>
              <div>
                <b>100% Zero-Burn Verified Supply Chain</b>
                <small>Mechanized baler booking, automated route planning & direct DBT farmer payouts.</small>
              </div>
            </div>
          </div>

          {/* Trust & Stats Bar */}
          <div className="kl-auth-trust-stats">
            <div className="kl-trust-stat">
              <span className="kl-trust-stat-value">148+</span>
              <span className="kl-trust-stat-label">Verified Farmers</span>
            </div>
            <div className="kl-trust-stat-divider" />
            <div className="kl-trust-stat">
              <span className="kl-trust-stat-value">520 t</span>
              <span className="kl-trust-stat-label">Residue Diverted</span>
            </div>
            <div className="kl-trust-stat-divider" />
            <div className="kl-trust-stat">
              <span className="kl-trust-stat-value">4</span>
              <span className="kl-trust-stat-label">Active Districts</span>
            </div>
            <div className="kl-trust-stat-divider" />
            <div className="kl-trust-stat">
              <span className="kl-trust-stat-value">₹22L+</span>
              <span className="kl-trust-stat-label">Farmer Payouts</span>
            </div>
          </div>

          <div className="kl-art-foot-badges">
            <span className="kl-art-foot-pill">🟢 186.4 t Straw Diverted</span>
            <span className="kl-art-foot-pill">🚜 14 Balers Live</span>
            <span className="kl-art-foot-pill">⚡ 3 Bio-Plants Active</span>
          </div>
        </div>
      </section>
      <section className="kl-auth-column">
        <div className="kl-auth-form">
          <div className="kl-auth-card">
            {/* Auth Switcher Tabs */}
            <div className="kl-auth-method-switcher">
              <button
                type="button"
                className={`kl-method-btn ${authMode === "phone" ? "active" : ""}`}
                onClick={() => setAuthMode("phone")}
              >
                📱 Phone &amp; OTP Login
                <small>New User · Aadhaar e-KYC</small>
              </button>
              <button
                type="button"
                className={`kl-method-btn ${authMode === "persona" ? "active" : ""}`}
                onClick={() => setAuthMode("persona")}
              >
                👤 Demo Personas
                <small>Punjab Pilot Roles</small>
              </button>
              <button
                type="button"
                className={`kl-method-btn ${authMode === "supabase" ? "active" : ""}`}
                onClick={() => setAuthMode("supabase")}
              >
                ⚡ Supabase Auth
                <small>{isSupabaseConfigured() ? "Cloud Database" : "Setup Backend"}</small>
              </button>
            </div>

            {authMode === "phone" ? (
              <PhoneOtpKycFlow
                onComplete={handlePhoneComplete}
                onCancel={() => setAuthMode("persona")}
              />
            ) : authMode === "supabase" ? (
              <SupabaseAuthForm
                onComplete={handlePhoneComplete}
                onCancel={() => setAuthMode("persona")}
              />
            ) : (
              <form onSubmit={handleDemoSubmit}>
                <div className="kl-auth-card-head">
                  <KrishiLoopAppIcon size={44} />
                  {activePreset.avatarUrl && (
                    <img src={activePreset.avatarUrl} alt={activePreset.name} className="kl-auth-persona-avatar" />
                  )}
                </div>
                <div className="kl-eyebrow">YOUR CIRCULAR LOOP STARTS HERE</div>
                <h2>Welcome to KrishiLoop</h2>
                <p>Select your persona to enter the demo agricultural workspace.</p>
                <label>Select role persona</label>
                <div className="kl-role-grid">
                  {roles.map(r => (
                    <button
                      key={r}
                      className={role === r ? "chosen" : ""}
                      type="button"
                      onClick={() => handleRoleChange(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <label htmlFor="login-email">Email address</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <label htmlFor="login-password">Password</label>
                <input id="login-password" name="password" type="password" placeholder="Any password for this demo" minLength="4" required defaultValue="demo1234" />
                <Button type="submit">Enter {role} workspace <span>→</span></Button>

                <div className="kl-auth-alt-action">
                  <span>or</span>
                  <button type="button" className="kl-link-btn" onClick={() => setAuthMode("phone")}>
                    Login with Phone Number &amp; OTP (New User) →
                  </button>
                </div>

                <div className="kl-demo-note">
                  {activePreset.avatarUrl && (
                    <img src={activePreset.avatarUrl} alt={activePreset.name} className="kl-note-avatar" />
                  )}
                  <div>
                    Logging in as <b>{activePreset.name}</b> ({activePreset.role} · {activePreset.org}).
                    <small style={{ display: 'block', marginTop: 2, opacity: 0.85 }}>Instant persona switching is available anywhere in the workspace.</small>
                  </div>
                </div>
              </form>
            )}

            {/* ---- Remember Me & Terms ---- */}
            <div className="kl-auth-bottom-controls">
              {/* Remember Me */}
              <label className="kl-remember-me-wrap">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                />
                <span className="kl-remember-checkmark" />
                <span>Remember me on this device</span>
              </label>

              {/* Terms & Conditions Consent */}
              <label className="kl-terms-consent-wrap">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={e => {
                    setAgreedTerms(e.target.checked);
                    if (e.target.checked) setTermsError("");
                  }}
                />
                <span className="kl-remember-checkmark" />
                <span>
                  I agree to the{" "}
                  <button type="button" className="kl-inline-link" onClick={() => setShowTermsModal(true)}>Terms & Conditions</button>
                  {" "}and{" "}
                  <button type="button" className="kl-inline-link" onClick={() => setShowPrivacyModal(true)}>Privacy Policy</button>
                </span>
              </label>
              {termsError && <div className="kl-terms-error">{termsError}</div>}
            </div>

            {/* Security Trust Badges */}
            <div className="kl-auth-trust-badges">
              <div className="kl-trust-badge"><span>🔒</span> SSL Encrypted</div>
              <div className="kl-trust-badge"><span>🛡</span> UIDAI Certified</div>
              <div className="kl-trust-badge"><span>🇮🇳</span> Made in India</div>
            </div>

            {/* Privacy Notice */}
            <div className="kl-auth-privacy-notice">
              <p>
                Your data is protected under India's Digital Personal Data Protection Act (DPDPA) 2023.
                KrishiLoop does not share your information with third parties without consent.
              </p>
            </div>
          </div>
        </div>
        <SiteFooter onLogout={null} />
      </section>

      {/* ---- Terms & Conditions Modal ---- */}
      {showTermsModal && (
        <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowTermsModal(false)}>
          <div className="kl-modal kl-legal-modal">
            <button className="kl-close" onClick={() => setShowTermsModal(false)} aria-label="Close">×</button>
            <div className="kl-eyebrow">LEGAL DOCUMENT</div>
            <h2>Terms & Conditions</h2>
            <div className="kl-legal-content">
              <h3>1. Acceptance of Terms</h3>
              <p>By registering or accessing KrishiLoop, you agree to these Terms & Conditions. KrishiLoop is a circular agriculture platform connecting farmers, collectors, processors, and buyers in Punjab's crop residue ecosystem.</p>
              <h3>2. User Registration & Authentication</h3>
              <p>Users must register with a valid Indian mobile number (+91). Identity verification is mandatory through Aadhaar e-KYC or other government-issued ID. Users are responsible for maintaining confidentiality of their OTP and account credentials.</p>
              <h3>3. Zero-Burn Certification</h3>
              <p>All accounts on KrishiLoop are certified under the zero-burn compliance programme. Users found violating stubble burning regulations may have their accounts suspended.</p>
              <h3>4. Marketplace Rules</h3>
              <p>Listings must accurately represent crop residue quantity, quality, and availability. Prices are indicative and subject to market conditions. KrishiLoop facilitates transactions but does not guarantee sale completion.</p>
              <h3>5. Direct Benefit Transfer (DBT)</h3>
              <p>Farmer payouts are processed through Government Direct Benefit Transfer. Verified bank account linked to Aadhaar is required for receiving payments.</p>
              <h3>6. Data Usage & Analytics</h3>
              <p>Anonymized data may be used for agricultural intelligence, satellite fire detection correlation, and carbon audit reporting by authorized government agencies.</p>
              <h3>7. Limitation of Liability</h3>
              <p>KrishiLoop is provided "as-is" for the Punjab Agricultural Circular Economy Initiative. The platform is not liable for losses arising from logistics delays, quality disputes, or market fluctuations.</p>
              <h3>8. Governing Law</h3>
              <p>These terms are governed by the laws of India, with jurisdiction in the courts of Chandigarh.</p>
            </div>
            <button className="primary kl-btn-full" onClick={() => { setAgreedTerms(true); setTermsError(""); setShowTermsModal(false); }}>
              I Accept the Terms & Conditions
            </button>
          </div>
        </div>
      )}

      {/* ---- Privacy Policy Modal ---- */}
      {showPrivacyModal && (
        <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowPrivacyModal(false)}>
          <div className="kl-modal kl-legal-modal">
            <button className="kl-close" onClick={() => setShowPrivacyModal(false)} aria-label="Close">×</button>
            <div className="kl-eyebrow">PRIVACY DOCUMENT</div>
            <h2>Privacy Policy</h2>
            <div className="kl-legal-content">
              <h3>Information We Collect</h3>
              <p>We collect mobile number, name, government ID details (Aadhaar/KCC/Voter ID/PAN), district, village, and role information during registration. Location data is collected for logistics route planning.</p>
              <h3>How We Use Your Data</h3>
              <p>Your data is used to verify identity via UIDAI e-KYC, facilitate marketplace transactions, plan collection routes, process DBT payouts, generate compliance reports for Punjab Agri authorities, and improve the platform experience.</p>
              <h3>Data Sharing</h3>
              <p>We share verified identity data with UIDAI for e-KYC authentication, transaction data with government DBT systems for farmer payouts, anonymized statistics with Punjab Agricultural Department, and zero-burn compliance data with satellite monitoring agencies (SAC/ISRO).</p>
              <h3>Data Retention</h3>
              <p>Account data is retained for the duration of your membership plus 5 years for government audit compliance. Transaction records are retained as per GST regulations.</p>
              <h3>Your Rights (DPDPA 2023)</h3>
              <p>You have the right to access your personal data, correct inaccuracies, request erasure (subject to regulatory retention requirements), data portability, and withdraw consent for non-essential processing.</p>
              <h3>Security Measures</h3>
              <p>All data is encrypted in transit (TLS 1.3) and at rest. OTP codes expire after 10 minutes. Government ID scans are stored in encrypted vaults with restricted access.</p>
              <h3>Contact</h3>
              <p>Data Protection Officer: dpo@krishiloop.in<br />Punjab Agri Circular Economy Initiative, Chandigarh, India.</p>
            </div>
            <button className="primary kl-btn-full" onClick={() => setShowPrivacyModal(false)}>
              Close Privacy Policy
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function ListingModal({ onClose, onSave }) {
  const [f, setF] = useState({ farmer: "", village: "", residue: "Paddy straw", est: "", from: "", until: "", price: "1800", quality: "Standard" });
  const change = e => setF({ ...f, [e.target.name]: e.target.value });
  return (
    <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <form className="kl-modal" onSubmit={e => { e.preventDefault(); onSave(f); }}>
        <button className="kl-close" onClick={onClose} aria-label="Close">×</button>
        <div className="kl-eyebrow">ADD TO THE LOOP</div>
        <h2>List agricultural residue</h2>
        <p>Publish a supply lot for matching and collection planning.</p>
        <div className="kl-form-grid">
          <label>Farmer name<input name="farmer" value={f.farmer} onChange={change} required placeholder="e.g. Jasmeet Kaur" /></label>
          <label>Village<input name="village" value={f.village} onChange={change} required placeholder="e.g. Dhuri" /></label>
          <label>Residue type<select name="residue" value={f.residue} onChange={change}><option>Paddy straw</option><option>Wheat straw</option><option>Mustard stalk</option><option>Other crop residue</option></select></label>
          <label>Estimated quantity (tonnes)<input name="est" type="number" min="0.1" step="0.1" value={f.est} onChange={change} required /></label>
          <label>Available from<input name="from" type="date" value={f.from} onChange={change} required /></label>
          <label>Available until<input name="until" type="date" value={f.until} onChange={change} required /></label>
          <label>Expected price (₹ / tonne)<input name="price" type="number" min="0" value={f.price} onChange={change} /></label>
          <label>Quality / condition<select name="quality" value={f.quality} onChange={change}><option>Standard</option><option>Dry, baled</option><option>Dry, loose</option><option>Needs inspection</option></select></label>
        </div>
        <div className="kl-modal-actions">
          <Button secondary onClick={onClose}>Cancel</Button>
          <Button type="submit">Publish supply listing →</Button>
        </div>
      </form>
    </div>
  );
}

function AppShell({ user, onLogout, onSwitchAccount }) {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState("Overview");
  const [pageHistory, setPageHistory] = useState([]);
  const [modal, setModal] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All residue");
  const [selectedLot, setSelectedLot] = useState("");
  const [contactPartnerModal, setContactPartnerModal] = useState(null);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("krishiloop-dark") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("krishiloop-dark", String(dark));
      if (dark) {
        document.documentElement.classList.add("kl-dark");
      } else {
        document.documentElement.classList.remove("kl-dark");
      }
    } catch {}
  }, [dark]);

  const [mobile, setMobile] = useState(false);
  const [backendStatus, setBackendStatus] = useState(() => isSupabaseConfigured() ? "online" : "demo");
  const [backendLoading, setBackendLoading] = useState(false);
  const [themeOverride, setThemeOverride] = useState(() => {
    try {
      return localStorage.getItem("krishiloop-theme-override") || "auto";
    } catch {
      return "auto";
    }
  });
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Compute enriched active account
  const activeAccount = useMemo(() => {
    const base = findAccountByRoleOrEmail(user?.email || user?.role);
    return { ...base, ...user };
  }, [user]);

  const getRoleThemeKey = (role) => {
    const r = (role || "").toLowerCase();
    if (r.includes("buyer")) return "buyer";
    if (r.includes("process")) return "processor";
    if (r.includes("collect") || r.includes("transport")) return "collector";
    if (r.includes("admin")) return "admin";
    return "seller"; // Default for Farmer / Seller
  };

  const activeThemeKey = themeOverride === "auto" ? getRoleThemeKey(activeAccount.role) : themeOverride;
  const activeThemeMeta = THEME_CONFIGS[activeThemeKey] || THEME_CONFIGS.seller;

  const handleSelectTheme = (key) => {
    setThemeOverride(key);
    try {
      localStorage.setItem("krishiloop-theme-override", key);
    } catch {}
  };

  useEffect(() => { localStorage.setItem(key, JSON.stringify(data)); }, [data]);

  // Load real backend data on mount if Supabase is configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let mounted = true;
    setBackendLoading(true);

    Promise.allSettled([
      lotsService.fetchLots(),
      demandsService.fetchDemands(),
      jobsService.fetchJobs(),
      recordsService.fetchRecords()
    ]).then(([lotsRes, demandsRes, jobsRes, recordsRes]) => {
      if (!mounted) return;
      setData(prev => ({
        ...prev,
        lots: (lotsRes.status === "fulfilled" && lotsRes.value?.data?.length) ? lotsRes.value.data : prev.lots,
        demands: (demandsRes.status === "fulfilled" && demandsRes.value?.data?.length) ? demandsRes.value.data : prev.demands,
        jobs: (jobsRes.status === "fulfilled" && jobsRes.value?.data?.length) ? jobsRes.value.data : prev.jobs,
        records: (recordsRes.status === "fulfilled" && recordsRes.value?.data?.length) ? recordsRes.value.data : prev.records
      }));
      setBackendStatus("online");
    }).catch(err => {
      console.warn("Supabase fetch failed, falling back to local data:", err);
      if (mounted) setBackendStatus("demo");
    }).finally(() => {
      if (mounted) setBackendLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  const notify = message => { setToast(message); window.clearTimeout(window.__klToast); window.__klToast = window.setTimeout(() => setToast(""), 3000); };
  const currentLots = useMemo(() => data.lots.filter(l => (filter === "All residue" || l.residue === filter) && `${l.id} ${l.farmer} ${l.village} ${l.residue}`.toLowerCase().includes(search.toLowerCase())), [data.lots, filter, search]);
  const openLots = data.lots.filter(l => !["Collected", "Processed"].includes(l.status));
  const routeLots = useMemo(() => openLots.slice(0, 6).map(l => ({ ...l, coords: VILLAGE_COORDS[l.village] || VILLAGE_COORDS.Sangrur })), [openLots]);
  const collected = data.lots.filter(l => ["Collected", "Processed"].includes(l.status));
  const totalListed = data.lots.reduce((s, l) => s + Number(l.est || 0), 0);
  const totalCollected = collected.reduce((s, l) => s + Number(l.act ?? l.est ?? 0), 0);
  const completedJobs = data.jobs.filter(j => j.status === "Collected").length;
  const kpis = [
    { label: "Residue listed", value: `${totalListed.toFixed(1)} t`, hint: `${data.lots.length} recorded lots` },
    { label: "Residue collected", value: `${totalCollected.toFixed(1)} t`, hint: "Recorded actual or estimated quantity" },
    { label: "Pickup completion", value: `${data.jobs.length ? Math.round(completedJobs / data.jobs.length * 100) : 0}%`, hint: `${completedJobs} of ${data.jobs.length} pickup jobs` },
    { label: "Open supply lots", value: String(openLots.length), hint: "Available for matching" },
  ];
  const nav = getRoleNav(activeAccount.role);

  const go = name => {
    const allowed = getRoleNav(activeAccount.role);
    const universalPages = ["Overview", "Profile", "Settings", "Live Feeds", "Impact"];
    if (!allowed.includes(name) && !universalPages.includes(name) && activeAccount.role !== "Admin") {
      notify(`The ${name} section is restricted for ${activeAccount.role} accounts.`);
      return;
    }
    if (name !== page) {
      setPageHistory(prev => [...prev, page]);
    }
    setPage(name);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (pageHistory.length > 0) {
      const prev = pageHistory[pageHistory.length - 1];
      setPageHistory(prevList => prevList.slice(0, -1));
      setPage(prev);
    } else if (page !== "Overview") {
      setPage("Overview");
    } else {
      notify("You are already on the Overview page");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addLot = async (f) => {
    const lot = {
      id: id("L", data.lots),
      farmer: f.farmer,
      village: f.village,
      location: f.village,
      residue: f.residue,
      est: Number(f.est),
      act: null,
      from: dateLabel(f.from),
      availableFrom: f.from,
      availableUntil: dateLabel(f.until),
      price: Number(f.price),
      quality: f.quality,
      status: "Listed",
      farmerId: activeAccount?.id || f.farmer,
      pickupJob: null,
      history: [{ status: "Listed", at: new Date().toISOString() }]
    };
    setData(d => ({ ...d, lots: [lot, ...d.lots] }));
    setModal(false);
    go("My lots");
    notify("Listing published and ready for matching.");

    if (isSupabaseConfigured()) {
      try {
        await lotsService.createLot(lot);
      } catch (e) {
        console.warn("Failed to sync new lot to Supabase:", e);
      }
    }
  };

  const updateLot = async (lotId, status, extra = {}) => {
    setData(d => ({
      ...d,
      lots: d.lots.map(l => l.id === lotId ? { ...l, ...extra, status, history: [...(l.history || []), { status, at: new Date().toISOString() }] } : l)
    }));

    if (isSupabaseConfigured()) {
      try {
        await lotsService.updateLot(lotId, { status, ...extra });
      } catch (e) {
        console.warn("Failed to sync lot update to Supabase:", e);
      }
    }
  };

  const createJob = async (lotIds, collector = activeAccount?.name || "Demo Collector") => {
    const group = data.lots.filter(l => lotIds.includes(l.id));
    if (!group.length) return;
    const job = {
      id: id("J", data.jobs),
      lotIds,
      collector,
      status: "Planned",
      route: group.map(l => l.village).join(" → ") + ` → ${group[0].location || "Sangrur"} processor`,
      distance: group.reduce((n, l) => n + kmBetween(l.village, "Sangrur"), 0),
      schedule: new Date().toISOString().slice(0, 10)
    };
    setData(d => ({
      ...d,
      jobs: [job, ...d.jobs],
      lots: d.lots.map(l => lotIds.includes(l.id) ? { ...l, status: "Collection planned", pickupJob: job.id, history: [...(l.history || []), { status: "Collection planned", at: new Date().toISOString() }] } : l)
    }));
    notify("Collection job created. Lots are now planned for pickup.");

    if (isSupabaseConfigured()) {
      try {
        await jobsService.createJob(job);
      } catch (e) {
        console.warn("Failed to sync collection job to Supabase:", e);
      }
    }
  };

  const confirmPickup = async (job) => {
    const actual = window.prompt("Enter actual collected quantity in tonnes:", String(data.lots.filter(l => job.lotIds.includes(l.id)).reduce((n, l) => n + Number(l.est), 0).toFixed(1)));
    if (actual === null) return;
    const sum = Number(actual);
    const lots = data.lots.filter(l => job.lotIds.includes(l.id));
    const totalEst = lots.reduce((n, x) => n + Number(x.est), 0) || 1;
    setData(d => ({
      ...d,
      jobs: d.jobs.map(j => j.id === job.id ? { ...j, status: "Collected", actualQuantity: sum, completedAt: new Date().toISOString() } : j),
      lots: d.lots.map(l => job.lotIds.includes(l.id) ? { ...l, status: "Collected", act: Number((sum * Number(l.est) / totalEst).toFixed(1)), history: [...(l.history || []), { status: "Collected", at: new Date().toISOString() }] } : l)
    }));
    notify("Pickup confirmed; actual quantities are recorded.");

    if (isSupabaseConfigured()) {
      try {
        await jobsService.confirmPickup(job.id, sum, job.lotIds);
      } catch (e) {
        console.warn("Failed to sync pickup confirmation to Supabase:", e);
      }
    }
  };

  const recordIntake = async (lot) => {
    if (!lot) return;
    const qty = window.prompt(`Processor intake quantity for ${lot.id} (tonnes):`, String(lot.act ?? lot.est));
    if (qty === null) return;
    const record = {
      id: id("R", data.records),
      lotId: lot.id,
      processor: activeAccount.role === "Processor" ? (activeAccount.name || activeAccount.email?.split("@")[0] || "Processor") : "Demo Processor",
      quantity: Number(qty),
      category: "Biomass feedstock",
      at: new Date().toISOString()
    };
    setData(d => ({
      ...d,
      records: [record, ...d.records],
      lots: d.lots.map(l => l.id === lot.id ? { ...l, status: "Processed", act: Number(qty), history: [...(l.history || []), { status: "Processed", at: new Date().toISOString() }] } : l)
    }));
    notify(`${lot.id} processor intake recorded.`);

    if (isSupabaseConfigured()) {
      try {
        await recordsService.createRecord(record);
        await lotsService.updateLot(lot.id, { status: "Processed", actual_quantity: Number(qty) });
      } catch (e) {
        console.warn("Failed to sync intake record to Supabase:", e);
      }
    }
  };
  const matchRows = (lot) => data.processors.map(p => { const distance = kmBetween(lot.village, p.location); const factors = { compat: p.accepted.includes(lot.residue) ? 1 : 0, distance: Math.max(0, 1 - distance / 90), quantity: Math.min(1, Number(lot.est) / Math.max(1, p.need / 8)), timing: 0.85, capacity: Math.min(1, p.capacity / Math.max(Number(lot.est), 1)), quality: lot.quality === "Needs inspection" ? .45 : .85 }; return { ...p, distance, parts: factors, percent: Math.round(score(factors) * 100) }; }).filter(m => m.parts.compat).sort((a, b) => b.percent - a.percent);
  const allMatches = matchRows(data.lots.find(l => l.id === selectedLot) || openLots[0] || data.lots[0] || { village: "Sangrur", residue: "Paddy straw", est: 1, quality: "Standard" });
  const exportCsv = () => { const rows = [["Lot", "Farmer", "Village", "Residue", "Estimated tonnes", "Actual tonnes", "Available from", "Status"], ...currentLots.map(l => [l.id, l.farmer, l.village, l.residue, l.est, l.act ?? "", l.from, l.status])]; const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n"); const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "krishiloop-lots.csv"; a.click(); URL.revokeObjectURL(a.href); };
  const pageTitle = {
    Overview: "A clear view of your residue loop",
    "Live Feeds": "Realtime Field & Plant Camera Network",
    Marketplace: "Supply and demand, in one place",
    "My lots": "Residue inventory",
    Matching: "Explainable supply matches",
    "Pickup jobs": "Collection jobs and handovers",
    Routes: "Collection planning",
    "Demand board": "Processor and buyer requirements",
    Intake: "Processor intake records",
    Impact: "Activity and impact reporting",
    Profile: "User Profile & Settings",
    "User Verification": "Ecosystem KYC & Aadhaar Verification Portal",
    Settings: "Account & System Preferences",
  }[page];

  return (
    <div className={`kl-app ${dark ? "kl-dark" : ""} kl-theme-${activeThemeKey}`}>
      <aside className={`kl-side ${mobile ? "open" : ""}`}>
        <a href="#top" className="kl-brand">
          <KrishiLoopAppIcon size={36} />
          <span>KrishiLoop<small>AGRICULTURE, IN A LOOP</small></span>
        </a>
        <div
          className="kl-side-role-badge"
          onClick={() => setShowThemeModal(true)}
          title={`Click to view or change dashboard theme (Current: ${activeThemeMeta.name})`}
        >
          <span className="kl-role-badge-icon">{activeThemeMeta.icon}</span>
          <span className="kl-role-badge-text">{activeThemeMeta.badgeText}</span>
        </div>
        <div className="kl-side-label">WORKSPACE</div>
        <nav>
          {nav.map(n => (
            <button key={n} className={page === n ? "active" : ""} onClick={() => go(n)}>
              <i>{icons[n]}</i>{n}
              {n === "My lots" && <span>{data.lots.length}</span>}
              {n === "Live Feeds" && <span className="kl-nav-live-dot">●</span>}
            </button>
          ))}
        </nav>
        <div className="kl-demo-tag">
          <span>●</span> Punjab pilot · {activeAccount.district}
        </div>

        {/* Profile button in Sidebar */}
        <div
          className="kl-profile kl-profile-clickable"
          onClick={() => go("Profile")}
          title="Click to view & manage profile"
        >
          <div
            className="kl-mark kl-sidebar-avatar-mark"
            style={{
              background: activeAccount.avatarBg,
              color: activeAccount.avatarColor,
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {activeAccount.avatarUrl ? (
              <img src={activeAccount.avatarUrl} alt={activeAccount.name} className="kl-avatar-img-sm" />
            ) : (
              activeAccount.initials
            )}
          </div>
          <span className="kl-profile-info">
            <b>{activeAccount.name}</b>
            <small>{activeAccount.role} · {activeAccount.district}</small>
          </span>
          <button
            className="kl-switch-btn"
            onClick={e => {
              e.stopPropagation();
              setAccountModal(true);
            }}
            title="Switch account persona"
            aria-label="Switch account"
          >
            ⇄
          </button>
        </div>
      </aside>

      <button className="kl-mobile-menu" onClick={() => setMobile(!mobile)}>☰</button>

      <main id="top" className="kl-main">
        {backendLoading && <div className="kl-backend-loading-bar" />}
        <header className="kl-topbar">
          <div className="kl-topbar-left">
            <button
              type="button"
              className={`kl-back-btn ${pageHistory.length === 0 && page === "Overview" ? "disabled" : ""}`}
              onClick={goBack}
              title={
                pageHistory.length > 0
                  ? `Go back to ${pageHistory[pageHistory.length - 1]}`
                  : page !== "Overview"
                    ? "Go back to Overview"
                    : "Go back"
              }
              aria-label="Go back"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back</span>
            </button>
            <div className="kl-crumb">KrishiLoop <span>/</span> {page}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className={`kl-backend-pill ${backendStatus}`} title={backendStatus === "online" ? "Supabase Cloud Connected" : "Local Browser Demo Storage"}>
              <span className={`kl-backend-dot ${backendStatus}`} />
              {backendStatus === "online" ? "Cloud Connected" : "Local Demo"}
            </span>
            <span className="kl-season"><i />2026 harvest · Punjab</span>
            <button className="kl-theme" onClick={() => setDark(!dark)} title="Toggle theme">{dark ? "☀" : "☾"}</button>

            {/* Profile trigger in Topbar */}
            <div
              className="kl-topbar-user"
              onClick={() => go("Profile")}
              title="View profile & account details"
            >
              <span
                className="kl-topbar-avatar"
                style={{ background: activeAccount.avatarBg, color: activeAccount.avatarColor }}
              >
                {activeAccount.avatarUrl ? (
                  <img src={activeAccount.avatarUrl} alt={activeAccount.name} className="kl-avatar-img-xs" />
                ) : (
                  activeAccount.initials
                )}
              </span>
              <span className="kl-topbar-name">{(activeAccount?.name || "User").split(" ")[0]}</span>
              <span className="kl-topbar-verified-tag" title="UIDAI Aadhaar Verified">✓ Verified</span>
            </div>

            {activeAccount.role === "Admin" && (
              <button
                className={`secondary kl-topbar-admin-kyc-btn ${page === "User Verification" ? "active" : ""}`}
                onClick={() => go("User Verification")}
                title="Manage Aadhaar KYC & Onboard New Users"
              >
                🛡 KYC Desk
              </button>
            )}

            {/* Help & Support Desk in Topbar */}
            <button
              className="secondary kl-help-topbar-btn"
              onClick={() => setShowHelpModal(true)}
              title="Help & Regulatory Support Desk"
            >
              ? Help
            </button>

            {/* Quick Switch button in Topbar */}
            <button
              className="secondary kl-switch-account-btn"
              onClick={() => setAccountModal(true)}
              title="Switch account persona"
            >
              ⇄ Switch
            </button>

            <button className="kl-signout" onClick={onLogout} title="Sign out">
              ↪ <span>Sign out</span>
            </button>
          </div>
        </header>

        <header className="kl-heading">
          <div className="kl-heading-left">
            {page !== "Overview" && (
              <button
                type="button"
                className="kl-heading-back-btn"
                onClick={goBack}
                title={pageHistory.length > 0 ? `Go back to ${pageHistory[pageHistory.length - 1]}` : "Go back to Overview"}
                aria-label="Go back"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
            )}
            <div>
              <div className="kl-eyebrow">PILOT WORKSPACE <span>·</span> {activeAccount.role.toUpperCase()} MODE</div>
              <h1>{pageTitle}</h1>
              <p>Coordinate agricultural residue from field to processor with a traceable digital workflow.</p>
            </div>
          </div>
          {activeAccount.role === "Farmer" && page !== "Profile" && page !== "Settings" && (
            <Button onClick={() => setModal(true)}>＋ List residue</Button>
          )}
        </header>

        <div className="kl-banner">
          <span>✳</span>
          <div>
            <b>Logged in as {activeAccount.name} ({activeAccount.role} · {activeAccount.district})</b>
            <small>Click your profile or the ⇄ Switch button to switch to another role persona in the circular loop.</small>
          </div>
        </div>

        {page === "Overview" && (
          <>
            <HeroTelemetryBanner
              activeAccount={activeAccount}
              activeThemeKey={activeThemeKey}
              onAction={(type, arg) => {
                if (type === "listResidue") setModal(true);
                else if (type === "navigate") go(arg);
              }}
              onOpenLiveFeed={() => go("Live Feeds")}
            />

            {/* Role-Specific Dashboard Views */}
            {(activeAccount.role === "Farmer" || activeAccount.role?.toLowerCase() === "farmer") && (
              <FarmerDashboard
                activeAccount={activeAccount}
                lots={data.lots}
                demands={data.demands}
                processors={data.processors}
                jobs={data.jobs}
                records={data.records}
                loading={backendLoading}
                onAddLot={() => setModal(true)}
                onUpdateLot={updateLot}
                onContactPartner={(partner, lot) => setContactPartnerModal({ partner, lot })}
                onNavigate={go}
                notify={notify}
              />
            )}

            {(activeAccount.role === "Buyer" || activeAccount.role?.toLowerCase() === "buyer" || activeAccount.role === "Processor" || activeAccount.role?.toLowerCase() === "processor") && (
              <BuyerDashboard
                activeAccount={activeAccount}
                lots={data.lots}
                demands={data.demands}
                records={data.records}
                jobs={data.jobs}
                loading={backendLoading}
                onPostDemand={() => go("Demand board")}
                onContactFarmer={(partner, lot) => setContactPartnerModal({ partner, lot })}
                onNavigate={go}
                notify={notify}
              />
            )}

            {(activeAccount.role === "Admin" || activeAccount.role?.toLowerCase() === "admin") && (
              <AdminDashboard
                activeAccount={activeAccount}
                lots={data.lots}
                demands={data.demands}
                records={data.records}
                jobs={data.jobs}
                loading={backendLoading}
                onNavigate={go}
                notify={notify}
              />
            )}

            {(activeAccount.role === "Collector" || activeAccount.role?.toLowerCase() === "collector" || activeAccount.role === "Transporter" || activeAccount.role?.toLowerCase() === "transporter") && (
              <TransporterDashboard
                activeAccount={activeAccount}
                lots={data.lots}
                jobs={data.jobs}
                records={data.records}
                loading={backendLoading}
                onCreateJob={createJob}
                onConfirmPickup={confirmPickup}
                onNavigate={go}
                notify={notify}
              />
            )}
          </>
        )}

        {page === "Live Feeds" && (
          <div className="kl-live-feeds-view">
            <LiveFieldCameraWidget />
            <div className="kl-two" style={{ marginTop: 20 }}>
              <section className="kl-panel">
                <div className="kl-panel-title">
                  <div>
                    <div className="kl-eyebrow">REGIONAL SATELLITE MONITOR</div>
                    <h2>Zero-Burn Stubble Fire Prevention</h2>
                  </div>
                  <span className="kl-pill">Sentinel-2 / Drone Grid</span>
                </div>
                <div className="kl-satellite-strip">
                  <img src="/images/drone_fields.jpg" alt="Drone farmland grid" className="kl-satellite-img" />
                  <div className="kl-satellite-overlay">
                    <span>🛰️ Sentinel-2 L2A Multispectral Feed · 10m Resolution</span>
                    <b>0 Thermal Anomalies · 100% Zero-Burn Verified</b>
                  </div>
                </div>
                <p className="kl-note" style={{ marginTop: 12 }}>
                  Automated thermal anomaly surveillance across Sangrur, Dhuri, and Malerkotla. Automated SMS alerts trigger baler dispatch upon combine harvester exit.
                </p>
              </section>
              <section className="kl-panel">
                <div className="kl-panel-title">
                  <div>
                    <div className="kl-eyebrow">DEPOT WEIGHBRIDGES</div>
                    <h2>Live Inbound Fleet</h2>
                  </div>
                  <span className="kl-pill">IoT Weighbridge</span>
                </div>
                <div className="kl-stop-list">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--kl-line)' }}>
                    <span style={{ background: 'var(--kl-mint)', color: 'var(--kl-green)', width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 16 }}>🚜</span>
                    <div style={{ flex: 1 }}>
                      <b>PB-13-X-4921 · Tractor Trolley (14.2 t)</b>
                      <small>From Dhuri Field #12 → Sangrur Bio-Pellets · Gate Queue: 1</small>
                    </div>
                    <span className="kl-status Collected">Inbound</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--kl-line)' }}>
                    <span style={{ background: 'var(--kl-mint)', color: 'var(--kl-green)', width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 16 }}>🚛</span>
                    <div style={{ flex: 1 }}>
                      <b>PB-11-AB-8802 · Multi-Axle Bale Truck (22.0 t)</b>
                      <small>From Sunam Central Depot → Malerkotla Bio-CNG</small>
                    </div>
                    <span className="kl-status Planned">En Route</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
                    <span style={{ background: 'var(--kl-mint)', color: 'var(--kl-green)', width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 16 }}>🌾</span>
                    <div style={{ flex: 1 }}>
                      <b>Baler Unit #04 (Mechanized Rake & Baler)</b>
                      <small>Longowal East · 82 Bales packaged today</small>
                    </div>
                    <span className="kl-status Open">Baling</span>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {page === "Marketplace" && (
          <>
            <section className="kl-market-summary">
              <Metric label="Supply lots" value={openLots.length} hint={`${totalListed.toFixed(1)} tonnes listed`} />
              <Metric label="Open requirements" value={data.demands.filter(d => d.status === "Open").length} hint={`${data.demands.filter(d => d.status === "Open").reduce((n, d) => n + d.quantity, 0)} tonnes requested`} />
              <Metric label="Processor network" value={data.processors.length} hint="Demo processor profiles" />
            </section>
            <div className="kl-panel kl-market-panel">
              <div className="kl-panel-title">
                <div><div className="kl-eyebrow">LOCAL NETWORK</div><h2>Residue supply lots</h2><p>Browse fictional pilot listings and compare their current status.</p></div>
                {activeAccount.role === "Farmer" && <Button onClick={() => setModal(true)}>＋ Add supply</Button>}
              </div>
              <LotFilters search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />
              <LotCards lots={currentLots} role={activeAccount.role} onMatch={l => { setSelectedLot(l.id); go("Matching"); }} onPlan={l => createJob([l.id])} onIntake={recordIntake} />
            </div>
            <div className="kl-panel kl-demand-panel">
              <div className="kl-panel-title">
                <div><div className="kl-eyebrow">BUYER SIGNAL</div><h2>Open processor demand</h2></div>
                <button className="kl-link" onClick={() => go("Demand board")}>All requirements →</button>
              </div>
              <DemandCards demands={data.demands.filter(d => d.status === "Open")} />
            </div>
          </>
        )}

        {page === "My lots" && (
          <section className="kl-panel">
            <div className="kl-panel-title">
              <div><div className="kl-eyebrow">TRACEABLE SUPPLY</div><h2>All residue lots</h2><p>Estimated and collected quantities are shown separately.</p></div>
              <Button secondary onClick={exportCsv}>↓ Export CSV</Button>
            </div>
            <LotFilters search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} />
            <LotTable lots={currentLots} onPlan={createJob} onIntake={recordIntake} role={activeAccount.role} />
          </section>
        )}

        {page === "Matching" && (
          <>
            <section className="kl-panel kl-match-config">
              <div className="kl-panel-title">
                <div><div className="kl-eyebrow">EXPLAINABLE SCORING</div><h2>Choose a lot to match</h2><p>Ranked using residue compatibility, distance, quantity, timing, capacity and quality.</p></div>
                <span className="kl-pill">Configurable weighted baseline</span>
              </div>
              <label className="kl-select-label">Residue lot
                <select value={selectedLot || openLots[0]?.id || ""} onChange={e => setSelectedLot(e.target.value)}>
                  {data.lots.map(l => <option key={l.id} value={l.id}>{l.id} · {l.farmer} · {l.residue} · {l.est} t</option>)}
                </select>
              </label>
            </section>
            <div className="kl-match-grid">
              {allMatches.length ? allMatches.map((m, i) => {
                const partnerPhone = m.phone || "+91 98722 54321";
                const partnerEmail = m.email || "procurement@sangrurbiomass.in";
                const partnerRep = m.contactPerson || "Procurement Officer";
                const partnerHours = m.workingHours || "Mon-Sat 8:00 AM - 7:00 PM";
                const currentLot = data.lots.find(l => l.id === selectedLot) || openLots[0] || data.lots[0];
                const mailSubject = encodeURIComponent(`KrishiLoop Deal Inquiry: Lot ${currentLot?.id || ""} (${currentLot?.est || ""}t ${currentLot?.residue || ""}) for ${m.name}`);
                const mailBody = encodeURIComponent(`Hello ${partnerRep},\n\nI am contacting you regarding Supply Lot ${currentLot?.id || ""} on KrishiLoop.\n\n• Residue: ${currentLot?.residue}\n• Estimated Quantity: ${currentLot?.est} tonnes\n• Farmgate Village: ${currentLot?.village}\n• Match Score: ${m.percent}%\n\nPlease confirm procurement terms and collection schedule.\n\nThank you,\nKrishiLoop Deal Partner`);

                return (
                  <article className="kl-match-card" key={m.id}>
                    <header>
                      <span className="kl-match-rank">0{i + 1}</span>
                      <span>
                        <b>{m.name}</b>
                        <small>{m.location} · accepts {m.accepted.join(", ")}</small>
                      </span>
                      <strong>{m.percent}<small>%</small></strong>
                    </header>
                    <div className="kl-match-bar"><i style={{ width: `${m.percent}%` }} /></div>
                    <div className="kl-match-factors">
                      {Object.keys(weights).map(k => (
                        <span key={k}>
                          {({ compat: "Compatibility", distance: "Distance", quantity: "Quantity fit", timing: "Timing", capacity: "Capacity", quality: "Quality" })[k]}
                          <b>{Math.round(m.parts[k] * 100)}%</b>
                        </span>
                      ))}
                    </div>
                    <p>Approx. {m.distance} km away · demand {m.need} t · {m.specification}</p>

                    {/* Deal Partner Direct Contact Information */}
                    <div className="kl-match-contact-box">
                      <div className="kl-match-contact-rep">
                        <span className="kl-rep-avatar">🏢</span>
                        <div className="kl-rep-details">
                          <b className="kl-rep-name">{partnerRep}</b>
                          <small className="kl-rep-sub">Deal Partner Representative · {partnerHours}</small>
                        </div>
                      </div>

                      <div className="kl-match-contact-links">
                        <a
                          href={`tel:${partnerPhone}`}
                          className="kl-contact-link-pill kl-pill-call"
                          title={`Direct call to ${partnerPhone}`}
                          onClick={() => notify(`Initiating direct call to ${partnerPhone}...`)}
                        >
                          <span className="kl-pill-icon">📞</span>
                          <span className="kl-pill-text">{partnerPhone}</span>
                        </a>

                        <a
                          href={`mailto:${partnerEmail}?subject=${mailSubject}&body=${mailBody}`}
                          className="kl-contact-link-pill kl-pill-email"
                          title={`Send deal proposal to ${partnerEmail}`}
                          onClick={() => notify(`Opening email client for ${partnerEmail}...`)}
                        >
                          <span className="kl-pill-icon">✉️</span>
                          <span className="kl-pill-text">{partnerEmail}</span>
                        </a>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="kl-match-card-actions">
                      <button
                        type="button"
                        className="primary kl-btn-contact-partner"
                        onClick={() => setContactPartnerModal({ partner: m, lot: currentLot })}
                      >
                        🤝 Contact Deal Partner
                      </button>

                      <div className="kl-match-sub-actions">
                        <a
                          href={`tel:${partnerPhone}`}
                          className="secondary kl-btn-sub-action"
                          onClick={() => notify(`Calling ${m.name}...`)}
                        >
                          📞 Call
                        </a>
                        <a
                          href={`mailto:${partnerEmail}?subject=${mailSubject}&body=${mailBody}`}
                          className="secondary kl-btn-sub-action"
                          onClick={() => notify(`Opening email for ${m.name}...`)}
                        >
                          ✉️ Email
                        </a>
                        <Button
                          secondary
                          onClick={() => notify(`${m.name} was added to the review queue.`)}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              }) : <p className="kl-empty">No compatible processor matches this residue type in the demo network.</p>}
            </div>
          </>
        )}

        {page === "Pickup jobs" && (
          <>
            <div className="kl-panel kl-panel-title-wrap">
              <div className="kl-panel-title">
                <div><div className="kl-eyebrow">FIELD OPERATIONS</div><h2>Collection jobs</h2><p>Collectors can confirm pickup and record actual quantity.</p></div>
                <Button secondary onClick={() => openLots.length && createJob(openLots.slice(0, 3).map(l => l.id))} disabled={!openLots.length}>＋ Plan nearby cluster</Button>
              </div>
            </div>
            <JobCards jobs={data.jobs} lots={data.lots} role={activeAccount.role} onPickup={confirmPickup} />
            {!data.jobs.length && <EmptyCard title="No pickup jobs yet" text="Create a collection plan from the marketplace or plan the first nearby cluster." action="Open marketplace" onClick={() => go("Marketplace")} />}
          </>
        )}

        {page === "Routes" && (
          <div className="kl-two kl-route-page">
            <section className="kl-panel">
              <div className="kl-panel-title">
                <div><div className="kl-eyebrow">SUGGESTED COLLECTION</div><h2>Nearby pickup cluster</h2></div>
                <span className="kl-pill">Live Google Map</span>
              </div>
              <GoogleMap lots={routeLots} depot={DEFAULT_DEPOT} />
              <p className="kl-note">Live Google Map. Markers are numbered in suggested pickup order; click a marker for lot details. Polyline is a straight-line ordering estimate — confirm road access and pickup windows with participants before dispatch.</p>
              <Button onClick={() => openLots.length && createJob(openLots.slice(0, 3).map(l => l.id))} disabled={!openLots.length}>Create this pickup job →</Button>
            </section>
            <section className="kl-panel">
              <div className="kl-eyebrow">PICKUP STOPS</div>
              <h2>Lots ready to plan</h2>
              <div className="kl-stop-list">
                {openLots.slice(0, 8).map((l, i) => (
                  <div key={l.id}>
                    <span>{i + 1}</span>
                    <div><b>{l.village}</b><small>{l.id} · {l.farmer}</small></div>
                    <strong>{l.est} t</strong>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {page === "Demand board" && (
          <>
            <div className="kl-panel kl-panel-title-wrap">
              <div className="kl-panel-title">
                <div><div className="kl-eyebrow">DEMAND VISIBILITY</div><h2>Processor requirements</h2><p>Demand figures are fictional pilot examples for demonstrating the workflow.</p></div>
                <Button onClick={async () => {
                  const processor = window.prompt("Processor / buyer name:", "New biomass buyer");
                  if (!processor) return;
                  const residue = window.prompt("Residue type:", "Paddy straw");
                  if (!residue) return;
                  const quantity = Number(window.prompt("Required quantity (tonnes):", "20"));
                  if (!quantity) return;
                  const location = window.prompt("District / location:", "Sangrur");
                  const newDemand = {
                    id: id("D", data.demands),
                    buyerId: activeAccount?.id,
                    processor,
                    residue,
                    quantity,
                    due: "2026-11-30",
                    location: location || "Sangrur",
                    price: 1800,
                    status: "Open",
                    type: "Bio-Pellet Plant",
                    image: "/images/biomass_plant.jpg"
                  };
                  setData(d => ({ ...d, demands: [newDemand, ...d.demands] }));
                  notify("Demand requirement published.");
                  if (isSupabaseConfigured()) {
                    try {
                      await demandsService.createDemand(newDemand);
                    } catch (e) {
                      console.warn("Failed to sync demand to Supabase:", e);
                    }
                  }
                }}>＋ Post requirement</Button>
              </div>
            </div>
            <DemandCards
              demands={data.demands}
              onClose={async d => {
                setData(s => ({ ...s, demands: s.demands.map(x => x.id === d.id ? { ...x, status: "Closed" } : x) }));
                notify("Requirement marked closed.");
                if (isSupabaseConfigured()) {
                  try {
                    await demandsService.updateDemandStatus(d.id, "Closed");
                  } catch (e) {
                    console.warn("Failed to sync demand close to Supabase:", e);
                  }
                }
              }}
              showActions={true}
            />
          </>
        )}

        {page === "Intake" && (
          <>
            <div className="kl-panel kl-panel-title-wrap">
              <div className="kl-panel-title">
                <div><div className="kl-eyebrow">PROCESSOR OPERATIONS</div><h2>Record processor intake</h2><p>Record the actual intake quantity and close the traceability loop.</p></div>
              </div>
            </div>
            <section className="kl-panel">
              <LotTable lots={data.lots.filter(l => l.status === "Collected" || l.status === "Processed")} role={activeAccount.role} onIntake={recordIntake} />
            </section>
            <div className="kl-panel kl-records">
              <div className="kl-eyebrow">INTAKE HISTORY</div>
              <h2>Processing records</h2>
              {data.records.length ? (
                <div className="kl-stop-list">
                  {data.records.map(r => (
                    <div key={r.id}>
                      <span>✓</span>
                      <div><b>{r.lotId} · {r.processor}</b><small>{r.category} · {dateLabel(r.at.slice(0, 10))}</small></div>
                      <strong>{r.quantity} t</strong>
                    </div>
                  ))}
                </div>
              ) : <EmptyCard title="No intake records" text="When a collected lot arrives, record its processor intake here." />}
            </div>
          </>
        )}

        {page === "Impact" && (
          <>
            <section className="kl-metrics">{kpis.map(k => <Metric key={k.label} {...k} />)}</section>
            <div className="kl-two">
              <section className="kl-panel">
                <div className="kl-eyebrow">MEASURED FROM DEMO RECORDS</div>
                <h2>Traceability coverage</h2>
                <p className="kl-body">Lots with at least one recorded lifecycle event: <b>{data.lots.length ? Math.round(data.lots.filter(l => (l.history || []).length > 0).length / data.lots.length * 100) : 0}%</b></p>
                <div className="kl-impact-meter"><i style={{ width: `${data.lots.length ? data.lots.filter(l => (l.history || []).length > 0).length / data.lots.length * 100 : 0}%` }} /></div>
                <p className="kl-note">This is a prototype activity indicator. It does not verify environmental benefit or avoided emissions.</p>
              </section>
              <section className="kl-panel">
                <div className="kl-eyebrow">OUTCOME RECORDS</div>
                <h2>Verified workflow activity</h2>
                <div className="kl-outcomes">
                  <span><b>{data.jobs.filter(j => j.status === "Collected").length}</b><small>Completed pickups</small></span>
                  <span><b>{data.records.length}</b><small>Processor intakes</small></span>
                  <span><b>{data.lots.filter(l => l.status === "Processed").length}</b><small>Processed lots</small></span>
                </div>
              </section>
            </div>
            <section className="kl-panel kl-claims">
              <h2>Environmental indicators</h2>
              <p>Carbon or emissions impacts are not calculated in this MVP. The report recommends adding them only when a verified methodology and eligible activity data are available.</p>
            </section>
          </>
        )}

        {/* Profile Page View */}
        {page === "Profile" && (
          <ProfilePage
            user={activeAccount}
            notify={notify}
            onBack={goBack}
            onSwitchAccount={acc => {
              onSwitchAccount(acc);
              notify(`Switched to ${acc.name} (${acc.role})`);
            }}
            onUpdateUser={acc => {
              onSwitchAccount(acc);
            }}
          />
        )}

        {/* User Verification / Admin KYC Page View (Secured: Admins only) */}
        {page === "User Verification" && (
          (activeAccount.role === "Admin" || activeAccount.role?.toLowerCase() === "admin") ? (
            <AdminKycManagement
              onSwitchUser={acc => {
                onSwitchAccount(acc);
                notify(`Switched account to ${acc.name} (${acc.role})`);
              }}
              notify={notify}
            />
          ) : (
            <div className="kl-panel kl-unauthorized-panel" role="alert">
              <div className="kl-unauthorized-icon">🔒</div>
              <div className="kl-eyebrow">ACCESS RESTRICTED <span>·</span> 403 FORBIDDEN</div>
              <h2>State Administrator Authorization Required</h2>
              <p className="kl-sub">
                The Ecosystem KYC &amp; Aadhaar Verification Desk is restricted to State Agricultural Officers and Platform Administrators.
                Your account (<strong>{activeAccount.name}</strong>) is currently authenticated as a <strong>{activeAccount.role}</strong>.
              </p>
              <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Button onClick={() => go("Overview")}>
                  Return to {activeAccount.role} Dashboard →
                </Button>
                <Button secondary onClick={() => setShowHelpModal(true)}>
                  Contact Directorate Helpdesk
                </Button>
              </div>
            </div>
          )
        )}

        {/* Account Settings Page View */}
        {page === "Settings" && (
          <SettingsPage
            notify={notify}
            onBack={goBack}
            activeThemeKey={activeThemeKey}
            themeOverride={themeOverride}
            onSelectTheme={handleSelectTheme}
            userRole={activeAccount.role}
            dark={dark}
            onToggleDark={setDark}
          />
        )}

        <SiteFooter onLogout={onLogout} onNavigate={go} />
      </main>

      {toast && <div className="kl-toast" role="status">✓ &nbsp;{toast}</div>}
      {modal && <ListingModal onClose={() => setModal(false)} onSave={addLot} />}

      {/* Account Switcher Modal */}
      {accountModal && (
        <AccountSwitcherModal
          activeUser={activeAccount}
          onSelectAccount={acc => {
            onSwitchAccount(acc);
            notify(`Switched account to ${acc.name} (${acc.role})`);
          }}
          onClose={() => setAccountModal(false)}
        />
      )}

      {/* Role-Tailored Theme Switcher Modal */}
      {showThemeModal && (
        <ThemeSwitcherModal
          currentRole={activeAccount.role}
          activeThemeKey={activeThemeKey}
          themeOverride={themeOverride}
          onSelectTheme={handleSelectTheme}
          onClose={() => setShowThemeModal(false)}
        />
      )}

      {/* Shared Help & Support Modal */}
      {showHelpModal && (
        <HelpSupportModal
          role={activeAccount.role}
          onClose={() => setShowHelpModal(false)}
        />
      )}

      {/* Contact Deal Partner Modal */}
      {contactPartnerModal && (
        <ContactPartnerModal
          partner={contactPartnerModal.partner}
          lot={contactPartnerModal.lot}
          onClose={() => setContactPartnerModal(null)}
          onNotify={notify}
        />
      )}
    </div>
  );
}

function LotFilters({ search, setSearch, filter, setFilter }) { return <div className="kl-tools"><input aria-label="Search lots" placeholder="Search by farmer, village or lot ID" value={search} onChange={e => setSearch(e.target.value)} /><select value={filter} onChange={e => setFilter(e.target.value)}><option>All residue</option>{["Paddy straw", "Wheat straw", "Mustard stalk", "Other crop residue"].map(x => <option key={x}>{x}</option>)}</select></div>; }

function LotCards({ lots, role, onMatch, onPlan, onIntake }) {
  if (!lots.length) return <p className="kl-empty">No matching supply lots. Try another filter or create a listing.</p>;
  return (
    <div className="kl-lot-grid">
      {lots.map(l => {
        const cardImg = l.image || (l.residue === "Wheat straw" ? "/images/hero_harvest.jpg" : "/images/straw_bales.jpg");
        return (
          <article className="kl-lot-card" key={l.id}>
            <div className="kl-lot-media-wrap">
              <img src={cardImg} alt={l.residue} className="kl-lot-cover-img" />
              <div className="kl-lot-media-overlay" />
              <div className="kl-lot-media-badges">
                <span className="kl-lot-live-pill"><span className="kl-pulse-dot" /> LIVE RESIDUE</span>
                <span className={`kl-status ${(l.status || "Listed").replaceAll(" ", "-")}`}>{l.status || "Listed"}</span>
              </div>
            </div>
            <div className="kl-lot-card-body">
              <div className="kl-lot-card-head">
                <span className="kl-lot-type">{l.residue}</span>
                <span className="kl-lot-quality-badge">{l.quality || "Standard"}</span>
              </div>
              <h3 className="kl-lot-amount">{l.est} <small>tonnes estimated</small></h3>
              <div className="kl-lot-telemetry-tags">
                <span className="kl-lot-chip">💧 {l.moisture || "12.4%"} moisture</span>
                <span className="kl-lot-chip">🌾 {l.baleType || "Mechanized Bales"}</span>
              </div>
              <div className="kl-lot-meta">
                <span>📍 {l.village}, Punjab</span>
                <span>⏱ {l.from}{l.availableUntil ? ` – ${l.availableUntil}` : ""}</span>
                <span>👨‍🌾 {l.farmer}</span>
                <span>💰 ₹{Number(l.price || 0).toLocaleString("en-IN")} / tonne</span>
              </div>
              <div className="kl-card-actions">
                {(role === "Farmer" || role === "Processor" || role === "Admin") && (
                  <Button secondary onClick={() => onMatch(l)}>⚡ View matches</Button>
                )}
                {["Collector", "Admin"].includes(role) && !["Collected", "Processed"].includes(l.status) && (
                  <Button onClick={() => onPlan(l)}>Plan pickup</Button>
                )}
                {["Processor", "Admin"].includes(role) && l.status === "Collected" && (
                  <Button onClick={() => onIntake(l)}>Record intake</Button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function LotTable({ lots, onPlan, onIntake, role }) {
  return (
    <div className="kl-table-scroll">
      <table className="kl-table">
        <thead>
          <tr>
            <th>LOT / SUPPLY</th>
            <th>FARMER</th>
            <th>LOCATION</th>
            <th>ESTIMATED</th>
            <th>ACTUAL PICKUP</th>
            <th>AVAILABLE</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {lots.map(l => (
            <tr key={l.id}>
              <td>
                <div className="kl-table-lot-cell">
                  <img src={l.image || "/images/straw_bales.jpg"} alt="" className="kl-table-thumb" />
                  <div>
                    <b>{l.id}</b>
                    <small>{l.residue} · {l.moisture || "12%"} moist</small>
                  </div>
                </div>
              </td>
              <td>{l.farmer}</td>
              <td>{l.village}, Punjab</td>
              <td>{l.est} t</td>
              <td>{l.act == null ? <span className="kl-muted">Pending</span> : `${l.act} t`}</td>
              <td>{l.from}</td>
              <td><span className={`kl-status ${(l.status || "Listed").replaceAll(" ", "-")}`}>{l.status || "Listed"}</span></td>
              <td>
                {["Collector", "Admin"].includes(role) && !["Collected", "Processed"].includes(l.status) && (
                  <button className="kl-row-action" onClick={() => onPlan([l.id])}>Plan pickup</button>
                )}
                {["Processor", "Admin"].includes(role) && l.status === "Collected" && (
                  <button className="kl-row-action" onClick={() => onIntake(l)}>Record intake</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!lots.length && <p className="kl-empty">No lots to display.</p>}
    </div>
  );
}

function DemandCards({ demands, onClose, showActions = false }) {
  if (!demands.length) return <p className="kl-empty">There are no open requirements in this demo yet.</p>;
  return (
    <div className="kl-demand-grid">
      {demands.map(d => (
        <article key={d.id} className="kl-demand-card">
          <div className="kl-demand-media-wrap">
            <img src={d.image || "/images/biomass_plant.jpg"} alt={d.processor} className="kl-demand-cover-img" />
            <div className="kl-demand-media-overlay" />
            <div className="kl-demand-media-badges">
              <span className="kl-demand-live-pill">⚡ {d.type || "Bio-Energy Unit"}</span>
              <span className={`kl-status ${d.status}`}>{d.status}</span>
            </div>
          </div>
          <div className="kl-demand-card-body">
            <h3>{d.processor}</h3>
            <p className="kl-demand-sub">🌱 {d.residue} · 📍 {d.location}</p>
            <div className="kl-demand-stats">
              <span><b>{d.quantity} t</b><small>Target volume</small></span>
              <span><b>{dateLabel(d.due)}</b><small>Required by</small></span>
              <span><b>₹{Number(d.price).toLocaleString("en-IN")}</b><small>Indicative / t</small></span>
            </div>
            {showActions && d.status === "Open" && (
              <button className="kl-row-action" onClick={() => onClose?.(d)}>Mark requirement closed</button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function JobCards({ jobs, lots, role, onPickup }) { return jobs.length ? <div className="kl-job-grid">{jobs.map(j => { const group = lots.filter(l => j.lotIds.includes(l.id)); return <article className="kl-panel kl-job" key={j.id}><header><span className="kl-job-id">{j.id}</span><span className={`kl-status ${j.status}`}>{j.status}</span></header><h3>{j.route}</h3><p>{group.map(l => l.id).join(" · ")} · {group.reduce((n, l) => n + l.est, 0).toFixed(1)} t estimated</p><div className="kl-job-info"><span>Collector<b>{j.collector}</b></span><span>Suggested distance<b>~{j.distance} km</b></span><span>Scheduled<b>{dateLabel(j.schedule)}</b></span></div>{j.status !== "Collected" && ["Collector", "Admin"].includes(role) && <Button onClick={() => onPickup(j)}>Confirm pickup & actual quantity</Button>}{j.status === "Collected" && <p className="kl-success">✓ Pickup confirmed · {j.actualQuantity} t actual total</p>}</article>; })}</div> : null; }

function EmptyCard({ title, text, action, onClick }) { return <div className="kl-empty-card"><span>↗</span><b>{title}</b><p>{text}</p>{action && <button className="kl-link" onClick={onClick}>{action} →</button>}</div>; }
function SiteFooter({ onLogout, onNavigate }) { const navTo = name => onNavigate ? onNavigate(name) : document.getElementById("login-email")?.focus(); return <footer className="kl-footer"><button className="kl-footer-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑ &nbsp;Back to top</button><div className="kl-footer-main"><div className="kl-footer-groups"><section><h3>Get to know KrishiLoop</h3><button onClick={() => navTo("Overview")}>About the project</button><button onClick={() => navTo("Impact")}>Our impact approach</button><button onClick={() => navTo("Marketplace")}>Punjab pilot</button><button onClick={() => navTo("Overview")}>How the residue loop works</button></section><section><h3>Join the residue network</h3><button onClick={() => navTo("Marketplace")}>List and discover residue</button><button onClick={() => navTo("Demand board")}>Post processor demand</button><button onClick={() => navTo("Pickup jobs")}>Coordinate collection</button><button onClick={() => navTo("Matching")}>Explore smart matching</button></section><section><h3>For partners</h3><button onClick={() => navTo("Routes")}>Collectors and aggregators</button><button onClick={() => navTo("Intake")}>Processors and buyers</button><button onClick={() => navTo("Demand board")}>Ecosystem organizations</button><button onClick={() => navTo("Impact")}>Pilot activity reports</button></section><section><h3>Let us help you</h3><button onClick={() => navTo("Profile")}>Account and profile</button><button onClick={() => navTo("Settings")}>System settings & API</button><button onClick={() => window.alert("Demo listings and activity are stored in this browser only.")}>Data and privacy</button>{onLogout && <button onClick={onLogout}>Sign out</button>}</section></div><div className="kl-footer-bottom"><a href="#top" className="kl-footer-brand"><KrishiLoopAppIcon size={32} /><span><b>KrishiLoop</b><small>Residue to value</small></span></a><span className="kl-footer-region">🌾 &nbsp;Punjab, India <i /> Illustrative pilot prototype</span><span className="kl-footer-copy">© 2026 KrishiLoop · Turning residue into a resource</span></div></div></footer>; }

export default function App() {
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem("krishiloop-remember") === "true";
    } catch {
      return false;
    }
  });

  const [session, setSession] = useState(() => {
    try {
      // Only auto-restore session if "Remember Me" was previously checked
      const remembered = localStorage.getItem("krishiloop-remember") === "true";
      if (!remembered) return null;

      const saved = JSON.parse(localStorage.getItem("krishiloop-session"));
      if (saved) {
        // Enforce privilege security: non-admins cannot restore as Admin
        if (saved.role === "Admin" && saved.id !== "acc-admin" && saved.email !== "amanpreet.k@punjab-agri.gov.in" && !saved.isLiveSupabase) {
          saved.role = "Farmer";
        }
        const full = findAccountByRoleOrEmail(saved.id || saved.email || saved.role);
        return { ...full, ...saved };
      }
      return null;
    } catch {
      return null;
    }
  });

  // Listen to Supabase Auth state changes and load trusted profile record
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // In local/demo mode: ensure non-admins cannot hold Admin role
      if (session?.role === "Admin" && session?.id !== "acc-admin" && session?.email !== "amanpreet.k@punjab-agri.gov.in") {
        const sanitized = { ...session, role: "Farmer" };
        localStorage.setItem("krishiloop-session", JSON.stringify(sanitized));
        setSession(sanitized);
      }
      return;
    }

    let isMounted = true;

    // Check existing Supabase user on startup & load trusted database profile
    authService.getUser().then(async (res) => {
      const user = res?.data?.user;
      if (user && isMounted) {
        const { data: profile } = await profileService.getProfile(user.id);
        const rawRole = profile?.role || "Farmer";
        const resolvedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
        const account = {
          id: user.id,
          name: profile?.full_name || user.email?.split("@")[0] || "User",
          email: user.email,
          phone: profile?.phone || "",
          district: profile?.district || "Sangrur",
          village: profile?.village || "Dhuri",
          org: profile?.org || `${profile?.district || "Sangrur"} Agricultural Loop`,
          role: resolvedRole,
          badge: `Verified ${resolvedRole}`,
          isAadhaarVerified: profile?.is_verified ?? true,
          kycStatus: profile?.kyc_status || "Verified",
          isLiveSupabase: true
        };
        localStorage.setItem("krishiloop-session", JSON.stringify(account));
        setSession(account);
      }
    }).catch(err => {
      console.warn("Could not load trusted profile on init:", err);
    });

    const { data: authListener } = authService.onAuthStateChange(async (event, supaSession) => {
      if (event === "SIGNED_IN" && supaSession?.user && isMounted) {
        const { data: profile } = await profileService.getProfile(supaSession.user.id);
        const rawRole = profile?.role || "Farmer";
        const resolvedRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
        const account = {
          id: supaSession.user.id,
          name: profile?.full_name || supaSession.user.email?.split("@")[0] || "User",
          email: supaSession.user.email,
          phone: profile?.phone || "",
          district: profile?.district || "Sangrur",
          village: profile?.village || "Dhuri",
          org: profile?.org || `${profile?.district || "Sangrur"} Agricultural Loop`,
          role: resolvedRole,
          badge: `Verified ${resolvedRole}`,
          isAadhaarVerified: profile?.is_verified ?? true,
          kycStatus: profile?.kyc_status || "Verified",
          isLiveSupabase: true
        };
        localStorage.setItem("krishiloop-session", JSON.stringify(account));
        setSession(account);
      } else if (event === "SIGNED_OUT" && isMounted) {
        setSession(null);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleRememberMe = (checked) => {
    setRememberMe(checked);
    try {
      if (checked) {
        localStorage.setItem("krishiloop-remember", "true");
      } else {
        localStorage.removeItem("krishiloop-remember");
      }
    } catch { /* ignore */ }
  };

  const login = (accountOrEmail, role) => {
    let value;
    if (typeof accountOrEmail === "object" && accountOrEmail !== null) {
      value = accountOrEmail;
    } else {
      const full = findAccountByRoleOrEmail(accountOrEmail || role);
      value = { ...full, email: accountOrEmail, role };
    }
    // Security check: only predefined admin account can have Admin role in demo mode
    if (value.role === "Admin" && value.id !== "acc-admin" && value.email !== "amanpreet.k@punjab-agri.gov.in" && !value.isLiveSupabase) {
      value.role = "Farmer";
    }
    localStorage.setItem("krishiloop-session", JSON.stringify(value));
    setSession(value);
  };

  const switchAccount = (newAcc) => {
    localStorage.setItem("krishiloop-session", JSON.stringify(newAcc));
    setSession(newAcc);
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await authService.signOut();
      } catch (e) {
        console.warn("Supabase sign out error:", e);
      }
    }
    localStorage.removeItem("krishiloop-session");
    localStorage.removeItem("krishiloop-remember");
    setRememberMe(false);
    setSession(null);
  };

  return session ? (
    <AppShell user={session} onLogout={logout} onSwitchAccount={switchAccount} />
  ) : (
    <Auth onLogin={login} rememberMe={rememberMe} setRememberMe={handleRememberMe} />
  );
}
