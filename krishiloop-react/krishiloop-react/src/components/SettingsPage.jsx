import { useState } from "react";

const loginHistoryData = [
  { time: "02 Oct 2026, 9:00 AM", device: "Chrome / Windows", location: "Chandigarh", ok: true },
  { time: "01 Oct 2026, 6:30 PM", device: "KrishiLoop App / Android", location: "Sangrur", ok: true },
  { time: "29 Sep 2026, 8:10 AM", device: "Chrome / Windows", location: "Chandigarh", ok: true },
  { time: "24 Sep 2026, 11:45 PM", device: "Firefox / Windows", location: "Ludhiana", ok: false },
];

function Toggle({ checked = false, onChange, label }) {
  const [on, setOn] = useState(checked);
  return (
    <label className="kl-toggle" title={label}>
      <input type="checkbox" checked={on} onChange={e => { setOn(e.target.checked); onChange?.(e.target.checked); }} />
      <span className="kl-toggle-slider" />
    </label>
  );
}

function ToggleRow({ title, desc, checked = false, onToggle }) {
  return (
    <div className="kl-toggle-row">
      <div className="kl-toggle-info"><h4>{title}</h4><p>{desc}</p></div>
      <Toggle checked={checked} onChange={onToggle} />
    </div>
  );
}

