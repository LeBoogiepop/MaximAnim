/**
 * Every tunable number of the app lives here. Components never hardcode
 * thresholds, durations or limits — they import them from this module.
 */

export const APP_NAME = "MaximAnim";

export const NAVIGATION = { keyboardViewportRatio: 0.75, retainedEntries: 80, restoreTimeoutMs: 4000 } as const;

export const IMAGE_DELIVERY = { directTimeoutMs: 5000, priorityTimeoutMs: 6000, maxBytes: 2 * 1024 * 1024, concurrency: 2, maxPending: 16 } as const;

export const RC10 = {
  paletteCacheEntries: 64, paletteSampleSize: 24,
  // Desktop artwork fills the content area beside the navigation rail; mobile keeps its existing rendition sizes.
  heroImageSizes: "(min-width: 1024px) calc(100vw - 12.5rem), 100vw",
  heroMetadataBudgetMs: 2200, heroImageBudgetMs: 6500,
  heroLogoSizes: "(min-width: 1024px) 480px, 88vw",
  episodeInlineRows: 3, episodePageSize: 30, episodeMetadataLimit: 2000,
  // Owner-approved image paths only; the metadata parser still rejects all other URLs.
  episodeThumbnailsEnabled: true,
  episodeCreditPages: 3,
} as const;
export const ARTWORK_PALETTE = {
  lightness: 0.81, maxChroma: 0.085, warmMaxChroma: 0.025, neutral: "#bac4cf",
  warmHueMin: 25, warmHueMax: 95, skinHueMax: 85, skinWeight: 0.3,
  sampleMinLightness: 0.2, sampleMaxLightness: 0.96, sampleMinChroma: 0.035,
  hueBucketDegrees: 30, minAlpha: 128,
} as const;
export const APP_DESCRIPTION = "Bibliothèque, suivi et lecteur d'anime — pensé pour l'iPhone.";

export const GUEST_PLAYBACK = {
  evidenceTtlMs: 30 * 60_000, windowMs: 10 * 60_000,
  maxRequests: 1200, maxControlRequests: 120, maxBytes: 512 * 1024 * 1024,
  maxBuckets: 2000, maxBodyBytes: 512 * 1024,
} as const;

export const THEME = {
  ink: "#000000",
  paper: "#F6F3EE",
} as const;

export const PROGRESS = {
  /** An episode counts as watched once this share of it has been played. */
  defaultCompletionThreshold: 0.9,
  /** Bounds offered in Settings for the completion threshold. */
  minCompletionThreshold: 0.7,
  maxCompletionThreshold: 0.98,
  /** Throttle for periodic saves while playing (IndexedDB is not written per frame). */
  saveIntervalMs: 10_000,
  /** Below this, a position is not worth saving or resuming. */
  minMeaningfulSeconds: 5,
  /** Do not resume into the last seconds: start over instead. */
  resumeEndMarginSeconds: 15,
  /** Rewind a little on resume so the viewer regains context. */
  resumeRewindSeconds: 2,
  /** Consecutive plays of the same episode within this window share one history entry. */
  historyMergeWindowMs: 45 * 60 * 1000,
} as const;

