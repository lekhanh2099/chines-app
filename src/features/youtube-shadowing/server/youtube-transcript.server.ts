import "server-only";

import type { z } from "zod";

import { logger } from "@/lib/logger";

import { normalizeTimedTextSegments } from "../model/transcript-segments";
import {
 innertubePlayerResponseSchema,
 timedTextJson3Schema,
 youtubeTranscriptErrorCodeSchema,
 youtubeTranscriptResponseSchema,
 type InnertubePlayerResponse,
 type YoutubeTranscriptErrorCode,
 type YoutubeTranscriptResponse,
} from "../model/youtube-transcript.schemas";

const INNERTUBE_PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const MAX_VIDEO_LENGTH_SECONDS = 1800;
const FETCH_TIMEOUT_MS = 10_000;

// ANDROID client avoids WEB UNPLAYABLE, TVHTML5 LOGIN_REQUIRED, and WEB_EMBEDDED_PLAYER ERROR.
// Fallback candidate if ANDROID breaks in the future: IOS client (clientVersion "20.10.4",
// deviceModel "iPhone16,2", UA "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3 like Mac OS X)").
const ANDROID_USER_AGENT = "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip";
const ANDROID_CLIENT_CONTEXT = {
 clientName: "ANDROID",
 clientVersion: "20.10.38",
 androidSdkVersion: 34,
 hl: "zh-CN",
};

const CHINESE_LANGUAGE_PRIORITY = ["zh-hans", "zh-cn", "zh", "zh-hant", "zh-tw", "zh-hk"];

type CaptionTrack = NonNullable<
 NonNullable<InnertubePlayerResponse["captions"]>["playerCaptionsTracklistRenderer"]
>["captionTracks"][number];

export class YoutubeTranscriptError extends Error {
 readonly code: YoutubeTranscriptErrorCode;

 constructor(code: YoutubeTranscriptErrorCode, message: string) {
  super(message);
  this.name = code;
  this.code = code;
 }
}

function fail(videoId: string, code: YoutubeTranscriptErrorCode, message: string): never {
 logger.warn("YouTube transcript fetch failed", { videoId, code });
 throw new YoutubeTranscriptError(code, message);
}

function parseAllowedYoutubeCaptionUrl(rawUrl: string): URL {
 let parsed: URL;
 try {
  parsed = new URL(rawUrl);
 } catch {
  throw new YoutubeTranscriptError("YOUTUBE_FETCH_FAILED", "Invalid caption track URL");
 }

 const hostname = parsed.hostname.toLowerCase();
 const isYoutubeHost = hostname === "youtube.com" || hostname.endsWith(".youtube.com");
 if (parsed.protocol !== "https:" || !isYoutubeHost) {
  throw new YoutubeTranscriptError("YOUTUBE_FETCH_FAILED", "Untrusted caption track host");
 }

 return parsed;
}

function chineseLanguageRank(languageCode: string): number {
 const normalized = languageCode.toLowerCase();
 const exactIndex = CHINESE_LANGUAGE_PRIORITY.indexOf(normalized);
 if (exactIndex >= 0) return exactIndex;
 return CHINESE_LANGUAGE_PRIORITY.length;
}

function findBestChineseTrackIndex(tracks: CaptionTrack[]): number {
 let bestIndex = -1;
 let bestRank = Number.POSITIVE_INFINITY;
 let bestIsAsr = 1;

 for (let index = 0; index < tracks.length; index += 1) {
  const track = tracks[index];
  if (!track || !track.languageCode.toLowerCase().startsWith("zh")) continue;

  const rank = chineseLanguageRank(track.languageCode);
  const isAsr = track.kind === "asr" ? 1 : 0;

  if (rank < bestRank || (rank === bestRank && isAsr < bestIsAsr)) {
   bestIndex = index;
   bestRank = rank;
   bestIsAsr = isAsr;
  }
 }

 return bestIndex;
}

function collectUniqueLanguages(tracks: CaptionTrack[]): string[] {
 const seen = new Set<string>();
 const languages: string[] = [];
 for (const track of tracks) {
  const code = track.languageCode.trim();
  if (!code || seen.has(code)) continue;
  seen.add(code);
  languages.push(code);
 }
 return languages;
}

