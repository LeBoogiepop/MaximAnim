import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { ui } from "@/lib/i18n/translate";
export function ArtworkCredits() { useInterfaceLanguage(); return <p className="text-xs text-soft">{ui("Catalogue et illustrations : AniList et leurs titulaires de droits. Les vidéos de cette édition sont des démonstrations autorisées, pas des épisodes d’anime.")}</p>; }
