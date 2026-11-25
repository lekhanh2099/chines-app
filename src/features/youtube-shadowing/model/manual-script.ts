import { MAX_TRANSCRIPT_SEGMENTS, mergeShortSegments } from "./transcript-segments";
import type { TranscriptSegment } from "./youtube-transcript.schemas";

export const MAX_MANUAL_SCRIPT_CHARS = 200_000;
const FALLBACK_LAST_SEGMENT_DURATION_MS = 5000;

const STANDALONE_TIMESTAMP_PATTERN = /^\s*(?:\[)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\])?\s*$/;
const INLINE_TIMESTAMP_PATTERN = /^\s*(?:\[)?(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\])?\s+(.+)$/;

export type ParsedManualScript = {
 segments: TranscriptSegment[];
 isTimed: boolean;
 timedCount: number;
};

function parseTimestampMs(hoursText = "", minutesText = "", secondsText = ""): number {
 const hours = hoursText ? Number.parseInt(hoursText, 10) : 0;
 const minutes = minutesText ? Number.parseInt(minutesText, 10) : 0;
 const seconds = secondsText ? Number.parseInt(secondsText, 10) : 0;
 if (
  !Number.isFinite(hours) ||
  !Number.isFinite(minutes) ||
  !Number.isFinite(seconds) ||
  minutes >= 60 ||
  seconds >= 60
 ) {
  return -1;
 }
 return (hours * 3600 + minutes * 60 + seconds) * 1000;
}

export function parseManualScript(rawText: string, durationMs = 0): ParsedManualScript {
 const bounded = rawText.slice(0, MAX_MANUAL_SCRIPT_CHARS);
 const rawLines = bounded.split(/\r?\n/);

 const entries: Array<{ startMs: number; hasTimestamp: boolean; text: string }> = [];
 let pendingStartMs = -1;

 for (const rawLine of rawLines) {
  const line = rawLine.trim();
  if (!line) continue;

  const standaloneMatch = STANDALONE_TIMESTAMP_PATTERN.exec(line);
  if (standaloneMatch) {
   const parsedMs = parseTimestampMs(standaloneMatch[1], standaloneMatch[2], standaloneMatch[3]);
   if (parsedMs >= 0) {
    pendingStartMs = parsedMs;
    continue;
   }
  }

  const inlineMatch = INLINE_TIMESTAMP_PATTERN.exec(line);
  if (inlineMatch) {
   const parsedMs = parseTimestampMs(inlineMatch[1], inlineMatch[2], inlineMatch[3]);
   const content = (inlineMatch[4] ?? "").trim();
   if (parsedMs >= 0 && content) {
    pendingStartMs = -1;
    entries.push({ startMs: parsedMs, hasTimestamp: true, text: content });
    continue;
   }
  }

  if (pendingStartMs >= 0) {
   entries.push({ startMs: pendingStartMs, hasTimestamp: true, text: line });
   pendingStartMs = -1;
  } else {
   entries.push({ startMs: 0, hasTimestamp: false, text: line });
  }
 }

 if (entries.length === 0) {
  return { segments: [], isTimed: false, timedCount: 0 };
 }

 const rawTimedCount = entries.filter((entry) => entry.hasTimestamp).length;
 const isTimed = rawTimedCount * 2 >= entries.length;

 if (!isTimed) {
  const untimedSegments = entries
   .slice(0, MAX_TRANSCRIPT_SEGMENTS)
   .map((entry) => ({ startMs: 0, endMs: 0, text: entry.text }));
  return {
   segments: untimedSegments,
   isTimed: false,
   timedCount: rawTimedCount,
  };
 }

 let lastKnownStartMs = 0;
 const normalizedEntries = entries.map((entry) => {
  if (entry.hasTimestamp) {
   lastKnownStartMs = entry.startMs;
   return { startMs: entry.startMs, text: entry.text };
  }
  return { startMs: lastKnownStartMs, text: entry.text };
 });

 normalizedEntries.sort((left, right) => left.startMs - right.startMs);

 const safeDurationMs = Math.max(0, Math.round(durationMs));
 const timedSegments: TranscriptSegment[] = normalizedEntries.map((entry, index) => {
  const nextEntry = normalizedEntries[index + 1];
  if (nextEntry) {
   return {
    startMs: entry.startMs,
    endMs: Math.max(entry.startMs, nextEntry.startMs),
    text: entry.text,
   };
  }

  const fallbackEndMs =
   safeDurationMs > entry.startMs
    ? safeDurationMs
    : entry.startMs + FALLBACK_LAST_SEGMENT_DURATION_MS;
  return {
   startMs: entry.startMs,
   endMs: fallbackEndMs,
   text: entry.text,
  };
 });

 const merged = mergeShortSegments(timedSegments).slice(0, MAX_TRANSCRIPT_SEGMENTS);
 return {
  segments: merged,
  isTimed: true,
  timedCount: merged.length,
 };
}
