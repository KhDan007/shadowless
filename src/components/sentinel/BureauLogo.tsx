/**
 * Bureau sigil — a stamped-block mark with a redaction bar and grid coordinates.
 * Replaces the generic ShieldCheck. Bureau direction: "operated, not designed".
 */
export function BureauLogo({ size = 32, className }: { size?: number; className?: string }) {
  const s = size;
  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      className={className}
      aria-label="Shadowless · Bureau mark"
      role="img"
    >
      {/* Outer crop-mark frame */}
      <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.9">
        <path d="M2 6 V2 H6" />
        <path d="M26 2 H30 V6" />
        <path d="M30 26 V30 H26" />
        <path d="M6 30 H2 V26" />
      </g>
      {/* Inner stamped block */}
      <rect x="6" y="6" width="20" height="20" fill="currentColor" opacity="0.12" />
      {/* Redaction bar — the signature mark */}
      <rect x="6" y="13" width="20" height="6" fill="currentColor" />
      {/* Coordinate ticks */}
      <g fill="currentColor" opacity="0.55">
        <rect x="6"  y="9"  width="2" height="1" />
        <rect x="11" y="9"  width="2" height="1" />
        <rect x="16" y="9"  width="2" height="1" />
        <rect x="21" y="9"  width="2" height="1" />
        <rect x="6"  y="22" width="2" height="1" />
        <rect x="11" y="22" width="2" height="1" />
        <rect x="16" y="22" width="2" height="1" />
        <rect x="21" y="22" width="2" height="1" />
      </g>
    </svg>
  );
}