export const PLAYER = {
  seekStepSeconds: 10,
  controlsHideDelayMs: 2800,
  doubleTapWindowMs: 280,
  /** A touch that moved further than this between down and up is a drag, not a tap (iPhone fingers drift a few points). */
  tapSlopPx: 12,
  /** Share of the width, on each side, that reacts to double-tap seeking. */
  doubleTapZone: 0.38,
  nextEpisodeCountdownSeconds: 6,
  /** A resolved stream must reach metadata within this time (after the play request), else it failed. */
  startupTimeoutMs: 11_000,
  playbackRates: [0.75, 1, 1.25, 1.5, 1.75, 2] as const,
  /** A larger « Épisode suivant » treatment appears from this share of the episode (the small control is there the whole time). */
  nextVisibleFrom: 0.85,
  /**
   * RC9.2: once THIS episode has shown its first frame, the IMMEDIATE next one is prepared after this short idle delay (episode
   * list, stream, relay session — metadata only, never media, never more than one episode ahead). It is prepared again when the
   * larger « Épisode suivant » treatment appears (the first preparation is dropped from the cache after `STREAM_STALE_MS`).
   */
  prepareNextAfterMs: 3_000,
  /** A swipe up on the picture enters fullscreen: at least this far, mostly vertical, and quick (a drag or a slow pan is not it). */
  swipeUpMinPx: 64,
  swipeUpMaxMs: 700,
  /** …and its horizontal drift must stay under this share of its height. */
  swipeUpMaxDrift: 0.6,
  /** Decoded resolution is followed this long after the first frame (adaptive HLS climbs). */
  qualityWindowMs: 30_000,
  /** A loading spinner only appears once a load has lasted this long: a fast start never flashes one. */
  loadingSpinnerDelayMs: 450,
  /** « Préparation de l'épisode… » lasts this long before the page admits it takes longer than expected (no detail, no error name). */
  slowPreparationMs: 8_000,
  /** Still no picture this long into the preparation: the stage stops waiting silently and offers « Réessayer » / « Essayer une autre source ». */
  stuckPreparationMs: 20_000,
  /** The small "+10 s" text after a double tap stays this long (no disc, no animation over the picture). */
  seekHintMs: 650,
  /** Swipe-down on a sheet: dismissed past this share of its height, or past this speed (px/ms) after a short pull. */
  sheetDismissShare: 0.28,
  sheetDismissVelocity: 0.55,
  sheetDismissMinPx: 36,
  /** A vertical move must exceed this before it counts as a sheet drag (a tap stays a tap). */
  sheetDragSlopPx: 8,
  defaultPlaybackRate: 1,
  /** A seek never targets the very last frames (ended would fire instead of playing). */
  seekEndMarginSeconds: 0.25,
  /** A seek has landed once the element reports a position this close to the target. */
  seekToleranceSeconds: 1.5,
  /** A `seeked` this close to the target is accepted as is (keyframe/segment snapping); further means it jumped back. */
  seekAcceptSeconds: 12,
  /** A seek still pending after this is issued once more (iOS sometimes drops a far seek). */
  seekRetryMs: 6_000,
  /**
   * A seek still ACTIVE (`seeking`, or no current data) is left alone: a second `currentTime` write supersedes it and restarts the
   * download. Past this window it counts as stuck and is issued once more, so a frozen seek is never silent.
   */
  seekPatienceMs: 18_000,
  /** How long the player's short notices (unreachable position…) stay. */
  noticeMs: 3_500,
  /** After a fullscreen request, further enter requests are ignored this long unless the browser answers first (a double tap). */
  fullscreenSettleMs: 700,
} as const;

export const SEARCH = {
  historyEntries: 64,
  restoreTimeoutMs: 4000,
  focusIntentTtlMs: 5000,
  debounceMs: 280,
  minQueryLength: 2,
  /** Recently OPENED anime kept on this device (shown on an empty Search): a handful, most recent first. */
  recentOpenedMax: 8,
  /** A press on a Récents row keeps the list for this long after release, so the tap still lands once WebKit has blurred the field. */
  recentsPressHoldMs: 400,
  perPage: 20,
  /** Typo fallback: at most this many variant searches, sent in one request… */
  fallbackVariants: 3,
  /** …each returning this many candidates, ranked locally. */
  fallbackPerVariant: 15,
  /** Shortest query that gets a typo fallback, and shortest token/prefix used as a variant. */
  fallbackMinLength: 4,
  fallbackMinToken: 3,
  /** Normal results are "obviously poor" when none of the first ones is at least this close to the query. */
  poorResultScore: 0.55,
  /** Fallback candidates shown only from this similarity. */
  fallbackMinScore: 0.6,
  /** Results checked when deciding whether normal results are poor. */
  poorCheckTop: 5,
  /** Popular titles kept as a typo-fallback pool (pages of this size, reused this long). */
  popularPoolPages: 2,
  prefixPoolCacheEntries: 16,
  popularPoolPageSize: 50,
  popularPoolTtlMs: 6 * 60 * 60 * 1000,
  /** Discovery rails and filtered browsing are reused this long. */
  discoverStaleMs: 30 * 60 * 1000,
} as const;

/** Airing anime the user follows (progress or a list): lightweight AniList refresh, never provider probing. */
export const AIRING = {
  availabilityRecheckMs: 24 * 60 * 60 * 1000,
  /** Refreshed at launch / on return to the app when older than this. */
  staleMs: 3 * 60 * 60 * 1000,
  /** The launch refresh waits this long so the first screen renders first. */
  launchDelayMs: 1500,
  /** Ids per AniList request (followed-anime batch). */
  idsPerRequest: 25,
  /** A newly aired episode is labelled "Nouveau" this long after it aired. */
  newForMs: 7 * 24 * 60 * 60 * 1000,
  /** The schedule window starts this far back (for "Nouveau")… */
  lookBackMs: 8 * 24 * 60 * 60 * 1000,
  /** …and ends this far ahead of the end of the current week. */
  lookAheadMs: 24 * 60 * 60 * 1000,
} as const;

export const QUERY = {
  searchStaleMs: 5 * 60 * 1000,
  animeStaleMs: 60 * 60 * 1000,
  gcMs: 24 * 60 * 60 * 1000,
  maxRetries: 2,
} as const;

