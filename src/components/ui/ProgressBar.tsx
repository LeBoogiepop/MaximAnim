/** Chunky, accessible progress bar. `value` is 0..1. */
export function ProgressBar({
  value,
  label,
  color = "var(--color-accent)",
  className = "",
  thin = false,
}: {
  value: number;
  label: string;
  color?: string;
  className?: string;
  thin?: boolean;
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`overflow-hidden rounded-full bg-surface ${thin ? "h-1.5" : "h-2.5"} ${className}`}
    >
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
