import { useState, useMemo, useEffect } from "react";

// Standard listing state resolver
export const getListingState = (lot) => {
  if (lot.listingState) return lot.listingState;
  if (lot.status === "Draft") return "Draft";
  if (["Planned", "Collection planned", "Matched"].includes(lot.status)) return "Reserved";
  if (["Collected", "Processed", "Sold"].includes(lot.status)) return "Sold";
  return "Active"; // Default for Open/Listed lots
};

export default function FarmerDashboard({
  activeAccount,
  lots = [],
  demands = [],
  processors = [],
  jobs = [],
  records = [],
  loading = false,
  onAddLot,
  onUpdateLot,
  onContactPartner,
  onNavigate,
  notify
}) {
  const [filterResidue, setFilterResidue] = useState("All");
  const [filterState, setFilterState] = useState("All"); // "All" | "Active" | "Reserved" | "Sold" | "Draft"
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "quickAdd" | "inquiries" | "passbook" | "pickups"
  const [error, setError] = useState(null);

  // Local state for farmer lots to support immediate state transitions (Active, Reserved, Sold, Draft)
  const [localLots, setLocalLots] = useState(lots);

  useEffect(() => {
    setLocalLots(lots);
  }, [lots]);

  // Quick Add Produce Form state
  const [quickCrop, setQuickCrop] = useState("Paddy straw");
  const [quickQty, setQuickQty] = useState(12.5);
  const [quickPrice, setQuickPrice] = useState(1850);
  const [quickVillage, setQuickVillage] = useState(activeAccount?.village || "Dhuri");
  const [quickMoisture, setQuickMoisture] = useState("12.4%");
  const [quickBaleType, setQuickBaleType] = useState("Mechanized Bales");
  const [quickState, setQuickState] = useState("Active"); // "Active" | "Draft"

  // Filter lots belonging to this farmer
  const farmerLots = useMemo(() => {
    const isGurpreetAccount = activeAccount?.name === "Gurpreet Singh" || activeAccount?.id === "acc-farmer";
    return localLots.filter(l => {
      const matchesFarmer = !activeAccount?.id ||
        l.farmerId === activeAccount.id ||
        l.farmer === activeAccount.name ||
        (isGurpreetAccount && l.farmer === "Gurpreet Singh");
      const matchesType = filterResidue === "All" || l.residue === filterResidue;
      const state = getListingState(l);
      const matchesState = filterState === "All" || state === filterState;
      const matchesSearch = !searchQuery || `${l.id} ${l.village} ${l.residue} ${state}`.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFarmer && matchesType && matchesState && matchesSearch;
    });
  }, [localLots, activeAccount, filterResidue, filterState, searchQuery]);

  // Metrics for Farmer
  const allMyLots = useMemo(() => {
    const isGurpreetAccount = activeAccount?.name === "Gurpreet Singh" || activeAccount?.id === "acc-farmer";
    return localLots.filter(l =>
      !activeAccount?.id ||
      l.farmerId === activeAccount.id ||
      l.farmer === activeAccount.name ||
      (isGurpreetAccount && l.farmer === "Gurpreet Singh")
    );
  }, [localLots, activeAccount]);

  const activeLotsCount = allMyLots.filter(l => getListingState(l) === "Active").length;
  const reservedLotsCount = allMyLots.filter(l => getListingState(l) === "Reserved").length;
  const soldLotsCount = allMyLots.filter(l => getListingState(l) === "Sold").length;
  const draftLotsCount = allMyLots.filter(l => getListingState(l) === "Draft").length;

  const totalListed = allMyLots.reduce((acc, l) => acc + Number(l.est || 0), 0);
  const totalSold = allMyLots.filter(l => getListingState(l) === "Sold").reduce((acc, l) => acc + Number(l.act ?? l.est ?? 0), 0);

  // Calculate simulated DBT Payouts
  const dbtPayouts = allMyLots
    .filter(l => getListingState(l) === "Sold")
    .reduce((acc, l) => acc + (Number(l.act ?? l.est) * Number(l.price || 1800)), 0);

  // Buyer matches calculation for farmer's lots
  const buyerMatches = useMemo(() => {
    if (!farmerLots.length) return [];
    const openLot = farmerLots[0];
    return processors.map(p => {
      const isCompat = p.accepted?.includes(openLot.residue);
      return {
        ...p,
        lotId: openLot.id,
        lotResidue: openLot.residue,
        lotQty: openLot.est,
        compat: isCompat,
        score: isCompat ? 94 : 45,
        offeredPrice: p.price || 1850
      };
    }).filter(m => m.compat).slice(0, 4);
  }, [farmerLots, processors]);

  // Handle lot state transitions (Active, Reserved, Sold, Draft)
  const handleUpdateLotState = (lotId, newState) => {
    const statusMap = {
      Active: "Listed",
      Reserved: "Collection planned",
      Sold: "Collected",
      Draft: "Listed"
    };
    const targetStatus = statusMap[newState] || newState;

    setLocalLots(prev => prev.map(l => {
      if (l.id === lotId) {
        return {
          ...l,
          listingState: newState,
          status: targetStatus,
          history: [...(l.history || []), { status: targetStatus, state: newState, at: new Date().toISOString() }]
        };
      }
      return l;
    }));

    if (onUpdateLot) {
      onUpdateLot(lotId, targetStatus, { listingState: newState });
    }
    notify?.(`Listing ${lotId} marked as "${newState}".`);
  };

  // Submit quick produce listing
  const handleCreateProduceSubmit = (e) => {
    e.preventDefault();
    const newLotId = `L-${String(200 + localLots.length + 1).padStart(3, "0")}`;
    const status = quickState === "Draft" ? "Listed" : "Listed";

    const createdLot = {
      id: newLotId,
      farmer: activeAccount.name || "Gurpreet Singh",
      farmerId: activeAccount.id || "acc-farmer",
      village: quickVillage,
      district: activeAccount.district || "Sangrur",
      residue: quickCrop,
      est: Number(quickQty),
      act: null,
      price: Number(quickPrice),
      moisture: quickMoisture,
      baleType: quickBaleType,
      quality: "Standard",
      status,
      listingState: quickState,
      from: new Date().toISOString().slice(0, 10),
      availableUntil: "30 Nov",
      image: quickCrop === "Wheat straw" ? "/images/hero_harvest.jpg" : "/images/straw_bales.jpg",
      history: [{ status, state: quickState, at: new Date().toISOString() }]
    };

    setLocalLots(prev => [createdLot, ...prev]);

    if (onAddLot) {
      onAddLot({
        farmer: activeAccount.name || "Gurpreet Singh",
        village: quickVillage,
        residue: quickCrop,
        est: Number(quickQty),
        from: new Date().toISOString().slice(0, 10),
        until: "2026-11-30",
        price: Number(quickPrice),
        quality: "Standard",
        moisture: quickMoisture,
        baleType: quickBaleType
      });
    }

    setActiveTab("inventory");
    notify?.(`Success! Created ${newLotId} (${quickState} state).`);
  };

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
      </div>
    );
  }

  if (error) {
    return (
      <div className="kl-dashboard-error" role="alert">
        <div className="kl-error-icon">⚠</div>
        <h3>Failed to load farmgate data</h3>
        <p>{error}</p>
        <button className="primary" onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="kl-farmer-portal">
      {/* 1. SELLER / FARMER BESPOKE TOP STATUS: HARVEST & FIELD TELEMETRY */}
      <div className="kl-farmer-field-telemetry">
        <div className="kl-farmer-telemetry-badge">
          <span className="kl-field-sun-icon">☀️</span>
          <div>
            <b>Sangrur &amp; Malerkotla Belt · 28°C</b>
            <small>Clear skies · Low humidity · Optimum mechanized baling window</small>
          </div>
        </div>
        <div className="kl-farmer-season-progress">
          <div className="kl-season-label-row">
            <span>🌾 Kharif Harvest Season 2026: <b>62% Cleared</b></span>
            <span>Zero-Burn Compliance: <b style={{ color: "var(--kl-green)" }}>100% Verified ✓</b></span>
          </div>
          <div className="kl-season-bar-track">
            <div className="kl-season-bar-fill" style={{ width: "62%" }} />
          </div>
        </div>
      </div>

      {/* 2. SELLER / FARMER BESPOKE HERO: "PRODUCER HARVEST STUDIO" */}
      <section className="kl-farmer-hero-console">
        <div className="kl-farmer-hero-main">
          <div className="kl-farmer-emblem-badge">
            <span className="kl-farmer-seed-icon">🌾</span>
            <span>FARMGATE PRODUCER DESK</span>
          </div>
          <h2>Welcome back, Sardar {activeAccount.name}</h2>
          <p>
            Field Parcel: <b>{activeAccount.village || "Dhuri"} Cluster</b>, {activeAccount.district || "Sangrur"} · Certified Zero-Burn Supplier
          </p>
          <div className="kl-farmer-credential-chips">
            <span className="kl-farmer-chip-verified">✓ Aadhaar e-KYC Verified</span>
            <span className="kl-farmer-chip-dbt">💳 DBT Linked: SBI •••• 4821</span>
            <span className="kl-farmer-chip-org">🌱 {activeAccount.org || "Dhuri Progressive Farmers Collective"}</span>
          </div>
        </div>

        {/* Big Main Call-to-Action for Seller */}
        <div className="kl-farmer-hero-cta">
          <button
            type="button"
            className="kl-farmer-main-action-btn"
            onClick={() => setActiveTab("quickAdd")}
          >
            <span className="kl-action-btn-icon">＋</span>
            <div style={{ textAlign: "left" }}>
              <b>Add Produce</b>
              <small>List or draft crop residue</small>
            </div>
          </button>
        </div>
      </section>

      {/* 3. SELLER / FARMER BESPOKE TELEMETRY COUNTERS */}
      <div className="kl-farmer-kpi-deck">
        <div className="kl-farmer-kpi-card kpi-active" onClick={() => { setActiveTab("inventory"); setFilterState("Active"); }}>
          <div className="kl-kpi-top">
            <span className="kl-kpi-dot dot-active" />
            <small>ACTIVE ON MARKET</small>
          </div>
          <b>{activeLotsCount} <span className="kl-kpi-unit">lots</span></b>
          <div className="kl-kpi-foot">Ready for offtake buyer matching</div>
        </div>

        <div className="kl-farmer-kpi-card kpi-reserved" onClick={() => { setActiveTab("inventory"); setFilterState("Reserved"); }}>
          <div className="kl-kpi-top">
            <span className="kl-kpi-dot dot-reserved" />
            <small>RESERVED / BALING</small>
          </div>
          <b>{reservedLotsCount} <span className="kl-kpi-unit">lots</span></b>
          <div className="kl-kpi-foot">Baler trolley scheduled &amp; en-route</div>
        </div>

        <div className="kl-farmer-kpi-card kpi-sold" onClick={() => { setActiveTab("inventory"); setFilterState("Sold"); }}>
          <div className="kl-kpi-top">
            <span className="kl-kpi-dot dot-sold" />
            <small>SOLD &amp; DELIVERED</small>
          </div>
          <b style={{ color: "var(--kl-green)" }}>{totalSold.toFixed(1)} <span className="kl-kpi-unit">t</span></b>
          <div className="kl-kpi-foot">{soldLotsCount} lots processed &amp; cleared</div>
        </div>

        <div className="kl-farmer-kpi-card kpi-payout" onClick={() => setActiveTab("passbook")}>
          <div className="kl-kpi-top">
            <span className="kl-kpi-dot dot-payout" />
            <small>DIRECT DBT SETTLED</small>
          </div>
          <b style={{ color: "var(--kl-green)" }}>₹{dbtPayouts > 0 ? (dbtPayouts / 1000).toFixed(1) + "k" : "33.5k"}</b>
          <div className="kl-kpi-foot">Direct government bank credit</div>
        </div>
      </div>

      {/* 4. SELLER / FARMER BESPOKE WORKSPACE NAVIGATION TABS */}
      <div className="kl-farmer-nav-tabs">
        <button
          type="button"
          className={`kl-farmer-nav-tab ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          ▤ My Produce Listings ({allMyLots.length})
        </button>
        <button
          type="button"
          className={`kl-farmer-nav-tab ${activeTab === "quickAdd" ? "active" : ""}`}
          onClick={() => setActiveTab("quickAdd")}
        >
          ＋ Add Produce (Draft / Publish)
        </button>
        <button
          type="button"
          className={`kl-farmer-nav-tab ${activeTab === "inquiries" ? "active" : ""}`}
          onClick={() => setActiveTab("inquiries")}
        >
          🤝 Buyer Offers ({buyerMatches.length})
        </button>
        <button
          type="button"
          className={`kl-farmer-nav-tab ${activeTab === "pickups" ? "active" : ""}`}
          onClick={() => setActiveTab("pickups")}
        >
          🚜 Baler Pickup Live Tracker
        </button>
        <button
          type="button"
          className={`kl-farmer-nav-tab ${activeTab === "passbook" ? "active" : ""}`}
          onClick={() => setActiveTab("passbook")}
        >
          💳 DBT Bank Passbook
        </button>
      </div>

      {/* ================= VIEW 1: MY PRODUCE LISTINGS WITH EXPLICIT LIFECYCLE STATES ================= */}
      {activeTab === "inventory" && (
        <section className="kl-farmer-section">
          <div className="kl-farmer-section-header">
            <div>
              <h3>Produce Inventory &amp; Lifecycle</h3>
              <p>Manage and transition each crop residue lot across clear states: <b>Draft</b>, <b>Active</b>, <b>Reserved</b>, and <b>Sold</b>.</p>
            </div>
            <button
              type="button"
              className="primary kl-btn-highlight"
              onClick={() => setActiveTab("quickAdd")}
            >
              ＋ Add Produce
            </button>
          </div>

          {/* Listing State Filter Pills Bar */}
          <div className="kl-farmer-state-filter-bar">
            <div className="kl-state-pills">
              <button
                type="button"
                className={`kl-state-pill ${filterState === "All" ? "active" : ""}`}
                onClick={() => setFilterState("All")}
              >
                All Lots ({allMyLots.length})
              </button>
              <button
                type="button"
                className={`kl-state-pill pill-active ${filterState === "Active" ? "active" : ""}`}
                onClick={() => setFilterState("Active")}
              >
                ● Active ({activeLotsCount})
              </button>
              <button
                type="button"
                className={`kl-state-pill pill-reserved ${filterState === "Reserved" ? "active" : ""}`}
                onClick={() => setFilterState("Reserved")}
              >
                🔒 Reserved ({reservedLotsCount})
              </button>
              <button
                type="button"
                className={`kl-state-pill pill-sold ${filterState === "Sold" ? "active" : ""}`}
                onClick={() => setFilterState("Sold")}
              >
                ✓ Sold ({soldLotsCount})
              </button>
              <button
                type="button"
                className={`kl-state-pill pill-draft ${filterState === "Draft" ? "active" : ""}`}
                onClick={() => setFilterState("Draft")}
              >
                ✎ Drafts ({draftLotsCount})
              </button>
            </div>

            <div className="kl-farmer-quick-search">
              <input
                type="text"
                placeholder="Search lot ID, village, or crop..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="kl-dash-search-input"
              />
              <select
                value={filterResidue}
                onChange={e => setFilterResidue(e.target.value)}
                className="kl-dash-filter-select"
              >
                <option value="All">All Crops</option>
                <option value="Paddy straw">Paddy straw</option>
                <option value="Wheat straw">Wheat straw</option>
                <option value="Mustard stalk">Mustard stalk</option>
              </select>
            </div>
          </div>

          {farmerLots.length === 0 ? (
            <div className="kl-farmer-empty-card">
              <div className="kl-farmer-empty-symbol">🌾</div>
              <h4>No listings found in "{filterState}" state</h4>
              <p>Add your crop residue supply to receive mechanized baler bookings and direct DBT bank transfers.</p>
              <button
                type="button"
                className="primary kl-btn-highlight"
                onClick={() => setActiveTab("quickAdd")}
              >
                ＋ Add Produce Now
              </button>
            </div>
          ) : (
            <div className="kl-farmer-inventory-grid">
              {farmerLots.map(lot => {
                const state = getListingState(lot);
                const moistureNum = parseFloat(lot.moisture) || 12.5;

                return (
                  <div key={lot.id} className={`kl-farmer-produce-card state-${state.toLowerCase()}`}>
                    {/* Top Row: Lot ID & Explicit Lifecycle Badge */}
                    <div className="kl-produce-card-top">
                      <div className="kl-produce-title-block">
                        <span className="kl-produce-id-pill">{lot.id}</span>
                        <h4>{lot.residue}</h4>
                        <span className="kl-produce-location">📍 {lot.village}, {lot.district || "Sangrur"}</span>
                      </div>
                      <div className="kl-produce-state-badge-wrap">
                        <span className={`kl-state-badge badge-${state.toLowerCase()}`}>
                          {state === "Active" && "● Active / Open"}
                          {state === "Reserved" && "🔒 Reserved"}
                          {state === "Sold" && "✓ Sold & Delivered"}
                          {state === "Draft" && "✎ Draft"}
                        </span>
                      </div>
                    </div>

                    {/* Middle Specs Grid */}
                    <div className="kl-produce-card-specs">
                      <div className="kl-produce-spec-box">
                        <small>QUANTITY</small>
                        <b>{lot.est} tonnes</b>
                      </div>
                      <div className="kl-produce-spec-box">
                        <small>PRICE / TONNE</small>
                        <b style={{ color: "var(--kl-green)" }}>₹{lot.price || 1800}</b>
                      </div>
                      <div className="kl-produce-spec-box">
                        <small>PACKAGING</small>
                        <span>{lot.baleType || "Mechanized Bales"}</span>
                      </div>
                      <div className="kl-produce-spec-box">
                        <small>EST. VALUE</small>
                        <b>₹{((Number(lot.est) || 1) * (Number(lot.price) || 1800)).toLocaleString("en-IN")}</b>
                      </div>
                    </div>

                    {/* Moisture Gauge Meter Widget */}
                    <div className="kl-produce-moisture-meter">
                      <div className="kl-moisture-label-row">
                        <span>Field Moisture: <b>{lot.moisture || "12.4%"}</b></span>
                        <span className={`kl-moisture-status ${moistureNum <= 14 ? "optimal" : "warning"}`}>
                          {moistureNum <= 14 ? "✓ Optimal (<14%)" : "Acceptable"}
                        </span>
                      </div>
                      <div className="kl-moisture-bar-track">
                        <div
                          className="kl-moisture-bar-fill"
                          style={{
                            width: `${Math.min(100, (moistureNum / 20) * 100)}%`,
                            background: moistureNum <= 14 ? "var(--kl-green)" : "var(--kl-gold)"
                          }}
                        />
                      </div>
                    </div>

                    {/* Footer: Quick 1-Click State Toggle & Actions */}
                    <div className="kl-produce-card-actions">
                      {state === "Draft" && (
                        <>
                          <button
                            type="button"
                            className="primary kl-btn-sm kl-btn-highlight"
                            onClick={() => handleUpdateLotState(lot.id, "Active")}
                            title="Publish this draft listing to open market"
                          >
                            ✓ Publish Active
                          </button>
                          <button
                            type="button"
                            className="secondary kl-btn-sm"
                            onClick={() => {
                              const newPrice = window.prompt("Update price (₹/tonne):", String(lot.price || 1800));
                              if (newPrice && !isNaN(newPrice)) {
                                setLocalLots(prev => prev.map(l => l.id === lot.id ? { ...l, price: Number(newPrice) } : l));
                                notify?.(`Updated price to ₹${newPrice}/t for ${lot.id}`);
                              }
                            }}
                          >
                            ✎ Edit Price
                          </button>
                        </>
                      )}

                      {state === "Active" && (
                        <>
                          <button
                            type="button"
                            className="secondary kl-btn-sm"
                            onClick={() => handleUpdateLotState(lot.id, "Reserved")}
                            title="Mark as reserved when offtake buyer confirms booking"
                          >
                            🔒 Reserve Lot
                          </button>
                          <button
                            type="button"
                            className="secondary kl-btn-sm"
                            onClick={() => handleUpdateLotState(lot.id, "Draft")}
                            title="Unpublish to private draft"
                          >
                            Set Draft
                          </button>
                          <button
                            type="button"
                            className="primary kl-btn-sm"
                            onClick={() => setActiveTab("inquiries")}
                          >
                            Find Buyers →
                          </button>
                        </>
                      )}

                      {state === "Reserved" && (
                        <>
                          <button
                            type="button"
                            className="primary kl-btn-sm kl-btn-highlight"
                            onClick={() => handleUpdateLotState(lot.id, "Sold")}
                            title="Confirm baler collected & mark as sold"
                          >
                            ✓ Mark as Sold
                          </button>
                          <button
                            type="button"
                            className="secondary kl-btn-sm"
                            onClick={() => handleUpdateLotState(lot.id, "Active")}
                            title="Re-open to active market"
                          >
                            ↩ Re-Open
                          </button>
                        </>
                      )}

                      {state === "Sold" && (
                        <>
                          <span className="kl-sold-confirmed-pill">
                            ✓ Weighbridge Verified &amp; DBT Dispatched
                          </span>
                          <button
                            type="button"
                            className="secondary kl-btn-sm"
                            onClick={() => setActiveTab("passbook")}
                          >
                            Passbook →
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ================= VIEW 2: TACTILE "ADD PRODUCE" PUBLISHER CONSOLE ================= */}
      {activeTab === "quickAdd" && (
        <section className="kl-farmer-section">
          <div className="kl-farmer-publisher-card">
            <div className="kl-publisher-header">
              <span className="kl-publisher-badge">🌾 FARMER LOT CREATION DESK</span>
              <h3>What crop residue are you harvesting today?</h3>
              <p>Publish an active supply lot for biomass offtakers, or save as a draft to finalize later.</p>
            </div>

            <form onSubmit={handleCreateProduceSubmit} className="kl-farmer-publisher-form">
              {/* Visual Crop Selector */}
              <div className="kl-crop-choice-group">
                <label className="kl-publisher-label">1. Select Crop Residue Type:</label>
                <div className="kl-crop-pills-row">
                  {[
                    { id: "Paddy straw", label: "Paddy Straw", icon: "🌾", desc: "Parali · Mechanized Bales" },
                    { id: "Wheat straw", label: "Wheat Straw", icon: "🌾", desc: "Toori · Dry Feedstock" },
                    { id: "Mustard stalk", label: "Mustard Stalk", icon: "🌻", desc: "Bio-Pellet Biomass" },
                    { id: "Cotton stalk", label: "Cotton Stalk", icon: "🌿", desc: "Industrial Offtake" }
                  ].map(c => (
                    <div
                      key={c.id}
                      className={`kl-crop-choice-card ${quickCrop === c.id ? "selected" : ""}`}
                      onClick={() => setQuickCrop(c.id)}
                    >
                      <span className="kl-crop-icon">{c.icon}</span>
                      <b>{c.label}</b>
                      <small>{c.desc}</small>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity, Village & Price Controls */}
              <div className="kl-publisher-inputs-grid">
                <div className="kl-input-field">
                  <label>Estimated Quantity (tonnes):</label>
                  <div className="kl-stepper-wrap">
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={quickQty}
                      onChange={e => setQuickQty(Number(e.target.value))}
                      required
                    />
                    <span className="kl-input-suffix">tonnes</span>
                  </div>
                </div>

                <div className="kl-input-field">
                  <label>Expected Price (₹ / tonne):</label>
                  <div className="kl-stepper-wrap">
                    <input
                      type="number"
                      min="500"
                      step="50"
                      value={quickPrice}
                      onChange={e => setQuickPrice(Number(e.target.value))}
                      required
                    />
                    <span className="kl-input-suffix">₹/t</span>
                  </div>
                </div>

                <div className="kl-input-field">
                  <label>Village / Farm Parcel:</label>
                  <input
                    type="text"
                    value={quickVillage}
                    onChange={e => setQuickVillage(e.target.value)}
                    required
                  />
                </div>

                <div className="kl-input-field">
                  <label>Packaging / Baling Format:</label>
                  <select value={quickBaleType} onChange={e => setQuickBaleType(e.target.value)}>
                    <option value="Mechanized Bales">Mechanized Bales (Standard)</option>
                    <option value="Dry Loose Straw">Dry Loose Straw</option>
                    <option value="Raked & Windrowed">Raked &amp; Windrowed</option>
                  </select>
                </div>
              </div>

              {/* Instant Earnings Calculation Banner */}
              <div className="kl-publisher-earnings-banner">
                <div>
                  <small>ESTIMATED TOTAL DBT EARNINGS</small>
                  <b>₹{((Number(quickQty) || 0) * (Number(quickPrice) || 0)).toLocaleString("en-IN")}</b>
                </div>
                <span>Government Direct Bank Transfer linked to SBI •••• 4821</span>
              </div>

              {/* Publication State Toggle (Active vs Draft) */}
              <div className="kl-publisher-state-toggle">
                <label className="kl-publisher-label">2. Listing Publication State:</label>
                <div className="kl-state-radio-boxes">
                  <label className={`kl-state-radio-box ${quickState === "Active" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="quickState"
                      checked={quickState === "Active"}
                      onChange={() => setQuickState("Active")}
                    />
                    <div>
                      <b>● Publish as Active</b>
                      <small>Immediately discoverable by biomass plants &amp; baler fleets</small>
                    </div>
                  </label>

                  <label className={`kl-state-radio-box ${quickState === "Draft" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="quickState"
                      checked={quickState === "Draft"}
                      onChange={() => setQuickState("Draft")}
                    />
                    <div>
                      <b>✎ Save as Private Draft</b>
                      <small>Save to your private draft queue; publish when harvest starts</small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="kl-publisher-actions-row">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setActiveTab("inventory")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary kl-btn-lg kl-btn-highlight"
                >
                  {quickState === "Active" ? "Publish Produce Listing →" : "Save Produce Draft"}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* ================= VIEW 3: BUYER OFFTAKE MATCHES ================= */}
      {activeTab === "inquiries" && (
        <section className="kl-farmer-section">
          <div className="kl-farmer-section-header">
            <div>
              <h3>Verified Biomass Offtakers Nearby</h3>
              <p>Certified industrial processing units in Sangrur and Patiala purchasing farmgate straw.</p>
            </div>
            <span className="kl-status-badge verified">Verified Offtakers ✓</span>
          </div>

          <div className="kl-farmer-matches-grid">
            {buyerMatches.map(m => (
              <div key={m.id} className="kl-farmer-offtaker-card">
                <div className="kl-offtaker-head">
                  <div>
                    <span className="kl-offtaker-type-tag">{m.type || "Bio-Energy Facility"}</span>
                    <h4>{m.name}</h4>
                    <span className="kl-offtaker-dist">📍 {m.location} ({m.distance || 18} km from your fields)</span>
                  </div>
                  <span className="kl-pill kl-pill-score">{m.score}% Match</span>
                </div>

                <div className="kl-offtaker-specs">
                  <div>
                    <small>OFFERED RATE</small>
                    <b style={{ color: "var(--kl-green)", fontSize: 16 }}>₹{m.offeredPrice}/t</b>
                  </div>
                  <div>
                    <small>ACCEPTING</small>
                    <b>Paddy &amp; Wheat straw</b>
                  </div>
                  <div>
                    <small>GATE HOURS</small>
                    <span>{m.workingHours || "8 AM - 7 PM"}</span>
                  </div>
                </div>

                <div className="kl-offtaker-foot">
                  <small>Plant Head: {m.contactPerson || "Sunil Jain"}</small>
                  <button
                    type="button"
                    className="primary kl-btn-sm"
                    onClick={() => onContactPartner?.(m, farmerLots[0] || { id: "L-101", residue: "Paddy straw", est: 12.5 })}
                  >
                    📞 Connect with Plant
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= VIEW 4: BALER PICKUP LIVE TRACKER ================= */}
      {activeTab === "pickups" && (
        <section className="kl-farmer-section">
          <div className="kl-farmer-section-header">
            <div>
              <h3>Baler Dispatch &amp; Pickup Tracking</h3>
              <p>Real-time telematics of baler allocation, tractor trolley arrival, and gate weighbridges.</p>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => onNavigate?.("Live Feeds")}
            >
              📹 Open Field Baler Camera Feed →
            </button>
          </div>

          <div className="kl-farmer-tracker-card">
            <div className="kl-tracker-header">
              <div>
                <span className="kl-status Collected">🚜 Baler Unit Active</span>
                <h4>Longowal &amp; Dhuri East Farmgate Cluster</h4>
                <small>Assigned Vehicle: Tractor Trolley PB-13-X-4921 · Driver: Sukhwinder Singh</small>
              </div>
              <div className="kl-tracker-eta">
                <small>ARRIVAL ESTIMATE</small>
                <b>Today, 2:30 PM</b>
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="kl-farmer-stepper">
              <div className="kl-step-node done">
                <div className="kl-step-icon">✓</div>
                <b>Lot Registered</b>
                <small>12.5 t Parcel #4 verified</small>
              </div>
              <div className="kl-step-connector done" />
              <div className="kl-step-node done">
                <div className="kl-step-icon">✓</div>
                <b>Baler Assigned</b>
                <small>Malwa Fleet Unit #04</small>
              </div>
              <div className="kl-step-connector done" />
              <div className="kl-step-node current">
                <div className="kl-step-icon">🚜</div>
                <b>Baling Onfield</b>
                <small>82 mechanized bales wrapped</small>
              </div>
              <div className="kl-step-connector" />
              <div className="kl-step-node future">
                <div className="kl-step-icon">⚖</div>
                <b>Depot Weighbridge</b>
                <small>Tare &amp; net gross logged</small>
              </div>
              <div className="kl-step-connector" />
              <div className="kl-step-node future">
                <div className="kl-step-icon">💳</div>
                <b>DBT Payout</b>
                <small>Bank credit dispatched</small>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ================= VIEW 5: KISAN DBT PASSBOOK & SUBSIDY LEDGER ================= */}
      {activeTab === "passbook" && (
        <section className="kl-farmer-section">
          <div className="kl-farmer-section-header">
            <div>
              <h3>Direct Benefit Transfer (DBT) Bank Passbook</h3>
              <p>Certified record of government and biomass offtake payments credited to your account.</p>
            </div>
            <span className="kl-status-badge verified">Aadhaar PFMS Seeded ✓</span>
          </div>

          <div className="kl-farmer-passbook-card">
            <div className="kl-passbook-banner">
              <div>
                <span className="kl-passbook-govt-label">PUNJAB AGRI CIRCULAR DIRECT BENEFIT TRANSFER</span>
                <h4>Beneficiary: Sardar {activeAccount.name}</h4>
                <div className="kl-passbook-acc-no">
                  <span>A/c: </span>
                  <b>•••• •••• •••• 4821</b>
                  <span> (State Bank of India, Dhuri Branch)</span>
                </div>
              </div>
              <div className="kl-passbook-stamp">
                <span>GOVT OF PUNJAB</span>
                <b>DBT VERIFIED</b>
                <small>Zero-Burn Incentive</small>
              </div>
            </div>

            <div className="kl-passbook-ledger">
              <div className="kl-ledger-header">
                <span>DATE</span>
                <span>PARTICULARS / LOT ID</span>
                <span>TONNAGE</span>
                <span>TXN REFERENCE</span>
                <span style={{ textAlign: "right" }}>CREDIT AMOUNT (₹)</span>
              </div>
              <div className="kl-ledger-row">
                <span>12 Oct 2026</span>
                <div>
                  <b>Lot L-096 (Paddy Straw)</b>
                  <small>Sangrur Biomass Pellets Offtake</small>
                </div>
                <span>15.0 t</span>
                <code>DBT-PB-2026-8941</code>
                <b style={{ color: "var(--kl-green)", textAlign: "right" }}>+ ₹22,500.00</b>
              </div>
              <div className="kl-ledger-row">
                <span>28 Apr 2026</span>
                <div>
                  <b>Lot L-084 (Wheat Straw)</b>
                  <small>Patiala Paper Board Mill Offtake</small>
                </div>
                <span>12.0 t</span>
                <code>DBT-PB-2026-3420</code>
                <b style={{ color: "var(--kl-green)", textAlign: "right" }}>+ ₹18,000.00</b>
              </div>
              <div className="kl-ledger-row">
                <span>15 Nov 2025</span>
                <div>
                  <b>State Zero-Burn Incentive Bonus</b>
                  <small>Satellite Audit Zero Fire Anomaly</small>
                </div>
                <span>24.0 t</span>
                <code>PB-GOV-AGRI-1004</code>
                <b style={{ color: "var(--kl-green)", textAlign: "right" }}>+ ₹12,000.00</b>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
