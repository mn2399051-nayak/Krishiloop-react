import { useState, useEffect } from "react";

export default function HeroTelemetryBanner({
  activeAccount,
  activeThemeKey = "seller",
  onAction,
  onOpenLiveFeed
}) {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Role & Theme tailored copy and telemetry metrics
  const heroData = {
    seller: {
      badge: "LIVE FARMGATE DISPATCH · ZERO-BURN COMPLIANT",
      title: "Crop Residue Listed at Farmgate,",
      accent: "Direct Payouts & Zero Stubble Burning.",
      desc: "Real-time farmgate intelligence connecting Punjab farmers to mechanized balers, transparent prices (₹/t), and direct DBT bank transfers.",
      bgImage: "/images/hero_harvest.jpg",
      stats: [
        { label: "Active Balers", val: "14 Units", trend: "🟢 GPS Onfield Now" },
        { label: "Straw Diverted", val: "186.4 t", trend: "🌱 100% Zero-Burn" },
        { label: "Farmer Value", val: "₹3.35 Lakh", trend: "⚡ Direct DBT Paid" }
      ],
      primaryAction: { label: "＋ List New Residue Lot", action: () => onAction("listResidue") },
      tag: "Covering 38 Villages in Sangrur & Malerkotla"
    },
    buyer: {
      badge: "COMMERCIAL OFFTAKE NETWORK · ESG & QUALITY VERIFIED",
      title: "Industrial Bio-Feedstock Procurement,",
      accent: "Securing Sustainable Supply at Scale.",
      desc: "Verified crop residue marketplace for paper mills, packaging plants, and industrial boilers to secure long-term biomass contracts with guaranteed specifications.",
      bgImage: "/images/straw_bales.jpg",
      stats: [
        { label: "Offtake Contracts", val: "5 Plants", trend: "🟢 Active Deliveries" },
        { label: "Straw Procured", val: "310.0 t", trend: "📋 On-Spec Quality" },
        { label: "Fossil Fuel Saved", val: "185 t Coal", trend: "🌍 Verified ESG Offset" }
      ],
      primaryAction: { label: "＋ Post Feedstock Demand", action: () => onAction("navigate", "Demand board") },
      tag: "Direct Delivery to Patiala & Ludhiana Offtakers"
    },
    processor: {
      badge: "BIO-ENERGY REFINERY · THERMAL POWER FEEDSTOCK",
      title: "High-Calorific Biomass Feedstock,",
      accent: "Fueling Clean Energy Generation.",
      desc: "Coordinating bulk residue intake, moisture verification, and bio-pellet/bio-CNG production across Sangrur, Malerkotla and Patiala plants.",
      bgImage: "/images/biomass_plant.jpg",
      stats: [
        { label: "Daily Capacity", val: "120 t/day", trend: "🟢 Continuous Intake" },
        { label: "Plant Intake", val: "245.0 t", trend: "🔥 Max 14% Moisture" },
        { label: "Pellets Output", val: "190.0 t", trend: "⚡ Dispatched to PSPCL" }
      ],
      primaryAction: { label: "⇩ Record Plant Intake", action: () => onAction("navigate", "Intake") },
      tag: "State Boiler & Biofuel Standard Verified"
    },
    collector: {
      badge: "FLEET DISPATCH · BALER GPS & CLUSTER LOGISTICS",
      title: "Mechanized Baler Fleets & Route Planning,",
      accent: "Rapid Farmgate Stubble Clearance.",
      desc: "GPS-optimized tractor logistics, cluster collection stops, and automated digital weighbridge slips across Punjab's agricultural belt.",
      bgImage: "/images/drone_fields.jpg",
      stats: [
        { label: "GPS Fleet", val: "12 Tractors", trend: "🚜 Active Route Dispatch" },
        { label: "Total Collected", val: "142.0 t", trend: "⏱ 98% On-Time Pickup" },
        { label: "Active Routes", val: "4 Clusters", trend: "📍 Optimized Logistics" }
      ],
      primaryAction: { label: "↗ View Collection Routes", action: () => onAction("navigate", "Routes") },
      tag: "Live Route Clustering across Sangrur District"
    },
    admin: {
      badge: "PUNJAB AGRI INITIATIVE · SATELLITE ZERO-BURN DESK",
      title: "State Agricultural Circular Economy,",
      accent: "Satellite-Monitored Stubble Fire Elimination.",
      desc: "Multi-district compliance oversight, UIDAI Aadhaar e-KYC desk, collector fleet subsidy verification, and real-time fire hotspot correlation with SAC/ISRO.",
      bgImage: "/images/hero_harvest.jpg",
      stats: [
        { label: "Districts Covered", val: "4 Districts", trend: "🛡 State Compliance" },
        { label: "Total Diverted", val: "520.0 t", trend: "🌱 Zero Satellite Hotspots" },
        { label: "Verified Users", val: "148 Farmers", trend: "✓ UIDAI e-KYC Complete" }
      ],
      primaryAction: { label: "🛡 Open KYC Desk", action: () => onAction("navigate", "User Verification") },
      tag: "State Nodal Office · Punjab Agri Directorate"
    }
  }[activeThemeKey] || heroData.seller;

  return (
    <div className={`kl-hero-banner kl-hero-theme-${activeThemeKey}`}>
      <div className="kl-hero-bg-wrap">
        <img
          src={heroData.bgImage}
          alt="Punjab harvest fields crop residue baling"
          className="kl-hero-bg-img"
        />
        <div className="kl-hero-overlay" />
      </div>

      <div className="kl-hero-content">
        <div className="kl-hero-top-row">
          <div className="kl-hero-badge">
            <span className="kl-pulse-dot" />
            <span className="kl-hero-badge-text">{heroData.badge}</span>
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
              {heroData.title} <br />
              <span className="kl-hero-title-accent">{heroData.accent}</span>
            </h1>
            <p className="kl-hero-desc">
              {heroData.desc}
            </p>
          </div>

          <div className="kl-hero-stats-glass">
            {heroData.stats.map((st, i) => (
              <div className="kl-hero-stat" key={i}>
                <span className="kl-hero-stat-label">{st.label}</span>
                <strong className="kl-hero-stat-val">{st.val}</strong>
                <span className="kl-hero-stat-trend">{st.trend}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="kl-hero-actions-row">
          <div className="kl-hero-buttons">
            <button
              className="kl-hero-btn primary"
              onClick={heroData.primaryAction.action}
            >
              <span>{heroData.primaryAction.label.split(" ")[0]}</span> {heroData.primaryAction.label.slice(heroData.primaryAction.label.indexOf(" ") + 1)}
            </button>
            <button
              className="kl-hero-btn secondary"
              onClick={() => onAction("navigate", "Marketplace")}
            >
              <span>🔍</span> Explore Marketplace
            </button>
          </div>

          <div className="kl-hero-cluster-pill">
            <span className="kl-flag-icon">🌾</span>
            <span>{heroData.tag}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
