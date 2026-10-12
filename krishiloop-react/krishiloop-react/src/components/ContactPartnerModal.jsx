import { useState } from "react";
import { matchRequestService } from "../services/supabaseService.js";

export default function ContactPartnerModal({ partner, lot, onClose, onNotify }) {
  if (!partner) return null;

  const phone = partner.phone || "+91 98722 54321";
  const email = partner.email || "procurement@sangrurbiomass.in";
  const contactPerson = partner.contactPerson || "Sunil Jain (Plant Head)";
  const workingHours = partner.workingHours || "8:00 AM - 7:00 PM";
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);

  const lotId = lot?.id || "L-104";
  const lotResidue = lot?.residue || "Paddy straw";
  const lotQty = lot?.est || "5.0";
  const lotFarmer = lot?.farmer || "Registered Farmer";
  const lotVillage = lot?.village || partner.location || "Dhuri";
  const lotPrice = lot?.price || "1800";

  const defaultSubject = `KrishiLoop Deal Inquiry: Lot ${lotId} (${lotQty}t ${lotResidue}) for ${partner.name}`;
  const defaultBody = `Hello ${contactPerson},\n\nI am reaching out regarding Supply Lot ${lotId} on KrishiLoop.\n\n• Lot ID: ${lotId}\n• Residue Type: ${lotResidue}\n• Estimated Quantity: ${lotQty} tonnes\n• Farmgate Location: ${lotVillage}, Punjab\n• Indicative Price: ₹${lotPrice}/tonne\n• Match Compatibility: ${partner.percent || 94}%\n\nWe would like to confirm your procurement interest and schedule vehicle collection. Please let us know your dispatch availability.\n\nRegards,\nKrishiLoop Deal Desk`;

  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState(defaultBody);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const copyToClipboard = (text, type) => {
    try {
      navigator.clipboard.writeText(text);
      if (type === "phone") {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
      onNotify?.(`Copied ${type === "phone" ? "phone number" : "email"} to clipboard!`);
    } catch {
      onNotify?.(`Selected: ${text}`);
    }
  };

  const handleSendPlatformInquiry = async e => {
    e?.preventDefault();
    setInquirySent(true);

    try {
      await matchRequestService.createMatchRequest({
        lotId,
        processorId: partner.id || "P1",
        processorName: partner.name,
        compatibilityScore: partner.percent || 90,
        contactPerson,
        contactPhone: phone,
        contactEmail: email,
        notes: message,
      });
    } catch (err) {
      console.warn("Could not record match request to Supabase:", err);
    }

    onNotify?.(`Deal inquiry logged for ${partner.name}! Deal partner will respond via phone or email shortly.`);
    setTimeout(() => {
      onClose?.();
    }, 1800);
  };

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  const waLink = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hello ${contactPerson}, I am contacting you regarding KrishiLoop Lot ${lotId} (${lotQty}t ${lotResidue}) at ${lotVillage}. Match score: ${partner.percent || 94}%. Please confirm procurement details.`)}`;

  return (
    <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="kl-modal kl-contact-partner-modal">
        <button className="kl-close" onClick={onClose} aria-label="Close">×</button>

        {/* Modal Header */}
        <div className="kl-contact-modal-head">
          <div className="kl-contact-partner-avatar">
            🏢
          </div>
          <div className="kl-contact-head-info">
            <div className="kl-contact-badge-pill">
              <span className="kl-dot-green">●</span>
              <span>VERIFIED DEAL PARTNER</span>
            </div>
            <h2>{partner.name}</h2>
            <p>
              {partner.type || "Processing Facility"} · {partner.location || partner.district} (Punjab)
            </p>
          </div>
          {partner.percent && (
            <div className="kl-contact-match-score">
              <span>{partner.percent}%</span>
              <small>Match Fit</small>
            </div>
          )}
        </div>

        {/* Matched Lot Context Strip */}
        <div className="kl-contact-lot-strip">
          <div className="kl-lot-strip-item">
            <span>RESIDUE LOT</span>
            <b>{lotId}</b>
          </div>
          <div className="kl-lot-strip-divider" />
          <div className="kl-lot-strip-item">
            <span>FEEDSTOCK</span>
            <b>{lotResidue}</b>
          </div>
          <div className="kl-lot-strip-divider" />
          <div className="kl-lot-strip-item">
            <span>QUANTITY</span>
            <b>{lotQty} tonnes</b>
          </div>
          <div className="kl-lot-strip-divider" />
          <div className="kl-lot-strip-item">
            <span>LOCATION</span>
            <b>{lotVillage}</b>
          </div>
          {partner.distance && (
            <>
              <div className="kl-lot-strip-divider" />
              <div className="kl-lot-strip-item">
                <span>DISTANCE</span>
                <b>~{partner.distance} km</b>
              </div>
            </>
          )}
        </div>

        {inquirySent ? (
          <div className="kl-contact-success-state">
            <div className="kl-success-check-badge">✓</div>
            <h3>Deal Inquiry Sent Successfully!</h3>
            <p>
              Your proposal regarding <b>Lot {lotId}</b> has been dispatched to <b>{partner.name}</b> ({contactPerson}).
              They will contact you directly via call or email.
            </p>
          </div>
        ) : (
          <div className="kl-contact-methods-stack">
            {/* Method 1: Direct Phone Call */}
            <div className="kl-contact-method-card kl-call-card">
              <div className="kl-method-card-head">
                <div className="kl-method-icon-wrap kl-icon-call">📞</div>
                <div className="kl-method-meta">
                  <h4>Direct Phone Call</h4>
                  <span>Representative: <b>{contactPerson}</b></span>
                  <small className="kl-hours-tag">🕒 Active: {workingHours}</small>
                </div>
              </div>
              <div className="kl-method-action-row">
                <a
                  href={`tel:${phone}`}
                  className="primary kl-btn-action-link"
                  onClick={() => onNotify?.(`Initiating call to ${phone}...`)}
                >
                  <span>📞 Call Now</span> <b>{phone}</b>
                </a>
                <button
                  type="button"
                  className="secondary kl-btn-copy"
                  onClick={() => copyToClipboard(phone, "phone")}
                >
                  {copiedPhone ? "✓ Copied!" : "📋 Copy"}
                </button>
              </div>
            </div>

            {/* Method 2: Email Proposal */}
            <div className="kl-contact-method-card kl-email-card">
              <div className="kl-method-card-head">
                <div className="kl-method-icon-wrap kl-icon-email">✉️</div>
                <div className="kl-method-meta">
                  <h4>Email Deal Proposal</h4>
                  <span>Official Inbox: <b>{email}</b></span>
                </div>
              </div>

              <div className="kl-email-form-fields">
                <div className="kl-field-row">
                  <label htmlFor="contact-email-subject">Subject</label>
                  <input
                    id="contact-email-subject"
                    type="text"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>
                <div className="kl-field-row">
                  <label htmlFor="contact-email-body">Deal Message</label>
                  <textarea
                    id="contact-email-body"
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>
              </div>

              <div className="kl-method-action-row">
                <a
                  href={mailtoLink}
                  className="primary kl-btn-action-link"
                  onClick={() => onNotify?.(`Opening email client for ${email}...`)}
                >
                  <span>✉️ Send via Email App</span>
                </a>
                <button
                  type="button"
                  className="secondary kl-btn-platform-inquiry"
                  onClick={handleSendPlatformInquiry}
                >
                  <span>⚡ Log In-App Deal Inquiry</span>
                </button>
                <button
                  type="button"
                  className="secondary kl-btn-copy"
                  onClick={() => copyToClipboard(email, "email")}
                >
                  {copiedEmail ? "✓ Copied!" : "📋 Copy Email"}
                </button>
              </div>
            </div>

            {/* Method 3: WhatsApp Chat */}
            <div className="kl-contact-method-card kl-wa-card">
              <div className="kl-method-card-head">
                <div className="kl-method-icon-wrap kl-icon-wa">💬</div>
                <div className="kl-method-meta">
                  <h4>Instant WhatsApp Deal Desk</h4>
                  <span>Quick confirmation for tractor / baler dispatch</span>
                </div>
              </div>
              <div className="kl-method-action-row">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="secondary kl-btn-wa-link"
                  onClick={() => onNotify?.(`Opening WhatsApp chat with ${contactPerson}...`)}
                >
                  <span>💬 Chat on WhatsApp (+91 {cleanPhone})</span> <span>↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="kl-contact-modal-footer">
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