async function fetchParsedJson<T>(
 videoId: string,
 url: string,
 init: RequestInit,
 schema: z.ZodType<T>,
 invalidPayloadMessage: string,
): Promise<T> {
 let response: Response;
 try {
  response = await fetch(url, {
   ...init,
   signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
 } catch {
  fail(
   videoId,
   youtubeTranscriptErrorCodeSchema.enum.YOUTUBE_FETCH_FAILED,
   "YouTube request failed",
  );
 }

 if (response.status === 403 || response.status === 429) {
  fail(
   videoId,
   youtubeTranscriptErrorCodeSchema.enum.YOUTUBE_BLOCKED,
   "YouTube blocked the request",
  );
 }

 if (!response.ok) {
  fail(
   videoId,
   youtubeTranscriptErrorCodeSchema.enum.YOUTUBE_FETCH_FAILED,
   `YouTube responded with status ${response.status}`,
  );
 }

 let parsed: ReturnType<z.ZodType<T>["safeParse"]>;
 try {
  parsed = schema.safeParse(await response.json());
 } catch {
  fail(
   videoId,
   youtubeTranscriptErrorCodeSchema.enum.YOUTUBE_FETCH_FAILED,
   "YouTube returned invalid JSON",
  );
 }

 if (!parsed.success) {
  fail(videoId, youtubeTranscriptErrorCodeSchema.enum.YOUTUBE_FETCH_FAILED, invalidPayloadMessage);
 }

 return parsed.data;
}

export async function fetchYoutubeTranscript(videoId: string): Promise<YoutubeTranscriptResponse> {
 const player = await fetchParsedJson(
  videoId,
  INNERTUBE_PLAYER_URL,
  {
   method: "POST",
   headers: {
    "content-type": "application/json",
    "user-agent": ANDROID_USER_AGENT,
   },
   body: JSON.stringify({
    videoId,
    context: { client: ANDROID_CLIENT_CONTEXT },
   }),
  },
  innertubePlayerResponseSchema,
  "Unexpected YouTube player payload",
 );

 if (player.playabilityStatus?.status !== "OK") {
  fail(
   videoId,
   youtubeTranscriptErrorCodeSchema.enum.YOUTUBE_BLOCKED,
   "YouTube video is not playable",
  );
 }

 const title = player.videoDetails?.title ?? "";
 const rawLengthSeconds = player.videoDetails?.lengthSeconds ?? 0;
 const lengthSeconds = Number.isFinite(rawLengthSeconds)
  ? Math.max(0, Math.round(rawLengthSeconds))
  : 0;

 if (lengthSeconds > MAX_VIDEO_LENGTH_SECONDS) {
  return youtubeTranscriptResponseSchema.parse({
   outcome: "too-long",
   videoId,
   title,
   lengthSeconds,
   language: "",
   availableLanguages: [],
   segments: [],
  });
 }

 const tracks = player.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
 const availableLanguages = collectUniqueLanguages(tracks);
 const selectedIndex = findBestChineseTrackIndex(tracks);
 const selectedTrack = selectedIndex >= 0 ? tracks[selectedIndex] : undefined;

 if (!selectedTrack) {
  return youtubeTranscriptResponseSchema.parse({
   outcome: "no-captions",
   videoId,
   title,
   lengthSeconds,
   language: "",
   availableLanguages,
   segments: [],
  });
 }

 let captionUrl: URL;
 try {
  captionUrl = parseAllowedYoutubeCaptionUrl(selectedTrack.baseUrl);
 } catch {
  fail(
   videoId,
   youtubeTranscriptErrorCodeSchema.enum.YOUTUBE_FETCH_FAILED,
   "Rejected non-YouTube caption URL",
  );
 }
 captionUrl.searchParams.set("fmt", "json3");

 const timedText = await fetchParsedJson(
  videoId,
  captionUrl.toString(),
  {
   method: "GET",
   headers: {
    "user-agent": ANDROID_USER_AGENT,
   },
  },
  timedTextJson3Schema,
  "Unexpected YouTube timedtext payload",
 );

 const segments = normalizeTimedTextSegments(timedText.events, lengthSeconds);
 if (segments.length === 0) {
  return youtubeTranscriptResponseSchema.parse({
   outcome: "no-captions",
   videoId,
   title,
   lengthSeconds,
   language: "",
   availableLanguages,
   segments: [],
  });
 }

 return youtubeTranscriptResponseSchema.parse({
  outcome: "ready",
  videoId,
  title,
  lengthSeconds,
  language: selectedTrack.languageCode,
  availableLanguages,
  segments,
 });
}
