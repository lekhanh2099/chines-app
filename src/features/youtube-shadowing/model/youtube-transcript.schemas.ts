import { z } from "zod";

export const youtubeVideoIdSchema = z.string().regex(/^[\w-]{11}$/);

// External YouTube innertube boundary: keep only the fields we read; unknown fields are stripped.
export const innertubePlayerResponseSchema = z.object({
 playabilityStatus: z.object({ status: z.string() }).optional(),
 videoDetails: z
  .object({
   title: z.string(),
   lengthSeconds: z.coerce.number(),
  })
  .optional(),
 captions: z
  .object({
   playerCaptionsTracklistRenderer: z
    .object({
     captionTracks: z
      .array(
       z.object({
        baseUrl: z.url(),
        languageCode: z.string(),
        kind: z.string().optional(),
       }),
      )
      .default([]),
    })
    .optional(),
  })
  .optional(),
});

export const timedTextJson3Schema = z.object({
 events: z
  .array(
   z.object({
    tStartMs: z.number().default(0),
    dDurationMs: z.number().default(0),
    segs: z.array(z.object({ utf8: z.string().default("") })).default([]),
   }),
  )
  .default([]),
});

export const transcriptOutcomeSchema = z.enum(["ready", "no-captions", "too-long"]);

export const youtubeTranscriptErrorCodeSchema = z.enum(["YOUTUBE_BLOCKED", "YOUTUBE_FETCH_FAILED"]);

export const transcriptSegmentSchema = z.strictObject({
 startMs: z.number().int().nonnegative(),
 endMs: z.number().int().nonnegative(),
 text: z.string().min(1),
});

export const youtubeTranscriptResponseSchema = z.strictObject({
 outcome: transcriptOutcomeSchema,
 videoId: youtubeVideoIdSchema,
 title: z.string(),
 lengthSeconds: z.number().int().nonnegative(),
 language: z.string(),
 availableLanguages: z.array(z.string()),
 segments: z.array(transcriptSegmentSchema),
});

export const apiErrorPayloadSchema = z.object({
 error: z.string().optional(),
 code: z.string().optional(),
});

export type TranscriptOutcome = z.infer<typeof transcriptOutcomeSchema>;
export type YoutubeTranscriptErrorCode = z.infer<typeof youtubeTranscriptErrorCodeSchema>;
export type TranscriptSegment = z.infer<typeof transcriptSegmentSchema>;
export type YoutubeTranscriptResponse = z.infer<typeof youtubeTranscriptResponseSchema>;
export type TimedTextJson3 = z.infer<typeof timedTextJson3Schema>;
export type InnertubePlayerResponse = z.infer<typeof innertubePlayerResponseSchema>;
