"use client";



import { ui } from "@/lib/i18n/translate";
import { useInterfaceLanguage } from "@/lib/i18n/useInterfaceLanguage";
import { Check, ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { SUBTITLES } from "@/config/app";
import {
  clampSubtitleHeight,
  clampSubtitleOutline,
  clampSubtitleSize,
  cueTextShadow,
  effectiveOutline,
  normalizeSubtitleStyle,
  outlineApplies,
  SUBTITLE_HEIGHT_STEPS,
  SUBTITLE_OUTLINE_MAX,
  SUBTITLE_SIZE_STEPS,
  SUBTITLE_STYLE_CHOICES,
  SUBTITLE_STYLE_LABELS,
  type SubtitleStyle,
  subtitleLinePercent,
  subtitleSizeMultiplier,
} from "@/lib/subtitles/style";

/**
 * « Apparence », reached from the CC sheet (language and look are ONE flow, no pill under the player): a 16:9 preview that
 * answers at once, Taille, Position, Style and Contour. Global preferences, persisted as they change. A style is a preset
 * (colour, weight, backing and its own default contour); the contour slider then tunes the ring of its text finely. The preview is a mock-up of the real `::cue` rendering, never a second
 * subtitle renderer: the video keeps the browser's own WebVTT display (size by `data-cue-size`, height by `VTTCue.line`).
 * Safari's native fullscreen renders captions itself and may ignore every choice made here; Maximanim never leaves it to force them.
 */

export interface SubtitleLook {
  style: SubtitleStyle;
  size: number;
  height: number;
  /** An index into the contour steps; null = the style's own. */
  outline: number | null;
}

export interface TranslationRow {
  /** « Traduire en français si nécessaire ». */
  enabled: boolean;
  /** A translator backend exists; without one the row says so and cannot be switched. */
  available: boolean;
  onChange: (next: boolean) => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  look: SubtitleLook;
  onChange: (patch: Partial<SubtitleLook>) => void;
  translation: TranslationRow | null;
}

/** What a fixed-height sheet needs: the same height whatever the look, so a slider never moves under the finger. */
const SHEET_HEIGHT = "88dvh";

/** The contour steps, from none to heaviest (the stored index IS the position). */
const OUTLINE_STEPS: readonly number[] = Array.from({ length: SUBTITLE_OUTLINE_MAX + 1 }, (_, i) => i);

/** The ring said in a word. */
function outlineWord(step: number): string {
  return step === 0 ? ui("Aucun") : step <= 2 ? ui("Fin") : step <= 5 ? ui("Moyen") : step <= 7 ? ui("Marqué") : ui("Épais");
}

const startLook = (look: SubtitleLook): SubtitleLook => ({ style: normalizeSubtitleStyle(look.style), size: clampSubtitleSize(look.size), height: clampSubtitleHeight(look.height), outline: clampSubtitleOutline(look.outline) });

export function SubtitleStyleSheet({ open, onClose, look, onChange, translation }: Props) {
  useInterfaceLanguage();
  // The local look answers before the preference round-trip; a reopened sheet starts again from the stored one.
  const [local, setLocal] = useState<SubtitleLook>(() => startLook(look));
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setLocal(startLook(look));
  }
  const set = (patch: Partial<SubtitleLook>) => {
    setLocal((l) => ({ ...l, ...patch }));
    onChange(patch);
  };
  const isDefault = local.size === SUBTITLES.size.default && local.height === SUBTITLES.height.default && local.outline == null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={ui("Apparence")}
      height={SHEET_HEIGHT}
      // The body is sliders and switches: a swipe-to-dismiss starts from the grabber / title bar only.
      dragFrom="handle"
      // A fixed slot (never mounted and unmounted): the sheet does not change size when the look leaves its defaults.
      footer={
        <button
          type="button"
          onClick={() => set({ size: SUBTITLES.size.default, height: SUBTITLES.height.default, outline: null })}
          disabled={isDefault}
          className="min-h-11 text-[15px] font-medium text-accent transition-opacity active:opacity-70 disabled:text-soft disabled:opacity-40"
          data-testid="subtitle-look-reset"
        >
          {ui("Réinitialiser la taille, la position et le contour")}</button>
      }
    >
      <Body local={local} set={set} translation={translation} />
    </Sheet>
  );
}

