export default function KrishiLoopAppIcon({ size = 32, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={`kl-app-icon-svg ${className}`}
      aria-label="KrishiLoop Logo"
    >
      <defs>
        <linearGradient id="klLogoBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#064e3b" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>

        <linearGradient id="klLogoGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="klLogoGold" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <radialGradient id="klLogoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Rounded App Icon Base */}
      <rect width="64" height="64" rx="16" fill="url(#klLogoBg)" />
      <rect width="60" height="60" x="2" y="2" rx="14" stroke="rgba(52, 211, 153, 0.3)" strokeWidth="1.5" />

      {/* Radial Spark */}
      <circle cx="32" cy="32" r="20" fill="url(#klLogoGlow)" />

      {/* Upper Green Leaf Loop */}
      <path
        d="M 32 10 
           C 44 10, 52 18, 52 28 
           C 52 38, 40 44, 32 44 
           C 24 44, 18 38, 18 32
           C 18 24, 26 18, 34 18
           C 40 18, 45 22, 45 27
           C 45 32, 38 36, 32 36"
        stroke="url(#klLogoGreen)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Golden Wheat Stalk Loop */}
      <path
        d="M 32 54 
           C 20 54, 12 46, 12 36 
           C 12 26, 24 20, 32 20 
           C 40 20, 46 26, 46 32
           C 46 40, 38 46, 30 46
           C 24 46, 19 42, 19 37
           C 19 32, 26 28, 32 28"
        stroke="url(#klLogoGold)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Wheat Kernel Accents */}
      <circle cx="48" cy="20" r="2.2" fill="#fef08a" />
      <circle cx="53" cy="28" r="2.2" fill="#fbbf24" />
      <circle cx="49" cy="37" r="2.2" fill="#f59e0b" />
      <circle cx="41" cy="45" r="2.2" fill="#d97706" />

      {/* Sprouting Leaf Tips */}
      <path d="M 32 10 Q 36 5 40 8 Q 36 12 32 10 Z" fill="#34d399" />
      <path d="M 22 14 Q 24 8 28 11 Q 25 15 22 14 Z" fill="#6ee7b7" />

      {/* Central Spark */}
      <circle cx="32" cy="32" r="3" fill="#ffffff" />
      <circle cx="32" cy="32" r="1.6" fill="#10b981" />
    </svg>
  );
}