export const ANILIST = {
  endpoint: "https://graphql.anilist.co",
  staffPerPage: 50,
  /** A tag is a theme worth showing from this relevance rank (0–100); spoilers never are. */
  tagMinRank: 60,
  maxTags: 8,
  /** Fallback when AniList rate-limits without a Retry-After header. */
  defaultRetryAfterSeconds: 5,
  /** A request that has not answered by then is abandoned (read as « unreachable »): nothing waits on AniList forever. */
  requestTimeoutMs: 15_000,
} as const;

/**
 * Contextual colour (RC8, reworked RC9): AniList gives each cover a dominant colour; it is an INPUT, never the truth, and
 * never a surface. `toneFromCover` turns the HUE of the Maximanim rose part of the way toward the cover's (in OKLCH, the
 * rose's lightness and chroma kept), so every page has its own accent and none stops being Maximanim.
 */
export const TONE = {
  /** Below this OKLCH chroma the cover is basically grey (or off-white / near-black): no tint, the rose itself. */
  minChroma: 0.03,
  /** How far the brand hue turns toward the cover's, 0–1. A third keeps a brown cover a warm rose, not a brown. */
  hueShare: 0.35,
  /** WCAG contrast of the accent as text/line against the page's ink (the rose's own is about 7). */
  minContrastOnInk: 4.5,
  /** Opacity of the glow behind a hero: a hint in a corner, never a wash. */
  glowAlpha: 0.12,
  /** Opacity of a quiet fill (an active row). */
  softAlpha: 0.14,
} as const;

/**
 * Franchise resolver (RC8): from one entry, walk PREQUEL / SEQUEL / PARENT only (side stories, spin-offs, alternatives
 * and the rest are listed, never walked through), one batched AniList request per level, bounded in levels and size.
 */
/** The few credits the anime page shows with a portrait (the rest is behind « Tout le staff »). */
export const STAFF_HEADLINE = {
  /** Portraits on the page. */
  max: 8,
  /** People shown for one role (two directors, two writers…). */
  perGroup: 2,
} as const;

export const FRANCHISE = {
  /** Levels (= requests) of the walk. A franchise of ten parts is reached from either end. */
  maxLevels: 10,
  /** Entries followed along the chain; beyond it the result says it is truncated. */
  maxNodes: 60,
  /** AniList caps a page at 50. */
  batchSize: 50,
  /** Formats that make an entry part of the main series (a film or an OVA in the chain is secondary). */
  mainFormats: ["TV", "TV_SHORT", "ONA"] as const,
  /**
   * An entry is a « season » only if it is long enough to be one (or its length is not known yet): a one-episode ONA that
   * AniList chains to a long series (One Piece's « MONSTERS »), a 4-episode TV special between two seasons, a « 1st
   * STAGE » teaser are listed with the secondary works, never numbered. A heuristic by design, kept here.
   */
  minSeasonEpisodes: 6,
  /** A group of secondary works (films, specials…) shows this many rows, then « Afficher les N autres »: One Piece has fifty. */
  groupPreview: 8,
  /**
   * One entry that long (or a RELEASING one already past it) makes the series a long runner: continuous, no « Saison N »
   * (One Piece, Naruto: whatever number of entries AniList splits it into). No arc is ever invented from a number.
   */
  longRunnerEpisodes: 100,
  staleMs: 6 * 60 * 60 * 1000,
} as const;

/** Credits shown by the player (docs/v1-credits-contract.md): bounded reads of AniList's staff list, once per anime. */
export const WATCH_CREDITS = {
  /** Staff pages read (GRAPH_PAGES.staffPageSize people each); a longer list is reported as incomplete, never guessed. */
  maxPages: 4,
} as const;

/** People, studios and source works (RC8): pages of AniList's own graph, loaded on demand. */
export const GRAPH_PAGES = {
  /** Productions / credits per request on a studio or person page. */
  pageSize: 25,
  /** People per request on « Tout le staff ». */
  staffPageSize: 30,
  staleMs: 60 * 60 * 1000,
  /** A page left is kept this long: anime → studio → anime → person → anime does not ask AniList again for what was just read. */
  gcMs: 30 * 60 * 1000,
  /**
   * Long lists load as the viewer nears their end (RC9), a page ahead, never all at once: at most this many pages by
   * themselves (AniList answers about 90 requests a minute and caps a page at 25), then an explicit « Afficher la suite ».
   */
  autoPages: 4,
  /** How far before the end of the list the next page is asked for. */
  prefetchMarginPx: 600,
  /** Tri and filtres appear only for a list at least this long and not all alike: six works need no controls. */
  minForControls: 12,
} as const;

export const LISTS = {
  maxNameLength: 40,
  defaultList: { name: "Watching", emoji: "⏳" },
} as const;

