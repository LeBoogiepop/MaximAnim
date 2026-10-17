import { z } from "zod";
import { GRAPH_PAGES } from "@/config/app";
import type { AnimeTitles, CatalogueEntry, CoverImage, MediaSource, PartialDate } from "@/types/anime";
import { AniListError, request } from "./client";
import { clean, normalizeDate, normalizeEntry } from "./normalize";
import { ENTRY_FIELDS } from "./queries";
import { isAuthorRole } from "./work-roles";
import { rawEntrySchema } from "./schema";
import { entrySource } from "./editorial";

export type { CatalogueEntry };

/**
 * The people, studios and source works behind an anime: everything is read from AniList's own graph (a person's anime
 * credits with their role, a studio's productions, the work an anime adapts) — raw → Zod → normalize → domain types,
 * like the rest. Nothing here is inferred from a title.
 */

const nullableString = z.string().nullish();
const nullableNumber = z.number().nullish();
const pageInfo = z.object({ hasNextPage: z.boolean().nullish() }).nullish();
const rawName = z.object({ full: nullableString, native: nullableString }).nullish();
const rawImage = z.object({ medium: nullableString, large: nullableString }).nullish();
const rawDate = z.object({ year: nullableNumber, month: nullableNumber, day: nullableNumber }).nullish();
const catalogueEntry = rawEntrySchema.extend({ source: nullableString });

// ---------------------------------------------------------------------------------------------------------------- types

export interface Person {
  id: number;
  name: string;
  nativeName: string | null;
  image: string | null;
  occupations: string[];
  /** AniList's free-text home town (a birthplace, NOT a nationality). Absent when AniList has none. */
  homeTown?: string | null;
  siteUrl: string | null;
}

/** One anime of a person's filmography, with every role they held on it (merged). */
export interface PersonCredit {
  entry: CatalogueEntry;
  roles: string[];
}

export interface StaffPersonRoles {
  id: number;
  name: string;
  nativeName: string | null;
  image: string | null;
  roles: string[];
}

export interface Studio {
  id: number;
  name: string;
  isAnimationStudio: boolean;
  siteUrl: string | null;
}

export interface StudioWork {
  entry: CatalogueEntry;
  /** Main animation studio of this anime (false: another participation). */
  main: boolean;
}

export interface WorkAuthor {
  id: number;
  name: string;
  nativeName: string | null;
  image: string | null;
  roles: string[];
}

export interface Work {
  id: number;
  titles: AnimeTitles;
  preferredTitle: string;
  /** AniList's own format: MANGA, NOVEL, ONE_SHOT… */
  format: string | null;
  status: string | null;
  countryOfOrigin: string | null;
  coverImage: CoverImage;
  startDate: PartialDate | null;
  endDate: PartialDate | null;
  chapters: number | null;
  volumes: number | null;
  authors: WorkAuthor[];
  /** Anime AniList lists as adaptations of this work (its own relations, not a title match). */
  adaptations: CatalogueEntry[];
  siteUrl: string | null;
  externalLinks: { site: string; url: string }[];
}

export interface Paged<T> {
  items: T[];
  hasNext: boolean;
}

// ----------------------------------------------------------------------------------------------------------- queries

const STAFF_NODE = /* GraphQL */ `
  id
  name { full native }
  image { medium large }
`;

export const STAFF_CREDITS_QUERY = /* GraphQL */ `
  query StaffCredits($id: Int!, $page: Int!, $perPage: Int!) {
    Media(id: $id, type: ANIME) {
      id
      staff(page: $page, perPage: $perPage, sort: [RELEVANCE, ID]) {
        pageInfo { hasNextPage }
        edges { role node { ${STAFF_NODE} } }
      }
    }
  }
`;

export const PERSON_QUERY = /* GraphQL */ `
  query PersonPage($id: Int!, $page: Int!, $perPage: Int!) {
    Staff(id: $id) {
      ${STAFF_NODE}
      primaryOccupations
      homeTown
      siteUrl
      staffMedia(type: ANIME, sort: [START_DATE_DESC], page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        edges { staffRole node { ${ENTRY_FIELDS} source(version: 3) } }
      }
    }
  }
`;

/** `isMain` is written into the document: AniList does not treat a null variable as absent. */
export const studioQuery = (isMain: boolean, upcoming = false, order: "newest" | "oldest" = "newest") => /* GraphQL */ `
  query StudioPage($id: Int!, $page: Int!, $perPage: Int!) {
    Studio(id: $id) {
      id
      name
      isAnimationStudio
      siteUrl
      media(sort: [${upcoming ? "STATUS_DESC, " : ""}${order === "oldest" ? "START_DATE" : "START_DATE_DESC"}], isMain: ${isMain}, page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        edges { isMainStudio node { ${ENTRY_FIELDS} source(version: 3) } }
      }
    }
  }
`;

