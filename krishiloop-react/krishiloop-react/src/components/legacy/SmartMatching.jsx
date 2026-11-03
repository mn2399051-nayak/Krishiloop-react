import { useState } from "react";
import { processors, matchFactors, weights, factorNames, score } from "../data.js";
import ContactPartnerModal from "./ContactPartnerModal.jsx";

const pct = (v) => Math.round(v * 100);

export default function SmartMatching({ lots = [], onMatch = () => { } }) {
  const [selected, setSelected] = useState("P1");
  const [chosenLot, setChosenLot] = useState("L-104");
  const [saved, setSaved] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const ranked = [...processors]
    .map((p) => ({ ...p, score: score(matchFactors[p.id]) }))
    .sort((a, b) => b.score - a.score);
  const chosen = processors.find((p) => p.id === selected) || processors[0];
  const f = matchFactors[selected] || matchFactors.P1;

  const currentLotObj = lots.find((l) => l.id === chosenLot) || {
    id: chosenLot,
    farmer: "Jasmeet Kaur",
    village: "Dhuri",
    residue: "Paddy straw",
    est: 5,
    price: 1800
  };

  const partnerPhone = chosen.phone || "+91 98722 54321";
  const partnerEmail = chosen.email || "procurement@sangrurbiomass.in";
  const partnerRep = chosen.contactPerson || "Procurement Desk";
  const partnerHours = chosen.workingHours || "8:00 AM - 7:00 PM";

  const mailSubject = encodeURIComponent(`KrishiLoop Deal Inquiry: Lot ${currentLotObj.id} (${currentLotObj.est}t ${currentLotObj.residue}) for ${chosen.name}`);
  const mailBody = encodeURIComponent(`Hello ${partnerRep},\n\nI am contacting you regarding Supply Lot ${currentLotObj.id} on KrishiLoop.\n\n• Residue: ${currentLotObj.residue}\n• Estimated Quantity: ${currentLotObj.est} tonnes\n• Farmgate Village: ${currentLotObj.village}\n• Match Score: ${pct(score(f))}%\n\nPlease confirm procurement terms and collection schedule.\n\nThank you,\nKrishiLoop Deal Desk`);

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  return (
    <div className="grid2" id="matching">
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: "var(--kl-green)", color: "#fff", padding: "10px 16px", borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontSize: 13, fontWeight: 600 }}>
          ✓ {toast}
        </div>
      )}

      <div className="panel">
        <h3>Best processor matches</h3>
        <p className="sub">Select a lot to see why it was matched</p>
        <select aria-label="Choose a residue lot" value={chosenLot} onChange={(e) => setChosenLot(e.target.value)} style={{ width: "100%", padding: "8px", marginBottom: 10, border: "1px solid var(--line)", borderRadius: 7, background: "var(--panel)", color: "var(--ink)", fontSize: 11 }}>
          {lots.length ? [...lots].map((lot) => <option key={lot.id} value={lot.id}>{lot.id} · {lot.farmer} · {lot.est} t</option>) : <option value="L-104">L-104 · Jasmeet Kaur · 5 t</option>}
        </select>
        <div>
          {ranked.map((p) => (
            <button
              key={p.id}
              className="match"
              aria-pressed={p.id === selected}
              onClick={() => setSelected(p.id)}
            >
              <span className="score">{pct(p.score)}</span>
              <span>
                <b>{p.name}</b>
                <br />
                <span style={{ color: "var(--muted)", fontSize: 13 }}>{p.district} &middot; needs {p.need} t</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Why this match: Lot {chosenLot} to {chosen.name}</h3>
        <p className="sub">Weighted score, weights are configurable</p>
        {Object.keys(weights).map((k) => (
          <div className="bar" key={k}>
            <span>{factorNames[k]}</span>
            <div><i style={{ width: `${pct(f[k])}%` }} /></div>
            <b>{pct(f[k])}</b>
          </div>
        ))}
        <p className="sub" style={{ marginTop: 14 }}>
          Match score {pct(score(f))} out of 100, from the weighted factors above.
        </p>

        {/* Deal Partner Direct Contact Section */}
        <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "var(--kl-panel-soft, #f8fafc)", border: "1px solid var(--kl-line, #e2e8f0)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🏢</span>
            <div>
              <b style={{ fontSize: 12, display: "block", color: "var(--kl-ink, #0f172a)" }}>{partnerRep}</b>
              <small style={{ color: "var(--kl-muted, #64748b)", fontSize: 10 }}>Procurement Contact · {partnerHours}</small>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            <a
              href={`tel:${partnerPhone}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 6, background: "var(--kl-mint, #ecfdf5)", color: "var(--kl-green, #065f46)", fontSize: 11, fontWeight: 700, textDecoration: "none" }}
              onClick={() => notify(`Initiating call to ${partnerPhone}...`)}
            >
              📞 {partnerPhone}
            </a>
            <a
              href={`mailto:${partnerEmail}?subject=${mailSubject}&body=${mailBody}`}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 9px", borderRadius: 6, background: "var(--kl-panel, #ffffff)", border: "1px solid var(--kl-line, #e2e8f0)", color: "var(--kl-ink, #0f172a)", fontSize: 11, fontWeight: 600, textDecoration: "none" }}
              onClick={() => notify(`Opening email client for ${partnerEmail}...`)}
            >
              ✉️ {partnerEmail}
            </a>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              type="button"
              className="primary"
              style={{ flex: 1, fontSize: 11, padding: "7px 10px", fontWeight: 700 }}
              onClick={() => setContactModalOpen(true)}
            >
              🤝 Contact Deal Partner
            </button>
            <button
              type="button"
              className="secondary"
              style={{ fontSize: 11, padding: "7px 10px" }}
              onClick={() => { setSaved(true); onMatch(); notify("Match saved to review queue."); }}
            >
              {saved ? "✓ Saved" : "Save match"}
            </button>
          </div>
        </div>
      </div>

      {contactModalOpen && (
        <ContactPartnerModal
          partner={{ ...chosen, percent: pct(score(f)) }}
          lot={currentLotObj}
          onClose={() => setContactModalOpen(false)}
          onNotify={notify}
        />
      )}
    </div>
  );
}
