import { z } from "zod";

/**
 * Runtime schemas for the raw AniList GraphQL payloads we request.
 * AniList marks almost everything nullable, so these stay lenient: validation
 * guards against shape changes, normalization decides what "missing" means.
 */

const nullableString = z.string().nullish();
const nullableNumber = z.number().nullish();

export const rawTitleSchema = z.object({
  romaji: nullableString,
  english: nullableString,
  native: nullableString,
});

export const rawCoverSchema = z
  .object({
    medium: nullableString,
    large: nullableString,
    extraLarge: nullableString,
    color: nullableString,
  })
  .nullish();

export const rawSummarySchema = z.object({
  id: z.number().int(),
  popularity: z.number().nonnegative().nullish(),
  isAdult: z.boolean().nullish(),
  source: nullableString,
  type: nullableString,
  title: rawTitleSchema.nullish(),
  coverImage: rawCoverSchema,
  format: nullableString,
  status: nullableString,
  season: nullableString,
  seasonYear: nullableNumber,
  episodes: nullableNumber,
  nextAiringEpisode: z
    .object({ episode: z.number().int(), airingAt: z.number().int() })
    .nullish(),
});

export type RawSummary = z.infer<typeof rawSummarySchema>;

const rawStaffConnection = z
  .object({
    edges: z
      .array(
        z
          .object({
            role: nullableString,
            node: z
              .object({
                id: z.number().int(),
                name: z.object({ full: nullableString, native: nullableString }).nullish(),
                image: z.object({ medium: nullableString, large: nullableString }).nullish(),
              })
              .nullish(),
          })
          .nullable(),
      )
      .nullish(),
  })
  .nullish();

const rawDateSchema = z.object({ year: nullableNumber, month: nullableNumber, day: nullableNumber }).nullish();

export const rawMediaSchema = rawSummarySchema.extend({
  bannerImage: nullableString,
  description: nullableString,
  countryOfOrigin: nullableString,
  source: nullableString,
  startDate: rawDateSchema,
  endDate: rawDateSchema,
  siteUrl: nullableString,
  externalLinks: z.array(z.object({ url: nullableString, site: nullableString }).nullable()).nullish(),
  tags: z.array(z.object({ name: nullableString, rank: nullableNumber, isMediaSpoiler: z.boolean().nullish() }).nullable()).nullish(),
  genres: z.array(z.string().nullable()).nullish(),
  synonyms: z.array(z.string().nullable()).nullish(),
  duration: nullableNumber,
  averageScore: nullableNumber,
  studios: z
    .object({
      edges: z
        .array(
          z
            .object({
              isMain: z.boolean().nullish(),
              node: z
                .object({
                  id: z.number().int(),
                  name: z.string(),
                  isAnimationStudio: z.boolean().nullish(),
                })
                .nullish(),
            })
            .nullable(),
        )
        .nullish(),
    })
    .nullish(),
  staff: rawStaffConnection,
  favStaff: rawStaffConnection,
  relations: z
    .object({
      edges: z
        .array(
          z
            .object({
              relationType: nullableString,
              node: rawSummarySchema.nullish(),
            })
            .nullable(),
        )
        .nullish(),
    })
    .nullish(),
});

export type RawMedia = z.infer<typeof rawMediaSchema>;

export const searchResponseSchema = z.object({
  Page: z
    .object({
      pageInfo: z.object({ hasNextPage: z.boolean().nullish() }).nullish(),
      media: z.array(rawSummarySchema.extend({ synonyms: z.array(z.string().nullable()).nullish() }).nullable()).nullish(),
    })
    .nullish(),
});

const rawSchedulePage = z
  .object({
    airingSchedules: z
      .array(z.object({ mediaId: z.number().int(), episode: z.number().int(), airingAt: z.number().int() }).nullable())
      .nullish(),
  })
  .nullish();

export const airingRefreshResponseSchema = z.object({
  followed: z.object({ media: z.array(rawSummarySchema.nullable()).nullish() }).nullish(),
  schedule: rawSchedulePage,
  schedule2: rawSchedulePage,
});

export const rawFallbackSchema = rawSummarySchema.extend({
  synonyms: z.array(z.string().nullable()).nullish(),
  popularity: nullableNumber,
});

export const fallbackResponseSchema = z.record(z.string(), z.object({ media: z.array(rawFallbackSchema.nullable()).nullish() }).nullish());

export const rawEntrySchema = rawSummarySchema.extend({ startDate: rawDateSchema, endDate: rawDateSchema.optional() });

export const franchiseNodesResponseSchema = z.object({
  Page: z
    .object({
      media: z
        .array(
          rawEntrySchema
            .extend({
              relations: z
                .object({ edges: z.array(z.object({ relationType: nullableString, node: rawEntrySchema.nullish() }).nullable()).nullish() })
                .nullish(),
            })
            .nullable(),
        )
        .nullish(),
    })
    .nullish(),
});

export const mediaResponseSchema = z.object({
  Media: rawMediaSchema.nullish(),
});

export const graphqlEnvelopeSchema = z.object({
  data: z.unknown().nullish(),
  errors: z
    .array(z.object({ message: z.string(), status: z.number().nullish() }))
    .nullish(),
});