export const WORK_QUERY = /* GraphQL */ `
  query WorkPage($id: Int!) {
    Media(id: $id, type: MANGA) {
      id
      type
      format
      status
      countryOfOrigin
      chapters
      volumes
      title { romaji english native }
      coverImage { medium large extraLarge color }
      startDate { year month day }
      endDate { year month day }
      siteUrl
      externalLinks { url site }
      staff(perPage: 25, sort: [RELEVANCE, ID]) { edges { role node { ${STAFF_NODE} } } }
      relations { edges { relationType(version: 2) node { ${ENTRY_FIELDS} source(version: 3) } } }
    }
  }
`;

// ------------------------------------------------------------------------------------------------------------ schemas

const staffEdge = z.object({ role: nullableString, node: z.object({ id: z.number().int(), name: rawName, image: rawImage }).nullish() }).nullable();

const staffCreditsResponse = z.object({
  Media: z.object({ staff: z.object({ pageInfo, edges: z.array(staffEdge).nullish() }).nullish() }).nullish(),
});

const personResponse = z.object({
  Staff: z
    .object({
      id: z.number().int(),
      name: rawName,
      image: rawImage,
      primaryOccupations: z.array(z.string().nullable()).nullish(),
      homeTown: nullableString,
      siteUrl: nullableString,
      staffMedia: z.object({ pageInfo, edges: z.array(z.object({ staffRole: nullableString, node: catalogueEntry.nullish() }).nullable()).nullish() }).nullish(),
    })
    .nullish(),
});

const studioResponse = z.object({
  Studio: z
    .object({
      id: z.number().int(),
      name: z.string(),
      isAnimationStudio: z.boolean().nullish(),
      siteUrl: nullableString,
      media: z.object({ pageInfo, edges: z.array(z.object({ isMainStudio: z.boolean().nullish(), node: catalogueEntry.nullish() }).nullable()).nullish() }).nullish(),
    })
    .nullish(),
});

const workResponse = z.object({
  Media: z
    .object({
      id: z.number().int(),
      type: nullableString,
      format: nullableString,
      status: nullableString,
      countryOfOrigin: nullableString,
      chapters: nullableNumber,
      volumes: nullableNumber,
      title: z.object({ romaji: nullableString, english: nullableString, native: nullableString }).nullish(),
      coverImage: z.object({ medium: nullableString, large: nullableString, extraLarge: nullableString, color: nullableString }).nullish(),
      startDate: rawDate,
      endDate: rawDate,
      siteUrl: nullableString,
      externalLinks: z.array(z.object({ url: nullableString, site: nullableString }).nullable()).nullish(),
      staff: z.object({ edges: z.array(staffEdge).nullish() }).nullish(),
      relations: z.object({ edges: z.array(z.object({ relationType: nullableString, node: catalogueEntry.nullish() }).nullable()).nullish() }).nullish(),
    })
    .nullish(),
});

// -------------------------------------------------------------------------------------------------------- normalizers

type RawCatalogueEntry = z.infer<typeof catalogueEntry>;

const SOURCES: readonly MediaSource[] = ["ORIGINAL", "MANGA", "LIGHT_NOVEL", "VISUAL_NOVEL", "VIDEO_GAME", "NOVEL", "WEB_NOVEL", "DOUJINSHI", "ANIME", "LIVE_ACTION", "GAME", "COMIC", "MULTIMEDIA_PROJECT", "PICTURE_BOOK", "OTHER"];

function entryOf(raw: RawCatalogueEntry): CatalogueEntry {
  const source = (SOURCES as readonly (string | null | undefined)[]).includes(raw.source) ? (raw.source as MediaSource) : null;
  return { ...normalizeEntry(raw), source: entrySource(raw.id, source) };
}

const peopleOf = (edges: z.infer<typeof staffEdge>[] | null | undefined): StaffPersonRoles[] => {
  const byId = new Map<number, StaffPersonRoles>();
  for (const edge of edges ?? []) {
    const node = edge?.node;
    const name = clean(node?.name?.full) ?? clean(node?.name?.native);
    if (!node || !name) continue;
    const person = byId.get(node.id) ?? { id: node.id, name, nativeName: clean(node.name?.native), image: clean(node.image?.large) ?? clean(node.image?.medium), roles: [] };
    const role = clean(edge?.role);
    if (role && !person.roles.includes(role)) person.roles.push(role);
    byId.set(node.id, person);
  }
  return [...byId.values()];
};

// --------------------------------------------------------------------------------------------------------------- API

