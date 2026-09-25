// KYC illustration system — one flat, 2-color, slightly abstract style for
// every visual inside the verification flow (brief: do not mix icon-library
// glyphs with illustrations; lucide stays out of the step content entirely
// and is only used for chrome — X, arrows, history).
//
// Two families, same geometry language:
//   - Art  : larger scene illustrations (viewBox 0 0 48 48), brand color +
//            tint fill, recolorable via props for semantic states (a green
//            check badge, an amber clock, a red alert keep the same style,
//            only the two colors swap).
//   - Glyph: small marks for the stepper / rows (viewBox 0 0 20 20) drawn
//            in currentColor so callers color them with text-* utilities.
//
// Defaults read the design tokens directly — never hardcode brand hexes
// here; --color-brand / --color-brand-tint are the single source.

export function IdCardArt({ size = 48, className = "", color, tint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="38"
        height="28"
        rx="5"
        fill={tint ?? "var(--color-brand-tint)"}
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
      />
      <circle cx="16" cy="21" r="5.2" fill={color ?? "var(--color-brand)"} />
      <path d="M10 32c1-3.6 3.4-5.6 6-5.6s5 2 6 5.6" fill={color ?? "var(--color-brand)"} />
      <rect
        x="28"
        y="18"
        width="11"
        height="3.2"
        rx="1.6"
        fill={color ?? "var(--color-brand)"}
        opacity="0.85"
      />
      <rect
        x="28"
        y="24.5"
        width="7.5"
        height="3.2"
        rx="1.6"
        fill={color ?? "var(--color-brand)"}
        opacity="0.45"
      />
      <rect
        x="14"
        y="33"
        width="20"
        height="3"
        rx="1.5"
        fill={color ?? "var(--color-brand)"}
        opacity="0.3"
      />
    </svg>
  );
}

