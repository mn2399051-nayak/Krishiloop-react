import { useState } from "react";

export default function HelpSupportModal({ role = "Farmer", onClose }) {
  const [activeCategory, setActiveCategory] = useState("faq"); // "faq" | "contacts" | "compliance"

  const roleHelp = {
    Farmer: {
      title: "Farmer & Residue Producer Support",
      faqs: [
        {
          q: "How do I list my crop residue for pickup?",
          a: "Click '＋ List New Produce Lot' from your Overview or '＋ Add supply' in the topbar. Enter your village, residue type, estimated tonnes, and available dates."
        },
        {
          q: "When and how are DBT bank payments released?",
          a: "Direct Benefit Transfer (DBT) is credited directly to your Aadhaar-seeded bank account once the baler delivers your straw to the processing depot and the weighbridge slip is verified."
        },
        {
          q: "How do I ensure 100% Zero-Burn certification?",
          a: "Keep your residue listed and cleared by mechanized balers. Sentinel-2 satellites verify zero thermal anomalies over your land parcels to certify compliance."
        }
      ]
    },
    Buyer: {
      title: "Buyer & Industrial Offtaker Support",
      faqs: [
        {
          q: "How do I filter lots by moisture specification?",
          a: "On your Buyer Overview or Marketplace, use the moisture filter to filter lots with <=14% or <=16% moisture according to your boiler intake requirements."
        },
        {
          q: "How can I post a customized feedstock tender?",
          a: "Click '＋ Post Feedstock Demand'. Specify required tonnes, maximum moisture, offered price per tonne, and delivery due date."
        },
        {
          q: "Where do I track weighbridge delivery receipts?",
          a: "In the 'Confirmed Orders & Fulfillment' tab, every delivery includes an official weighbridge slip number (e.g. WB-SAN-4891) and verified net weight."
        }
      ]
    },
    Collector: {
      title: "Logistics Aggregator & Fleet Support",
      faqs: [
        {
          q: "How does cluster route optimization work?",
          a: "The Routes view calculates the shortest-distance cluster between nearby farmgate parcels and the nearest processing depot to minimize tractor dead-mileage."
        },
        {
          q: "How do I record actual scale weight upon delivery?",
          a: "When tractor trolleys arrive at the depot weighbridge, click 'Confirm Pickup & Scale Weight' to record the tare and gross weights."
        }
      ]
    },
    Transporter: {
      title: "Logistics Aggregator & Fleet Support",
      faqs: [
        {
          q: "How does cluster route optimization work?",
          a: "The Routes view calculates the shortest-distance cluster between nearby farmgate parcels and the nearest processing depot to minimize tractor dead-mileage."
        },
        {
          q: "How do I record actual scale weight upon delivery?",
          a: "When tractor trolleys arrive at the depot weighbridge, click 'Confirm Pickup & Scale Weight' to record the tare and gross weights."
        }
      ]
    },
    Processor: {
      title: "Biomass Processing Facility Support",
      faqs: [
        {
          q: "How do I record mill gate intake?",
          a: "Navigate to the Intake tab to log net incoming tonnes, moisture test readings, and issue digital intake receipts."
        },
        {
          q: "Can I adjust moisture tolerances on incoming lots?",
          a: "Yes, if an incoming batch exceeds moisture limits, flag a discrepancy to request adjusted tonnage or artificial drying."
        }
      ]
    },
    Admin: {
      title: "State Agricultural Administrator Help",
      faqs: [
        {
          q: "How do I approve or reject pending Aadhaar KYC applications?",
          a: "Navigate to the 'User Verification' desk or click 'Pending KYC Reviews' on the Admin dashboard. Inspect the uploaded credential and select Approve or Reject."
        },
        {
          q: "How are unauthorized role changes prevented?",
          a: "Row Level Security (RLS) triggers enforce that non-admin accounts cannot elevate themselves to Admin. All permission checks are enforced at database and API levels."
        },
        {
          q: "How do I export state compliance audit reports?",
          a: "Click '↓ Export State Audit Report' on the Admin dashboard to download complete CSV audit reports for Punjab DBT and residue diversion."
        }
      ]
    }
  };

  const currentHelp = roleHelp[role] || roleHelp.Farmer;

  return (
    <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="kl-modal kl-help-modal">
        <button className="kl-close" onClick={onClose} aria-label="Close">×</button>
        <div className="kl-eyebrow">HELP &amp; REGULATORY SUPPORT DESK</div>
        <h2>KrishiLoop Assistance Center</h2>
        <p className="kl-sub">
          Round-the-clock support for farmers, offtakers, fleet aggregators, and administrators in Punjab.
        </p>

        <div className="kl-dashboard-tabs" style={{ margin: "16px 0" }}>
          <button
            className={`kl-dash-tab ${activeCategory === "faq" ? "active" : ""}`}
            onClick={() => setActiveCategory("faq")}
          >
            ❓ {currentHelp.title}
          </button>
          <button
            className={`kl-dash-tab ${activeCategory === "contacts" ? "active" : ""}`}
            onClick={() => setActiveCategory("contacts")}
          >
            📞 Emergency Hotlines &amp; SOS
          </button>
          <button
            className={`kl-dash-tab ${activeCategory === "compliance" ? "active" : ""}`}
            onClick={() => setActiveCategory("compliance")}
          >
            🌱 Zero-Burn Directive
          </button>
        </div>

        {activeCategory === "faq" && (
          <div className="kl-help-faq-list">
            {currentHelp.faqs.map((f, i) => (
              <div key={i} className="kl-help-faq-item">
                <b>{f.q}</b>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        )}

        {activeCategory === "contacts" && (
          <div className="kl-help-contacts-grid">
            <div className="kl-help-contact-card">
              <span className="kl-contact-icon">🚜</span>
              <div>
                <b>Punjab Baler Dispatch Emergency SOS</b>
                <p>Call when baler breaks down or combine harvest requires immediate pickup.</p>
                <code>1800-180-1551 (Toll-Free)</code>
              </div>
            </div>
            <div className="kl-help-contact-card">
              <span className="kl-contact-icon">🏛</span>
              <div>
                <b>Punjab Agricultural Directorate Helpdesk</b>
                <p>Civil Secretariat, Chandigarh · Zero-Burn Stubble Monitoring Wing</p>
                <code>helpdesk@krishiloop.punjab.gov.in</code>
              </div>
            </div>
            <div className="kl-help-contact-card">
              <span className="kl-contact-icon">💬</span>
              <div>
                <b>WhatsApp Farmer &amp; Offtaker Helpline</b>
                <p>Instant support in Punjabi &amp; English for marketplace inquiries</p>
                <code>+91 98760 11223</code>
              </div>
            </div>
          </div>
        )}

        {activeCategory === "compliance" && (
          <div className="kl-help-compliance-box">
            <h4>Punjab Zero-Burn Stubble Diversion Directive (2026 Season)</h4>
            <p>
              Under the National Green Tribunal and Commission for Air Quality Management (CAQM) guidelines, all paddy and wheat residue listed on KrishiLoop is registered for mechanized ex-situ management (bio-pellets, bio-CNG, paper pulp).
            </p>
            <ul>
              <li><strong>Zero Penalty Guarantee:</strong> Registered farmers with scheduled baler pickups are exempt from punitive stubble burning environmental compensation.</li>
              <li><strong>Direct DBT Incentives:</strong> Farmers receive ₹1,800 to ₹1,900 per tonne directly in their Aadhaar-seeded bank account upon mill gate delivery.</li>
              <li><strong>Satellite Verification:</strong> SAC / ISRO Sentinel-2 pass verifies 0 thermal anomalies to maintain active platform standing.</li>
            </ul>
          </div>
        )}

        <div className="kl-modal-actions" style={{ marginTop: 20 }}>
          <button className="primary kl-btn-full" onClick={onClose}>
            Close Help Center
          </button>
        </div>
      </div>
    </div>
  );
}
