import { useState, useMemo } from "react";

export default function AdminDashboard({
  activeAccount,
  lots = [],
  demands = [],
  records = [],
  jobs = [],
  loading = false,
  onNavigate,
  notify
}) {
  const [activeQueueTab, setActiveQueueTab] = useState("kyc"); // "kyc" | "issues" | "moderation"
  const [activeViewSection, setActiveViewSection] = useState("workbench"); // "workbench" | "ledger" | "surveillance"
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);

  // Selected item in the Inspector Workbench (defaults to first KYC applicant)
  const [selectedKycAppId, setSelectedKycAppId] = useState("kyc-app-101");
  const [selectedIssueId, setSelectedIssueId] = useState("ISS-401");
  const [selectedModId, setSelectedModId] = useState("MOD-LOT-105");

  // Pending KYC Queue state
  const [kycQueue, setKycQueue] = useState([
    {
      id: "kyc-app-101",
      name: "Sukhdev Singh",
      role: "Farmer",
      phone: "+91 98765 22110",
      district: "Sangrur",
      village: "Sherpur",
      idType: "Aadhaar Card",
      idNumber: "XXXX-XXXX-8921",
      submittedAt: "Today, 10:15 AM",
      status: "Pending",
      documentName: "aadhaar_card_sukhdev.pdf",
      satelliteParcels: "Parcel #12 & #14 (Sherpur East) · 18.4 acres",
      thermalStatus: "Zero Anomalies Verified (Pass #482)"
    },
    {
      id: "kyc-app-102",
      name: "Bikramjeet Transports",
      role: "Collector",
      phone: "+91 98140 66778",
      district: "Patiala",
      village: "Nabha",
      idType: "Commercial Fleet License",
      idNumber: "PB-11-COMM-4412",
      submittedAt: "Yesterday, 3:30 PM",
      status: "Pending",
      documentName: "fleet_license_nabha.pdf",
      satelliteParcels: "Depot Longowal & Lehragaga",
      thermalStatus: "6 Mechanized Balers GPS-tracked"
    },
    {
      id: "kyc-app-103",
      name: "Malwa Bio-Energy Depot",
      role: "Buyer",
      phone: "+91 99881 33445",
      district: "Malerkotla",
      village: "Amargarh",
      idType: "GSTIN Certificate",
      idNumber: "03AABCM9412R1Z8",
      submittedAt: "2 days ago, 11:00 AM",
      status: "Pending",
      documentName: "gstin_certificate_amargarh.pdf",
      satelliteParcels: "Industrial Pellet Facility Amargarh",
      thermalStatus: "Continuous Thermal Monitoring Active"
    }
  ]);

  // Flagged Issues Moderation
  const [flaggedIssues, setFlaggedIssues] = useState([
    {
      id: "ISS-401",
      title: "Moisture Reading Discrepancy on Lot L-102",
      lotId: "L-102",
      reportedBy: "Sangrur Biomass Pellets (Sunil Jain)",
      farmer: "Jasmeet Kaur (Dhuri)",
      type: "Quality / Moisture Dispute",
      description: "Field listing claimed 12.0% moisture; weighbridge lab probe detected 15.8% after morning rain. Adjusted tonnage requested.",
      severity: "Medium",
      status: "Investigating",
      createdAt: "Today, 8:30 AM",
      fieldEvidence: "Depot probe calibrated at 15.6% avg moisture across 14 bales."
    },
    {
      id: "ISS-402",
      title: "Baler Trolley Weighbridge Tare Check",
      lotId: "J-201",
      reportedBy: "Malwa Fleet Aggregator",
      farmer: "Gurpreet Singh (Dhuri)",
      type: "Logistics Calibration",
      description: "Scale recalibration at depot entrance verified 0.2 t tare variation. Approved for standard tolerance adjustment.",
      severity: "Low",
      status: "Open",
      createdAt: "Yesterday, 4:10 PM",
      fieldEvidence: "Tare slip WB-SAN-4820 recorded 4.8 t empty trolley."
    }
  ]);

  // Listing Moderation Queue
  const [moderationQueue, setModerationQueue] = useState([
    {
      id: "MOD-LOT-105",
      lotId: "L-105",
      type: "Produce Listing",
      farmer: "Jasmeet Kaur",
      village: "Dhuri",
      crop: "Paddy straw (18.0 t)",
      price: 1850,
      zeroBurnRisk: "Low (Satellite Clear)",
      flagReason: "High moisture report from nearby weather sensor (14.8%)",
      status: "Pending Review",
      submittedAt: "Today, 09:40 AM"
    },
    {
      id: "MOD-LOT-106",
      lotId: "L-106",
      type: "Produce Listing",
      farmer: "Harinder Singh",
      village: "Bhawanigarh",
      crop: "Wheat straw (22.5 t)",
      price: 1800,
      zeroBurnRisk: "Verified Clear",
      flagReason: "First-time farm parcel registration; requires perimeter verification",
      status: "Pending Review",
      submittedAt: "Yesterday, 05:15 PM"
    }
  ]);

  // State Ecosystem Transactions ledger
  const transactions = useMemo(() => [
    {
      id: "TXN-PB-901",
      beneficiary: "Gurpreet Singh",
      role: "Farmer (Residue Producer)",
      category: "DBT Stubble Diverted Incentive",
      tonnes: 15.0,
      amount: 22500,
      bankRef: "SBI-DBT-4891240",
      date: "12 Oct 2026, 09:30 AM",
      status: "Settled"
    },
    {
      id: "TXN-PB-902",
      beneficiary: "Malwa Bio-Logistics Fleet Ltd.",
      role: "Collector / Transporter",
      category: "Mechanized Baler Cluster Subsidy",
      tonnes: 32.4,
      amount: 16200,
      bankRef: "HDFC-LOG-119420",
      date: "11 Oct 2026, 04:15 PM",
      status: "Settled"
    },
    {
      id: "TXN-PB-903",
      beneficiary: "Patiala Paper Board Mill",
      role: "Commercial Offtaker",
      category: "Feedstock Purchase Settlement",
      tonnes: 24.5,
      amount: 44100,
      bankRef: "ICICI-PRC-88190",
      date: "10 Oct 2026, 02:00 PM",
      status: "Settled"
    },
    {
      id: "TXN-PB-904",
      beneficiary: "Sukhdev Singh",
      role: "Farmer (Residue Producer)",
      category: "DBT Direct Bank Transfer",
      tonnes: 8.0,
      amount: 12000,
      bankRef: "PNB-DBT-99201",
      date: "Today, 11:20 AM",
      status: "Processing"
    }
  ], []);

  // Real-time Activity Telemetry
  const activityLog = useMemo(() => [
    { id: 1, time: "Just now", icon: "🛰", title: "Sentinel-2 Satellite Pass Verified", text: "Thermal scan over Sangrur, Dhuri & Malerkotla: 0 stubble fires detected (100% Zero-Burn compliance)." },
    { id: 2, time: "15 mins ago", icon: "✓", title: "Aadhaar e-KYC Approved", text: "State Officer approved Aadhaar e-KYC credentials for user Harinder Singh (Farmer, Dhuri)." },
    { id: 3, time: "1 hour ago", icon: "⚖", title: "Digital Weighbridge Slip Logged", text: "Tractor PB-13-X-4921 delivered 14.2 tonnes of paddy straw to Sangrur Biomass Pellets." },
    { id: 4, time: "3 hours ago", icon: "⚡", title: "DBT Payout Batch Dispatched", text: "State Treasury released batch ₹2.4 Lakhs in Direct Benefit Transfers to 8 certified zero-burn farmers." }
  ], []);

  // Selected item references
  const currentKycApp = kycQueue.find(a => a.id === selectedKycAppId) || kycQueue[0];
  const currentIssue = flaggedIssues.find(i => i.id === selectedIssueId) || flaggedIssues[0];
  const currentMod = moderationQueue.find(m => m.id === selectedModId) || moderationQueue[0];

  // Actions
  const handleApproveKyc = (appId) => {
    setKycQueue(prev => prev.map(a => a.id === appId ? { ...a, status: "Verified" } : a));
    notify?.(`e-KYC application ${appId} approved by State Officer.`);
  };

  const handleRejectKyc = (appId) => {
    const reason = window.prompt("Reason for KYC rejection / resubmission:", "Mismatched ID proof details or unreadable document scan");
    if (reason) {
      setKycQueue(prev => {
        const next = prev.filter(a => a.id !== appId);
        if (selectedKycAppId === appId && next.length > 0) {
          setSelectedKycAppId(next[0].id);
        }
        return next;
      });
      notify?.(`Application ${appId} sent back for resubmission.`);
    }
  };

  const handleResolveIssue = (issueId) => {
    setFlaggedIssues(prev => prev.map(iss => iss.id === issueId ? { ...iss, status: "Resolved" } : iss));
    notify?.(`Issue ${issueId} resolved and logged in state audit archive.`);
  };

  const handleApproveModeration = (modId) => {
    setModerationQueue(prev => prev.map(m => m.id === modId ? { ...m, status: "Approved" } : m));
    notify?.(`Item ${modId} approved for public marketplace listing.`);
  };

  const pendingCount = kycQueue.filter(a => a.status === "Pending").length;
  const openIssuesCount = flaggedIssues.filter(i => i.status !== "Resolved").length;
  const pendingModCount = moderationQueue.filter(m => m.status === "Pending Review").length;

  if (loading) {
    return (
      <div className="kl-dashboard-loading" role="status">
        <div className="kl-skeleton-hero" />
        <div className="kl-skeleton-metrics">
          <div className="kl-skeleton-card" />
          <div className="kl-skeleton-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kl-dashboard-error" role="alert">
        <div className="kl-error-icon">⚠</div>
        <h3>Failed to load administrator telemetry</h3>
        <p>{error}</p>
        <button className="primary" onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="kl-admin-portal">
      {/* 1. ADMIN BESPOKE TOP STATUS: SATELLITE & DIRECTIVE SURVEILLANCE TELEMETRY */}
      <div className="kl-admin-surveillance-banner">
        <div className="kl-admin-satellite-indicator">
          <span className="kl-admin-sat-radar-icon">🛰</span>
          <div>
            <b>SENTINEL-2 L2A &amp; SAC THERMAL SATELLITE GRID</b>
            <small>Orbit: Synchronized · Resolution: 10m Multispectral · Revisit: 5 days</small>
          </div>
        </div>
        <div className="kl-admin-telemetry-stats">
          <span className="kl-admin-stat-item"><b>0</b> Thermal Anomalies</span>
          <span className="kl-admin-stat-item"><b style={{ color: "var(--kl-green)" }}>100%</b> Zero-Burn</span>
          <span className="kl-admin-stat-item"><b>148</b> Audited Accounts</span>
          <span className="kl-admin-stat-item"><b style={{ color: "var(--kl-gold)" }}>₹2.4L</b> DBT Batch</span>
        </div>
      </div>

      {/* 2. ADMIN BESPOKE STATE COMMAND HEADER */}
      <section className="kl-admin-command-header">
        <div className="kl-admin-header-title-block">
          <div className="kl-admin-seal-badge">
            <span className="kl-admin-seal-icon">🛡</span>
            <span>GOVERNMENT OF PUNJAB · AGRI CIRCULAR ECONOMY DIRECTIVE</span>
          </div>
          <h2>State Operations Command &amp; Regulatory Oversight</h2>
          <p>
            Central regulatory console managing participant e-KYC credentials, weighbridge dispute arbitration, pre-market listing compliance, and state DBT disbursements.
          </p>
          <div className="kl-admin-officer-meta">
            <span>👤 Nodal Officer: <b>{activeAccount.name}</b> (IAS)</span>
            <span>🏛 Punjab Agri Directorate, Chandigarh</span>
            <span>🔒 Cryptographic Audit Trail Active</span>
          </div>
        </div>

        <div className="kl-admin-header-actions">
          <button
            type="button"
            className="kl-admin-export-audit-btn"
            onClick={() => {
              const rows = [["Txn ID", "Beneficiary", "Role", "Tonnes", "Amount", "Status"], ...transactions.map(t => [t.id, t.beneficiary, t.role, t.tonnes, t.amount, t.status])];
              const csv = rows.map(r => r.join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "punjab-dbt-state-audit.csv";
              a.click();
              notify?.("State DBT and residue audit report exported.");
            }}
          >
            ↓ Export State Audit CSV
          </button>
        </div>
      </section>

      {/* 3. ADMIN BESPOKE SECTION SWITCHER */}
      <div className="kl-admin-section-tabs">
        <button
          type="button"
          className={`kl-admin-section-tab ${activeViewSection === "workbench" ? "active" : ""}`}
          onClick={() => setActiveViewSection("workbench")}
        >
          ⚔ Operations Workbench (Queues &amp; Dossiers)
        </button>
        <button
          type="button"
          className={`kl-admin-section-tab ${activeViewSection === "ledger" ? "active" : ""}`}
          onClick={() => setActiveViewSection("ledger")}
        >
          💳 State DBT Financial Ledger ({transactions.length})
        </button>
        <button
          type="button"
          className={`kl-admin-section-tab ${activeViewSection === "surveillance" ? "active" : ""}`}
          onClick={() => setActiveViewSection("surveillance")}
        >
          📡 Live Satellite &amp; Depot Activity Stream
        </button>
      </div>

      {/* ================= VIEW 1: DUAL-PANE OPERATIONS WORKBENCH ================= */}
      {activeViewSection === "workbench" && (
        <div className="kl-admin-dual-pane-workbench">
          {/* LEFT PANE: QUEUE TRIAGE LIST */}
          <div className="kl-admin-queue-pane">
            {/* Triage Queue Sub-tabs */}
            <div className="kl-admin-triage-tabs">
              <button
                type="button"
                className={`kl-triage-tab ${activeQueueTab === "kyc" ? "active" : ""}`}
                onClick={() => setActiveQueueTab("kyc")}
              >
                e-KYC Queue ({pendingCount})
              </button>
              <button
                type="button"
                className={`kl-triage-tab ${activeQueueTab === "issues" ? "active" : ""}`}
                onClick={() => setActiveQueueTab("issues")}
              >
                Disputes ({openIssuesCount})
              </button>
              <button
                type="button"
                className={`kl-triage-tab ${activeQueueTab === "moderation" ? "active" : ""}`}
                onClick={() => setActiveQueueTab("moderation")}
              >
                Moderation ({pendingModCount})
              </button>
            </div>

            {/* QUEUE 1: PENDING KYC QUEUE */}
            {activeQueueTab === "kyc" && (
              <div className="kl-admin-queue-list">
                {kycQueue.map(app => {
                  const isSelected = app.id === selectedKycAppId;
                  return (
                    <div
                      key={app.id}
                      className={`kl-admin-queue-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedKycAppId(app.id)}
                    >
                      <div className="kl-queue-card-top">
                        <b>{app.name}</b>
                        <span className={`kl-status-badge ${app.status === "Verified" ? "verified" : "pending"}`}>
                          {app.status === "Verified" ? "Verified ✓" : "Pending"}
                        </span>
                      </div>
                      <div className="kl-queue-card-meta">
                        <span>Role: {app.role} · 📍 {app.village}, {app.district}</span>
                        <small>{app.idType}: {app.idNumber}</small>
                      </div>
                      <div className="kl-queue-card-foot">
                        <small>Submitted: {app.submittedAt}</small>
                        {isSelected && <span className="kl-inspecting-tag">Viewing in Dossier ➔</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* QUEUE 2: FLAGGED DISPUTES QUEUE */}
            {activeQueueTab === "issues" && (
              <div className="kl-admin-queue-list">
                {flaggedIssues.map(iss => {
                  const isSelected = iss.id === selectedIssueId;
                  return (
                    <div
                      key={iss.id}
                      className={`kl-admin-queue-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedIssueId(iss.id)}
                    >
                      <div className="kl-queue-card-top">
                        <b>{iss.title}</b>
                        <span className={`kl-status ${iss.status === "Resolved" ? "Processed" : "Listed"}`}>{iss.status}</span>
                      </div>
                      <div className="kl-queue-card-meta">
                        <span>Reported by: {iss.reportedBy}</span>
                        <small>Severity: {iss.severity} · {iss.type}</small>
                      </div>
                      <div className="kl-queue-card-foot">
                        <small>{iss.createdAt}</small>
                        {isSelected && <span className="kl-inspecting-tag">Viewing in Dossier ➔</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* QUEUE 3: LISTING MODERATION QUEUE */}
            {activeQueueTab === "moderation" && (
              <div className="kl-admin-queue-list">
                {moderationQueue.map(m => {
                  const isSelected = m.id === selectedModId;
                  return (
                    <div
                      key={m.id}
                      className={`kl-admin-queue-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedModId(m.id)}
                    >
                      <div className="kl-queue-card-top">
                        <b>{m.crop}</b>
                        <span className={`kl-status ${m.status === "Approved" ? "Processed" : "Listed"}`}>{m.status}</span>
                      </div>
                      <div className="kl-queue-card-meta">
                        <span>Origin: {m.farmer} ({m.village})</span>
                        <small>Compliance: {m.zeroBurnRisk}</small>
                      </div>
                      <div className="kl-queue-card-foot">
                        <small>{m.submittedAt}</small>
                        {isSelected && <span className="kl-inspecting-tag">Viewing in Dossier ➔</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT PANE: ACTIVE INSPECTION DOSSIER WORKBENCH */}
          <div className="kl-admin-dossier-pane">
            {activeQueueTab === "kyc" && (
              currentKycApp ? (
                <div className="kl-admin-dossier-card">
                  <div className="kl-dossier-header">
                    <div>
                      <span className="kl-dossier-label">GOVERNMENT IDENTITY AUDIT DOSSIER</span>
                      <h3>{currentKycApp.name} ({currentKycApp.role})</h3>
                      <small>Application ID: <code>{currentKycApp.id}</code> · Submitted: {currentKycApp.submittedAt}</small>
                    </div>
                    <span className={`kl-status-badge ${currentKycApp.status === "Verified" ? "verified" : "pending"}`}>
                      {currentKycApp.status === "Verified" ? "Verified ✓" : "Pending Officer Decision"}
                    </span>
                  </div>

                  <div className="kl-dossier-details-grid">
                    <div className="kl-dossier-field">
                      <small>ID PROOF TYPE</small>
                      <b>{currentKycApp.idType}</b>
                    </div>
                    <div className="kl-dossier-field">
                      <small>MASKED IDENTITY NUMBER</small>
                      <code>{currentKycApp.idNumber}</code>
                    </div>
                    <div className="kl-dossier-field">
                      <small>MOBILE &amp; OTP VERIFICATION</small>
                      <b>{currentKycApp.phone} (OTP Confirmed ✓)</b>
                    </div>
                    <div className="kl-dossier-field">
                      <small>RESIDENTIAL CLUSTER</small>
                      <b>{currentKycApp.village}, {currentKycApp.district}, Punjab</b>
                    </div>
                    <div className="kl-dossier-field" style={{ gridColumn: "1 / -1" }}>
                      <small>FARM PARCEL SATELLITE REGISTRY</small>
                      <span>{currentKycApp.satelliteParcels}</span>
                    </div>
                    <div className="kl-dossier-field" style={{ gridColumn: "1 / -1" }}>
                      <small>ZERO-BURN SATELLITE CLEARANCE</small>
                      <b style={{ color: "var(--kl-green)" }}>{currentKycApp.thermalStatus}</b>
                    </div>
                  </div>

                  {/* Document Preview Box */}
                  <div className="kl-dossier-document-box">
                    <div className="kl-doc-box-head">
                      <span>📄 Submitted Credential Scan: <b>{currentKycApp.documentName}</b></span>
                      <span className="kl-doc-certified-tag">UIDAI SHA-256 Validated</span>
                    </div>
                    <div className="kl-doc-preview-canvas">
                      <div className="kl-mock-id-card">
                        <div className="kl-id-gov-strip">GOVERNMENT OF PUNJAB · UIDAI e-KYC VERIFIED</div>
                        <div className="kl-id-card-content">
                          <div className="kl-id-avatar-placeholder">👤</div>
                          <div className="kl-id-details">
                            <b>{currentKycApp.name}</b>
                            <span>{currentKycApp.idType}: {currentKycApp.idNumber}</span>
                            <span>Address: {currentKycApp.village}, {currentKycApp.district}</span>
                            <small>Linked DBT Bank: State Bank of India (PFMS Seeded)</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decision Actions */}
                  <div className="kl-dossier-actions-bar">
                    {currentKycApp.status === "Pending" ? (
                      <>
                        <button
                          type="button"
                          className="secondary kl-btn-sm"
                          style={{ color: "var(--kl-red)" }}
                          onClick={() => handleRejectKyc(currentKycApp.id)}
                        >
                          ✕ Request Resubmission
                        </button>
                        <button
                          type="button"
                          className="primary kl-btn-sm"
                          onClick={() => handleApproveKyc(currentKycApp.id)}
                        >
                          ✓ Approve Application &amp; Unlock DBT
                        </button>
                      </>
                    ) : (
                      <span className="kl-status-pill ok">Application Approved &amp; Credentials Locked</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="kl-admin-dossier-card kl-empty-card" style={{ padding: 40, textAlign: "center" }}>
                  <h4>No Application Selected</h4>
                  <p>All pending KYC applications have been reviewed or the queue is currently empty.</p>
                </div>
              )
            )}

            {activeQueueTab === "issues" && (
              currentIssue ? (
                <div className="kl-admin-dossier-card">
                  <div className="kl-dossier-header">
                    <div>
                      <span className="kl-dossier-label">DISPUTE ARBITRATION DOSSIER</span>
                      <h3>{currentIssue.title}</h3>
                      <small>Ticket ID: <code>{currentIssue.id}</code> · Severity: {currentIssue.severity}</small>
                    </div>
                    <span className={`kl-status ${currentIssue.status === "Resolved" ? "Processed" : "Listed"}`}>
                      {currentIssue.status}
                    </span>
                  </div>

                  <div className="kl-dossier-details-grid">
                    <div className="kl-dossier-field">
                      <small>REPORTED BY</small>
                      <b>{currentIssue.reportedBy}</b>
                    </div>
                    <div className="kl-dossier-field">
                      <small>RELATED FARMER</small>
                      <b>{currentIssue.farmer}</b>
                    </div>
                    <div className="kl-dossier-field" style={{ gridColumn: "1 / -1" }}>
                      <small>DESCRIPTION OF DISPUTE</small>
                      <p style={{ margin: "4px 0 0", fontSize: 13 }}>{currentIssue.description}</p>
                    </div>
                    <div className="kl-dossier-field" style={{ gridColumn: "1 / -1" }}>
                      <small>DEPOT FIELD EVIDENCE</small>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--kl-green)" }}>{currentIssue.fieldEvidence}</p>
                    </div>
                  </div>

                  <div className="kl-dossier-actions-bar">
                    <button
                      type="button"
                      className="secondary kl-btn-sm"
                      onClick={() => alert(`Field officer dispatched to inspect Lot ${currentIssue.lotId}.`)}
                    >
                      🛸 Dispatch Field Probe
                    </button>
                    {currentIssue.status !== "Resolved" ? (
                      <button
                        type="button"
                        className="primary kl-btn-sm"
                        onClick={() => handleResolveIssue(currentIssue.id)}
                      >
                        ✓ Calibrate &amp; Mark Resolved
                      </button>
                    ) : (
                      <span className="kl-status-pill ok">Dispute Resolved in State Log</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="kl-admin-dossier-card kl-empty-card" style={{ padding: 40, textAlign: "center" }}>
                  <h4>No Disputes Pending</h4>
                  <p>There are no active dispute tickets requiring state arbitration.</p>
                </div>
              )
            )}

            {activeQueueTab === "moderation" && (
              currentMod ? (
                <div className="kl-admin-dossier-card">
                  <div className="kl-dossier-header">
                    <div>
                      <span className="kl-dossier-label">PRE-MARKET MODERATION DOSSIER</span>
                      <h3>{currentMod.crop} · 📍 {currentMod.village}</h3>
                      <small>Item Ref: <code>{currentMod.id}</code> · Farmer: {currentMod.farmer}</small>
                    </div>
                    <span className={`kl-status ${currentMod.status === "Approved" ? "Processed" : "Listed"}`}>
                      {currentMod.status}
                    </span>
                  </div>

                  <div className="kl-dossier-details-grid">
                    <div className="kl-dossier-field">
                      <small>QUOTED RATE</small>
                      <b>₹{currentMod.price} / tonne</b>
                    </div>
                    <div className="kl-dossier-field">
                      <small>ZERO-BURN SATELLITE STATUS</small>
                      <b style={{ color: "var(--kl-green)" }}>{currentMod.zeroBurnRisk}</b>
                    </div>
                    <div className="kl-dossier-field" style={{ gridColumn: "1 / -1" }}>
                      <small>COMPLIANCE AUDIT OBSERVATION</small>
                      <p style={{ margin: "4px 0 0", fontSize: 13 }}>{currentMod.flagReason}</p>
                    </div>
                  </div>

                  <div className="kl-dossier-actions-bar">
                    <button
                      type="button"
                      className="secondary kl-btn-sm"
                      onClick={() => alert("Drone pass order submitted to Malwa Remote Sensing Unit.")}
                    >
                      🛸 Dispatch Drone Inspection
                    </button>
                    {currentMod.status !== "Approved" ? (
                      <button
                        type="button"
                        className="primary kl-btn-sm"
                        onClick={() => handleApproveModeration(currentMod.id)}
                      >
                        ✓ Approve for Public Marketplace
                      </button>
                    ) : (
                      <span className="kl-status-pill ok">Approved &amp; Live on Marketplace</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="kl-admin-dossier-card kl-empty-card" style={{ padding: 40, textAlign: "center" }}>
                  <h4>No Listings In Moderation</h4>
                  <p>All new produce listings have been verified and approved.</p>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: STATE FINANCIAL LEDGER & DBT RECONCILIATION ================= */}
      {activeViewSection === "ledger" && (
        <section className="kl-admin-ledger-section">
          <div className="kl-admin-ledger-head">
            <div>
              <h3>Public Financial Management System (PFMS) · State DBT Ledger</h3>
              <p>Reconciled disbursements of farmer zero-burn incentives, baler cluster subsidies, and offtaker settlements.</p>
            </div>
            <button
              type="button"
              className="secondary kl-btn-sm"
              onClick={() => notify?.("Audited records validated with Reserve Bank PFMS Gateway.")}
            >
              🔄 Refresh PFMS Feed
            </button>
          </div>

          <div className="kl-table-scroll">
            <table className="kl-table kl-transactions-table">
              <thead>
                <tr>
                  <th>TXN REF</th>
                  <th>BENEFICIARY</th>
                  <th>PROGRAMME CATEGORY</th>
                  <th>DISBURSED VOLUME</th>
                  <th>AMOUNT (₹)</th>
                  <th>PFMS CLEARANCE REF</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td><code>{t.id}</code></td>
                    <td><b>{t.beneficiary}</b><small style={{ display: "block", color: "var(--kl-muted)" }}>{t.role}</small></td>
                    <td>{t.category}</td>
                    <td><b>{t.tonnes} t</b></td>
                    <td><b style={{ color: "var(--kl-green)" }}>₹{t.amount.toLocaleString("en-IN")}</b></td>
                    <td><code>{t.bankRef}</code></td>
                    <td><span className={`kl-status-pill ${t.status === "Settled" ? "ok" : "pending"}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ================= VIEW 3: LIVE SATELLITE & WEIGHBRIDGE SURVEILLANCE STREAM ================= */}
      {activeViewSection === "surveillance" && (
        <section className="kl-admin-surveillance-section">
          <div className="kl-admin-ledger-head">
            <div>
              <h3>Satellite Surveillance Passes &amp; Automated Audit Trail</h3>
              <p>Immutable real-time telematics from Sentinel-2 satellite passes, weighbridge scale calibrations, and officer audits.</p>
            </div>
          </div>

          <div className="kl-admin-activity-stream">
            {activityLog.map(act => (
              <div key={act.id} className="kl-admin-stream-item">
                <span className="kl-stream-icon">{act.icon}</span>
                <div className="kl-stream-content">
                  <div className="kl-stream-head">
                    <b>{act.title}</b>
                    <small>{act.time}</small>
                  </div>
                  <p>{act.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
