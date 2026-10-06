import { useState, useEffect } from "react";
import { DEMO_ACCOUNTS } from "../accounts.js";

export default function ProfilePage({ user, notify, onSwitchAccount, onBack }) {
  const [firstName, setFirstName] = useState(user?.firstName || "Gurpreet");
  const [lastName, setLastName] = useState(user?.lastName || "Singh");
  const [phone, setPhone] = useState(user?.phone || "+91 98760 12345");
  const [email, setEmail] = useState(user?.email || "gurpreet.s@krishiloop.in");
  const [bio, setBio] = useState(user?.bio || "Covering Sangrur and surrounding blocks since 2024. Specialised in paddy straw collection logistics.");
  const [role, setRole] = useState(user?.role || "Farmer");
  const [district, setDistrict] = useState(user?.district || "Sangrur");
  const [org, setOrg] = useState(user?.org || "Dhuri Progressive Farmers Collective");

  // Keep state in sync if switched to another account
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || user.name?.split(" ")[0] || "Gurpreet");
      setLastName(user.lastName || user.name?.split(" ").slice(1).join(" ") || "Singh");
      setPhone(user.phone || "+91 98760 12345");
      setEmail(user.email || "demo@krishiloop.in");
      setBio(user.bio || "");
      setRole(user.role || "Farmer");
      setDistrict(user.district || "Sangrur");
      setOrg(user.org || "KrishiLoop Collective");
    }
  }, [user]);

  const initials = user?.initials || `${firstName[0] || ""}${lastName[0] || ""}`;
  const fullName = `${firstName} ${lastName}`.trim() || user?.name || "Demo User";
  const stats = user?.stats || [
    { label: "Farmers onboarded", value: "38" },
    { label: "Residue listed this season", value: "186 t" },
    { label: "Collection completion rate", value: "81%" },
  ];
  const activities = user?.recentActivity || [
    { type: "green", icon: "✓", text: "Added <b>L-106</b> lot for Sukhdev Singh (7.4 t, Malerkotla)", time: "Today, 9:14 AM" },
    { type: "straw", icon: "📈", text: "Updated collection route for <b>Sangrur cluster</b> — added stop at Lehragaga", time: "Yesterday, 4:32 PM" },
    { type: "blue", icon: "🔔", text: "Matched <b>L-104</b> (Jasmeet Kaur) to Sangrur Biomass Pellets — score 89", time: "Yesterday, 11:05 AM" },
    { type: "green", icon: "✓", text: "Marked <b>L-101</b> as Processed — payment released", time: "3 days ago, 2:18 PM" },
  ];

  const saveProfile = () => {
    notify?.("Profile changes saved successfully.");
  };

  return (
    <>
      <header className="kl-heading">
        <div className="kl-heading-left">
          {onBack && (
            <button
              type="button"
              className="kl-heading-back-btn"
              onClick={onBack}
              title="Go back"
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
          )}
          <div>
            <div className="kl-eyebrow">YOUR PROFILE <span>·</span> ACCOUNT DETAILS</div>
            <h1>{fullName}</h1>
            <p>{role} · {district} district · {org}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="primary" onClick={saveProfile}>Save changes</button>
        </div>
      </header>

      {/* Hero */}
      <div
        className="kl-profile-hero"
        style={user?.coverUrl ? {
          backgroundImage: `linear-gradient(135deg, rgba(6, 78, 59, 0.88) 0%, rgba(16, 185, 129, 0.75) 100%), url(${user.coverUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        } : undefined}
      >
        <div className="kl-profile-avatar-wrap">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={fullName} className="kl-profile-avatar-img" />
          ) : (
            <div className="kl-profile-avatar-lg" style={{ background: user?.avatarBg || "#d8b34d", color: user?.avatarColor || "#1a2717" }}>
              {initials}
            </div>
          )}
        </div>
        <div className="kl-profile-hero-info">
          <h2>{fullName}</h2>
          <p>{role} · {district} district · {user?.village || district}</p>
          <div className="kl-profile-badges">
            <span className="kl-badge">✓ {user?.badge || "Verified Account"}</span>
            <span className="kl-badge">🛡 {role} Workspace</span>
            <span className="kl-badge">📅 Member since {user?.memberSince || "Oct 2024"}</span>
            <span className="kl-badge">🆔 {user?.employeeId || "KL-DEMO-01"}</span>
          </div>
        </div>
      </div>

      {/* Switch Account Quick Bar */}
      <section className="kl-panel" style={{ marginBottom: 20 }}>
        <div className="kl-panel-title">
          <div>
            <div className="kl-eyebrow">SWITCH ACCOUNT</div>
            <h3>Active Accounts in Punjab Pilot</h3>
            <p className="kl-sub">Quickly switch persona to experience the complete circular loop workflow</p>
          </div>
          <span className="kl-pill">5 Demo Personas</span>
        </div>
        <div className="kl-accounts-switch-grid">
          {DEMO_ACCOUNTS.map(acc => {
            const isActive = acc.email === user?.email || acc.role === user?.role;
            return (
              <div
                key={acc.id}
                className={`kl-account-card ${isActive ? "active" : ""}`}
                onClick={() => !isActive && onSwitchAccount?.(acc)}
              >
                <div className="kl-account-card-top">
                  {acc.avatarUrl ? (
                    <img src={acc.avatarUrl} alt={acc.name} className="kl-account-avatar-img" />
                  ) : (
                    <div className="kl-account-avatar" style={{ background: acc.avatarBg, color: acc.avatarColor }}>
                      {acc.initials}
                    </div>
                  )}
                  <div className="kl-account-meta">
                    <b>{acc.name}</b>
                    <span className="kl-account-role-tag">{acc.role}</span>
                  </div>
                </div>
                <div className="kl-account-district">📍 {acc.village}, {acc.district}</div>
                <div className="kl-account-org">{acc.org}</div>
                <div className="kl-account-action">
                  {isActive ? (
                    <span className="kl-active-indicator">● Active Account</span>
                  ) : (
                    <span className="kl-switch-link">Switch to this account →</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <div className="kl-stat-row">
        {stats.map((st, i) => (
          <div className="kl-stat-card" key={i}>
            <b>{st.value}</b>
            <span>{st.label}</span>
          </div>
        ))}
      </div>

      {/* Edit forms */}
      <div className="kl-profile-grid">
        <div className="kl-panel">
          <h3>Personal information</h3>
          <p className="kl-sub">Update your contact details and basic info</p>
          <div className="kl-form-pair">
            <label>First name<input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} /></label>
            <label>Last name<input type="text" value={lastName} onChange={e => setLastName(e.target.value)} /></label>
          </div>
          <div className="kl-form-pair">
            <label>Phone number<input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></label>
            <label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          </div>
          <label className="kl-field-full">Bio / Notes<textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} /></label>
        </div>
        <div className="kl-panel">
          <h3>Work &amp; Organisation</h3>
          <p className="kl-sub">Role, district coverage and organisation details</p>
          <div className="kl-form-pair">
            <label>Role
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option>Farmer</option>
                <option>Collector</option>
                <option>Processor</option>
                <option>Buyer</option>
                <option>Admin</option>
              </select>
            </label>
            <label>Primary district
              <select value={district} onChange={e => setDistrict(e.target.value)}>
                <option>Sangrur</option>
                <option>Patiala</option>
                <option>Malerkotla</option>
                <option>Barnala</option>
                <option>Chandigarh</option>
              </select>
            </label>
          </div>
          <label className="kl-field-full">Organisation<input type="text" value={org} onChange={e => setOrg(e.target.value)} /></label>
          <label className="kl-field-full">Account ID<input type="text" value={user?.employeeId || "KL-DEMO-001"} disabled /></label>
        </div>
      </div>

      {/* Activity feed */}
      <section className="kl-panel" style={{ marginBottom: 18 }}>
        <h3>Recent activity for {role}</h3>
        <p className="kl-sub">Last actions and events on the platform for this persona</p>
        <div className="kl-activity-feed">
          {activities.map((a, i) => (
            <div className="kl-activity-item" key={i}>
              <div className={`kl-activity-dot ${a.type}`}>{a.icon}</div>
              <div>
                <div className="kl-activity-text" dangerouslySetInnerHTML={{ __html: a.text }} />
                <div className="kl-activity-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Linked accounts */}
      <section className="kl-panel">
        <h3>Connected services</h3>
        <p className="kl-sub">External communication and operational channels</p>
        <div className="kl-security-item">
          <div className="kl-security-left">
            <div className="kl-security-icon green">📱</div>
            <div className="kl-security-text">
              <h4>KrishiLoop Mobile App (Android)</h4>
              <p>Linked · Last active 10 mins ago · GPS tracking enabled</p>
            </div>
          </div>
          <span className="kl-status-pill ok">✓ Connected</span>
        </div>
        <div className="kl-security-item">
          <div className="kl-security-left">
            <div className="kl-security-icon straw">💬</div>
            <div className="kl-security-text">
              <h4>WhatsApp Field Bot &amp; Alerts</h4>
              <p>{phone} · Instant pickup notices and receipts</p>
            </div>
          </div>
          <button className="secondary" onClick={() => notify?.("WhatsApp alerts refreshed.")}>Manage</button>
        </div>
        <div className="kl-security-item">
          <div className="kl-security-left">
            <div className="kl-security-icon blue">✉</div>
            <div className="kl-security-text">
              <h4>Email notifications</h4>
              <p>{email} · Weekly digests &amp; payment receipts</p>
            </div>
          </div>
          <span className="kl-status-pill ok">✓ Active</span>
        </div>
      </section>
    </>
  );
}
