import type { CSSProperties, ReactNode } from "react";
import type { Tone } from "@/lib/utils/tone";

/** Shared palette variables. RC10 allows dark atmospheric gradients on reviewed anime heroes;
 * all other consumers keep their small, readable accents and brand fallback.
 */
export function toneVars(tone: Tone): CSSProperties {
  return { "--tone": tone.accent, "--tone-soft": tone.soft, "--tone-glow": tone.glow, "--tone-on": tone.on } as CSSProperties;
}

export function ToneScope({ tone, children, className = "", testId }: { tone: Tone; children: ReactNode; className?: string; testId?: string }) {
  return (
    <div className={className} style={toneVars(tone)} data-testid={testId}>
      {children}
    </div>
  );
}

/**
 * The glow behind a hero: a radial hint in the top corner that fades to nothing within ~200 px. The glow fades into cinematic black.
 */
export function ToneGlow({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 top-0 h-52 [mask-image:linear-gradient(to_bottom,transparent,#000_35%,transparent)] ${className}`}
      style={{ background: "radial-gradient(70% 100% at 50% 0%, var(--tone-glow), transparent 72%)" }}
    />
  );
}
