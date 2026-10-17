"use client";

import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ChevronRight, UserRound } from "lucide-react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { intent } from "@/features/catalogue/queries";
import { SectionTitle } from "@/components/ui/Section";
import { STAFF_HEADLINE } from "@/config/app";
import { STAFF_GROUP_LABELS } from "@/lib/utils/format";
import type { StaffCredit, StaffRoleGroup } from "@/types/anime";
import { isOrganization } from "@/lib/anilist/editorial";

/**
 * The headline credits, with a portrait: the few people who made the anime, in a fixed reading order (original work
 * for an adaptation, direction, script, character design, animation, storyboard, art, sound, music) — a compact tile each: portrait, name, and the
 * role that put them here. At most `STAFF_HEADLINE.max` of them; everything else is behind « Tout le staff ».
 */
export function StaffBlock({ staff, linkTo, allHref }: { staff: StaffCredit[]; linkTo?: (id: number) => string; allHref?: string }) {
  useInterfaceLanguage();
  if (!staff.length) return null;
  const tiles = headlineTiles(staff);
  return (
    <section aria-labelledby="staff-title" data-testid="staff-block">
      <SectionTitle id="staff-title" className="px-safe mb-3">
        {ui("Équipe")}</SectionTitle>
      <ul className="rail" data-testid="staff-tiles">
        {tiles.map(({ person, group }) => (
          <li key={person.id} className="w-[5.75rem] shrink-0" data-fact={group} data-testid={`staff-${group}`}>
            <PersonTile person={person} role={STAFF_GROUP_LABELS[group]} href={group === "original" && isOrganization(person.name) ? undefined : linkTo?.(person.id)} />
          </li>
        ))}
      </ul>
      {allHref && (
        <Link href={allHref} className="px-safe flex min-h-12 items-center justify-between gap-2 text-[15px] font-medium text-paper active:opacity-70" data-testid="all-staff">
          {ui("Tout le staff")}<ChevronRight size={18} className="context-accent" aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}

/** One tile per person (the role that ranks first), by role order, a couple of people per role, capped. */
export function headlineTiles(staff: readonly StaffCredit[]): { person: StaffCredit; group: StaffRoleGroup }[] {
  const seen = new Set<number>();
  const tiles: { person: StaffCredit; group: StaffRoleGroup }[] = [];
  for (const group of ROLE_ORDER) {
    let taken = 0;
    for (const person of staff) {
      if (taken >= STAFF_HEADLINE.perGroup || tiles.length >= STAFF_HEADLINE.max) break;
      if (!person.groups.includes(group) || seen.has(person.id)) continue;
      seen.add(person.id);
      tiles.push({ person, group });
      taken++;
    }
  }
  return tiles;
}

/** A compact portrait (rounded square, not a bubble), the name, and the role under it. The whole tile opens the person. */
function PersonTile({ person, role, href }: { person: StaffCredit; role: string; href?: string }) {
  useInterfaceLanguage();
  const queryClient = useQueryClient();
  const has = person.image && !person.image.includes("default.jpg");
  const body = (
    <>
      <span className="relative block aspect-square w-full overflow-hidden rounded-[var(--radius-card)] bg-surface">
        {has ? (
          <Image src={person.image!} alt="" fill sizes="92px" className="object-cover" loading="lazy" />
        ) : (
          // No portrait on AniList: a neutral silhouette on the same tile, never a stray initial.
          <span className="absolute inset-0 flex items-center justify-center bg-raised text-muted" aria-hidden="true" data-testid="portrait-fallback">
            <UserRound size={34} strokeWidth={1.5} />
          </span>
        )}
      </span>
      <span className="mt-1.5 line-clamp-2 block text-[14px] leading-tight font-medium text-paper">{person.name}</span>
      <span className="mt-1 line-clamp-2 block text-[13px] leading-snug text-soft">{role}</span>
    </>
  );
  return href ? (
    <Link href={href} className="staff-link tactile block rounded-[var(--radius-card)]" data-testid="person-link" onPointerDown={() => intent.person(queryClient, person.id)}>
      {body}
    </Link>
  ) : (
    <div>{body}</div>
  );
}

export function PersonAvatar({ name: _name, image, size = 36 }: { name: string; image: string | null; size?: number }) {
  useInterfaceLanguage();
  return (
    <span className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface" style={{ width: size, height: size }}>
      {image && !image.includes("default.jpg") ? (
        <Image src={image} alt="" fill sizes={`${size}px`} className="object-cover" loading="lazy" />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-raised text-muted" aria-hidden="true" data-testid="portrait-fallback">
          <UserRound size={Math.round(size * 0.6)} strokeWidth={1.5} />
        </span>
      )}
    </span>
  );
}

/** An adaptation reads « author, then the people who made it » (the author only exists in the data of an adaptation). */
const ROLE_ORDER: StaffRoleGroup[] = ["original", "director", "composition", "characterDesign", "animationDirection", "storyboard", "artDirection", "soundDirection", "music"];