export const HOME = {
  maxContinue: 12,
  maxUpNext: 12,
  /** « À venir »: a glance at the next releases of what is followed, not the planning. */
  upcomingShown: 3,
  /**
   * "Retirer de Continuer" applies to the position it was made at: playing the
   * same episode this much further (or another episode) brings the anime back.
   */
  continueDismissStaleSeconds: 60,
  /** The toast offering "Annuler" after a removal. */
  undoMs: 6_000,
  /** Posters above the fold get eager loading/high fetch priority. */
  eagerPosterCount: 3,
  /** The next-to-watch episode's stream is resolved (once) this long after the home screen settles. */
  preResolveDelayMs: 1500,
} as const;

export const EPISODES = {
  /** Fixed row pitch (72px row + 8px gap): lets the list render only what is on screen. */
  rowHeightPx: 64,
  /** Rows rendered before the first measurement. */
  initialRows: 16,
  /** Extra rows above/below the viewport. */
  overscanRows: 8,
} as const;

export const HISTORY = {
  pageSize: 60,
} as const;

export const BACKUP = {
  format: "maxime-anime-backup",
  /** v1: library only · v2: + repositories and installed-source settings · v3: + source permissions, pinned code, preferences, mappings, stable history ids · v4: + explicit airing follows · v5: + explicit library states (Abandonné / Terminé) · v6: + two subtitle looks (Cinéma, Contraste) and seven subtitle heights (preferences only; same shape) · v7: + subtitle size 70 % and height line 97 % (preferences only; same shape) · v8: + subtitle height line 99 % and the contour (`subtitleOutline`, null = the look's own; preferences only). */
  version: 10,
} as const;

export const EXTENSIONS = {
  /** Per-call budget inside the sandbox (search, detail, videos…). */
  invokeTimeoutMs: 25_000,
  /** Loading/initialising an extension script. */
  loadTimeoutMs: 10_000,
  /** A sandbox with no call for this long is destroyed. */
  idleDisposeMs: 90_000,
  /** At most this many sandboxes alive at once (least recently used is dropped). */
  maxLiveSandboxes: 3,
  maxScriptBytes: 2_000_000,
  /** HTTP requests one invocation may issue. */
  maxRequestsPerInvocation: 60,
  /** Body size accepted from an upstream for an extension (HTML/JSON); below the host function payload limit. */
  maxResponseBytes: 4_000_000,
  maxRequestBodyBytes: 256_000,
  requestTimeoutMs: 15_000,
  maxRedirects: 5,
  /** Episode lists and details are reused for this long. */
  episodesTtlMs: 30 * 60 * 1000,
  detailTtlMs: 6 * 60 * 60 * 1000,
  /** Minimum title similarity for an automatic (non-exact) match. */
  autoMatchScore: 0.92,
  /** Below this similarity, search results are considered unrelated. */
  minCandidateScore: 0.35,
  /** Candidates shown in "Choisir la correspondance". */
  maxMatchCandidates: 8,
  /** Titles tried while matching automatically. */
  matchSearchQueries: 3,
  /** Result pages read per title while matching automatically (only while pages stay related). */
  matchSearchPages: 4,
  /** Total search requests one automatic match may spend, across titles and pages. */
  matchSearchBudget: 6,
  /** Extra searches (synonyms, looser spellings) tried only when the main titles found nothing related — within the budget above. */
  matchFallbackQueries: 2,
  /** Entries whose episode list is fetched to verify a match. */
  matchVerifyCandidates: 3,
  /** A requested episode this far past an entry's last one makes the entry suspicious. */
  coverageSlackEpisodes: 2,
  /** Runs this long are checked for coverage even without a requested episode… */
  longSeriesEpisodes: 40,
  /** …and an automatic entry covering less than this share of them is suspicious. */
  minLongSeriesCoverage: 0.25,
  /** A non-exact title is accepted when its entry covers this share of the run… */
  verifiedCoverage: 0.8,
  /** …and its title is at least this close. */
  verifiedTitleScore: 0.75,
  /** Verified score lead required over the runner-up. */
  verifiedMargin: 0.08,
  /** A saved correspondence is re-checked at most this often per episode asked. */
  revalidateMs: 10 * 60 * 1000,
  /** Resolved stream metadata (never media) is reused in memory for this long, or until its URLs expire. */
  streamCacheTtlMs: 4 * 60 * 1000,
  /** Margin before a URL's own expiry after which it is no longer reused. */
  streamExpiryMarginMs: 60 * 1000,
  diagnosticsLimit: 200,
} as const;

/** Conservative validity checks before a playback earns a source-profile success. */
export const PLAYBACK_VALIDATION = {
  /** Reject tiny resources unless an independently known runtime is itself tiny. */
  minKnownSeconds: 10,
  /** Gross truncation only; catalogue runtimes are approximate. */
  minExpectedRatio: 0.35,
  runtimeSlackSeconds: 15,
  /** Real moving playback, excluding pauses, buffering and seek jumps. */
  successSeconds: 15,
  shortRuntimeProofRatio: 0.8,
  seekSlackSeconds: 1,
} as const;

