import "../styles/knight-logo.css";

interface KnightLogoMiniProps {
  size?: number; // px, default 36
  className?: string;
}

/**
 * KnightLogoMini — inline animated SVG logo of the full KNIGHT AI robot character.
 * Uses CSS animations for eye-blink, shield floating, sword swinging, and orbit rotations.
 */
export function KnightLogoMini({ size = 36, className = "" }: KnightLogoMiniProps) {
  return (
    <span
      className={`knight-logo-mini ${className}`}
      style={{ width: size, height: size }}
      aria-label="KNIGHT AI Logo"
      role="img"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ══ APP ICON BACKGROUND ══ */}
        <rect width="512" height="512" rx="112" fill="#050C1A" />
        <rect width="512" height="512" rx="112" fill="url(#kl-logo-bg)" />

        {/* Outer glow border */}
        <rect
          x="2.5"
          y="2.5"
          width="507"
          height="507"
          rx="110"
          stroke="url(#kl-logo-ringGrad)"
          strokeWidth="2.5"
          fill="none"
          opacity="0.55"
        />

        {/* ══ ORBIT RINGS ══ */}
        <circle
          cx="256"
          cy="248"
          r="155"
          stroke="#1E3A8A"
          strokeWidth="1"
          fill="none"
          strokeDasharray="6 5"
          opacity="0.25"
          className="kl-orbit-ccw"
        />
        <circle
          cx="256"
          cy="248"
          r="175"
          stroke="#22D3EE"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="3 8"
          opacity="0.15"
          className="kl-orbit-cw"
        />

        {/* ══ ANTENNA / CREST ══ */}
        <line
          x1="256"
          y1="48"
          x2="256"
          y2="80"
          stroke="url(#kl-logo-crestGrad)"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle
          cx="256"
          cy="44"
          r="8"
          fill="url(#kl-logo-crestGrad)"
          filter="url(#kl-logo-glow-sm)"
          className="kl-crest-pulse"
        />
        <circle
          cx="256"
          cy="44"
          r="14"
          stroke="#22D3EE"
          strokeWidth="1.5"
          fill="none"
          opacity="0.4"
        />

        {/* ══ HELMET (round head) ══ */}
        <circle
          cx="256"
          cy="138"
          r="72"
          fill="#0D1F48"
          filter="url(#kl-logo-glow-head)"
        />
        <circle cx="256" cy="138" r="65" fill="url(#kl-logo-helmetGrad)" />
        <circle cx="256" cy="138" r="58" fill="url(#kl-logo-helmetInner)" />
        <ellipse cx="256" cy="100" rx="30" ry="12" fill="white" opacity="0.07" />

        {/* ── VISOR ── */}
        <rect
          x="186"
          y="122"
          width="140"
          height="42"
          rx="16"
          fill="#020912"
          opacity="0.95"
        />
        <rect
          x="190"
          y="126"
          width="132"
          height="15"
          rx="10"
          fill="white"
          opacity="0.03"
        />

        {/* ── EYES (cyan glowing rectangles with blink class) ── */}
        {/* Left eye */}
        <rect
          x="194"
          y="128"
          width="46"
          height="28"
          rx="9"
          fill="url(#kl-logo-eyeGrad)"
          filter="url(#kl-logo-eye-glow)"
          className="kl-eye-blink"
        />
        <rect
          x="200"
          y="134"
          width="34"
          height="16"
          rx="6"
          fill="#22D3EE"
          opacity="0.2"
        />
        <rect
          x="208"
          y="138"
          width="18"
          height="8"
          rx="4"
          fill="white"
          opacity="0.65"
        />

        {/* Right eye */}
        <rect
          x="272"
          y="128"
          width="46"
          height="28"
          rx="9"
          fill="url(#kl-logo-eyeGrad)"
          filter="url(#kl-logo-eye-glow)"
          className="kl-eye-blink"
        />
        <rect
          x="278"
          y="134"
          width="34"
          height="16"
          rx="6"
          fill="#22D3EE"
          opacity="0.2"
        />
        <rect
          x="286"
          y="138"
          width="18"
          height="8"
          rx="4"
          fill="white"
          opacity="0.65"
        />

        {/* Visor bridge */}
        <rect
          x="236"
          y="134"
          width="40"
          height="16"
          rx="6"
          fill="#020912"
          opacity="0.9"
        />

        {/* ── JAW / CHIN ── */}
        <rect x="214" y="176" width="84" height="22" rx="8" fill="url(#kl-logo-jawGrad)" />
        <rect
          x="220"
          y="181"
          width="72"
          height="2.5"
          rx="1.2"
          fill="#38BDF8"
          opacity="0.5"
        />
        <rect
          x="226"
          y="186"
          width="60"
          height="2.5"
          rx="1.2"
          fill="#38BDF8"
          opacity="0.3"
        />

        {/* ══ NECK ══ */}
        <rect x="238" y="198" width="36" height="20" rx="6" fill="url(#kl-logo-armorGrad)" />
        <rect
          x="243"
          y="202"
          width="26"
          height="6"
          rx="3"
          fill="#1E3A8A"
          opacity="0.5"
        />

        {/* ══ BODY / TORSO ══ */}
        <rect
          x="166"
          y="216"
          width="180"
          height="110"
          rx="22"
          fill="url(#kl-logo-bodyGrad)"
          filter="url(#kl-logo-body-shadow)"
        />
        {/* Torso inner panel */}
        <rect
          x="190"
          y="228"
          width="132"
          height="86"
          rx="14"
          fill="url(#kl-logo-chestPanel)"
        />
        {/* Chest badge area */}
        <rect
          x="208"
          y="238"
          width="96"
          height="58"
          rx="10"
          fill="#0A1730"
          opacity="0.8"
        />
        {/* Badge icon */}
        <circle cx="256" cy="252" r="10" fill="url(#kl-logo-badgeGrad)" opacity="0.9" />
        <polygon
          points="256,246 260,252 256,258 252,252"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          opacity="0.9"
        />
        {/* Badge text lines (with scanning effect) */}
        <rect
          x="228"
          y="268"
          width="56"
          height="4"
          rx="2"
          fill="#22D3EE"
          opacity="0.6"
          className="kl-scanbar"
        />
        <rect
          x="232"
          y="276"
          width="48"
          height="3"
          rx="1.5"
          fill="#38BDF8"
          opacity="0.4"
        />
        <rect
          x="238"
          y="283"
          width="36"
          height="3"
          rx="1.5"
          fill="#38BDF8"
          opacity="0.25"
        />
        {/* 3 status dots */}
        <circle cx="240" cy="298" r="4" fill="#22D3EE" opacity="0.9" className="kl-dot-1" />
        <circle cx="256" cy="298" r="4" fill="#22D3EE" opacity="0.6" className="kl-dot-2" />
        <circle cx="272" cy="298" r="4" fill="#22D3EE" opacity="0.35" className="kl-dot-3" />

        {/* Shoulder rivets */}
        <circle cx="188" cy="230" r="4" fill="#38BDF8" opacity="0.7" />
        <circle cx="324" cy="230" r="4" fill="#38BDF8" opacity="0.7" />

        {/* ══ LEFT ARM ══ */}
        <rect
          x="96"
          y="220"
          width="48"
          height="96"
          rx="16"
          fill="url(#kl-logo-armGrad)"
          filter="url(#kl-logo-body-shadow)"
        />
        <rect
          x="100"
          y="224"
          width="40"
          height="30"
          rx="12"
          fill="url(#kl-logo-armHighlight)"
        />
        {/* Left arm joint */}
        <circle cx="156" cy="226" r="12" fill="url(#kl-logo-jointGrad)" />

        {/* ══ SHIELD (wrapped in a group with class kl-shield) ══ */}
        <g className="kl-shield">
          {/* Shield glow halo */}
          <path
            d="M44 256 C44 226, 92 210, 92 210 C92 210, 140 226, 140 256 C140 292, 118 322, 92 336 C66 322, 44 292, 44 256 Z"
            fill="url(#kl-logo-shieldGlowArea)"
            opacity="0.25"
            filter="url(#kl-logo-shield-glow)"
          />
          {/* Shield body */}
          <path
            d="M52 256 C52 230, 92 216, 92 216 C92 216, 132 230, 132 256 C132 290, 112 318, 92 330 C72 318, 52 290, 52 256 Z"
            fill="url(#kl-logo-shieldBody)"
            stroke="url(#kl-logo-shieldStroke)"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Shield inner panel */}
          <path
            d="M62 258 C62 236, 92 224, 92 224 C92 224, 122 236, 122 258 C122 286, 106 308, 92 318 C78 308, 62 286, 62 258 Z"
            stroke="url(#kl-logo-shieldStroke)"
            strokeWidth="1.5"
            strokeDasharray="5 4"
            fill="none"
            opacity="0.65"
          />
          {/* Shield cross lines */}
          <line
            x1="92"
            y1="228"
            x2="92"
            y2="314"
            stroke="url(#kl-logo-shieldStroke)"
            strokeWidth="1.5"
            opacity="0.35"
          />
          <line
            x1="64"
            y1="270"
            x2="120"
            y2="270"
            stroke="url(#kl-logo-shieldStroke)"
            strokeWidth="1.5"
            opacity="0.35"
          />
          {/* Shield diamond emblem */}
          <polygon
            points="92,252 103,264 92,276 81,264"
            fill="url(#kl-logo-shieldStroke)"
            opacity="0.2"
          />
          <polygon
            points="92,252 103,264 92,276 81,264"
            stroke="url(#kl-logo-shieldStroke)"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="92" cy="264" r="5" fill="white" opacity="0.9" />
          <circle
            cx="92"
            cy="264"
            r="8"
            stroke="url(#kl-logo-shieldStroke)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.5"
          />
        </g>

        {/* ══ RIGHT ARM ══ */}
        <rect
          x="368"
          y="220"
          width="48"
          height="96"
          rx="16"
          fill="url(#kl-logo-armGrad)"
          filter="url(#kl-logo-body-shadow)"
        />
        <rect
          x="372"
          y="224"
          width="40"
          height="30"
          rx="12"
          fill="url(#kl-logo-armHighlight)"
        />
        {/* Right arm joint */}
        <circle cx="356" cy="226" r="12" fill="url(#kl-logo-jointGrad)" />

        {/* ══ SWORD (wrapped in a group with class kl-sword) ══ */}
        <g className="kl-sword">
          {/* Sword glow */}
          <rect
            x="414"
            y="156"
            width="10"
            height="130"
            rx="5"
            fill="url(#kl-logo-swordGlowBar)"
            opacity="0.3"
            filter="url(#kl-logo-sword-glow)"
            transform="rotate(-30 420 260)"
          />
          {/* Sword blade */}
          <rect
            x="417"
            y="152"
            width="7"
            height="120"
            rx="3.5"
            fill="url(#kl-logo-swordBlade)"
            filter="url(#kl-logo-sword-glow)"
            transform="rotate(-30 420 260)"
          />
          {/* Sword guard */}
          <rect
            x="404"
            y="262"
            width="33"
            height="7"
            rx="3.5"
            fill="url(#kl-logo-swordGuard)"
            transform="rotate(-30 420 260)"
          />
          {/* Sword hilt */}
          <rect
            x="418"
            y="266"
            width="7"
            height="22"
            rx="2"
            fill="#1a2545"
            transform="rotate(-30 420 260)"
          />
          {/* Sword pommel */}
          <circle
            cx="421.5"
            cy="291"
            r="6"
            fill="url(#kl-logo-swordPommel)"
            filter="url(#kl-logo-glow-sm)"
            transform="rotate(-30 420 260)"
          />
        </g>

        {/* ══ LEGS ══ */}
        {/* Left leg */}
        <rect
          x="210"
          y="322"
          width="44"
          height="68"
          rx="14"
          fill="url(#kl-logo-legGrad)"
          filter="url(#kl-logo-body-shadow)"
        />
        {/* Left boot */}
        <rect x="204" y="378" width="56" height="20" rx="10" fill="url(#kl-logo-bootGrad)" />
        <rect
          x="206"
          y="380"
          width="52"
          height="8"
          rx="5"
          fill="#38BDF8"
          opacity="0.2"
        />

        {/* Right leg */}
        <rect
          x="258"
          y="322"
          width="44"
          height="68"
          rx="14"
          fill="url(#kl-logo-legGrad)"
          filter="url(#kl-logo-body-shadow)"
        />
        {/* Right boot */}
        <rect x="252" y="378" width="56" height="20" rx="10" fill="url(#kl-logo-bootGrad)" />
        <rect
          x="254"
          y="380"
          width="52"
          height="8"
          rx="5"
          fill="#38BDF8"
          opacity="0.2"
        />

        {/* Leg connectors */}
        <rect x="216" y="318" width="32" height="12" rx="6" fill="url(#kl-logo-armorGrad)" />
        <rect x="264" y="318" width="32" height="12" rx="6" fill="url(#kl-logo-armorGrad)" />

        {/* ══ STATUS BAR BELOW ROBOT ══ */}
        <rect x="156" y="412" width="200" height="28" rx="14" fill="#0D1F48" opacity="0.85" />
        <circle cx="178" cy="426" r="5" fill="#22D3EE" opacity="0.9" />
        <circle cx="172" cy="426" r="3.5" fill="#22D3EE" />
        <rect
          x="182"
          y="422"
          width="68"
          height="8"
          rx="4"
          fill="#38BDF8"
          opacity="0.55"
        />

        {/* ══ DEFS ══ */}
        <defs>
          <radialGradient
            id="kl-logo-bg"
            cx="50%"
            cy="38%"
            r="58%"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="512"
            y2="512"
          >
            <stop offset="0%" stopColor="#0D1F48" />
            <stop offset="100%" stopColor="#050C1A" />
          </radialGradient>
          <linearGradient
            id="kl-logo-ringGrad"
            x1="0"
            y1="0"
            x2="512"
            y2="512"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#1D4ED8" />
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
          <linearGradient
            id="kl-logo-crestGrad"
            x1="256"
            y1="36"
            x2="256"
            y2="80"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
          <radialGradient id="kl-logo-helmetGrad" cx="44%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#1B3580" />
            <stop offset="100%" stopColor="#0F1D45" />
          </radialGradient>
          <radialGradient id="kl-logo-helmetInner" cx="44%" cy="36%" r="55%">
            <stop offset="0%" stopColor="#162554" />
            <stop offset="100%" stopColor="#0A1230" />
          </radialGradient>
          <linearGradient
            id="kl-logo-eyeGrad"
            x1="0"
            y1="128"
            x2="0"
            y2="156"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient
            id="kl-logo-jawGrad"
            x1="256"
            y1="176"
            x2="256"
            y2="198"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="100%" stopColor="#0F1E50" />
          </linearGradient>
          <linearGradient
            id="kl-logo-armorGrad"
            x1="256"
            y1="198"
            x2="256"
            y2="218"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient
            id="kl-logo-bodyGrad"
            x1="256"
            y1="216"
            x2="256"
            y2="326"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1D3A8A" />
            <stop offset="100%" stopColor="#0F1E50" />
          </linearGradient>
          <linearGradient
            id="kl-logo-chestPanel"
            x1="256"
            y1="228"
            x2="256"
            y2="314"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1a3070" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0A1430" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="kl-logo-badgeGrad" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </radialGradient>
          <linearGradient
            id="kl-logo-armGrad"
            x1="120"
            y1="220"
            x2="120"
            y2="316"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1D3A8A" />
            <stop offset="100%" stopColor="#0F1E50" />
          </linearGradient>
          <linearGradient
            id="kl-logo-armHighlight"
            x1="120"
            y1="224"
            x2="120"
            y2="254"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2150A0" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#1B3880" stopOpacity="0.3" />
          </linearGradient>
          <radialGradient id="kl-logo-jointGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1E40AF" />
          </radialGradient>
          {/* Shield gradients */}
          <linearGradient
            id="kl-logo-shieldBody"
            x1="92"
            y1="210"
            x2="92"
            y2="336"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0D1F48" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#060F28" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient
            id="kl-logo-shieldGlowArea"
            x1="92"
            y1="210"
            x2="92"
            y2="340"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0891B2" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="kl-logo-shieldStroke"
            x1="92"
            y1="216"
            x2="92"
            y2="330"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
          {/* Sword gradients */}
          <linearGradient
            id="kl-logo-swordBlade"
            x1="420"
            y1="152"
            x2="420"
            y2="272"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
          <linearGradient
            id="kl-logo-swordGlowBar"
            x1="420"
            y1="152"
            x2="420"
            y2="282"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </linearGradient>
          <linearGradient
            id="kl-logo-swordGuard"
            x1="404"
            y1="265"
            x2="437"
            y2="265"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0E7490" />
            <stop offset="50%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0E7490" />
          </linearGradient>
          <radialGradient id="kl-logo-swordPommel" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#0891B2" />
          </radialGradient>
          {/* Legs */}
          <linearGradient
            id="kl-logo-legGrad"
            x1="256"
            y1="322"
            x2="256"
            y2="390"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#1D3A8A" />
            <stop offset="100%" stopColor="#0F1E50" />
          </linearGradient>
          <linearGradient
            id="kl-logo-bootGrad"
            x1="256"
            y1="378"
            x2="256"
            y2="398"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#162554" />
            <stop offset="100%" stopColor="#0A1230" />
          </linearGradient>

          {/* Filters / glows */}
          <filter id="kl-logo-glow-head" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kl-logo-eye-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kl-logo-glow-sm" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kl-logo-body-shadow" x="-10%" y="-5%" width="120%" height="120%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="8"
              floodColor="#22D3EE"
              floodOpacity="0.18"
            />
          </filter>
          <filter id="kl-logo-shield-glow" x="-40%" y="-30%" width="180%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="kl-logo-sword-glow" x="-100%" y="-20%" width="300%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </span>
  );
}
