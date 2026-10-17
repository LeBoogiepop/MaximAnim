"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import Link from "next/link";

/**
 * Desktop-only context next to "Retour" (« Réglages › Sources »): where this
 * screen sits, one click to its parent. Mobile keeps the back button alone.
 */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  useInterfaceLanguage();
  return (
    <nav aria-label={ui("Fil d'Ariane")} className="hidden min-w-0 items-center gap-2 text-[13px] lg:flex" data-testid="breadcrumbs">
      {items.map((item, i) => (
        <span key={item.label} className="flex min-w-0 items-center gap-2">
          {i > 0 && (
            <span className="text-muted" aria-hidden="true">
              ›
            </span>
          )}
          {item.href ? (
            <Link href={item.href} className="truncate text-soft hover:text-paper">
              {item.label}
            </Link>
          ) : (
            <span className="truncate text-paper" aria-current="page">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