/** Automatic source selection and the device-local playback profile. */
export const AUTO_SOURCE = {
  /** Attempts kept per source (rolling window). */
  attemptsWindow: 30,
  /** Anime availability entries kept per source. */
  availabilityEntries: 400,
  /** "This source has this anime" is trusted for this long… */
  availabilityTtlMs: 7 * 24 * 60 * 60 * 1000,
  /** …"it found nothing" only this long (a search can miss once; a site adds titles). Errors are never stored as absence. */
  negativeAvailabilityTtlMs: 18 * 60 * 60 * 1000,
  /**
   * Score added in Français préféré / Anglais préféré when successful plays of THIS anime really delivered the
   * preferred subtitle language (text track or explicit hard-sub marker). Chosen from behaviour, on a 0–1 score whose
   * quality term is `weights.quality · min(1, height / 1080)`:
   *   – 720p is worth 0.117 less than 1080p  → a reliable 720p FR must beat a reliable 1080p EN (0.17 > 0.117, and it
   *     still wins when it starts ~6 s slower: speed weighs 0.15);
   *   – 480p is worth 0.194 less             → a 480p FR must not (0.17 < 0.194): the preference is felt, not absolute.
   * Never applied to unknown evidence, never in Qualité d'abord, and it cannot lift a failing source (those sort last).
   * RC6: this bonus now only shapes the score of Anglais préféré. Français préféré is lexicographic (see rankSources and
   * FRENCH_HUNT): a source with proven French outranks the others regardless of resolution.
   */
  languagePreferenceBonus: 0.17,
  /** Below this smoothed success rate, after enough attempts, a source is treated as failing. */
  failingReliability: 0.45,
  minAttemptsForVerdict: 4,
  weights: { reliability: 0.5, quality: 0.35, speed: 0.15 },
  /** Neutral values for a source with no history. */
  unknownQuality: 0.6,
  unknownSpeed: 0.5,
  /** Time to first frame at which the speed score halves. */
  speedHalfMs: 5000,
  /** Sources probed at most for an anime with no history… */
  maxProbe: 3,
  /** Hard limit for match + episode metadata, even for a non-cooperative runtime. */
  probeBudgetMs: 15_000,
  /** A new visit briefly deprioritizes a source whose real playback just failed. */
  failureCooldownMs: 60_000,
  maxPlaybackSources: 5,
  /** …at most this many at once: the next one starts if the current one is slow. */
  probeConcurrency: 2,
  hedgeAfterMs: 2500,
  /**
   * …and once that hedge runs, the preferred source has this much longer: past it, a hedge that already found the anime
   * plays now, so one silent source never holds the screen while the next one is ready. A slow preferred source is not
   * lost: the French lane keeps it as a candidate.
   */
  hedgeWinAfterMs: 6000,
  /** Scores closer than this are "essentially equal" (the latest success here wins). */
  tieMargin: 0.03,
  /** A source granted its hosts mid-search is retried at most this often per episode (the viewer's own grants are never automatic). */
  maxGrantRetries: 2,
} as const;

/** Launch-time offer of the recommended sources: shown at most this often on a device, and never again once declined. */
export const SOURCES_OFFER = { maxShown: 2 } as const;

/**
 * A source often returns several servers for one episode. When preparing or starting one of them fails, the other
 * servers of the SAME source are tried before the source is given up — within this many options in total.
 */
export const PLAYBACK_OPTIONS = {
  maxAttempts: 3,
  /** One fresh resolution after all server options fail; never a refresh loop. */
  maxRenewals: 1,
} as const;

/**
 * Français préféré is a promise, not a bonus (RC6): the viewer wants to watch in French. A source that really delivers
 * French (native track, burned-in VOSTFR, external human file) outranks one that does not, whatever the resolution;
 * quality, speed and reliability then order the French options among themselves. When the playing source has no French,
 * every other enabled source is tried once (see lib/sources/french-hunt.ts) — the number of sources decides how long
 * that takes, not a constant — within one global time budget.
 */
