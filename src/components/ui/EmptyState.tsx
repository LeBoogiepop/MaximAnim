"use client";

import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { localizeOwnedText } from "@/lib/i18n/translate";
import type { ReactNode } from "react";

/**
 * Empty/error state: a title, one sentence, at most one clear action. No
 * sticker, no emoji — the screen around it (and the artwork) carries the tone.
 * `glyph` is accepted for older call sites and deliberately not rendered.
 */
export function EmptyState({
  title,
  children,
  action,
  compact = false,
}: {
  glyph?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "calm" | "warning";
  compact?: boolean;
}) {
  useInterfaceLanguage();
  return (
    <div className={`flex flex-col items-center text-center ${compact ? "gap-1.5 px-4 py-8" : "gap-2 px-6 py-12"}`}>
      <h3 className="text-[17px] font-semibold text-balance">{localizeOwnedText(title)}</h3>
      {children && <p className="max-w-xs text-[15px] text-pretty text-soft">{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
