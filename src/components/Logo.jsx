import { useId } from "react";

function Logo({ size = 36}) {
  const maskId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-badge-cut`;

  return (
    <svg
      className="app-logo"
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#ffffff" />
          <polygon
            points="32,8.2 52.3,20.1 52.3,43.9 32,55.8 11.7,43.9 11.7,20.1"
            fill="none"
            stroke="#000000"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <g
            transform="translate(12.8 13.85) scale(0.6)"
            fill="none"
            stroke="#000000"
            strokeLinecap="round"
          >
            <circle cx="32" cy="10" r="6" strokeWidth="5" />
            <line x1="32" y1="16" x2="32" y2="52" strokeWidth="7" />
            <line x1="21" y1="24" x2="43" y2="24" strokeWidth="6" />
            <path
              d="M 7 38 Q 9 59 32 59 Q 55 59 57 38 L 46 45 Q 42 51 32 51 Q 22 51 18 45 Z"
              fill="#000000"
              stroke="none"
            />
          </g>
        </mask>
      </defs>
      <polygon
        points="32,4 56,18 56,46 32,60 8,46 8,18"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

export default Logo;
