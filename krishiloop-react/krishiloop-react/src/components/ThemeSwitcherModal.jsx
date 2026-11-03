export const THEME_CONFIGS = {
  seller: {
    id: "seller",
    name: "Seller / Farmer Theme",
    shortName: "Seller Theme",
    roleMatch: "Farmer / Seller",
    icon: "🌾",
    colors: {
      primary: "#d97706",
      accent: "#f59e0b",
      bgLight: "#fcfaf5",
      badge: "#fef3c7",
      darkBg: "#0f0c07"
    },
    accentGradient: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)",
    tagline: "Harvest Gold & Fertile Emerald",
    description: "Designed for crop growers and residue sellers. Emphasizes farmgate prices (₹/t), crop moisture levels, mechanized baler dispatch, and direct DBT bank payouts.",
    badgeText: "🌾 SELLER / PRODUCER WORKSPACE",
    highlights: ["Farmgate Residue Inventory", "Direct Benefit Transfer (DBT)", "Baler Booking & Field Moisture"]
  },
  buyer: {
    id: "buyer",
    name: "Buyer / Offtaker Theme",
    shortName: "Buyer Theme",
    roleMatch: "Commercial Buyer",
    icon: "💼",
    colors: {
      primary: "#0284c7",
      accent: "#2563eb",
      bgLight: "#f2f6fb",
      badge: "#e0f2fe",
      darkBg: "#060d17"
    },
    accentGradient: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
    tagline: "Executive Sapphire & Precision Slate",
    description: "Tailored for pulp mills, packaging plants, and industrial offtakers. Prioritizes bulk feedstock procurement tenders, commercial contracts, quality grades, and corporate ESG compliance.",
    badgeText: "💼 BUYER / OFFTAKER WORKSPACE",
    highlights: ["Demand Board & Tenders", "Commercial Feedstock Contracts", "Quality Grade & Moisture Specs"]
  },
  processor: {
    id: "processor",
    name: "Processor Theme",
    shortName: "Processor Theme",
    roleMatch: "Biomass Processor",
    icon: "⚡",
    colors: {
      primary: "#ea580c",
      accent: "#f97316",
      bgLight: "#fcf7f3",
      badge: "#ffedd5",
      darkBg: "#100804"
    },
    accentGradient: "linear-gradient(135deg, #ea580c 0%, #f97316 100%)",
    tagline: "Bio-Energy Amber Forge & Clean Tech",
    description: "Designed for bio-pellet mills, bio-CNG refineries, and thermal boiler plants. Focuses on daily mill gate intake tonnage, calorific energy value, and boiler fuel delivery.",
    badgeText: "⚡ BIO-ENERGY PROCESSOR WORKSPACE",
    highlights: ["Daily Plant Intake Capacity", "Pellet & Biofuel Production", "Weighbridge Traceability Slips"]
  },
  collector: {
    id: "collector",
    name: "Collector / Fleet Theme",
    shortName: "Collector Theme",
    roleMatch: "Baler Aggregator / Fleet",
    icon: "🚜",
    colors: {
      primary: "#16a34a",
      accent: "#22c55e",
      bgLight: "#f5f8f5",
      badge: "#dcfce7",
      darkBg: "#07100b"
    },
    accentGradient: "linear-gradient(135deg, #15803d 0%, #22c55e 100%)",
    tagline: "Fleet Logistics & Baler Amber",
    description: "Optimized for tractor fleet owners and baler aggregators. Highlights GPS farm stops, pickup routes, cluster dispatch, and actual collection scale weights.",
    badgeText: "🚜 LOGISTICS & BALER FLEET WORKSPACE",
    highlights: ["GPS Farmgate Cluster Map", "Pickup Job Confirmation", "Actual Weight Reconciliation"]
  },
  admin: {
    id: "admin",
    name: "State Regulatory Theme",
    shortName: "Admin Theme",
    roleMatch: "Govt / State Admin",
    icon: "🛡",
    colors: {
      primary: "#7c3aed",
      accent: "#8b5cf6",
      bgLight: "#f8f6fc",
      badge: "#ede9fe",
      darkBg: "#0b0713"
    },
    accentGradient: "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
    tagline: "Sovereign Amethyst & State Spruce",
    description: "Built for Punjab Agri officers and pilot monitoring authorities. Focuses on multi-district telemetry, satellite fire detection correlation, UIDAI Aadhaar KYC approval, and zero-burn compliance.",
    badgeText: "🛡 STATE REGULATORY DESK",
    highlights: ["Statewide Stubble Fire Audit", "UIDAI Aadhaar KYC Desk", "Multi-District Analytics & Subsidy"]
  }
};