function Body({ local, set, translation }: { local: SubtitleLook; set: (patch: Partial<SubtitleLook>) => void; translation: TranslationRow | null }) {
  useInterfaceLanguage();
  // A stored legacy « Discret » stays selectable while it is the choice; it is never offered otherwise.
  const styles = SUBTITLE_STYLE_CHOICES.includes(local.style) ? SUBTITLE_STYLE_CHOICES : [...SUBTITLE_STYLE_CHOICES, local.style];

  return (
    <div className="flex flex-col gap-3 pb-1" data-testid="subtitle-style-sheet">
      {/* The preview stays in view while the sliders (and, on a small phone, the styles) scroll under it. */}
      <div className="sticky top-0 z-10 -mx-5 bg-raised px-5 pb-1">
        <Preview look={local} />
      </div>

      <Slider
        label={ui("Taille")}
        testId="subtitle-size"
        steps={SUBTITLE_SIZE_STEPS}
        value={local.size}
        onChange={(size) => set({ size })}
        ends={["A", "A"]}
        valueText={`${Math.round(subtitleSizeMultiplier(local.size) * 100)} %`}
        endClasses={["text-[13px]", "text-[20px]"]}
      />
      <Slider
        label="Position"
        testId="subtitle-height"
        steps={SUBTITLE_HEIGHT_STEPS}
        value={local.height}
        onChange={(height) => set({ height })}
        ends={[ui("Bas"), ui("Haut")]}
        valueText={local.height === SUBTITLES.height.default ? "Standard" : ui("{0} % du bas", 100 - subtitleLinePercent(local.height))}
        endClasses={["text-[13px]", "text-[13px]"]}
      />

      <fieldset>
        <legend className="mb-2 text-[15px] font-semibold text-paper">Style</legend>
        {/* Each look drawn as it will look (over a light band, where a backing or an outline earns its place), so the choice is seen, not read. */}
        {/* One row that scrolls sideways: the sheet shows the look, the sliders AND the styles without a vertical scroll. */}
        <ul role="radiogroup" className="-mx-5 flex scroll-pl-5 snap-x gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {styles.map((key) => (
            <li key={key} className="w-[42%] shrink-0 snap-start">
              <button
                type="button"
                role="radio"
                aria-checked={local.style === key}
                aria-label={SUBTITLE_STYLE_LABELS[key]}
                onClick={() => set({ style: key, outline: null })}
                className="flex min-h-12 w-full flex-col gap-1 text-left active:opacity-70"
                data-testid={`subtitle-style-${key}`}
              >
                <span className={`cue-preview relative block aspect-[16/7] w-full overflow-hidden rounded-lg border ${local.style === key ? "border-accent" : "border-line"}`} data-cue-style={key} aria-hidden="true">
                  <span className="cue-preview-scene absolute inset-0" />
                  <span className="cue-preview-text block" style={{ top: "88%", ["--cue-k" as string]: 1.5, textShadow: cueTextShadow(key, effectiveOutline(key, null)) ?? undefined }}>
                    <span>{ui("J'adore Maxime.")}</span>
                  </span>
                </span>
                <span className="flex items-center justify-between gap-2 text-[15px] text-paper">
                  <span>{SUBTITLE_STYLE_LABELS[key]}</span>
                  {local.style === key && <Check size={17} className="shrink-0 text-accent" aria-hidden="true" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      {/* Always present (a fixed slot): the sheet never changes size. A look drawn on a backing has no ring to tune. */}
      <Slider
        label={ui("Contour")}
        testId="subtitle-outline"
        steps={OUTLINE_STEPS}
        value={effectiveOutline(local.style, local.outline)}
        onChange={(outline) => set({ outline })}
        ends={[ui("Aucun"), ui("Épais")]}
        valueText={outlineApplies(local.style) ? outlineWord(effectiveOutline(local.style, local.outline)) : ui("Fond opaque")}
        endClasses={["text-[12px]", "text-[12px]"]}
        endWidth="w-11"
        disabled={!outlineApplies(local.style)}
      />

      {/* No translator behind the app: nothing is said about translation at all. */}
      {translation?.available && <AdvancedOptions translation={translation} />}
    </div>
  );
}

/** Translation is a last resort (French exists natively, or from an external provider, first): a quiet disclosure, closed by default. */
function AdvancedOptions({ translation }: { translation: TranslationRow }) {
  useInterfaceLanguage();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const on = translation.enabled;
  return (
    <div className="border-t border-line" data-testid="subtitle-translation-row">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)} className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-[14px] text-soft active:opacity-70" data-testid="subtitle-advanced-toggle">
        <span>{ui("Options avancées")}{on ? ui(" traduction activée") : ""}</span>
        <ChevronRight size={16} className={`shrink-0 text-muted transition-transform duration-150 ${open ? "rotate-90" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} className="flex items-center justify-between gap-3 pb-2">
          <span className="min-w-0 py-1">
            <span className="block text-[14px] text-paper">{ui("Traduire en français si nécessaire")}</span>
            <span className="block text-[12px] leading-snug text-soft">
              {ui("Quand seul l'anglais existe : une piste « Français (traduit) » s'ajoute, l'anglais reste.")}</span>
          </span>
          <Switch checked={on} onChange={translation.onChange} label={ui("Traduire en français si nécessaire")} />
        </div>
      )}
    </div>
  );
}

/** `steps` lists the stored indices in the order the slider walks them (the indices never moved when the range grew). */
function Slider({ label, testId, value, steps, onChange, ends, valueText, endClasses, endWidth, disabled = false }: { label: string; testId: string; value: number; steps: readonly number[]; onChange: (v: number) => void; ends: [string, string]; valueText: string; endClasses: [string, string]; endWidth?: string; disabled?: boolean }) {
  useInterfaceLanguage();
  const position = Math.max(0, steps.indexOf(value));
  return (
    <div>
      <div className="mb-0.5 flex items-baseline justify-between">
        <span className="text-[15px] font-semibold text-paper">{label}</span>
        <span className="text-[13px] text-soft tabular-nums">{valueText}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`${endWidth ?? "w-7"} shrink-0 text-center font-semibold text-soft ${endClasses[0]}`} aria-hidden="true">
          {ends[0]}
        </span>
        <input
          type="range"
          min={0}
          max={steps.length - 1}
          step={1}
          value={position}
          onChange={(e) => onChange(steps[Number(e.target.value)] ?? value)}
          aria-label={label}
          aria-valuetext={valueText}
          disabled={disabled}
          // touch-none: the browser never starts a pan from the thumb, so a little vertical drift cannot cancel the drag.
          className="h-11 min-w-0 flex-1 cursor-pointer touch-none accent-[var(--color-accent)] disabled:cursor-default disabled:opacity-40"
          data-testid={testId}
        />
        <span className={`${endWidth ?? "w-9"} shrink-0 text-center font-semibold text-soft ${endClasses[1]}`} aria-hidden="true">
          {ends[1]}
        </span>
      </div>
    </div>
  );
}

/** A frame of a 16:9 picture with a two-line caption placed exactly where the cue's bottom edge goes. */
function Preview({ look }: { look: SubtitleLook }) {
  useInterfaceLanguage();
  const line = subtitleLinePercent(look.height);
  return (
    <div
      className="cue-preview relative aspect-video w-full overflow-hidden rounded-xl border border-line"
      data-testid="subtitle-preview"
      data-cue-style={look.style}
      data-cue-size={look.size}
      data-cue-line={line}
      role="img"
      aria-label={ui("Aperçu des sous-titres")}
    >
      <div className="cue-preview-scene absolute inset-0" aria-hidden="true" />
      <p className="cue-preview-text" style={{ top: `${line}%`, ["--cue-k" as string]: subtitleSizeMultiplier(look.size), textShadow: cueTextShadow(look.style, effectiveOutline(look.style, look.outline)) ?? undefined }}>
        <span>{ui("Je suis amoureux de Maxime.")}</span>
        <br />
        <span>{ui("J'adore Maxime.")}</span>
      </p>
    </div>
  );
}
