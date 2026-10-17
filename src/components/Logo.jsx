function Logo({ size = 36 }) {
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
        <mask id="anchorly-logo-cut" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64">
          <rect width="64" height="64" fill="#ffffff" />
          <g
            transform="translate(11.5 11.1) scale(0.64)"
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
        className="app-logo-outline"
        points="5.1,32 18.6,8.8 45.4,8.8 58.9,32 45.4,55.2 18.6,55.2"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <polygon
        className="app-logo-inner"
        points="10.2,32 21.1,13.1 42.9,13.1 53.8,32 42.9,50.9 21.1,50.9"
        mask="url(#anchorly-logo-cut)"
      />
    </svg>
  );
}

export default Logo;