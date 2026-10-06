import { useState, useEffect } from "react";

export default function HeroTelemetryBanner({ activeAccount, onAction, onOpenLiveFeed }) {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="kl-hero-banner">
      <div className="kl-hero-bg-wrap">
        <img
          src="/images/hero_harvest.jpg"
          alt="Punjab harvest fields crop residue baling"
          className="kl-hero-bg-img"
        />
        <div className="kl-hero-overlay" />
      </div>

      <div className="kl-hero-content">
        <div className="kl-hero-top-row">
          <div className="kl-hero-badge">
            <span className="kl-pulse-dot" />
            <span className="kl-hero-badge-text">LIVE HARVEST DISPATCH · PUNJAB CLUSTER</span>
            <span className="kl-hero-badge-time">{time} IST</span>
          </div>
          <div className="kl-hero-weather">
            <span className="kl-weather-item">☀️ 29°C · Clear Sky</span>
            <span className="kl-weather-divider">•</span>
            <span className="kl-weather-item">💧 48% Humidity (Optimal)</span>
            <span className="kl-weather-divider">•</span>
            <span className="kl-weather-item">💨 Wind 8 km/h NW</span>
          </div>
        </div>

        <div className="kl-hero-main-row">
          <div className="kl-hero-headline">
            <h1 className="kl-hero-title">
              Agricultural Residue, <br />
              <span className="kl-hero-title-accent">Powering the Circular Economy.</span>
            </h1>
            <p className="kl-hero-desc">
              Real-time farmgate intelligence connecting farmers, mechanized baler fleets,
              and bio-energy plants to eliminate stubble burning across Sangrur, Malerkotla & Patiala.
            </p>
          </div>

          <div className="kl-hero-stats-glass">
            <div className="kl-hero-stat">
              <span className="kl-hero-stat-label">Active Balers</span>
              <strong className="kl-hero-stat-val">14 <small>Units</small></strong>
              <span className="kl-hero-stat-trend">🟢 GPS Onfield Now</span>
            </div>
            <div className="kl-hero-stat">
              <span className="kl-hero-stat-label">Straw Diverted</span>
              <strong className="kl-hero-stat-val">186.4 <small>t</small></strong>
              <span className="kl-hero-stat-trend">🌱 100% Zero-Burn</span>
            </div>
            <div className="kl-hero-stat">
              <span className="kl-hero-stat-label">Farmer Value</span>
              <strong className="kl-hero-stat-val">₹3.35 <small>Lakh</small></strong>
              <span className="kl-hero-stat-trend">⚡ Direct DBT Paid</span>
            </div>
          </div>
        </div>

        <div className="kl-hero-actions-row">
          <div className="kl-hero-buttons">
            {activeAccount.role === "Farmer" && (
              <button
                className="kl-hero-btn primary"
                onClick={() => onAction("listResidue")}
              >
                <span>＋</span> List New Residue Lot
              </button>
            )}
            <button
              className="kl-hero-btn secondary"
              onClick={() => onAction("navigate", "Marketplace")}
            >
              <span>🔍</span> Explore Marketplace
            </button>
            <button
              className="kl-hero-btn glass"
              onClick={() => onOpenLiveFeed ? onOpenLiveFeed() : onAction("navigate", "Routes")}
            >
              <span className="kl-cam-icon">📹</span> Realtime Field Camera Feeds
            </button>
          </div>

          <div className="kl-hero-cluster-pill">
            <span className="kl-flag-icon">🌾</span>
            <span>Covering <strong>38 Villages</strong> in Malwa Belt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