export default function ThemeSwitcherModal({
  currentRole,
  activeThemeKey,
  themeOverride,
  onSelectTheme,
  onClose
}) {
  return (
    <div className="kl-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kl-modal kl-theme-switcher-modal">
        <button className="kl-close" onClick={onClose} aria-label="Close">×</button>
        <div className="kl-eyebrow">DASHBOARD PERSONALIZATION</div>
        <h2>Role-Tailored Themes</h2>
        <p>
          KrishiLoop customizes its visual palette, data highlights, and layout accents to match your role’s workflow needs.
        </p>

        {/* Auto Mode Toggle Card */}
        <div
          className={`kl-theme-auto-card ${themeOverride === "auto" ? "selected" : ""}`}
          onClick={() => {
            onSelectTheme("auto");
          }}
        >
          <div className="kl-theme-auto-radio">
            <span className={`kl-radio-dot ${themeOverride === "auto" ? "active" : ""}`} />
          </div>
          <div className="kl-theme-auto-info">
            <div className="kl-theme-auto-head">
              <b>⚡ Automatic (Follows User Role: {currentRole})</b>
              <span className="kl-pill">Recommended</span>
            </div>
            <p>
              Automatically switches the dashboard to <strong>{THEME_CONFIGS[activeThemeKey]?.name || "Seller Theme"}</strong> when logged in as <em>{currentRole}</em>, and smoothly adapts whenever you switch account personas.
            </p>
          </div>
        </div>

        <div className="kl-theme-options-grid">
          {Object.values(THEME_CONFIGS).map((cfg) => {
            const isSelected = activeThemeKey === cfg.id && themeOverride !== "auto";
            const isRoleDefault = (currentRole.toLowerCase().includes(cfg.id) || (cfg.id === "seller" && currentRole === "Farmer"));

            return (
              <div
                key={cfg.id}
                className={`kl-theme-card-option ${isSelected ? "selected" : ""} ${isRoleDefault && themeOverride === "auto" ? "role-active" : ""}`}
                onClick={() => onSelectTheme(cfg.id)}
              >
                <div className="kl-theme-card-header">
                  <div className="kl-theme-badge-icon" style={{ background: cfg.accentGradient }}>
                    {cfg.icon}
                  </div>
                  <div>
                    <h4 className="kl-theme-title">{cfg.name}</h4>
                    <span className="kl-theme-tagline">{cfg.tagline}</span>
                  </div>
                </div>

                <p className="kl-theme-card-desc">{cfg.description}</p>

                <div className="kl-theme-highlights">
                  {cfg.highlights.map((h, i) => (
                    <span key={i} className="kl-theme-chip">✓ {h}</span>
                  ))}
                </div>

                <div className="kl-theme-card-footer">
                  <div className="kl-theme-swatches">
                    <span className="kl-swatch" style={{ background: cfg.colors.primary }} />
                    <span className="kl-swatch" style={{ background: cfg.colors.accent }} />
                    <span className="kl-swatch" style={{ background: cfg.colors.badge }} />
                  </div>
                  <span className="kl-theme-select-status">
                    {isSelected ? "Active Theme" : isRoleDefault && themeOverride === "auto" ? "Active by Role" : "Select Theme →"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="kl-modal-actions" style={{ marginTop: 20 }}>
          <button
            type="button"
            className="secondary"
            onClick={() => onSelectTheme("auto")}
          >
            Reset to Auto (Role-Based)
          </button>
          <button type="button" className="primary" onClick={onClose}>
            Apply &amp; Return to Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
