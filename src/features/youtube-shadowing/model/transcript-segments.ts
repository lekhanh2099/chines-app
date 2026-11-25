import type { TimedTextJson3, TranscriptSegment } from "./youtube-transcript.schemas";

export const MAX_TRANSCRIPT_SEGMENTS = 2000;
const SHORT_SEGMENT_DURATION_MS = 1200;
const SHORT_SEGMENT_TEXT_LENGTH = 4;
const MAX_MERGE_GAP_MS = 400;
const MAX_MERGED_TEXT_LENGTH = 40;
const TRAILING_PUNCTUATION_PATTERN = /[，。！？、；：,.!?;:…—–\-）》」』】"'\s]$/u;

function joinSegmentTexts(first: string, second: string): string {
 const connector = TRAILING_PUNCTUATION_PATTERN.test(first) ? "" : "，";
 return `${first}${connector}${second}`;
}

export function mergeShortSegments(segments: TranscriptSegment[]): TranscriptSegment[] {
 if (segments.length <= 1) return segments.slice(0, MAX_TRANSCRIPT_SEGMENTS);

 const merged: TranscriptSegment[] = [];
 let current = segments[0];

 for (let index = 1; index < segments.length; index += 1) {
  const next = segments[index];
  if (!current || !next) continue;

  const currentDurationMs = current.endMs - current.startMs;
  const isShort =
   currentDurationMs < SHORT_SEGMENT_DURATION_MS || current.text.length < SHORT_SEGMENT_TEXT_LENGTH;
  const gapMs = next.startMs - current.endMs;
  const combinedText = joinSegmentTexts(current.text, next.text);

  if (isShort && gapMs <= MAX_MERGE_GAP_MS && combinedText.length <= MAX_MERGED_TEXT_LENGTH) {
   current = {
    startMs: current.startMs,
    endMs: Math.max(current.endMs, next.endMs),
    text: combinedText,
   };
   continue;
  }

  merged.push(current);
  current = next;
 }

 if (current) {
  merged.push(current);
 }

 return merged.slice(0, MAX_TRANSCRIPT_SEGMENTS);
}

export function normalizeTimedTextSegments(
 events: TimedTextJson3["events"],
 lengthSeconds: number,
): TranscriptSegment[] {
 const cleaned: Array<{ startMs: number; durationMs: number; text: string }> = [];

 for (const event of events) {
  const text = event.segs
   .map((seg) => seg.utf8)
   .join("")
   .replace(/[\r\n]+/g, " ")
   .trim();

  if (!text) continue;

  cleaned.push({
   startMs: Math.max(0, Math.round(event.tStartMs)),
   durationMs: Math.max(0, Math.round(event.dDurationMs)),
   text,
  });
 }

 cleaned.sort((left, right) => left.startMs - right.startMs);

 const videoEndMs = Math.max(0, Math.round(lengthSeconds * 1000));
 const timed: TranscriptSegment[] = cleaned.map((item, index) => {
  const computedEndMs = item.startMs + item.durationMs;
  if (computedEndMs > item.startMs) {
   return { startMs: item.startMs, endMs: computedEndMs, text: item.text };
  }

  const nextItem = cleaned[index + 1];
  const fallbackEndMs = nextItem ? nextItem.startMs : videoEndMs;
  return {
   startMs: item.startMs,
   endMs: Math.max(item.startMs, fallbackEndMs),
   text: item.text,
  };
 });

 return mergeShortSegments(timed).slice(0, MAX_TRANSCRIPT_SEGMENTS);
}

export function findActiveSegmentIndex(segments: TranscriptSegment[], currentMs: number): number {
 if (segments.length === 0) return -1;

 const first = segments[0];
 if (!first || currentMs < first.startMs) return -1;

 let low = 0;
 let high = segments.length - 1;
 let result = 0;

 while (low <= high) {
  const mid = Math.floor((low + high) / 2);
  const candidate = segments[mid];
  if (!candidate) break;

  if (candidate.startMs <= currentMs) {
   result = mid;
   low = mid + 1;
  } else {
   high = mid - 1;
  }
 }

 return result;
}
