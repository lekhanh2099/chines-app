import { describe, expect, it } from "vitest";

import { MAX_TTS_TEXT_LENGTH } from "./tts-contract";
import { splitSpeechSegments } from "./tts-text";

describe("splitSpeechSegments", () => {
 it("trims, drops empty segments and joins the rest with newlines", () => {
  expect(splitSpeechSegments(["  你好 ", "", "   ", "世界"])).toEqual(["你好\n世界"]);
 });

 it("returns no chunks when every segment is blank", () => {
  expect(splitSpeechSegments([])).toEqual([]);
  expect(splitSpeechSegments(["  ", "\n"])).toEqual([]);
 });

 it("keeps text at the request limit as one chunk", () => {
  const text = "好".repeat(MAX_TTS_TEXT_LENGTH);
  expect(splitSpeechSegments([text])).toEqual([text]);
 });

 it("chunks longer text to the request limit without splitting code points", () => {
  const text = "好".repeat(MAX_TTS_TEXT_LENGTH) + "😀😀";
  const chunks = splitSpeechSegments([text]);
  expect(chunks).toEqual(["好".repeat(MAX_TTS_TEXT_LENGTH), "😀😀"]);
  expect(chunks.join("")).toBe(text);
 });
});
