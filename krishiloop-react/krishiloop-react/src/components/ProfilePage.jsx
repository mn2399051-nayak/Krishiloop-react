import { useState } from "react";

const activityData = [
  { type: "green", icon: "✓", text: 'Added <b>L-106</b> lot for Sukhdev Singh (7.4 t, Malerkotla)', time: "Today, 9:14 AM" },
  { type: "straw", icon: "📈", text: 'Updated collection route for <b>Sangrur cluster</b> — added stop at Lehragaga', time: "Yesterday, 4:32 PM" },
  { type: "blue", icon: "🔔", text: 'Matched <b>L-104</b> (Jasmeet Kaur) to Sangrur Biomass Pellets — score 89', time: "Yesterday, 11:05 AM" },
  { type: "green", icon: "✓", text: 'Marked <b>L-101</b> as Processed — payment released to Gurpreet Singh', time: "3 days ago, 2:18 PM" },
  { type: "blue", icon: "🔔", text: 'Submitted <b>weekly digest</b> for Sangrur to admin', time: "4 days ago, 9:00 AM" },
];

export default function ProfilePage({ user, notify }) {
  const emailName = user?.email?.split("@")[0] || "Demo User";
  const nameParts = emailName.split(/[.\-_]/);
  const defaultFirst = nameParts[0]?.charAt(0).toUpperCase() + (nameParts[0]?.slice(1) || "");
  const defaultLast = nameParts.length > 1 ? nameParts[1]?.charAt(0).toUpperCase() + (nameParts[1]?.slice(1) || "") : "";

  const [firstName, setFirstName] = useState(defaultFirst || "Gurpreet");
  const [lastName, setLastName] = useState(defaultLast || "Singh");
  const [phone, setPhone] = useState("+91 98760 12345");
  const [email, setEmail] = useState(user?.email || "gurpreet.s@krishiloop.in");
  const [bio, setBio] = useState("Covering Sangrur and surrounding blocks since 2024. Specialised in paddy straw collection logistics.");
  const [role, setRole] = useState(user?.role || "Field Coordinator");
  const [district, setDistrict] = useState("Sangrur");
  const [org, setOrg] = useState("KrishiLoop Pvt. Ltd.");

  const initials = `${firstName[0] || ""}${lastName[0] || ""}`;
  const fullName = `${firstName} ${lastName}`;

  const saveProfile = () => {
    notify?.("Profile saved successfully");
  };

  return (
    <>
      <header className="kl-heading">
        <div>
          <div className="kl-eyebrow">YOUR PROFILE</div>
          <h1>My Profile</h1>
          <p>Manage your personal information and activity</p>
        </div>
        <button className="primary" onClick={saveProfile}>Save changes</button>
      </header>

      {/* Hero */}
      <div className="kl-profile-hero">
        <div className="kl-profile-avatar-wrap">
          <div className="kl-profile-avatar-lg">{initials}</div>
        </div>
        <div className="kl-profile-hero-info">
          <h2>{fullName}</h2>
          <p>{role} · {district} district</p>
          <div className="kl-profile-badges">
            <span className="kl-badge">✓ Verified</span>
            <span className="kl-badge">🛡 {role}</span>
            <span className="kl-badge">📅 Member since Oct 2024</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="kl-stat-row">
        <div className="kl-stat-card"><b>38</b><span>Farmers onboarded</span></div>
        <div className="kl-stat-card"><b>186 t</b><span>Residue listed this season</span></div>
        <div className="kl-stat-card"><b>81%</b><span>Collection completion rate</span></div>
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
          <h3>Work information</h3>
          <p className="kl-sub">Role, district coverage and organisation</p>
          <label className="kl-field-full">Role
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option>Farmer</option><option>Collector</option><option>Processor</option><option>Buyer</option><option>Admin</option><option>Field Coordinator</option>
            </select>
          </label>
          <label className="kl-field-full">Primary district
            <select value={district} onChange={e => setDistrict(e.target.value)}>
              <option>Sangrur</option><option>Patiala</option><option>Malerkotla</option><option>Barnala</option>
            </select>
          </label>
          <label className="kl-field-full">Organisation<input type="text" value={org} onChange={e => setOrg(e.target.value)} /></label>
          <label className="kl-field-full">Employee ID<input type="text" value="KL-FC-007" disabled /></label>
        </div>
      </div>

      {/* Activity feed */}
      <section className="kl-panel" style={{ marginBottom: 18 }}>
        <h3>Recent activity</h3>
        <p className="kl-sub">Your last actions on the platform</p>
        <div className="kl-activity-feed">
          {activityData.map((a, i) => (
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
        <h3>Linked accounts</h3>
        <p className="kl-sub">Connect external services for faster access</p>
        <div className="kl-security-item">
          <div className="kl-security-left">
            <div className="kl-security-icon green">📱</div>
            <div className="kl-security-text"><h4>KrishiLoop Mobile App</h4><p>Linked · Last active 2 hours ago</p></div>
          </div>
          <span className="kl-status-pill ok">✓ Connected</span>
        </div>
        <div className="kl-security-item">
          <div className="kl-security-left">
            <div className="kl-security-icon straw">📞</div>
            <div className="kl-security-text"><h4>WhatsApp Business</h4><p>Receive field alerts via WhatsApp</p></div>
          </div>
          <button className="secondary" onClick={() => notify?.("WhatsApp linked successfully!")}>Link</button>
        </div>
        <div className="kl-security-item">
          <div className="kl-security-left">
            <div className="kl-security-icon blue">✉</div>
            <div className="kl-security-text"><h4>Email notifications</h4><p>{email} · Active</p></div>
          </div>
          <span className="kl-status-pill ok">✓ Active</span>
        </div>
      </section>
    </>
  );
}