export const FRENCH_HUNT = {
  /** One source's own subtitles and the external lookup have this long to show a French track before it counts as « none ». */
  settleBudgetMs: 12_000,
  /**
   * The whole search, from the first « no French » verdict: past it the English source plays again and the note says the
   * search timed out (not that no French exists). About four sources at the slowest, many more when they answer fast.
   */
  totalBudgetMs: 60_000,
  /**
   * Speculative preflight (RC7): when the playing source has shown no French this long after it started, the NEXT
   * candidate's catalogue match, episode list and stream metadata are resolved in the background (never a video, never a
   * playback relay), so the switch finds them cached. Not before: a source that has French shows it within seconds.
   */
  preflightAfterMs: 3_000,
  /** Providers probed at once by the preflight: with the one playing, never more than two sources are busy. */
  preflightConcurrency: 1,
  /**
   * The French lane (RC9): the search runs BEHIND the picture that plays. A playing video is replaced only by a source
   * that announces French (or is known to deliver it), already prepared. These bound the background work:
   * – one candidate's catalogue + stream metadata, hard-aborted past this;
   */
  laneCandidateBudgetMs: 12_000,
  /** – candidates looked at per lane run (a swap starts a new run for the new playing source); */
  laneMaxCandidates: 3,
  /** – the whole search from the first « no French » verdict: a real timer, not a check made at the end of a hop. */
  laneTotalBudgetMs: 45_000,
} as const;

/** "Tester les sources" on an anime page: catalogue checks only, never a hidden stream. */
export const SOURCE_LAB = {
  /** Sources checked at once. */
  concurrency: 2,
  /** Search + episode list budget for one source, before it is reported as "Timeout". */
  catalogueTimeoutMs: 45_000,
  /** Anime whose results are remembered on this device (oldest dropped). */
  maxAnime: 40,
  /** « Benchmark des lectures »: after the first frame, time left for the decoded resolution and subtitles to settle… */
  benchmarkSettleMs: 5_000,
  /** …and the bound for one source to reach a first frame (resolution + start), else « Timeout ». */
  benchmarkTimeoutMs: 60_000,
  /** How often the benchmark checks the source under test. */
  benchmarkTickMs: 500,
} as const;

/** How a source's local track record is summarised in Réglages → Sources. */
export const SOURCE_HEALTH = {
  /** A success rate is shown only from this many attempts (no fake precision). */
  minAttemptsForRate: 5,
  /** "Fiable" from this success rate (with enough attempts)… */
  reliableRate: 0.8,
  /** …"Instable" below this one. */
  unstableRate: 0.5,
  /** Median time to first frame is shown from this many successful plays. */
  minSuccessesForSpeed: 2,
} as const;

export const PWA = {
  /** "Mettre à jour maintenant" waits at most this long for the new service worker before reloading. */
  updateTimeoutMs: 6_000,
} as const;

export const CATALOGUE = {
  /** Server fallback for catalogue hosts a browser cannot read (CORS). */
  timeoutMs: 10_000,
  maxRedirects: 3,
  maxCatalogueBytes: 3_000_000,
  maxScriptBytes: 2_000_000,
  /** A Sora `modules.json` index: manifests followed at most… */
  maxIndexManifests: 200,
  /** …this many at a time (small static JSON files). */
  indexConcurrency: 8,
} as const;

export const RELAY = {
  /** Lifetime of a playback session token. */
  sessionTtlMs: 4 * 60 * 60 * 1000,
  maxPlaylistBytes: 4_000_000,
  /** Upper bound for one relayed media response (segment or byte range). */
  maxMediaBytes: 1_500_000_000,
  timeoutMs: 20_000,
  maxRedirects: 5,
} as const;

export const AUTH = {
  serverTokenCacheMs: 60_000,
  serverTokenCacheSize: 500,
  /** Server-side cache of a user's source grants (enabled + approved hosts). */
  grantCacheMs: 30_000,
  otpLength: 6,
} as const;

export const SYNC = {
  /** Local changes are pushed this long after the last one. */
  debounceMs: 4_000,
  /** Progress changes (every few seconds while watching) are batched harder. */
  progressThrottleMs: 60_000,
  pushBatchSize: 400,
  pullPageSize: 1000,
  /** Re-read slightly before the cursor: concurrent commits may land out of order. */
  pullOverlapMs: 5_000,
  /** Pushed tombstones are kept this long so other devices can learn about them. */
  tombstoneRetentionMs: 90 * 24 * 60 * 60 * 1000,
} as const;

