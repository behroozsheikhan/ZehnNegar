/** نشان ذهن‌نگار: یک گره مرکزی با شاخه‌های نقشهٔ ذهنی (همان طرح آیکن برنامه). */
export function AppLogo({ className }: { className?: string }): React.JSX.Element {
  return (
    <svg
      className={className}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="zn-logo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7C78F0" />
          <stop offset="1" stopColor="#4B47B8" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="240" height="240" rx="56" fill="url(#zn-logo-bg)" />
      <g fill="none" stroke="#FFFFFF" strokeWidth="9" strokeLinecap="round" opacity="0.9">
        <path d="M150 128 C 118 128, 118 72, 84 72" />
        <path d="M150 128 C 112 128, 112 128, 76 128" />
        <path d="M150 128 C 118 128, 118 184, 84 184" />
      </g>
      <rect x="140" y="98" width="72" height="60" rx="20" fill="#FFFFFF" />
      <circle cx="72" cy="72" r="18" fill="#FFD166" />
      <circle cx="62" cy="128" r="18" fill="#7BE0C3" />
      <circle cx="72" cy="184" r="18" fill="#FF8FA3" />
      <g fill="#4B47B8">
        <rect x="156" y="116" width="40" height="8" rx="4" />
        <rect x="168" y="132" width="28" height="8" rx="4" />
      </g>
    </svg>
  );
}
