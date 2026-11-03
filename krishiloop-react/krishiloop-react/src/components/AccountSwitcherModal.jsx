import { getAllAccounts } from "../accounts.js";
import { THEME_CONFIGS } from "./ThemeSwitcherModal.jsx";

const getRoleThemeKey = (role) => {
  const r = (role || "").toLowerCase();
  if (r.includes("buyer")) return "buyer";
  if (r.includes("process")) return "processor";
  if (r.includes("collect")) return "collector";
  if (r.includes("admin")) return "admin";
  return "seller";
};

export default function AccountSwitcherModal({ activeUser, onSelectAccount, onClose }) {
  const accounts = getAllAccounts();
  return (
    <div className="kl-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kl-modal kl-account-switcher-modal">
        <button className="kl-close" onClick={onClose} aria-label="Close">×</button>
        <div className="kl-eyebrow">PUNJAB PILOT WORKSPACE</div>
        <h2>Switch Account Persona &amp; Theme</h2>
        <p>
          Selecting a persona automatically adapts the dashboard’s visual theme, telemetry data, and workflow permissions to that role’s specific needs.
        </p>

        <div className="kl-switch-modal-list">
          {accounts.map((acc) => {
            const isActive = acc.email === activeUser?.email || acc.role === activeUser?.role;
            const themeKey = getRoleThemeKey(acc.role);
            const theme = THEME_CONFIGS[themeKey] || THEME_CONFIGS.seller;

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
                    <span
                      className="kl-account-theme-pill"
                      style={{
                        background: theme.colors.badge,
                        color: theme.colors.primary,
                        borderColor: theme.colors.primary
                      }}
                      title={`Switches to ${theme.name}`}
                    >
                      {theme.icon} {theme.shortName}
                    </span>
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