/** One page of an anime's credits (« Tout le staff »), merged per person within the page. */
export async function fetchStaffPage(animeId: number, page: number, signal?: AbortSignal): Promise<Paged<StaffPersonRoles>> {
  const data = await request(STAFF_CREDITS_QUERY, { id: animeId, page, perPage: GRAPH_PAGES.staffPageSize }, staffCreditsResponse, signal);
  return { items: peopleOf(data.Media?.staff?.edges), hasNext: data.Media?.staff?.pageInfo?.hasNextPage === true };
}

export async function fetchPersonPage(id: number, page: number, signal?: AbortSignal, order: "newest" | "oldest" = "newest"): Promise<{ person: Person; credits: { entry: CatalogueEntry; role: string | null }[]; hasNext: boolean }> {
  const data = await request(order === "oldest" ? PERSON_QUERY.replace("START_DATE_DESC", "START_DATE") : PERSON_QUERY, { id, page, perPage: GRAPH_PAGES.pageSize }, personResponse, signal);
  const staff = data.Staff;
  const name = clean(staff?.name?.full) ?? clean(staff?.name?.native);
  if (!staff || !name) throw new AniListError("notFound", "Personne introuvable.");
  const credits = (staff.staffMedia?.edges ?? []).flatMap((e) => (e?.node ? [{ entry: entryOf(e.node), role: clean(e.staffRole) }] : []));
  return {
    person: {
      id: staff.id,
      name,
      nativeName: clean(staff.name?.native),
      image: clean(staff.image?.large) ?? clean(staff.image?.medium),
      occupations: (staff.primaryOccupations ?? []).filter((o): o is string => Boolean(o)),
      homeTown: clean(staff.homeTown),
      siteUrl: clean(staff.siteUrl),
    },
    credits,
    hasNext: staff.staffMedia?.pageInfo?.hasNextPage === true,
  };
}

export async function fetchStudioPage(id: number, page: number, isMain: boolean, signal?: AbortSignal, upcoming = false, order: "newest" | "oldest" = "newest"): Promise<{ studio: Studio; works: StudioWork[]; hasNext: boolean; upcomingSeen?: boolean; statusTail?: CatalogueEntry["status"] }> {
  const data = await request(studioQuery(isMain, upcoming, order), { id, page, perPage: GRAPH_PAGES.pageSize }, studioResponse, signal);
  const studio = data.Studio;
  if (!studio) throw new AniListError("notFound", "Studio introuvable.");
  const works = (studio.media?.edges ?? []).flatMap((e) => (e?.node && (isMain || e.isMainStudio === false) ? [{ entry: entryOf(e.node), main: e.isMainStudio === true }] : []));
  return {
    studio: { id: studio.id, name: studio.name, isAnimationStudio: studio.isAnimationStudio === true, siteUrl: clean(studio.siteUrl) },
    works,
    ...(upcoming ? { upcomingSeen: works.some(w => w.entry.status === "NOT_YET_RELEASED"), statusTail: works.filter(w => w.entry.status != null).at(-1)?.entry.status } : {}),
    // Empty/duplicate/filtered pages cannot prove exhaustion: only the API ends the list.
    hasNext: studio.media?.pageInfo?.hasNextPage === true,
  };
}

export async function fetchWork(id: number, signal?: AbortSignal): Promise<Work> {
  const data = await request(WORK_QUERY, { id }, workResponse, signal);
  const media = data.Media;
  if (!media) throw new AniListError("notFound", "Œuvre introuvable.");
  const titles: AnimeTitles = { romaji: clean(media.title?.romaji), english: clean(media.title?.english), native: clean(media.title?.native) };
  const authors = peopleOf(media.staff?.edges).filter((p) => p.roles.some(isAuthorRole));
  const links = (media.externalLinks ?? []).flatMap((l) => (l?.url && l.site && /^https:\/\//i.test(l.url) ? [{ site: l.site.trim(), url: l.url.trim() }] : []));
  return {
    id: media.id,
    titles,
    preferredTitle: titles.romaji ?? titles.english ?? titles.native ?? "Titre inconnu",
    format: clean(media.format),
    status: clean(media.status),
    countryOfOrigin: /^[A-Z]{2}$/.test(media.countryOfOrigin ?? "") ? media.countryOfOrigin! : null,
    coverImage: {
      medium: clean(media.coverImage?.medium),
      large: clean(media.coverImage?.large),
      extraLarge: clean(media.coverImage?.extraLarge),
      color: clean(media.coverImage?.color),
    },
    startDate: normalizeDate(media.startDate),
    endDate: normalizeDate(media.endDate),
    chapters: media.chapters ?? null,
    volumes: media.volumes ?? null,
    authors,
    adaptations: (media.relations?.edges ?? []).flatMap((e) => (e?.relationType === "ADAPTATION" && e.node?.type === "ANIME" ? [entryOf(e.node)] : [])),
    siteUrl: clean(media.siteUrl),
    externalLinks: links,
  };
}
