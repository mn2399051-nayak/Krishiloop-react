import { useState, useMemo, useEffect, useRef } from "react";

export default function BuyerDashboard({
  activeAccount,
  lots = [],
  demands = [],
  records = [],
  jobs = [],
  loading = false,
  onPostDemand,
  onContactFarmer,
  onNavigate,
  notify
}) {
  const [activeTab, setActiveTab] = useState("discover"); // "discover" | "watchlist" | "tenders" | "orders"
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCrop, setFilterCrop] = useState("All");
  const [filterMoisture, setFilterMoisture] = useState("All");
  const [filterDistrict, setFilterDistrict] = useState("All");
  const [filterQuantity, setFilterQuantity] = useState("All"); // "All" | "<20t" | "20-50t" | ">50t"
  const [filterPrice, setFilterPrice] = useState("All"); // "All" | "<1750" | "1750-1850" | ">1850"

  // Comparison State (up to 3 lots)
  const [compareLotIds, setCompareLotIds] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const searchInputRef = useRef(null);

  // Saved / Bookmarked Lots in localStorage
  const [savedLotIds, setSavedLotIds] = useState(() => {
    try {
      const raw = localStorage.getItem("krishiloop-saved-lots");
      return raw ? JSON.parse(raw) : ["L-101", "L-103"];
    } catch {
      return ["L-101", "L-103"];
    }
  });

  const [error, setError] = useState(null);

  // Sync saved lots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("krishiloop-saved-lots", JSON.stringify(savedLotIds));
    } catch {}
  }, [savedLotIds]);

  const toggleSaveLot = (lotId) => {
    setSavedLotIds(prev => {
      const next = prev.includes(lotId) ? prev.filter(id => id !== lotId) : [...prev, lotId];
      notify?.(prev.includes(lotId) ? `Removed lot ${lotId} from saved watchlist` : `Saved lot ${lotId} to your procurement watchlist`);
      return next;
    });
  };

  // Toggle compare lot selection (max 3)
  const toggleCompareLot = (lotId) => {
    setCompareLotIds(prev => {
      if (prev.includes(lotId)) {
        return prev.filter(id => id !== lotId);
      }
      if (prev.length >= 3) {
        notify?.("You can select up to 3 produce lots for side-by-side matrix evaluation.");
        return prev;
      }
      return [...prev, lotId];
    });
  };

  // Main Action: Find Produce
  const handleFindProduceMainAction = () => {
    setActiveTab("discover");
    setTimeout(() => {
      searchInputRef.current?.focus();
      const el = document.getElementById("kl-buyer-trading-desk");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  // Filter available produce lots with full multi-criteria filtering
  const availableLots = useMemo(() => {
    return lots.filter(l => {
      const isAvailable = !["Collected", "Processed"].includes(l.status);
      const matchesSearch = !searchQuery || `${l.id} ${l.farmer} ${l.village} ${l.residue}`.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCrop = filterCrop === "All" || l.residue === filterCrop;
      const matchesDistrict = filterDistrict === "All" || l.village === filterDistrict || l.district === filterDistrict;

      // Moisture Filter
      const moistureVal = parseFloat(l.moisture) || 13;
      const matchesMoisture = filterMoisture === "All" ||
        (filterMoisture === "<=14%" && moistureVal <= 14) ||
        (filterMoisture === "<=16%" && moistureVal <= 16);

      // Quantity Filter
      const qty = Number(l.est || 0);
      let matchesQuantity = true;
      if (filterQuantity === "<20t") matchesQuantity = qty < 20;
      else if (filterQuantity === "20-50t") matchesQuantity = qty >= 20 && qty <= 50;
      else if (filterQuantity === ">50t") matchesQuantity = qty > 50;

      // Price Filter
      const price = Number(l.price || 1800);
      let matchesPrice = true;
      if (filterPrice === "<1750") matchesPrice = price < 1750;
      else if (filterPrice === "1750-1850") matchesPrice = price >= 1750 && price <= 1850;
      else if (filterPrice === ">1850") matchesPrice = price > 1850;

      return isAvailable && matchesSearch && matchesCrop && matchesDistrict && matchesMoisture && matchesQuantity && matchesPrice;
    });
  }, [lots, searchQuery, filterCrop, filterDistrict, filterMoisture, filterQuantity, filterPrice]);

  // Saved lots
  const savedLots = useMemo(() => {
    return lots.filter(l => savedLotIds.includes(l.id));
  }, [lots, savedLotIds]);

  // Compared lots
  const comparedLots = useMemo(() => {
    return lots.filter(l => compareLotIds.includes(l.id));
  }, [lots, compareLotIds]);

  // Buyer's demands / requests
  const buyerDemands = useMemo(() => {
    return demands.filter(d => {
      if (d.buyerId && activeAccount?.id && (d.buyerId === activeAccount.id || d.buyer_id === activeAccount.id)) return true;
      if (activeAccount?.org && d.processor) {
        const org = activeAccount.org.toLowerCase();
        const proc = d.processor.toLowerCase();
        return proc.includes(org) || org.includes(proc);
      }
      return !activeAccount?.org;
    });
  }, [demands, activeAccount]);

  // Confirmed orders and fulfillment tracking
  const confirmedOrders = useMemo(() => {
    return [
      {
        id: "PO-2026-881",
        lotId: "L-098",
        supplier: "Gurpreet Singh (Dhuri Cluster)",
        residue: "Paddy straw (Mechanized Bales)",
        quantity: 32.0,
        agreedPrice: 1850,
        totalValue: 59200,
        destination: activeAccount.org || "Patiala Paper Board Mill",
        status: "In Transit",
        balerFleet: "Malwa Fleet #02 (Tractor Trolley PB-13-X-4921)",
        eta: "Today, 4:30 PM",
        weighbridgeSlip: "WB-SAN-4891"
      },
      {
        id: "PO-2026-874",
        lotId: "L-092",
        supplier: "Harinder Singh (Bhawanigarh)",
        residue: "Paddy straw",
        quantity: 24.5,
        agreedPrice: 1800,
        totalValue: 44100,
        destination: activeAccount.org || "Patiala Paper Board Mill",
        status: "Delivered",
        balerFleet: "Fleet Vehicle PB-11-AB-8802",
        completedAt: "10 Oct 2026",
        weighbridgeSlip: "WB-SAN-4820"
      }
    ];
  }, [activeAccount]);

  // Total volume procured
  const totalProcured = 310.0;
  const activeContracts = confirmedOrders.length + 3;
  const coalSaved = 185;

  if (loading) {
    return (
      <div className="kl-dashboard-loading" role="status">
        <div className="kl-skeleton-hero" />
        <div className="kl-skeleton-metrics">
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
        <h3>Failed to load buyer procurement desk</h3>
        <p>{error}</p>
        <button className="primary" onClick={() => setError(null)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="kl-buyer-portal">
      {/* 1. BUYER BESPOKE TOP COMMODITY SPOT TICKER BAR */}
      <div className="kl-buyer-ticker-bar" role="marquee" aria-label="Biomass Commodity Spot Price Ticker">
        <div className="kl-ticker-badge">LIVE COMMODITY INDEX</div>
        <div className="kl-ticker-stream">
          <span className="kl-ticker-item">🌾 <b>PADDY STRAW (MALWA):</b> ₹1,820/t <small className="up">▲ +₹35</small></span>
          <span className="kl-ticker-item">🌾 <b>WHEAT STRAW (TOORI):</b> ₹1,650/t <small className="flat">― ₹0</small></span>
          <span className="kl-ticker-item">⚡ <b>BOILER GRADE MOISTURE:</b> ≤ 14.0%</span>
          <span className="kl-ticker-item">🏭 <b>MILL DEMAND ACTIVE:</b> 480 t/day</span>
          <span className="kl-ticker-item">🚚 <b>HAULAGE LOGISTICS INDEX:</b> ₹120/t (avg 18 km)</span>
          <span className="kl-ticker-item">⚖ <b>GATE WEIGHBRIDGE QUEUE:</b> 2 Vehicles</span>
        </div>
      </div>

      {/* 2. BUYER BESPOKE INDUSTRIAL PROCUREMENT HEADER */}
      <section className="kl-buyer-terminal-header">
        <div className="kl-buyer-terminal-info">
          <div className="kl-buyer-tagline">
            <span className="kl-terminal-pulse-dot" />
            <span>INDUSTRIAL COMMODITY PROCUREMENT TERMINAL</span>
            <span className="kl-status-badge verified">✓ GSTIN &amp; ESG Compliant</span>
          </div>
          <h2>{activeAccount.org || "Patiala Paper Board Mill"} — Feedstock Terminal</h2>
          <p>
            Mill Gate: <b>{activeAccount.district || "Patiala"} Depot</b> · Commercial Offtaker · Scope-3 ESG Certified
          </p>
        </div>

        {/* Primary Action Button: "Find Produce" */}
        <div className="kl-buyer-terminal-actions">
          <button
            type="button"
            className="kl-buyer-find-produce-btn"
            onClick={handleFindProduceMainAction}
            title="Discover and evaluate farmgate supply lots"
          >
            <span className="kl-search-radar-icon">⌕</span>
            <div style={{ textAlign: "left" }}>
              <b>Find Produce ({availableLots.length})</b>
              <small>Filter, inspect &amp; compare</small>
            </div>
          </button>

          <button
            type="button"
            className="secondary"
            onClick={onPostDemand}
            title="Publish a feedstock requirement to regional balers"
          >
            ＋ Post Feedstock Tender
          </button>
        </div>
      </section>

      {/* 3. BUYER BESPOKE PROCUREMENT TELEMETRY DECK */}
      <div className="kl-buyer-metrics-strip">
        <div className="kl-buyer-metric-box">
          <small>FEEDSTOCK PROCURED (MT)</small>
          <b>{totalProcured.toFixed(1)} <span className="kl-buyer-unit">t</span></b>
          <span>Verified unburned biomass</span>
        </div>
        <div className="kl-buyer-metric-box">
          <small>AVAILABLE REGIONAL LOTS</small>
          <b style={{ color: "var(--kl-green)" }}>{availableLots.length} <span className="kl-buyer-unit">lots</span></b>
          <span>Within Sangrur &amp; Patiala radius</span>
        </div>
        <div className="kl-buyer-metric-box">
          <small>ACTIVE SUPPLY CONTRACTS</small>
          <b>{activeContracts} <span className="kl-buyer-unit">POs</span></b>
          <span>Scheduled delivery logistics</span>
        </div>
        <div className="kl-buyer-metric-box">
          <small>FOSSIL COAL OFFSET</small>
          <b style={{ color: "#3b82f6" }}>{coalSaved} <span className="kl-buyer-unit">t coal</span></b>
          <span>Scope-3 ESG carbon credits</span>
        </div>
      </div>

      {/* 4. BUYER BESPOKE TERMINAL WORKBENCH NAVIGATION */}
      <div className="kl-buyer-tabs-bar">
        <button
          type="button"
          className={`kl-buyer-tab ${activeTab === "discover" ? "active" : ""}`}
          onClick={() => setActiveTab("discover")}
        >
          ⌕ Discover &amp; Compare Produce ({availableLots.length})
        </button>
        <button
          type="button"
          className={`kl-buyer-tab ${activeTab === "watchlist" ? "active" : ""}`}
          onClick={() => setActiveTab("watchlist")}
        >
          ★ Procurement Watchlist ({savedLots.length})
        </button>
        <button
          type="button"
          className={`kl-buyer-tab ${activeTab === "tenders" ? "active" : ""}`}
          onClick={() => setActiveTab("tenders")}
        >
          ◷ Feedstock Tenders ({buyerDemands.length})
        </button>
        <button
          type="button"
          className={`kl-buyer-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📄 Confirmed Orders &amp; Weighbridges ({confirmedOrders.length})
        </button>
      </div>

      {/* ================= VIEW 1: COMMODITY PROCUREMENT MATRIX (DISCOVERY & DUAL-VIEW) ================= */}
      {activeTab === "discover" && (
        <section id="kl-buyer-trading-desk" className="kl-buyer-trading-section">
          {/* Top Bar with Search, Multi-Criteria Filters & View Switcher */}
          <div className="kl-buyer-control-panel">
            <div className="kl-buyer-filters-grid">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by lot ID, farmer, or cluster..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="kl-buyer-search-input"
              />

              {/* Crop Filter */}
              <select
                value={filterCrop}
                onChange={e => setFilterCrop(e.target.value)}
                className="kl-buyer-filter-select"
              >
                <option value="All">All Crops</option>
                <option value="Paddy straw">Paddy straw (Parali)</option>
                <option value="Wheat straw">Wheat straw (Toori)</option>
                <option value="Mustard stalk">Mustard stalk</option>
              </select>

              {/* Cluster Location */}
              <select
                value={filterDistrict}
                onChange={e => setFilterDistrict(e.target.value)}
                className="kl-buyer-filter-select"
              >
                <option value="All">All Clusters</option>
                <option value="Sangrur">Sangrur</option>
                <option value="Dhuri">Dhuri</option>
                <option value="Patiala">Patiala</option>
                <option value="Malerkotla">Malerkotla</option>
                <option value="Bhawanigarh">Bhawanigarh</option>
              </select>

              {/* Quantity Bracket */}
              <select
                value={filterQuantity}
                onChange={e => setFilterQuantity(e.target.value)}
                className="kl-buyer-filter-select"
              >
                <option value="All">All Quantities</option>
                <option value="<20t">Small Lot (&lt; 20 tonnes)</option>
                <option value="20-50t">Medium Lot (20 - 50 tonnes)</option>
                <option value=">50t">Bulk Volume (&gt; 50 tonnes)</option>
              </select>

              {/* Unit Price Bracket */}
              <select
                value={filterPrice}
                onChange={e => setFilterPrice(e.target.value)}
                className="kl-buyer-filter-select"
              >
                <option value="All">All Prices</option>
                <option value="<1750">&lt; ₹1,750 / tonne</option>
                <option value="1750-1850">₹1,750 - ₹1,850 / tonne</option>
                <option value=">1850">&gt; ₹1,850 / tonne</option>
              </select>

              {/* Moisture Bracket */}
              <select
                value={filterMoisture}
                onChange={e => setFilterMoisture(e.target.value)}
                className="kl-buyer-filter-select"
              >
                <option value="All">All Moisture Levels</option>
                <option value="<=14%">Max 14% (Boiler Grade)</option>
                <option value="<=16%">Max 16% (Standard Grade)</option>
              </select>
            </div>

            {/* View Mode Switcher: Matrix Table vs Cards */}
            <div className="kl-buyer-view-toggle-bar">
              <div className="kl-view-mode-buttons">
                <button
                  type="button"
                  className={`kl-view-btn ${viewMode === "table" ? "active" : ""}`}
                  onClick={() => setViewMode("table")}
                  title="Industrial Commodity Table Matrix"
                >
                  ☷ Table Matrix
                </button>
                <button
                  type="button"
                  className={`kl-view-btn ${viewMode === "grid" ? "active" : ""}`}
                  onClick={() => setViewMode("grid")}
                  title="Commodity Spec Cards"
                >
                  ⊞ Cards Grid
                </button>
              </div>

              {compareLotIds.length > 0 && (
                <button
                  type="button"
                  className="primary kl-btn-sm"
                  onClick={() => setShowCompareModal(true)}
                >
                  ⚖ Compare Selected ({compareLotIds.length}) →
                </button>
              )}
            </div>
          </div>

          {availableLots.length === 0 ? (
            <div className="kl-buyer-empty-desk">
              <div className="kl-buyer-empty-icon">🔍</div>
              <h4>No matching supply lots found</h4>
              <p>No farmgate lots match your current moisture, cluster, or price filters.</p>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCrop("All");
                  setFilterDistrict("All");
                  setFilterQuantity("All");
                  setFilterPrice("All");
                  setFilterMoisture("All");
                }}
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === "table" ? (
            /* DENSE PROFESSIONAL COMMODITY PROCUREMENT MATRIX TABLE */
            <div className="kl-buyer-matrix-wrap">
              <table className="kl-buyer-matrix-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>CMP</th>
                    <th>LOT ID</th>
                    <th>CROP RESIDUE</th>
                    <th>FARMER / ORIGIN</th>
                    <th>QTY (MT)</th>
                    <th>FIELD MOISTURE</th>
                    <th>BASE PRICE</th>
                    <th>EST. LANDED (₹/T)</th>
                    <th>FORMAT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {availableLots.map(lot => {
                    const isCompared = compareLotIds.includes(lot.id);
                    const isSaved = savedLotIds.includes(lot.id);
                    const basePrice = Number(lot.price || 1800);
                    const haulage = 120; // Average ₹120 haulage freight
                    const landedPrice = basePrice + haulage;
                    const moistureVal = parseFloat(lot.moisture) || 12.5;

                    return (
                      <tr key={lot.id} className={isCompared ? "row-comparing" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompareLot(lot.id)}
                            title="Select for comparison matrix"
                          />
                        </td>
                        <td>
                          <span className="kl-buyer-table-lot-id">{lot.id}</span>
                        </td>
                        <td>
                          <b>{lot.residue}</b>
                        </td>
                        <td>
                          <span>{lot.farmer}</span>
                          <small style={{ display: "block", color: "var(--kl-muted)" }}>📍 {lot.village} (~18 km)</small>
                        </td>
                        <td>
                          <b>{lot.est} t</b>
                        </td>
                        <td>
                          <span>{lot.moisture || "12.5%"}</span>
                          <small style={{ display: "block", color: moistureVal <= 14 ? "var(--kl-green)" : "var(--kl-gold-dark)" }}>
                            {moistureVal <= 14 ? "✓ Boiler Grade" : "Standard"}
                          </small>
                        </td>
                        <td>
                          <b>₹{basePrice}/t</b>
                        </td>
                        <td>
                          <b style={{ color: "#0284c7" }}>₹{landedPrice}/t</b>
                          <small style={{ display: "block", color: "var(--kl-muted)" }}>(incl. haulage)</small>
                        </td>
                        <td>
                          <span>{lot.baleType || "Mechanized Bales"}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <button
                              type="button"
                              className={`kl-table-save-btn ${isSaved ? "saved" : ""}`}
                              onClick={() => toggleSaveLot(lot.id)}
                              title={isSaved ? "Saved" : "Save to Watchlist"}
                            >
                              {isSaved ? "★" : "☆"}
                            </button>
                            <button
                              type="button"
                              className="primary kl-btn-xs"
                              onClick={() => onContactFarmer?.({ name: lot.farmer, village: lot.village }, lot)}
                            >
                              Order PO →
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* VISUAL CARDS GRID VIEW */
            <div className="kl-buyer-lots-grid">
              {availableLots.map(lot => {
                const isCompared = compareLotIds.includes(lot.id);
                const isSaved = savedLotIds.includes(lot.id);
                const basePrice = Number(lot.price || 1800);
                const haulage = 120;
                const landedPrice = basePrice + haulage;

                return (
                  <div key={lot.id} className={`kl-buyer-card ${isCompared ? "comparing" : ""}`}>
                    <div className="kl-buyer-card-top">
                      <div>
                        <span className="kl-buyer-lot-id">{lot.id}</span>
                        <h4>{lot.residue}</h4>
                        <span className="kl-buyer-supplier">Farmer: {lot.farmer} · 📍 {lot.village}</span>
                      </div>
                      <button
                        type="button"
                        className={`kl-buyer-bookmark ${isSaved ? "saved" : ""}`}
                        onClick={() => toggleSaveLot(lot.id)}
                      >
                        {isSaved ? "★ Watchlist" : "☆ Save"}
                      </button>
                    </div>

                    <div className="kl-buyer-specs-grid">
                      <div><small>QUANTITY</small><b>{lot.est} t</b></div>
                      <div><small>BASE PRICE</small><b>₹{basePrice}/t</b></div>
                      <div><small>MOISTURE</small><b>{lot.moisture || "12.5%"}</b></div>
                      <div><small>EST. LANDED</small><b style={{ color: "#0284c7" }}>₹{landedPrice}/t</b></div>
                    </div>

                    <div className="kl-buyer-card-foot">
                      <label className="kl-buyer-compare-label">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => toggleCompareLot(lot.id)}
                        />
                        <span>Compare</span>
                      </label>
                      <button
                        type="button"
                        className="primary kl-btn-xs"
                        onClick={() => onContactFarmer?.({ name: lot.farmer, village: lot.village }, lot)}
                      >
                        Issue Purchase Order →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ================= VIEW 2: WATCHLIST & SAVED LOTS ================= */}
      {activeTab === "watchlist" && (
        <section className="kl-buyer-trading-section">
          <div className="kl-buyer-section-title">
            <h3>Saved Procurement Watchlist ({savedLots.length})</h3>
            <p>Bookmarked supply parcels being tracked for contract execution.</p>
          </div>

          {savedLots.length === 0 ? (
            <div className="kl-buyer-empty-desk">
              <div className="kl-buyer-empty-icon">★</div>
              <h4>Watchlist is currently empty</h4>
              <p>Click the bookmark icon on any produce lot to track it here.</p>
              <button className="primary" onClick={() => setActiveTab("discover")}>Browse Produce Marketplace</button>
            </div>
          ) : (
            <div className="kl-buyer-lots-grid">
              {savedLots.map(lot => (
                <div key={lot.id} className="kl-buyer-card">
                  <div className="kl-buyer-card-top">
                    <div>
                      <span className="kl-buyer-lot-id">{lot.id}</span>
                      <h4>{lot.residue}</h4>
                      <span>Farmer: {lot.farmer} · 📍 {lot.village}</span>
                    </div>
                    <button
                      type="button"
                      className="kl-buyer-bookmark saved"
                      onClick={() => toggleSaveLot(lot.id)}
                    >
                      ★ Saved
                    </button>
                  </div>
                  <div className="kl-buyer-specs-grid">
                    <div><small>QUANTITY</small><b>{lot.est} t</b></div>
                    <div><small>PRICE</small><b>₹{lot.price || 1800}/t</b></div>
                    <div><small>MOISTURE</small><b>{lot.moisture || "12.5%"}</b></div>
                    <div><small>TOTAL VALUE</small><b>₹{((Number(lot.est) || 1) * (Number(lot.price) || 1800)).toLocaleString("en-IN")}</b></div>
                  </div>
                  <div className="kl-buyer-card-foot">
                    <span className="kl-status-badge verified">Ready for Pickup</span>
                    <button
                      type="button"
                      className="primary kl-btn-xs"
                      onClick={() => onContactFarmer?.({ name: lot.farmer, village: lot.village }, lot)}
                    >
                      Issue PO Contract →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= VIEW 3: FEEDSTOCK TENDERS & REQUIREMENTS ================= */}
      {activeTab === "tenders" && (
        <section className="kl-buyer-trading-section">
          <div className="kl-buyer-section-title">
            <h3>Active Feedstock Tenders ({buyerDemands.length})</h3>
            <p>Official mill requirements published to regional collector fleets and farmer cooperatives.</p>
          </div>

          <div className="kl-buyer-tenders-grid">
            {buyerDemands.map(d => (
              <div key={d.id} className="kl-buyer-tender-card">
                <div className="kl-tender-top">
                  <div>
                    <span className="kl-tender-id">{d.id}</span>
                    <h4>{d.residue}</h4>
                    <small>Destination: {d.processor}</small>
                  </div>
                  <span className="kl-status-pill ok">{d.status}</span>
                </div>
                <div className="kl-tender-body">
                  <div><span>Requirement:</span> <b>{d.quantity} tonnes</b></div>
                  <div><span>Max Ceiling:</span> <b style={{ color: "var(--kl-green)" }}>₹{d.price || 1850}/t</b></div>
                  <div><span>Due Date:</span> <b>{d.due || "15 Nov 2026"}</b></div>
                  <div><span>Unloading Depot:</span> <b>{d.location || "Patiala"}</b></div>
                </div>
                <div className="kl-tender-foot">
                  <span className="kl-status-badge verified">Zero-Burn Certified Only</span>
                  <button
                    type="button"
                    className="secondary kl-btn-xs"
                    onClick={() => notify?.(`Tender bids opened for ${d.id}`)}
                  >
                    View Inbound Bids (3) →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ================= VIEW 4: CONFIRMED ORDERS & WEIGHBRIDGE SLIPS ================= */}
      {activeTab === "orders" && (
        <section className="kl-buyer-trading-section">
          <div className="kl-buyer-section-title">
            <h3>Confirmed Purchase Orders &amp; Weighbridge Slips</h3>
            <p>Traceable intake registry confirming delivered gross weight, tare, and net biomass payments.</p>
          </div>

          <div className="kl-buyer-orders-stack">
            {confirmedOrders.map(o => (
              <div key={o.id} className="kl-buyer-order-item">
                <div className="kl-order-top-row">
                  <div>
                    <span className="kl-order-ref">{o.id} · Lot {o.lotId}</span>
                    <h4>{o.residue}</h4>
                    <small>Supplier: <b>{o.supplier}</b></small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className={`kl-status ${o.status === "Delivered" ? "Processed" : "Collected"}`}>{o.status}</span>
                    <div className="kl-order-total-price">₹{o.totalValue.toLocaleString("en-IN")}</div>
                  </div>
                </div>

                <div className="kl-order-meta-grid">
                  <div><small>NET WEIGHT</small><b>{o.quantity} t</b></div>
                  <div><small>SETTLED RATE</small><b>₹{o.agreedPrice}/t</b></div>
                  <div><small>DISPATCHED FLEET</small><span>{o.balerFleet}</span></div>
                  <div><small>WEIGHBRIDGE SLIP</small><b style={{ color: "var(--kl-green)" }}>{o.weighbridgeSlip}</b></div>
                </div>

                <div className="kl-order-actions-row">
                  <button
                    type="button"
                    className="secondary kl-btn-xs"
                    onClick={() => onNavigate?.("Live Feeds")}
                  >
                    📹 View Mill Gate Camera
                  </button>
                  <button
                    type="button"
                    className="primary kl-btn-xs"
                    onClick={() => notify?.(`Weighbridge certificate ${o.weighbridgeSlip} downloaded.`)}
                  >
                    Download Digital Slip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DOCKED COMPARISON TRAY */}
      {compareLotIds.length > 0 && (
        <div className="kl-buyer-compare-dock">
          <div className="kl-compare-dock-left">
            <span className="kl-dock-label">PRODUCE COMPARISON MATRIX ({compareLotIds.length}/3):</span>
            <div className="kl-dock-pills">
              {comparedLots.map(l => (
                <span key={l.id} className="kl-dock-pill">
                  {l.id} ({l.residue})
                  <button type="button" onClick={() => toggleCompareLot(l.id)}>×</button>
                </span>
              ))}
            </div>
          </div>
          <div className="kl-compare-dock-right">
            <button
              type="button"
              className="secondary kl-btn-sm"
              onClick={() => setCompareLotIds([])}
            >
              Clear
            </button>
            <button
              type="button"
              className="primary kl-btn-sm"
              onClick={() => setShowCompareModal(true)}
            >
              ⚖ Launch Comparison Table ({compareLotIds.length}) →
            </button>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE MATRIX EVALUATION MODAL */}
      {showCompareModal && (
        <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && setShowCompareModal(false)}>
          <div className="kl-modal kl-compare-modal">
            <button type="button" className="kl-close" onClick={() => setShowCompareModal(false)}>×</button>
            <div className="kl-eyebrow">COMMODITY MATRIX COMPARISON</div>
            <h2>Biomass Supply Side-by-Side Evaluation</h2>
            <p>Direct comparison of unit rates, moisture penalties, freight distance, and landed costs.</p>

            <div className="kl-compare-table-wrap" style={{ marginTop: 18, overflowX: "auto" }}>
              <table className="kl-table kl-compare-table">
                <thead>
                  <tr>
                    <th style={{ width: 170 }}>Metric / Parameter</th>
                    {comparedLots.map(l => (
                      <th key={l.id} style={{ minWidth: 200 }}>
                        <div className="kl-compare-th-content">
                          <span className="kl-buyer-table-lot-id">{l.id}</span>
                          <b>{l.residue}</b>
                          <small>📍 {l.village}</small>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><b>Farmer / Origin</b></td>
                    {comparedLots.map(l => <td key={l.id}>{l.farmer} ({l.village})</td>)}
                  </tr>
                  <tr>
                    <td><b>Available Volume</b></td>
                    {comparedLots.map(l => <td key={l.id}><b>{l.est} tonnes</b></td>)}
                  </tr>
                  <tr>
                    <td><b>Base Farmgate Price</b></td>
                    {comparedLots.map(l => <td key={l.id}><b style={{ color: "var(--kl-green)" }}>₹{l.price || 1800}/t</b></td>)}
                  </tr>
                  <tr>
                    <td><b>Est. Transit Haulage</b></td>
                    {comparedLots.map(l => <td key={l.id}>+ ₹120/t (avg 18 km)</td>)}
                  </tr>
                  <tr>
                    <td><b>Landed Gate Cost</b></td>
                    {comparedLots.map(l => <td key={l.id}><b style={{ color: "#0284c7", fontSize: 14 }}>₹{(Number(l.price || 1800) + 120).toLocaleString("en-IN")}/t</b></td>)}
                  </tr>
                  <tr>
                    <td><b>Field Moisture</b></td>
                    {comparedLots.map(l => <td key={l.id}><span>{l.moisture || "12.5%"}</span></td>)}
                  </tr>
                  <tr>
                    <td><b>Baling Format</b></td>
                    {comparedLots.map(l => <td key={l.id}>{l.baleType || "Mechanized Bales"}</td>)}
                  </tr>
                  <tr>
                    <td><b>Action</b></td>
                    {comparedLots.map(l => (
                      <td key={l.id}>
                        <button
                          type="button"
                          className="primary kl-btn-xs"
                          onClick={() => {
                            setShowCompareModal(false);
                            onContactFarmer?.({ name: l.farmer, village: l.village }, l);
                          }}
                        >
                          Execute PO →
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="kl-modal-actions" style={{ marginTop: 20 }}>
              <button type="button" className="secondary" onClick={() => setShowCompareModal(false)}>Close Evaluation</button>
              <button type="button" className="secondary" onClick={() => setCompareLotIds([])}>Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
