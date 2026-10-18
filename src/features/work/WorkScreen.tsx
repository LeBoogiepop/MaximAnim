"use client";



import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { DetailHeader } from "@/components/layout/DetailHeader";
import { ToneGlow, toneVars } from "@/components/layout/ToneScope";
import { FactList, FactRow } from "@/components/ui/FactList";
import { Poster } from "@/components/ui/Poster";
import { SectionTitle } from "@/components/ui/Section";
import { PersonAvatar } from "@/features/anime/DetailSections";
import { workOptions } from "@/features/catalogue/queries";
import { PageSkeleton, PageState } from "@/features/catalogue/shared";
import { useTitles } from "@/features/settings/PreferencesContext";
import { type Work } from "@/lib/anilist/catalogue";
import { shownLinks } from "@/lib/anilist/links";
import { workRolesOf } from "@/lib/anilist/work-roles";
import { useContentMark } from "@/lib/perf/use-content-mark";
import { countryOf, SOURCE_LABELS } from "@/lib/utils/format";
import { routes } from "@/lib/utils/routes";
import { toneFromCover } from "@/lib/utils/tone";
import { SourceAdaptationRow } from "./SourceAdaptationRow";

const FORMATS: Record<string, string> = { MANGA: "Manga", get NOVEL() { return ui("Roman"); }, ONE_SHOT: "One-shot" };
const STATUSES: Record<string, string> = { get FINISHED() { return ui("Terminé"); }, get RELEASING() { return ui("En publication"); }, get NOT_YET_RELEASED() { return ui("À venir"); }, get CANCELLED() { return ui("Arrêté"); }, get HIATUS() { return ui("En pause"); } };

/**
 * The manga or novel an anime adapts, for the cultural context of the adaptation only — not a reader. Everything on it
 * comes from AniList's own record of that work; a field AniList does not have is not shown, not filled in. The rows are the
 * same for every work (Type, Pays, Publication, Volumes, Statut): a figure AniList lacks says « Non renseigné » instead of
 * moving the rows around. `origin` is how the anime words it (« Light novel »): AniList only knows « Roman ».
 */
export function WorkScreen({ id, origin = null }: { id: number; origin?: "LIGHT_NOVEL" | "WEB_NOVEL" | null }) {
  useInterfaceLanguage();
  const query = useQuery(workOptions(id));
  if (query.isPending) return <PageSkeleton label={ui("Chargement de l'œuvre")} />;
  if (query.isError) return <PageState error={query.error} subject={ui("Cette œuvre")} onRetry={() => void query.refetch()} back={routes.home()} />;
  return <WorkView work={query.data} origin={origin} />;
}

/** « depuis 2014 », « 2014 — 2019 », « 2014 »: years only, as precise as is useful for a book. */
function publicationOf(work: Work): string | null {
  const from = work.startDate?.year ?? null;
  const to = work.endDate?.year ?? null;
  if (from == null) return null;
  if (work.status === "RELEASING" || work.status === "HIATUS") return ui("depuis {0}", from);
  return to != null && to !== from ? `${from} – ${to}` : String(from);
}

function WorkView({ work, origin }: { work: Work; origin: "LIGHT_NOVEL" | "WEB_NOVEL" | null }) {
  useInterfaceLanguage();
  const { main } = useTitles();
  const tone = toneFromCover(work.coverImage.color);
  const country = countryOf(work.countryOfOrigin);
  const novel = work.format === "NOVEL";
  const type = novel && origin ? (SOURCE_LABELS[origin] ?? ui("Roman")) : work.format ? (FORMATS[work.format] ?? work.format) : null;
  const publication = publicationOf(work);
  const links = shownLinks({ id: work.id, siteUrl: work.siteUrl, links: work.externalLinks, kind: "manga" });
  useContentMark(`work:${work.id}`, true);

  return (
    <div className="page-in pb-4" style={toneVars(tone)}>
      <div className="relative mx-auto max-w-4xl">
        <ToneGlow />
        <DetailHeader
          fallback={routes.home()}
          title={main(work.titles)}
          titleTestId="work-title"
          context={ui("Œuvre d'origine")}
          image={{ render: (size) => <Poster cover={work.coverImage} alt="" sizes={`${size}px`} className="w-full" priority />, viewer: { src: work.coverImage.extraLarge ?? work.coverImage.large ?? work.coverImage.medium, alt: ui("Couverture de {0}", main(work.titles)) } }}
        />

        <div className="px-safe">
          <FactList testId="work-facts">
            {type && <FactRow label="Type" fact="type">{type}</FactRow>}
            {country && <FactRow label={ui("Pays")} fact="country">{country.name}</FactRow>}
            {publication && <FactRow label="Publication" fact="publication">{publication}</FactRow>}
            <FactRow label="Volumes" fact="volumes">
              {work.volumes ? String(work.volumes) : <span className="text-soft">{ui("Non renseigné")}</span>}
            </FactRow>
            {work.chapters ? <FactRow label={ui("Chapitres")} fact="chapters">{String(work.chapters)}</FactRow> : null}
            {work.status && STATUSES[work.status] && <FactRow label={ui("Statut")} fact="status">{STATUSES[work.status]}</FactRow>}
          </FactList>
        </div>

        <div className="mt-6 flex flex-col gap-7">
          {work.authors.length > 0 && (
            <section aria-labelledby="authors-title" data-testid="work-authors" className="px-safe">
              <SectionTitle id="authors-title" className="mb-1">
                {work.authors.length > 1 ? ui("Auteurs") : ui("Auteur")}
              </SectionTitle>
              <ul className="flex flex-col divide-y divide-line">
                {work.authors.map((a) => (
                  <li key={a.id}>
                    <Link href={routes.person(a.id)} className="tactile flex min-h-14 items-center gap-3 py-2 active:bg-raised" data-testid="author-link">
                      <PersonAvatar name={a.name} image={a.image} size={40} />
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold">{a.name}</span>
                        <span className="block text-[13px] text-soft">{workRolesOf(a.roles, { novel }).join(", ")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {work.adaptations.length > 0 && (
            <section aria-labelledby="adapt-title" data-testid="work-adaptations" className="px-safe">
              <SectionTitle id="adapt-title" className="mb-1">
                {ui("Adaptations animées")}</SectionTitle>
              <ul className="flex flex-col divide-y divide-line">
                {work.adaptations.map((entry) => (
                  <li key={entry.id}>
                    <SourceAdaptationRow entry={entry} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-label={ui("Liens")} className="px-safe">
            <SectionTitle className="mb-1 text-[17px]">{ui("Liens")}</SectionTitle>
            <ul className="flex flex-wrap gap-x-5">
              {links.map((l) => (
                <li key={l.key}>
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center gap-1.5 text-[15px] text-soft underline decoration-line underline-offset-4">
                    {l.label}
                    <ExternalLink size={14} className="text-muted" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