export default function SettingsPage({ notify }) {
  const [tab, setTab] = useState("security");
  const [showPwForm, setShowPwForm] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [theme, setTheme] = useState("system");
  const [mapsKey, setMapsKey] = useState(() => localStorage.getItem("krishiloop_gmaps_key") || "");
  const [showKey, setShowKey] = useState(false);

  const pwScore = (() => {
    let sc = 0;
    if (pwNew.length >= 8) sc++;
    if (/[A-Z]/.test(pwNew)) sc++;
    if (/[0-9]/.test(pwNew)) sc++;
    if (/[^A-Za-z0-9]/.test(pwNew)) sc++;
    return sc;
  })();
  const pwLevels = [
    { pct: "25%", color: "var(--kl-red, #bf674f)", label: "Weak" },
    { pct: "50%", color: "var(--kl-gold, #c5922e)", label: "Fair" },
    { pct: "75%", color: "var(--kl-gold, #c5922e)", label: "Good" },
    { pct: "100%", color: "var(--kl-green)", label: "Strong" },
  ];
  const pwLevel = pwLevels[Math.max(pwScore - 1, 0)];

  const savePassword = () => {
    if (!pwCurrent || !pwNew || !pwConfirm) { notify?.("Please fill all password fields"); return; }
    if (pwNew !== pwConfirm) { notify?.("New passwords do not match"); return; }
    if (pwNew.length < 8) { notify?.("Password must be at least 8 characters"); return; }
    setShowPwForm(false);
    setPwCurrent(""); setPwNew(""); setPwConfirm("");
    notify?.("Password updated successfully");
  };

  const saveMapsKey = () => {
    if (!mapsKey.trim()) { notify?.("Please paste your Google Maps API key"); return; }
    localStorage.setItem("krishiloop_gmaps_key", mapsKey.trim());
    notify?.("Google Maps API Key saved. Reload Routes page to use it.");
  };

  const clearMapsKey = () => {
    localStorage.removeItem("krishiloop_gmaps_key");
    setMapsKey("");
    notify?.("Google Maps API key cleared.");
  };

  const handleTheme = (t, cls) => {
    setTheme(t);
    if (t === "dark") document.documentElement.classList.add("kl-dark-mode");
    else document.documentElement.classList.remove("kl-dark-mode");
    notify?.(`Switched to ${t} mode`);
  };

  const confirmDanger = (action) => {
    const isDel = action === "delete";
    if (window.confirm(isDel ? "Delete account permanently? This cannot be undone." : "Deactivate account? Data is kept for 90 days.")) {
      notify?.(isDel ? "Account deleted" : "Account deactivated");
    }
  };

  const tabs = [
    { id: "security", label: "🛡 Security" },
    { id: "notifications", label: "🔔 Notifications" },
    { id: "preferences", label: "☰ Preferences" },
    { id: "maps", label: "📍 Google Maps API" },
    { id: "danger", label: "⚠ Danger zone" },
  ];

  return (
    <>
      <header className="kl-heading">
        <div>
          <div className="kl-eyebrow">ACCOUNT</div>
          <h1>Account settings</h1>
          <p>Manage security, notifications and preferences</p>
        </div>
      </header>

      <div className="kl-settings-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`kl-settings-tab${tab === t.id ? " on" : ""}`} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {/* ===== SECURITY ===== */}
      {tab === "security" && (
        <>
          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <h3>Password &amp; authentication</h3>
            <p className="kl-sub">Keep your account secure with a strong password and two-factor auth</p>
            <div className="kl-security-item">
              <div className="kl-security-left">
                <div className="kl-security-icon green">🔒</div>
                <div className="kl-security-text"><h4>Password</h4><p>Last changed 45 days ago</p></div>
              </div>
              <button className="secondary" onClick={() => setShowPwForm(!showPwForm)}>Change password</button>
            </div>
            <div className="kl-security-item">
              <div className="kl-security-left">
                <div className="kl-security-icon straw">📱</div>
                <div className="kl-security-text"><h4>Two-factor authentication (2FA)</h4><p>Adds a second layer of protection on every login</p></div>
              </div>
              <Toggle label="Enable 2FA" onChange={on => notify?.(on ? "2FA enabled" : "2FA disabled")} />
            </div>
            <div className="kl-security-item">
              <div className="kl-security-left">
                <div className="kl-security-icon green">📞</div>
                <div className="kl-security-text"><h4>Phone number (OTP backup)</h4><p>+91 98760 12345 · Verified</p></div>
              </div>
              <span className="kl-status-pill ok">✓ Verified</span>
            </div>
          </section>

          {showPwForm && (
            <section className="kl-panel" style={{ marginBottom: 18 }}>
              <h3>Change password</h3>
              <p className="kl-sub">Use a strong, unique password that you don't use elsewhere</p>
              <label className="kl-field-full">Current password<input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder="Enter current password" /></label>
              <div className="kl-form-pair">
                <label>New password<input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Min. 8 characters" /></label>
                <label>Confirm new password<input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Repeat new password" /></label>
              </div>
              <div className="kl-pw-strength">
                <small>Password strength</small>
                <div className="kl-pw-bar"><div style={{ width: pwNew.length ? pwLevel.pct : "0%", background: pwNew.length ? pwLevel.color : "var(--kl-line)" }} /></div>
                {pwNew.length > 0 && <small style={{ color: pwLevel.color }}>{pwLevel.label}</small>}
              </div>
              <div className="kl-form-actions">
                <button className="primary" onClick={savePassword}>Update password</button>
                <button className="secondary" onClick={() => setShowPwForm(false)}>Cancel</button>
              </div>
            </section>
          )}

          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <h3>Active sessions</h3>
            <p className="kl-sub">Devices currently logged in to your account</p>
            <div className="kl-security-item">
              <div className="kl-security-left">
                <div className="kl-security-icon green">💻</div>
                <div className="kl-security-text"><h4>Chrome on Windows · <span style={{ color: "var(--kl-green)", fontSize: 12 }}>● Current</span></h4><p>Chandigarh, India · Active now</p></div>
              </div>
              <span className="kl-status-pill ok">This device</span>
            </div>
            <div className="kl-security-item">
              <div className="kl-security-left">
                <div className="kl-security-icon straw">📱</div>
                <div className="kl-security-text"><h4>KrishiLoop App on Android</h4><p>Sangrur, India · 2 hours ago</p></div>
              </div>
              <button className="kl-btn-danger" onClick={() => notify?.("Session revoked")}>Revoke</button>
            </div>
            <div className="kl-security-item">
              <div className="kl-security-left">
                <div className="kl-security-icon red">💻</div>
                <div className="kl-security-text"><h4>Firefox on Windows</h4><p>Ludhiana, India · 5 days ago</p></div>
              </div>
              <button className="kl-btn-danger" onClick={() => notify?.("Session revoked")}>Revoke</button>
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="kl-btn-danger" onClick={() => notify?.("All other sessions revoked")}>Sign out all other devices</button>
            </div>
          </section>

          <section className="kl-panel">
            <h3>Login history</h3>
            <p className="kl-sub">Recent sign-in activity on your account</p>
            <div className="kl-table-scroll">
              <table className="kl-table" style={{ minWidth: 400 }}>
                <thead><tr><th>DATE &amp; TIME</th><th>DEVICE</th><th>LOCATION</th><th>STATUS</th></tr></thead>
                <tbody>
                  {loginHistoryData.map((l, i) => (
                    <tr key={i}>
                      <td>{l.time}</td><td>{l.device}</td><td>{l.location}</td>
                      <td><span className={`kl-status-pill ${l.ok ? "ok" : "danger"}`}>{l.ok ? "✓ Success" : "⚠ Failed"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ===== NOTIFICATIONS ===== */}
      {tab === "notifications" && (
        <>
          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <h3>Email notifications</h3>
            <p className="kl-sub">Choose what emails you receive from KrishiLoop</p>
            <ToggleRow title="New lot listings" desc="When a farmer in your district lists a new residue lot" checked onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="Collection schedule updates" desc="Reminders and changes to planned pickup routes" checked onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="Match confirmed" desc="When a processor confirms a lot match" checked onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="Payment releases" desc="When a payment to a farmer is processed" onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="Weekly digest" desc="Summary of your district's activity every Monday" checked onToggle={() => notify?.("Preference saved")} />
          </section>
          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <h3>Push &amp; SMS notifications</h3>
            <p className="kl-sub">Real-time alerts for time-sensitive actions</p>
            <ToggleRow title="Push notifications (App)" desc="Immediate in-app alerts for critical events" checked onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="SMS alerts" desc="Text messages for pickup reminders" onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="WhatsApp updates" desc="Status updates via WhatsApp Business" onToggle={() => notify?.("Preference saved")} />
          </section>
          <section className="kl-panel">
            <h3>Quiet hours</h3>
            <p className="kl-sub">Silence non-critical notifications during these hours</p>
            <div className="kl-form-pair">
              <label>From<input type="time" defaultValue="22:00" onChange={() => notify?.("Quiet hours updated")} /></label>
              <label>To<input type="time" defaultValue="07:00" onChange={() => notify?.("Quiet hours updated")} /></label>
            </div>
            <button className="primary" style={{ marginTop: 12 }} onClick={() => notify?.("Quiet hours saved")}>Save quiet hours</button>
          </section>
        </>
      )}

      {/* ===== PREFERENCES ===== */}
      {tab === "preferences" && (
        <>
          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <h3>Appearance</h3>
            <p className="kl-sub">Choose how KrishiLoop looks on your device</p>
            <div className="kl-pref-grid">
              {["system", "light", "dark"].map(t => (
                <button key={t} className={`kl-pref-option${theme === t ? " on" : ""}`} onClick={() => handleTheme(t)}>
                  {t === "system" ? "☀" : t === "light" ? "🌤" : "🌙"}
                  <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                </button>
              ))}
            </div>
          </section>
          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <h3>Language &amp; region</h3>
            <p className="kl-sub">Display language and number formats</p>
            <div className="kl-form-pair">
              <label>Language<select onChange={() => notify?.("Language preference saved")}><option>English (India)</option><option>ਪੰਜਾਬੀ (Punjabi)</option><option>हिन्दी (Hindi)</option></select></label>
              <label>Time zone<select onChange={() => notify?.("Timezone saved")}><option>IST (UTC+5:30)</option><option>UTC</option></select></label>
            </div>
            <div className="kl-form-pair">
              <label>Weight unit<select onChange={() => notify?.("Unit preference saved")}><option>Tonnes (t)</option><option>Quintals (q)</option><option>Kilograms (kg)</option></select></label>
              <label>Date format<select onChange={() => notify?.("Date format saved")}><option>DD MMM YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></label>
            </div>
            <button className="primary" style={{ marginTop: 12 }} onClick={() => notify?.("Language & region saved")}>Save preferences</button>
          </section>
          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <h3>Dashboard defaults</h3>
            <p className="kl-sub">Customise what you see when you log in</p>
            <ToggleRow title="Show loop summary on load" desc="Display the residue loop stages at the top" checked onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="Auto-scroll to my district" desc="Focus the chart on Sangrur by default" checked onToggle={() => notify?.("Preference saved")} />
            <ToggleRow title="Show collection route on load" desc="Expand the cluster map immediately" onToggle={() => notify?.("Preference saved")} />
          </section>
          <section className="kl-panel">
            <h3>Data &amp; privacy</h3>
            <p className="kl-sub">Control how your data is used</p>
            <ToggleRow title="Share usage analytics" desc="Help improve KrishiLoop by sharing anonymous usage data" checked onToggle={() => notify?.("Privacy preference saved")} />
            <ToggleRow title="Location tracking (field mode)" desc="Enable GPS during active collection routes" onToggle={() => notify?.("Location preference saved")} />
            <div style={{ marginTop: 16 }}>
              <button className="secondary" onClick={() => notify?.("Data export requested — you will receive an email")}>Export my data</button>
            </div>
          </section>
        </>
      )}

      {/* ===== GOOGLE MAPS API ===== */}
      {tab === "maps" && (
        <>
          <section className="kl-panel" style={{ marginBottom: 18 }}>
            <div className="kl-panel-title" style={{ marginBottom: 14 }}>
              <div>
                <h3>Google Maps Platform Configuration</h3>
                <p className="kl-sub" style={{ margin: 0 }}>Manage API keys and integration status for Maps, Routes, Places, and Geocoding.</p>
              </div>
              <span className={`kl-pill ${mapsKey ? "kl-pill-live" : ""}`}>{mapsKey ? "✓ Key Configured" : "⚙ Key Not Configured"}</span>
            </div>

            <div className="kl-maps-key-box">
              <label className="kl-field-full" style={{ marginBottom: 8 }}>
                <small>GOOGLE MAPS API KEY</small>
                <div className="kl-key-input-wrap">
                  <input type={showKey ? "text" : "password"} value={mapsKey} onChange={e => setMapsKey(e.target.value)} placeholder="AIzaSy..." autoComplete="off" spellCheck="false" style={{ fontFamily: "monospace" }} />
                  <button className="secondary" onClick={() => setShowKey(!showKey)}>{showKey ? "Hide" : "Show"}</button>
                  <button className="primary" onClick={saveMapsKey}>Save &amp; Connect</button>
                  <button className="secondary" onClick={clearMapsKey}>Clear Key</button>
                </div>
              </label>
              <p className="kl-sub" style={{ margin: "4px 0 0" }}>The API key is securely saved in your browser's local storage and used for client-side Google Maps SDK calls.</p>
            </div>

            <h4 style={{ margin: "18px 0 12px", fontSize: 15 }}>Enabled Google Maps APIs</h4>
            <div className="kl-gmap-grid">
              {[
                { name: "Maps JavaScript API", desc: "Renders the interactive 2D collection cluster map, satellite imagery toggle, and custom farm waypoint markers.", detail: "✓ Dynamic zoom, pan, and cluster rendering" },
                { name: "Directions API", desc: "Computes multi-stop driving directions between farm stops and the processing depot.", detail: "✓ Road km, live drive duration & route optimization" },
                { name: "Places API / Places SDK", desc: "Powers real-time village and farm location autocomplete in the Add Residue Listing dialog.", detail: "✓ Place details, postal components & formatted addresses" },
                { name: "Geocoding API", desc: "Converts village names to GPS coordinates and handles reverse-geocoding on map clicks.", detail: "✓ Village-to-LatLng & reverse location lookup" },
              ].map(api => (
                <div className="kl-gmap-card" key={api.name}>
                  <h4 style={{ display: "flex", justifyContent: "space-between", margin: "0 0 4px", fontSize: 14 }}>
                    <span>{api.name}</span>
                    <span className={`kl-pill ${mapsKey ? "kl-pill-live" : ""}`} style={{ fontSize: 9 }}>{mapsKey ? "Live / Active" : "Ready / Demo"}</span>
                  </h4>
                  <p className="kl-sub" style={{ margin: "0 0 8px", lineHeight: 1.4 }}>{api.desc}</p>
                  <div style={{ fontSize: 11, color: "var(--kl-green)", fontWeight: 600 }}>{api.detail}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="kl-panel">
            <h3>Google Cloud Setup Instructions</h3>
            <p className="kl-sub">How to obtain and restrict your Google Maps API key</p>
            <ol className="kl-setup-list">
              <li>Open the <a href="https://console.cloud.google.com/google/maps-apis/credentials" target="_blank" rel="noopener" style={{ color: "var(--kl-green)", fontWeight: 600 }}>Google Cloud Console → Credentials</a>.</li>
              <li>Create or select your project and click <b>+ Create Credentials → API key</b>.</li>
              <li>Enable the following 4 APIs: <b>Maps JavaScript API</b>, <b>Places API</b>, <b>Directions API</b>, and <b>Geocoding API</b>.</li>
              <li><b>Security Best Practice:</b> Restrict the key to HTTP referrers (e.g. your domain or <code>localhost/*</code>).</li>
              <li>Under <em>API restrictions</em>, restrict the key to only the 4 APIs listed above.</li>
            </ol>
            <div className="kl-note" style={{ marginTop: 14 }}>
              <b>Note on Billing:</b> Usage of Google Maps Platform may incur costs. For zero-cost prototyping, Google provides free monthly credits or a Maps Demo Key.
            </div>
          </section>
        </>
      )}

      {/* ===== DANGER ZONE ===== */}
      {tab === "danger" && (
        <section className="kl-panel kl-danger-panel">
          <h3 style={{ color: "var(--kl-red, #bf674f)" }}>Danger zone</h3>
          <p className="kl-sub">These actions are irreversible. Please proceed with caution.</p>
          <div className="kl-security-item">
            <div><h4>Deactivate account</h4><p className="kl-sub" style={{ margin: 0 }}>Temporarily suspend your account. Data is kept for 90 days.</p></div>
            <button className="secondary" onClick={() => confirmDanger("deactivate")}>Deactivate</button>
          </div>
          <div className="kl-security-item">
            <div><h4>Transfer account ownership</h4><p className="kl-sub" style={{ margin: 0 }}>Assign your lots and farmers to another coordinator.</p></div>
            <button className="secondary" onClick={() => notify?.("Contact support to transfer ownership")}>Request transfer</button>
          </div>
          <div className="kl-security-item" style={{ borderBottom: 0 }}>
            <div><h4 style={{ color: "var(--kl-red, #bf674f)" }}>Delete account permanently</h4><p className="kl-sub" style={{ margin: 0 }}>All your data, lots and history will be erased. This cannot be undone.</p></div>
            <button className="kl-btn-danger" onClick={() => confirmDanger("delete")}>Delete account</button>
          </div>
        </section>
      )}
    </>
  );
}
