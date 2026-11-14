import { MAX_TTS_TEXT_LENGTH } from "./tts-contract";

/** Trims and joins segments with newlines, then chunks the result to the TTS request limit. */
export function splitSpeechSegments(segments: readonly string[]) {
 const normalizedText = segments
  .map((segment) => segment.trim())
  .filter(Boolean)
  .join("\n");
 if (!normalizedText) return [];
 if (normalizedText.length <= MAX_TTS_TEXT_LENGTH) return [normalizedText];

 const chunks: string[] = [];
 let chunk = "";
 for (const character of Array.from(normalizedText)) {
  if (chunk && chunk.length + character.length > MAX_TTS_TEXT_LENGTH) {
   chunks.push(chunk);
   chunk = "";
  }
  chunk += character;
 }
 if (chunk) chunks.push(chunk);
 return chunks;
}