export const SUBTITLES = {
  /** A subtitle file larger than this is not a subtitle file. */
  maxBytes: 3_000_000,
  /** Auto shows the first of these languages an episode has. */
  autoLanguages: ["fr", "en"] as const,
  /** The only text-track languages offered to the viewer, in preference order (the translated French track is one more "fr"). */
  viewerLanguages: ["fr", "en"] as const,
  /**
   * WebVTT `line` written on every cue that has no placement of its own, as a percentage of the video height with
   * the cue's bottom edge (`line:<n>%,end`) on it: 92 (RC5.1 was 91, too high; RC6 tried 95 then 93, both a little too low) leaves about 8 % of margin under the text whatever the font
   * size or the number of lines, so a two-line cue keeps its shape. RC4's `-3` (snap-to-lines, counted in cue lines)
   * put cues far too high on a portrait iPhone. Cues that already carry `line:`, `region:` or `vertical:` are left
   * exactly as the file wrote them.
   */
  defaultCueLinePercent: 92,
  /**
   * The viewer's look beyond the style (RC8), both stored as a small index so a synced value can never be arbitrary:
   * `size` is the multiplier of the style's own font size (the `data-cue-size` rules in globals.css carry the same
   * numbers, `::cue` cannot read a CSS variable on every engine); `height` is the WebVTT `line` percentage (bottom edge
   * of an ordinary cue) written on the cues at runtime — index 1 is `defaultCueLinePercent`, the position the files are
   * converted with, so cached conversions stay valid. Larger index = higher on the picture. RC9: seven positions (the
   * first five are unchanged, so stored indices keep their meaning); the two highest are 6 points apart, so each step is
   * visible on a phone (≈ 6.5 px on a 390 px wide picture). The highest still keeps a two-line cue of the largest size
   * well inside the picture (its top at about 30 %); a taller cue is pulled down by `cueBlockShare`.
   * RC9.2 appends one more, line 99 %, the lowest step the picture can physically hold (index 8): the oldest indices never move either.
   * RC9.1 reaches further down on both ranges WITHOUT renumbering: a stored index keeps its meaning, so the new
   * extremes are appended (size index 5 = 70 %, below the old 85 %; height index 7 = line 97 %, below the old 95 %) and
   * the sliders walk the steps in their visual order (`SUBTITLE_SIZE_STEPS` / `SUBTITLE_HEIGHT_STEPS`, lib/subtitles/style.ts).
   * 97 % leaves 3 % under a two-line cue's last line, which an outlined cue of the largest size still clears.
   */
  size: { multipliers: [0.85, 1, 1.15, 1.3, 1.5, 0.7], default: 1 },
  height: { lines: [95, 92, 88, 84, 80, 74, 68, 97, 99], default: 1 },
  /**
   * RC9.2: the contour of the cue text, a real slider. A stored index into `radii` (px of a crisp, unblurred ring of hard
   * shadows — never a glow); `null` = the look's own default (`defaults`). Standard starts almost without one, Lisible firmly
   * outlined. Literal rules per step in globals.css (`data-cue-outline`): `::cue` cannot be trusted with CSS variables.
   */
  outline: {
    radii: [0, 0.5, 0.8, 1.1, 1.4, 1.7, 2, 2.4, 2.8, 3.2],
    defaults: { cinema: 1, readable: 5, film: 3, contrast: 0, minimal: 0 },
  },
  /**
   * Height of one caption line, as a share of the picture's height (the largest size of the boldest look on a narrow
   * phone, line-height included: ≈ 19 %). A cue with more than two lines is never raised above what keeps its whole
   * block inside the picture, `cueTopMargin` of margin included.
   */
  cueBlockShare: 19,
  cueTopMargin: 6,
  /**
   * How long the CC button may keep saying "loading". After that it says the subtitles are unavailable — display only:
   * retrieval is not cancelled, and a track that arrives later still makes the CC menu appear.
   */
  loadingDisplayMs: 15_000,
  /** One subtitle file read (direct or relay) is abandoned after this long, so a silent host cannot stall the others. */
  readTimeoutMs: 20_000,
} as const;

/**
 * External subtitles (RC5.1): a subtitle provider is independent of the video source. Server limits, the device
 * cache and the sync gates live here — nothing below is a secret.
 */
export const EXTERNAL_SUBTITLES = {
  /** The only language searched for in V1 (French preference). */
  language: "fr",
  /** One provider call (search or file) is abandoned after this long; a silent host never stalls the others. */
  providerTimeoutMs: 6_000,
  /** The AniList → IMDb/TMDB dataset and the IMDb season structure (Cinemeta) are kept in memory this long. */
  idsTtlMs: 24 * 60 * 60 * 1000,
  idsTimeoutMs: 10_000,
  cinemetaTtlMs: 24 * 60 * 60 * 1000,
  cinemetaTimeoutMs: 6_000,
  /** The mapping dataset is refused beyond this size (it is ~7 MB today). */
  idsMaxBytes: 16_000_000,
  /** A subtitle file larger than this is refused by the server (the client keeps SUBTITLES.maxBytes). */
  maxFileBytes: 1_500_000,
  /** Candidates returned to the client per search, after validation and ranking. */
  maxCandidates: 12,
  /** Edge cache of a search / of a file (the answer depends only on the query). */
  searchCacheSeconds: 3_600,
  fileCacheSeconds: 604_800,
  /** An absolute number printed with a season tag (S38E1122) only counts when it is this large or the tag says season 1. */
  absoluteUnambiguousFrom: 150,
  /** Gross-mismatch gate against video.duration: a file ending far past the video, or long before it, is another cut. */
  durationGate: { maxOverrun: 1.1, overrunSlackSeconds: 90, minCoverage: 0.4 },
  /** Manual offset buttons (seconds) and its bound. */
  offsetStepSeconds: 0.5,
  offsetMaxSeconds: 30,
  /** Device cache: files kept (oldest evicted first); a cached search is trusted this long. */
  cacheFiles: 60,
  searchTtlMs: 7 * 24 * 60 * 60 * 1000,
  /** A search that found nothing is asked again sooner: providers keep adding files after a release. */
  emptySearchTtlMs: 6 * 60 * 60 * 1000,
  /** Bumped when parsing / conversion changes what a cached file means. */
  cacheVersion: 1,
  /** Subtitle-to-subtitle alignment on the video source's own English track: quality gate, never forced. */
  align: { maxShiftSeconds: 25, stepSeconds: 0.1, minCues: 40, minConfidence: 0.6, minGain: 0.12, minShiftSeconds: 0.3 },
} as const;

