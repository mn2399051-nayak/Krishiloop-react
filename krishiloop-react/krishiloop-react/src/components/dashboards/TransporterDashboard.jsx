import { useState, useMemo } from "react";
import GoogleMap from "../GoogleMap.jsx";
import { VILLAGE_COORDS, DEFAULT_DEPOT } from "../../data.js";

export default function TransporterDashboard({
  activeAccount,
  lots = [],
  jobs = [],
  records = [],
  loading = false,
  onCreateJob,
  onConfirmPickup,
  onNavigate,
  notify
}) {
  const [activeTab, setActiveTab] = useState("jobs"); // "jobs" | "routes" | "handover"
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState(null);

  // Active open lots available for collection
  const openLots = useMemo(() => lots.filter(l => !["Collected", "Processed"].includes(l.status)), [lots]);
  const routeLots = useMemo(() => openLots.slice(0, 6).map(l => ({ ...l, coords: VILLAGE_COORDS[l.village] || VILLAGE_COORDS.Sangrur })), [openLots]);
  
  // Total tonnes collected
  const totalCollected = lots.filter(l => ["Collected", "Processed"].includes(l.status)).reduce((acc, l) => acc + Number(l.act ?? l.est ?? 0), 0);
  const activeRoutesCount = jobs.filter(j => j.status === "Planned").length;

  if (loading) {
    return (
      <div className="kl-dashboard-loading" role="status">
        <div className="kl-skeleton-hero" />
        <div className="kl-skeleton-metrics">
          <div className="kl-skeleton-card" />
          <div className="kl-skeleton-card" />
          <div className="kl-skeleton-card" />
          <div className="kl-skeleton-card" />
        </div>
        <div className="kl-skeleton-panel" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="kl-dashboard-error" role="alert">
        <div className="kl-error-icon">⚠</div>
        <h3>Failed to load transporter logistics workspace</h3>
        <p>{error}</p>
        <button className="primary" onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="kl-role-dashboard kl-transporter-dashboard">
      {/* 1. Transporter Hero Banner */}
      <section className="kl-panel kl-transporter-hero">
        <div className="kl-transporter-hero-content">
          <div className="kl-eyebrow">
            <span>🚜 BALER FLEET &amp; LOGISTICS AGGREGATOR DESK</span>
            <span className="kl-status-badge verified">Commercial Carrier License Active ✓</span>
          </div>
          <h2>{activeAccount.org || "Malwa Bio-Logistics Fleet Ltd."} — Transport Operations</h2>
          <p className="kl-sub">
            Plan mechanized baling routes across Punjab farmgate clusters, coordinate tractor trolley dispatch, and verify actual weighbridge intake slips at processing depots.
          </p>
          <div className="kl-transporter-hero-tags">
            <span>👤 Fleet Manager: {activeAccount.name}</span>
            <span>📍 Active Depot: Sangrur Biomass Hub</span>
            <span>🚜 Active Fleet: 6 Mechanized Balers · 12 GPS Tractors</span>
          </div>
        </div>
        <div className="kl-transporter-hero-actions">
          <button
            type="button"
            className="primary kl-btn-lg"
            onClick={() => onNavigate?.("Routes")}
            title="Open route planning map"
          >
            ⌁ Route Planning &amp; GPS Clusters
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onNavigate?.("Live Feeds")}
            title="View baler and weighbridge cameras"
          >
            📹 View Baler GPS &amp; Cameras
          </button>
        </div>
      </section>

      {/* 2. KPIs */}
      <section className="kl-metrics kl-transporter-metrics">
        <article className="kl-metric">
          <span>Total Straw Collected</span>
          <b>{totalCollected.toFixed(1)} <small>tonnes</small></b>
          <small>Direct farmgate collection</small>
        </article>
        <article className="kl-metric">
          <span>Active Scheduled Routes</span>
          <b>{activeRoutesCount} <small>clusters</small></b>
          <small>Dhuri, Lehragaga &amp; Sunam</small>
        </article>
        <article className="kl-metric">
          <span>On-Time Delivery Rate</span>
          <b style={{ color: "var(--kl-green)" }}>98% <small>rating</small></b>
          <small>Same-day combine following</small>
        </article>
        <article className="kl-metric">
          <span>Open Farm Lots</span>
          <b>{openLots.length} <small>lots</small></b>
          <small>Ready for pickup</small>
        </article>
      </section>

      {/* 3. Sub-tabs */}
      <div className="kl-dashboard-tabs">
        <button
          className={`kl-dash-tab ${activeTab === "jobs" ? "active" : ""}`}
          onClick={() => setActiveTab("jobs")}
        >
          ↗ Pickup Jobs &amp; Trolley Dispatches ({jobs.length})
        </button>
        <button
          className={`kl-dash-tab ${activeTab === "routes" ? "active" : ""}`}
          onClick={() => setActiveTab("routes")}
        >
          ⌁ Route Optimization &amp; Farm Stops
        </button>
        <button
          className={`kl-dash-tab ${activeTab === "handover" ? "active" : ""}`}
          onClick={() => setActiveTab("handover")}
        >
          ⇩ Depot Weighbridge Handover ({records.length})
        </button>
      </div>

      {/* TAB 1: PICKUP JOBS */}
      {activeTab === "jobs" && (
        <section className="kl-panel" style={{ marginBottom: 20 }}>
          <div className="kl-panel-title">
            <div>
              <div className="kl-eyebrow">FIELD DISPATCH MANIFEST</div>
              <h3>Active Collection Jobs</h3>
              <p className="kl-sub">Farmgate pickup orders assigned to baler units and tractor trolleys.</p>
            </div>
            <button
              className="primary"
              onClick={() => {
                const unassigned = openLots.slice(0, 2).map(l => l.id);
                if (unassigned.length && onCreateJob) {
                  onCreateJob(unassigned);
                } else {
                  notify?.("All lots currently assigned to active routes.");
                }
              }}
            >
              ＋ Plan New Pickup Job
            </button>
          </div>

          <div className="kl-transporter-jobs-grid">
            {jobs.length === 0 ? (
              <div className="kl-empty-card" style={{ gridColumn: "1 / -1", padding: "32px 20px", textAlign: "center" }}>
                <div className="kl-empty-icon">🚜</div>
                <h4>No active collection jobs dispatched</h4>
                <p>Click "＋ Plan New Pickup Job" above to cluster nearby farmgate residue lots and assign trolley routes.</p>
              </div>
            ) : (
              jobs.map(j => {
                const jobLots = lots.filter(l => (j.lotIds || []).includes(l.id));
                const estWeight = jobLots.reduce((acc, l) => acc + Number(l.est || 0), 0);
                const actualWeight = j.actualQuantity ?? jobLots.reduce((acc, l) => acc + Number(l.act || 0), 0);
                const isCollected = j.status === "Collected";

                return (
                  <div key={j.id} className={`kl-job-card ${isCollected ? "completed" : ""}`}>
                    <div className="kl-job-head">
                      <div>
                        <span className="kl-job-id">{j.id}</span>
                        <h4>{j.route || "Cluster Route"}</h4>
                        <small>Carrier: {j.collector || activeAccount?.name || "Assigned Baler Fleet"}</small>
                      </div>
                      <span className={`kl-status ${j.status || "Planned"}`}>
                        {isCollected ? "Delivered ✓" : "Planned Today"}
                      </span>
                    </div>
                    <div className="kl-job-route-stops">
                      {jobLots.length > 0 ? (
                        jobLots.map(l => (
                          <span key={l.id}>
                            📍 {l.village} ({l.farmer || "Farmer"} · {l.est} t)
                          </span>
                        ))
                      ) : (
                        <span>📍 Stops: {(j.lotIds || []).join(", ") || "Farmgate stops"}</span>
                      )}
                      <span>🏁 Destination: Sangrur Biomass Hub</span>
                    </div>
                    <div className="kl-job-footer">
                      <span>
                        {isCollected ? "Actual Load: " : "Est. Load: "}
                        <b>{(isCollected ? (actualWeight || estWeight) : estWeight).toFixed(1)} tonnes</b>
                      </span>
                      {isCollected ? (
                        <span className="kl-status-pill ok">Weighbridge Verified</span>
                      ) : (
                        <button
                          type="button"
                          className="primary kl-btn-sm"
                          onClick={() => {
                            if (onConfirmPickup) {
                              onConfirmPickup(j);
                            } else {
                              notify?.("Pickup confirmation logged.");
                            }
                          }}
                        >
                          Confirm Pickup &amp; Scale Weight →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* TAB 2: ROUTE PLANNING & GPS STOPS */}
      {activeTab === "routes" && (
        <section className="kl-panel" style={{ marginBottom: 20 }}>
          <div className="kl-panel-title">
            <div>
              <div className="kl-eyebrow">CLUSTER ROUTE OPTIMIZATION</div>
              <h3>Farmgate GPS Coordinates &amp; Depot Distance</h3>
              <p className="kl-sub">Shortest-path collection sequence minimizing empty baler dead-mileage.</p>
            </div>
            <span className="kl-pill">{routeLots.length} Stops Active</span>
          </div>

          {routeLots.length === 0 ? (
            <div className="kl-empty-card">
              <div className="kl-empty-icon">📍</div>
              <h4>No pending collection stops</h4>
              <p>All current farmgate residue lots have already been collected and transported to processing depots.</p>
            </div>
          ) : (
            <>
              <GoogleMap lots={routeLots} depot={DEFAULT_DEPOT} height={380} />
              <div className="kl-route-foot" style={{ marginTop: 14 }}>
                <span><b>{routeLots.length} stops</b><small>Sangrur and Dhuri cluster</small></span>
                <span><b>{routeLots.reduce((n, l) => n + 14, 0)} km</b><small>Approx. total roundtrip road distance</small></span>
                <span><b>0.85 t/km</b><small>Fuel efficiency metric</small></span>
              </div>
            </>
          )}
        </section>
      )}

      {/* TAB 3: DEPOT WEIGHBRIDGE HANDOVER */}
      {activeTab === "handover" && (
        <section className="kl-panel">
          <div className="kl-panel-title">
            <div>
              <div className="kl-eyebrow">MILL GATE INTAKE &amp; SCALE TICKETS</div>
              <h3>Digital Weighbridge Handover History</h3>
              <p className="kl-sub">Intake receipts signed off by regional processing facilities upon straw delivery.</p>
            </div>
            <button className="secondary" onClick={() => notify?.("Exporting logistics manifest...")}>↓ Export Delivery Slips</button>
          </div>

          <div className="kl-stop-list">
            <div className="kl-intake-slip-row">
              <span className="kl-slip-icon">✓</span>
              <div>
                <b>WB-SAN-4891 · Sangrur Biomass Pellets Facility</b>
                <small>PB-13-X-4921 · 14.2 tonnes net · Moisture 12.8% · 12 Oct 2026</small>
              </div>
              <b style={{ color: "var(--kl-green)" }}>Verified &amp; Signed</b>
            </div>
            <div className="kl-intake-slip-row">
              <span className="kl-slip-icon">✓</span>
              <div>
                <b>WB-MAL-1029 · Malerkotla Bio-CNG Unit</b>
                <small>PB-11-AB-8802 · 22.0 tonnes net · Moisture 13.1% · 10 Oct 2026</small>
              </div>
              <b style={{ color: "var(--kl-green)" }}>Verified &amp; Signed</b>
            </div>
            {records.map(r => (
              <div key={r.id} className="kl-intake-slip-row">
                <span className="kl-slip-icon">✓</span>
                <div>
                  <b>{r.id} · {r.processor}</b>
                  <small>Lot {r.lotId} · {r.quantity} tonnes net · {r.category}</small>
                </div>
                <b style={{ color: "var(--kl-green)" }}>Logged at Depot</b>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
