import { useState, useEffect } from "react";

const FEEDS = [
  {
    id: "baler",
    title: "Sangrur Field 04 · Mechanized Baler Fleet",
    tag: "LIVE TRACTOR CAM",
    image: "/images/hero_harvest.jpg",
    location: "Longowal - Dhuri Link Road, Sangrur",
    coords: "30.244° N, 75.842° E",
    metrics: [
      { label: "Baler Speed", val: "5.8 km/h" },
      { label: "Bales Formed", val: "142 units" },
      { label: "Residue Moisture", val: "12.4% (Optimal)" },
      { label: "Telemetry Link", val: "4G LTE · 98 ms" }
    ],
    status: "Active Harvest Baling",
    badgeColor: "#10b981",
  },
  {
    id: "plant",
    title: "Malerkotla Bio-CNG & Biofuel Pellet Plant",
    tag: "WEIGHBRIDGE INTAKE",
    image: "/images/biomass_plant.jpg",
    location: "Malerkotla Industrial Focal Point",
    coords: "30.531° N, 75.884° E",
    metrics: [
      { label: "Truck Queue", val: "2 vehicles" },
      { label: "Today's Intake", val: "48.5 tonnes" },
      { label: "Silo Capacity", val: "78% available" },
      { label: "Station Status", val: "Online & Baling" }
    ],
    status: "Intake Station Active",
    badgeColor: "#0284c7",
  },
  {
    id: "yard",
    title: "Dhuri Aggregation Depot · Baled Straw Stack",
    tag: "STORAGE MONITOR",
    image: "/images/straw_bales.jpg",
    location: "Dhuri Farmgate Aggregation Hub",
    coords: "30.370° N, 75.872° E",
    metrics: [
      { label: "Total Bales", val: "840 bales" },
      { label: "Stack Temp", val: "28.2°C (Safe)" },
      { label: "Density", val: "145 kg/m³" },
      { label: "Fire Sensor", val: "Green · Normal" }
    ],
    status: "Depot Monitored",
    badgeColor: "#f59e0b",
  },
  {
    id: "drone",
    title: "Punjab State Remote Sensing · Drone Farmland Grid",
    tag: "SATELLITE & DRONE",
    image: "/images/drone_fields.jpg",
    location: "Sangrur & Patiala Regional Buffer",
    coords: "30.312° N, 75.920° E",
    metrics: [
      { label: "Altitude", val: "120 m AGL" },
      { label: "Thermal Anomalies", val: "0 (Zero Fires)" },
      { label: "Parcels Scanned", val: "348 plots" },
      { label: "Spectral NDVI", val: "0.72 Healthy" }
    ],
    status: "Zero Stubble Fires",
    badgeColor: "#8b5cf6",
  }
];

export default function LiveFieldCameraWidget({ onClose }) {
  const [activeFeedId, setActiveFeedId] = useState("baler");
  const [liveTime, setLiveTime] = useState(() => new Date().toLocaleTimeString("en-IN"));
  const [showHud, setShowHud] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString("en-IN"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeFeed = FEEDS.find(f => f.id === activeFeedId) || FEEDS[0];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <section className="kl-panel kl-camera-widget">
      <div className="kl-panel-title kl-camera-header">
        <div className="kl-camera-title-group">
          <div className="kl-camera-badge-row">
            <span className="kl-live-ping" />
            <span className="kl-eyebrow">FIELD TELEMETRY NETWORK</span>
            <span className="kl-camera-clock">{liveTime} IST</span>
          </div>
          <h2>Live Farmgate & Processing Cameras</h2>
          <p>Real-time visual monitoring of mechanized baling, stack depots, and processor delivery in Punjab.</p>
        </div>

        <div className="kl-camera-header-actions">
          <button
            className={`kl-cam-action-btn ${isRefreshing ? "spin" : ""}`}
            onClick={handleRefresh}
            title="Refresh stream sensors"
          >
            ↻ Sync Feed
          </button>
          <button
            className="kl-cam-action-btn"
            onClick={() => setShowHud(!showHud)}
            title="Toggle telemetry overlay"
          >
            {showHud ? "Hide HUD" : "Show HUD"}
          </button>
          {onClose && (
            <button className="kl-close" onClick={onClose} aria-label="Close">×</button>
          )}
        </div>
      </div>

      {/* Camera feed selector tabs */}
      <div className="kl-feed-tabs">
        {FEEDS.map(f => (
          <button
            key={f.id}
            className={`kl-feed-tab ${f.id === activeFeedId ? "active" : ""}`}
            onClick={() => setActiveFeedId(f.id)}
          >
            <span
              className="kl-tab-dot"
              style={{ background: f.badgeColor }}
            />
            <div className="kl-tab-text">
              <strong>{f.tag}</strong>
              <small>{f.title.split("·")[0]}</small>
            </div>
          </button>
        ))}
      </div>

      {/* Main Video/Camera Viewport */}
      <div className="kl-viewport-card">
        <div className="kl-viewport-media">
          <img
            src={activeFeed.image}
            alt={activeFeed.title}
            className={`kl-viewport-img ${isRefreshing ? "refreshing" : ""}`}
          />
          <div className="kl-viewport-gradient" />

          {/* Realtime Stream HUD Overlay */}
          {showHud && (
            <div className="kl-viewport-hud">
              {/* Top HUD row */}
              <div className="kl-hud-top">
                <div className="kl-hud-rec">
                  <span className="kl-rec-dot" />
                  <span>LIVE FEED</span>
                  <span className="kl-hud-fps">1080P · 30 FPS</span>
                </div>
                <div className="kl-hud-coords">
                  <span>GPS {activeFeed.coords}</span>
                  <span className="kl-hud-tag">{activeFeed.tag}</span>
                </div>
              </div>

              {/* Crosshair & Grid Lines */}
              <div className="kl-hud-crosshairs">
                <div className="kl-hud-target" />
                <span className="kl-hud-reticle top-left" />
                <span className="kl-hud-reticle top-right" />
                <span className="kl-hud-reticle bottom-left" />
                <span className="kl-hud-reticle bottom-right" />
              </div>

              {/* Bottom HUD row */}
              <div className="kl-hud-bottom">
                <div className="kl-hud-loc">
                  <strong>{activeFeed.title}</strong>
                  <span>📍 {activeFeed.location}</span>
                </div>
                <div className="kl-hud-status-badge" style={{ borderColor: activeFeed.badgeColor }}>
                  <span style={{ color: activeFeed.badgeColor }}>●</span> {activeFeed.status}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Telemetry Sensor Dashboard */}
        <div className="kl-viewport-telemetry">
          {activeFeed.metrics.map(m => (
            <div className="kl-telemetry-cell" key={m.label}>
              <span className="kl-telemetry-lbl">{m.label}</span>
              <strong className="kl-telemetry-val">{m.val}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