export const SOURCES_UI = {
  /** Réglages → Sources: a huge imported catalogue (this many switched-off sources or more) folds them under « Autres sources du dépôt ». */
  collapseDisabledFrom: 20,
} as const;

export const EMAIL_SIGN_IN = { resendCooldownSeconds: 60, digits: 6 } as const;

export const EPISODE_NAV = {
  /** The fiche's shared 5.25rem row, followed by the same 0.25rem gap as inline. */
  ficheRowPitchRem: 5.5,
  ficheOverscan: 4,
  sheetFirstPaintPx: 600,
  /** Fixed row height (px) of the windowed episode navigator: a 1 200-episode list renders about fifteen rows. */
  rowHeight: 52,
  /** The rows of the fiche's full episode interface: number, a real thumbnail, a title that may wrap, the progress. */
  richRowHeight: 100,
  /** Rows rendered above and below what is visible. */
  overscan: 6,
  /** Largest height of the Épisodes sheet, in dvh: the picture and the page stay visible above it. */
  sheetHeightDvh: 66,
  /** The fiche's full episode interface: nearly the whole screen (the player keeps 66 dvh: its picture must stay visible). */
  sheetImmersiveDvh: 94,
  /** Handle, title, jump field, bulk action and padding around the list. */
  sheetChromePx: 254,
} as const;

export const TRANSLATION = {
  /** Only direction supported in RC5. */
  sourceLang: "en",
  targetLang: "fr",
  /** Label of the generated track: never passed off as a native French one. */
  trackLabel: "Français (traduit)",
  /** Bumped when the way a track is cut, protected or rebuilt changes: invalidates cached translations. */
  formatVersion: 1,
  /** Cues per request (DeepL accepts up to 50 texts and 128 KiB per request). */
  batchCues: 40,
  /** Adjacent cues sent as untranslated context with a batch. */
  contextCues: 3,
  /** Requests in flight at once for one episode. */
  concurrency: 2,
  /** Server-side limits on one request; anything beyond is refused, not truncated. */
  maxSegments: 50,
  maxSegmentChars: 1_000,
  maxRequestChars: 40_000,
  maxContextChars: 600,
  maxCuesPerTrack: 2_500,
  /** One upstream call is abandoned after this long. */
  upstreamTimeoutMs: 25_000,
  /** Translated tracks kept on the device (oldest evicted first). */
  cacheEntries: 40,
} as const;

export const SEASON_CATALOGUE = { minYear: 1900, maxYear: 2200, staleMs: 15 * 60_000 } as const;

export const TMDB = {
  cacheMs: 24 * 60 * 60_000, negativeCacheMs: 60_000, timeoutMs: 8_000, mappingTimeoutMs: 12_000,
  artworkRequestTimeoutMs: 50_000,
  maxCacheEntries: 128, maxConcurrentRequests: 4, maxResponseBytes: 2_000_000,
  maxEpisodes: 2_000, maxSeasonsPerEntry: 4, defaultCooldownMs: 60_000, maxCooldownMs: 15 * 60_000,
} as const;

export const TRANSLATOR = {
  /** The v1 implementation behind the generic translator interface (server: src/server/translation). Part of every cache key. */
  id: "deepl",
  /** Bumped when the provider settings that shape the output change (tag handling, model…). */
  version: "v2-xml-1",
  /** Server-side budget per signed-in user; a runaway client cannot burn the API quota. */
  maxRequestsPerMinute: 60,
} as const;

/** Temporary, device-local dock recording. No collection until explicitly armed. */
export const DOCK_DIAGNOSTICS = {
  enabledKey: "maxime-anime:dock-diagnostic-enabled",
  reportKey: "maxime-anime:dock-diagnostic-report",
  maxCaptures: 2,
  maxSamples: 96,
  retainedInitialSamples: 8,
  startupFrames: 4,
  persistIntervalMs: 1000,
} as const;