export function FaceScanArt({ size = 48, className = "", color, tint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M11 41c0-7.2 5.8-12 13-12s13 4.8 13 12"
        fill={tint ?? "var(--color-brand-tint)"}
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle
        cx="24"
        cy="19"
        r="8.5"
        fill={tint ?? "var(--color-brand-tint)"}
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
      />
      <rect
        x="13.5"
        y="17.7"
        width="21"
        height="2.6"
        rx="1.3"
        fill={color ?? "var(--color-brand)"}
        opacity="0.55"
      />
      <path
        d="M6 14V9a3 3 0 0 1 3-3h5"
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M42 14V9a3 3 0 0 0-3-3h-5"
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M6 33v5a3 3 0 0 0 3 3h5"
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M42 33v5a3 3 0 0 1-3 3h-5"
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckBadgeArt({ size = 48, className = "", color, tint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="15"
        fill={tint ?? "var(--color-brand-tint)"}
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
      />
      <circle cx="24" cy="24" r="10.5" fill={color ?? "var(--color-brand)"} />
      <path
        d="M19.4 24.3l3.3 3.3 6-6.7"
        stroke="#ffffff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldLockArt({ size = 48, className = "", color, tint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 5l14 5v11c0 9.4-6.1 17.4-14 20-7.9-2.6-14-10.6-14-20V10l14-5z"
        fill={tint ?? "var(--color-brand-tint)"}
        stroke={color ?? "var(--color-brand)"}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="21.5" r="3.4" fill={color ?? "var(--color-brand)"} />
      <rect
        x="22.3"
        y="23"
        width="3.4"
        height="6.5"
        rx="1.7"
        fill={color ?? "var(--color-brand)"}
      />
    </svg>
  );
}

export function ClockArt({ size = 48, className = "", color, tint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="15"
        fill={tint ?? "#fef9c3"}
        stroke={color ?? "#b45309"}
        strokeWidth="2.2"
      />
      <path
        d="M24 15.5V24l6 3.6"
        stroke={color ?? "#b45309"}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AlertArt({ size = 48, className = "", color, tint }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M24 8.5c1.3 0 2.5.7 3.2 1.8l13 21.5c1.4 2.3-.3 5.2-3 5.2H13.8c-2.7 0-4.4-2.9-3-5.2l13-21.5c.7-1.1 1.9-1.8 3.2-1.8z"
        fill={tint ?? "#fee2e2"}
        stroke={color ?? "var(--color-danger)"}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <rect
        x="22.3"
        y="20"
        width="3.4"
        height="10"
        rx="1.7"
        fill={color ?? "var(--color-danger)"}
      />
      <circle cx="24" cy="34" r="2.1" fill={color ?? "var(--color-danger)"} />
    </svg>
  );
}

// ── Glyphs (stepper + rows) — colored via currentColor ──────────────────────

export function GlyphOverview({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 2c.9 4.4 3.6 7.1 8 8-4.4.9-7.1 3.6-8 8-.9-4.4-3.6-7.1-8-8 4.4-.9 7.1-3.6 8-8z"
        fill="currentColor"
      />
    </svg>
  );
}

export function GlyphIdCard({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="4.5"
        width="15"
        height="11"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="7.2" cy="9" r="1.7" fill="currentColor" />
      <path
        d="M4.7 13.1c.5-1.3 1.5-2 2.5-2s2 .7 2.5 2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <rect x="11.6" y="8.2" width="4" height="1.6" rx="0.8" fill="currentColor" />
      <rect
        x="11.6"
        y="11.1"
        width="2.8"
        height="1.6"
        rx="0.8"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

export function GlyphFaceScan({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 6V5A2.5 2.5 0 0 1 5 2.5h1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17.5 6V5A2.5 2.5 0 0 0 15 2.5h-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M2.5 14v1A2.5 2.5 0 0 0 5 17.5h1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M17.5 14v1a2.5 2.5 0 0 1-2.5 2.5h-1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="10" cy="8.7" r="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M6.4 15.1c.6-1.9 1.9-2.9 3.6-2.9s3 1 3.6 2.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GlyphStatus({ size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M2.5 10.5h3.2l1.9-4.8 3.2 9.3 1.9-4.5h4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Plain checkmark for the stepper's "done" state (sits inside a filled
// brand circle) — custom path, not a library icon.
export function GlyphCheckMark({ size = 12, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.6 8.3l2.9 2.9 5.9-6.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GlyphLock({ size = 13, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="4.5"
        y="8.5"
        width="11"
        height="8"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 8.5V6.6a3 3 0 0 1 6 0v1.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GlyphCommunity({ size = 17, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="7.6" cy="7.4" r="2.9" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M2.6 16c.6-3 2.6-4.7 5-4.7s4.4 1.7 5 4.7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="14.4" cy="8.4" r="2.1" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      <path
        d="M14 12c1.9.3 3.1 1.8 3.5 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function GlyphPlans({ size = 17, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="4" y="3" width="12" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M7 7.5h6M7 10.5h6M7 13.5h3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function GlyphPayout({ size = 17, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="5.5"
        width="15"
        height="9"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.2 8.2v0M14.8 11.8v0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Composite pieces ─────────────────────────────────────────────────────────

// Viewfinder-style capture frame: rounded rectangle with corner brackets
// and a dashed inner guide. Children (the ghost ID illustration) sit
// centered inside. Used even on desktop/file-picker flows — the frame is
// the promise of what the secure window will ask for.
export function ViewfinderFrame({ children, className = "" }) {
  const corner = "absolute w-7 h-7 border-brand border-[2.5px]";
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 rounded-[18px] border border-dashed border-brand/30" />
      <span className={`${corner} top-0 left-0 border-r-0 border-b-0 rounded-tl-[14px]`} />
      <span className={`${corner} top-0 right-0 border-l-0 border-b-0 rounded-tr-[14px]`} />
      <span className={`${corner} bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[14px]`} />
      <span className={`${corner} bottom-0 right-0 border-l-0 border-t-0 rounded-br-[14px]`} />
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// Trust/reassurance line — placed directly under sensitive content (brief
// item 5), never buried in a footer disclaimer.
export function TrustNote({ children, className = "" }) {
  return (
    <p
      className={`flex items-start gap-1.5 text-[11.5px] text-[#6B7280] leading-[1.5] m-0 ${className}`}
    >
      <ShieldLockArt size={14} className="flex-shrink-0 mt-[1px]" />
      <span>{children}</span>
    </p>
  );
}
