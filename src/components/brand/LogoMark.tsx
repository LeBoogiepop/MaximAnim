/**
 * The Maximanim mark: an open, slightly tilted media frame holding a
 * geometric M, with a rose play-shape breaking out through its right side.
 * Same geometry as `public/brand/icon.svg` (scripts/generate-icons.mjs),
 * without the background tile.
 */
export function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="84 70 380 380" className={className} aria-hidden="true" focusable="false">
      <g transform="rotate(-3 256 256)">
        <path
          d="M404 176 V168 A64 64 0 0 0 340 104 H172 A64 64 0 0 0 108 168 V344 A64 64 0 0 0 172 408 H340 A64 64 0 0 0 404 344 V336"
          fill="none"
          stroke="var(--color-paper)"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path d="M176 334 V190 L242 270 L308 190 V238" fill="none" stroke="var(--color-paper)" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M318 214 C318 202 331 195 341 201 L436 251 C447 257 447 273 436 279 L341 329 C331 335 318 328 318 316 Z" fill="var(--color-accent)" />
      </g>
    </svg>
  );
}

/** Four-pointed spark path centred on (x, y). */
export function Spark({
  x,
  y,
  r,
  fill,
  stroke,
  strokeWidth = 0,
}: {
  x: number;
  y: number;
  r: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}) {
  const k = r * 0.28;
  const d = `M${x} ${y - r} C${x + k * 0.4} ${y - k} ${x + k} ${y - k * 0.4} ${x + r} ${y} C${x + k} ${y + k * 0.4} ${x + k * 0.4} ${y + k} ${x} ${y + r} C${x - k * 0.4} ${y + k} ${x - k} ${y + k * 0.4} ${x - r} ${y} C${x - k} ${y - k * 0.4} ${x - k * 0.4} ${y - k} ${x} ${y - r}Z`;
  return <path d={d} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />;
}

/** Standalone decorative spark, used as a tiny identity accent across screens. */
export function SparkIcon({
  size = 14,
  color = "var(--color-cream)",
  className,
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <Spark x={12} y={12} r={11} fill={color} />
    </svg>
  );
}
