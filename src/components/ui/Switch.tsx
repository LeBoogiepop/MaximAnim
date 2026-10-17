"use client";

/**
 * Compact switch: a dark track with a hairline border when off, the accent
 * when on, a light knob. The visual is small; the touch target stays 44px.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="group relative flex h-11 w-13 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`relative h-[26px] w-[44px] rounded-full border transition-colors duration-150 ${checked ? "border-transparent bg-accent" : "border-line bg-surface"}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-paper shadow-[0_1px_2px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out group-active:scale-95 ${
            checked ? "translate-x-[18px]" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
