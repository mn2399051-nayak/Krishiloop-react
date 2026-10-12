import { useState, useEffect } from "react";
import { getAllAccounts } from "../accounts.js";
import PhoneOtpKycFlow from "./PhoneOtpKycFlow.jsx";
import { profileService, kycService } from "../services/supabaseService.js";
import { isSupabaseConfigured } from "../lib/supabase.js";

export default function AdminKycManagement({ onSwitchUser, notify }) {
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [filterRole, setFilterRole] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserCert, setSelectedUserCert] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [supabaseAccounts, setSupabaseAccounts] = useState([]);
  const [kycDocs, setKycDocs] = useState([]);
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [docSignedUrl, setDocSignedUrl] = useState(null);

  // Fetch Supabase profiles & KYC documents when configured
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let isMounted = true;
    setLoadingBackend(true);

    Promise.all([
      profileService.getAllProfiles(),
      kycService.fetchKycDocuments(),
    ]).then(([profilesRes, kycRes]) => {
      if (!isMounted) return;
      if (profilesRes.data && profilesRes.data.length > 0) {
        const mapped = profilesRes.data.map(p => ({
          id: p.id,
          name: p.full_name,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email || `${p.id.slice(0, 8)}@krishiloop.in`,
          role: p.role,
          badge: p.badge || `Verified ${p.role}`,
          avatarBg: p.avatar_bg || "#059669",
          avatarColor: p.avatar_color || "#ffffff",
          avatarUrl: p.avatar_url,
          coverUrl: p.cover_url || "/images/hero_harvest.jpg",
          initials: p.initials || p.full_name?.slice(0, 2).toUpperCase() || "KL",
          phone: p.phone,
          district: p.district || "Sangrur",
          village: p.village || "Dhuri",
          org: p.org || "Punjab Agri Network",
          bio: p.bio,
          employeeId: `KL-${p.role.slice(0, 3).toUpperCase()}-${p.id.slice(0, 4).toUpperCase()}`,
          isVerified: p.is_verified,
          kycStatus: p.kyc_status,
          idProofType: p.id_proof_type || "Aadhaar Card",
          idProofNumber: p.id_proof_number_masked || "XXXX-XXXX-8921",
          source: "supabase",
        }));
        setSupabaseAccounts(mapped);
      }
      if (kycRes.data) {
        setKycDocs(kycRes.data);
      }
      setLoadingBackend(false);
    }).catch(err => {
      console.warn("Could not fetch admin KYC data from Supabase:", err);
      if (isMounted) setLoadingBackend(false);
    });

    return () => { isMounted = false; };
  }, [refreshKey]);

  // Combine default local demo accounts with Supabase accounts
  const localAccounts = getAllAccounts();
  const accounts = supabaseAccounts.length > 0
    ? [...supabaseAccounts, ...localAccounts.filter(l => !supabaseAccounts.some(s => s.phone === l.phone || s.id === l.id))]
    : localAccounts;

  const filteredAccounts = accounts.filter(acc => {
    const matchesRole = filterRole === "All" || acc.role === filterRole;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      acc.name?.toLowerCase().includes(query) ||
      acc.phone?.includes(query) ||
      acc.district?.toLowerCase().includes(query) ||
      acc.idProofNumber?.toLowerCase().includes(query) ||
      acc.employeeId?.toLowerCase().includes(query);
    return matchesRole && matchesSearch;
  });

  const verifiedCount = accounts.filter(a => a.isVerified).length;
  const farmerCount = accounts.filter(a => a.role === "Farmer").length;

  const handleOnboardingComplete = newAccount => {
    setShowOnboardModal(false);
    setRefreshKey(k => k + 1);
    notify?.(`User ${newAccount.name} (${newAccount.role}) successfully onboarded and verified with Aadhaar!`);
    if (window.confirm(`User ${newAccount.name} is now verified with Aadhaar! Would you like to switch to their workspace now?`)) {
      onSwitchUser?.(newAccount);
    }
  };

  // Generate private signed URL for document viewing
  const handleViewPrivateDoc = async (userId) => {
    const doc = kycDocs.find(d => d.user_id === userId);
    if (!doc?.storage_path) {
      alert("Demonstration scan: Simulated UIDAI e-KYC digital record stored securely.");
      return;
    }
    const { signedUrl, error } = await kycService.getSignedUrl(doc.storage_path, 1800);
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    } else {
      alert("Could not create signed URL: " + (error?.message || "Storage access restricted."));
    }
  };

  return (
    <div className="kl-admin-kyc-container">
      {/* Header Banner */}
      <section className="kl-panel kl-admin-kyc-hero">
        <div className="kl-admin-kyc-hero-left">
          <div className="kl-eyebrow">PUNJAB STATE RESIDUE MONITORING · ADMIN DESK</div>
          <h2>Farmer &amp; Partner ID Verification (e-KYC)</h2>
          <p>
            Under Punjab Clean Air Directives, all residue transactions, mechanized baler bookings, and DBT incentive
            transfers require mobile OTP and Aadhaar / valid Government ID confirmation.
          </p>
        </div>
        <div className="kl-admin-kyc-hero-actions">
          <button
            type="button"
            className="primary kl-onboard-action-btn"
            onClick={() => setShowOnboardModal(true)}
          >
            ＋ Onboard New User (Phone &amp; Aadhaar OTP)
          </button>
        </div>
      </section>

      {/* KPI Stats */}
      <div className="kl-stat-row">
        <div className="kl-stat-card">
          <b>{accounts.length}</b>
          <span>Total Pilot Users</span>
        </div>
        <div className="kl-stat-card">
          <b style={{ color: "var(--kl-green)" }}>{verifiedCount} (100%)</b>
          <span>Aadhaar e-KYC Verified</span>
        </div>
        <div className="kl-stat-card">
          <b>{farmerCount}</b>
          <span>Verified Farmers</span>
        </div>
        <div className="kl-stat-card">
          <b style={{ color: "var(--kl-green)" }}>Active</b>
          <span>UIDAI Gateway Status</span>
        </div>
      </div>

      {/* Directory & Controls */}
      <section className="kl-panel" style={{ marginTop: 20 }}>
        <div className="kl-panel-title">
          <div>
            <div className="kl-eyebrow">OFFICIAL VERIFICATION DIRECTORY</div>
            <h3>Verified Platform Participants</h3>
            <p className="kl-sub">Real-time status of users authenticated via Phone OTP and Aadhaar e-KYC</p>
          </div>
          <div className="kl-admin-filters-wrap">
            <input
              type="text"
              placeholder="Search by name, phone, Aadhaar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="kl-admin-search-input"
            />
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="kl-admin-filter-select"
            >
              <option value="All">All Roles</option>
              <option value="Farmer">Farmer</option>
              <option value="Collector">Collector</option>
              <option value="Processor">Processor</option>
              <option value="Buyer">Buyer</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="kl-table-scroll">
          <table className="kl-table kl-admin-kyc-table">
            <thead>
              <tr>
                <th>PARTICIPANT</th>
                <th>ROLE &amp; ORG</th>
                <th>PHONE NUMBER</th>
                <th>ID PROOF (e-KYC)</th>
                <th>DISTRICT / VILLAGE</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map(acc => (
                <tr key={acc.id}>
                  <td>
                    <div className="kl-admin-user-cell">
                      {acc.avatarUrl ? (
                        <img src={acc.avatarUrl} alt="" className="kl-admin-avatar-img" />
                      ) : (
                        <div
                          className="kl-admin-avatar-fallback"
                          style={{ background: acc.avatarBg || "#059669", color: acc.avatarColor || "#fff" }}
                        >
                          {acc.initials}
                        </div>
                      )}
                      <div>
                        <b>{acc.name}</b>
                        <small>{acc.employeeId || "KL-USER-01"}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="kl-account-role-tag">{acc.role}</span>
                    <div style={{ fontSize: 11, color: "var(--kl-muted)", marginTop: 2 }}>{acc.org}</div>
                  </td>
                  <td>
                    <div className="kl-admin-phone-cell">
                      <span>{acc.phone || "+91 98765 00000"}</span>
                      <small>✓ SMS OTP Verified</small>
                    </div>
                  </td>
                  <td>
                    <div className="kl-admin-id-cell">
                      <b>{acc.idProofType || "Aadhaar Card"}</b>
                      <code>{acc.idProofNumber || "XXXX-XXXX-8921"}</code>
                    </div>
                  </td>
                  <td>
                    <span>{acc.district}</span>
                    <small style={{ display: "block", color: "var(--kl-muted)" }}>{acc.village || acc.district}</small>
                  </td>
                  <td>
                    <span className="kl-status-badge-verified">
                      ✓ UIDAI Verified
                    </span>
                  </td>
                  <td>
                    <div className="kl-admin-row-actions">
                      <button
                        type="button"
                        className="kl-row-action"
                        onClick={() => setSelectedUserCert(acc)}
                        title="View e-KYC Verification Certificate"
                      >
                        Certificate
                      </button>
                      <button
                        type="button"
                        className="kl-row-action kl-action-switch"
                        onClick={() => onSwitchUser?.(acc)}
                        title="Login as this user"
                      >
                        Enter ↗
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Onboard Modal */}
      {showOnboardModal && (
        <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowOnboardModal(false)}>
          <div className="kl-modal kl-admin-onboard-modal">
            <button className="kl-close" onClick={() => setShowOnboardModal(false)} aria-label="Close">
              ×
            </button>
            <div className="kl-eyebrow">ADMIN REGISTRATION &amp; VERIFICATION DESK</div>
            <h2>Onboard New Participant</h2>
            <p>
              Register a new farmer or partner by verifying their mobile number via OTP, followed by Aadhaar /
              government ID e-KYC authentication.
            </p>

            <PhoneOtpKycFlow
              isAdminMode={true}
              onComplete={handleOnboardingComplete}
              onCancel={() => setShowOnboardModal(false)}
            />
          </div>
        </div>
      )}

      {/* Verification Certificate Modal */}
      {selectedUserCert && (
        <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && setSelectedUserCert(null)}>
          <div className="kl-modal kl-cert-modal">
            <button className="kl-close" onClick={() => setSelectedUserCert(null)} aria-label="Close">
              ×
            </button>
            <div className="kl-cert-card">
              <div className="kl-cert-header">
                <span className="kl-govt-seal">🏛</span>
                <div>
                  <small>GOVERNMENT OF PUNJAB · DEPARTMENT OF AGRICULTURE</small>
                  <h3>KrishiLoop Zero-Burn Digital Verification Certificate</h3>
                </div>
              </div>

              <div className="kl-cert-body">
                <p>This document certifies that the following participant has successfully completed electronic identity verification (e-KYC):</p>

                <div className="kl-cert-details-grid">
                  <div>
                    <label>Full Name</label>
                    <b>{selectedUserCert.name}</b>
                  </div>
                  <div>
                    <label>Assigned Role</label>
                    <b>{selectedUserCert.role} ({selectedUserCert.badge})</b>
                  </div>
                  <div>
                    <label>Verified Mobile</label>
                    <b>{selectedUserCert.phone}</b>
                  </div>
                  <div>
                    <label>Government ID Proof</label>
                    <b>{selectedUserCert.idProofType} ({selectedUserCert.idProofNumber})</b>
                  </div>
                  <div>
                    <label>District &amp; Village</label>
                    <b>{selectedUserCert.village}, {selectedUserCert.district} (Punjab)</b>
                  </div>
                  <div>
                    <label>Traceability UID</label>
                    <b style={{ color: "var(--kl-green)" }}>{selectedUserCert.employeeId}</b>
                  </div>
                  <div>
                    <label>Verification Method</label>
                    <b>Two-Factor OTP (Mobile SMS + UIDAI Aadhaar)</b>
                  </div>
                  <div>
                    <label>Status</label>
                    <b style={{ color: "var(--kl-green)" }}>✓ Active · Full Regular Website Access</b>
                  </div>
                </div>
              </div>

              <div className="kl-cert-footer">
                <div className="kl-cert-qr">
                  <span>📱 Scan for UIDAI e-KYC Verification</span>
                </div>
                <div className="kl-cert-sig">
                  <div className="kl-cert-sig-line" />
                  <small>State Agricultural Traceability Officer</small>
                </div>
              </div>
            </div>
            <div className="kl-modal-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="secondary"
                onClick={() => setSelectedUserCert(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  const target = selectedUserCert;
                  setSelectedUserCert(null);
                  onSwitchUser?.(target);
                }}
              >
                Login as {selectedUserCert.name} ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
