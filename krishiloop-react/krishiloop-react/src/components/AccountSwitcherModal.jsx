import { DEMO_ACCOUNTS } from "../accounts.js";

export default function AccountSwitcherModal({ activeUser, onSelectAccount, onClose }) {
  return (
    <div className="kl-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="kl-modal kl-account-switcher-modal">
        <button className="kl-close" onClick={onClose} aria-label="Close">×</button>
        <div className="kl-eyebrow">PUNJAB PILOT WORKSPACE</div>
        <h2>Switch Account Persona</h2>
        <p>Experience the entire residue loop by switching between different supply chain roles.</p>

        <div className="kl-switch-modal-list">
          {DEMO_ACCOUNTS.map(acc => {
            const isActive = acc.email === activeUser?.email || acc.role === activeUser?.role;
            return (
              <div
                key={acc.id}
                className={`kl-switch-modal-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  if (!isActive) {
                    onSelectAccount(acc);
                  }
                  onClose();
                }}
              >
                {acc.avatarUrl ? (
                  <img src={acc.avatarUrl} alt={acc.name} className="kl-switch-modal-avatar-img" />
                ) : (
                  <div
                    className="kl-switch-modal-avatar"
                    style={{ background: acc.avatarBg, color: acc.avatarColor }}
                  >
                    {acc.initials}
                  </div>
                )}
                <div className="kl-switch-modal-info">
                  <div className="kl-switch-modal-head">
                    <b>{acc.name}</b>
                    <span className="kl-account-role-tag">{acc.role}</span>
                  </div>
                  <div className="kl-switch-modal-sub">
                    <span>📍 {acc.village}, {acc.district}</span>
                    <span>·</span>
                    <span>{acc.org}</span>
                  </div>
                  <div className="kl-switch-modal-stats">
                    {acc.stats.slice(0, 2).map((s, idx) => (
                      <span key={idx}><strong>{s.value}</strong> {s.label}</span>
                    ))}
                  </div>
                </div>
                <div className="kl-switch-modal-action">
                  {isActive ? (
                    <span className="kl-active-badge">● Active</span>
                  ) : (
                    <button className="secondary" type="button">Switch →</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
