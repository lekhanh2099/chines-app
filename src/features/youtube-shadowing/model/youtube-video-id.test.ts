import { describe, expect, it } from "vitest";

import { parseYoutubeVideoId } from "./youtube-video-id";

describe("parseYoutubeVideoId", () => {
 it("extracts video IDs from all supported YouTube URL formats", () => {
  expect(parseYoutubeVideoId("https://www.youtube.com/watch?v=oLHfnK9IVZs")).toBe("oLHfnK9IVZs");
  expect(parseYoutubeVideoId("https://youtu.be/N55ZNxgKA3I")).toBe("N55ZNxgKA3I");
  expect(parseYoutubeVideoId("https://www.youtube.com/shorts/G-mJQjn3L-8")).toBe("G-mJQjn3L-8");
  expect(parseYoutubeVideoId("https://www.youtube.com/embed/l5eMUEGHv5Y")).toBe("l5eMUEGHv5Y");
  expect(parseYoutubeVideoId("https://www.youtube.com/live/n2hOvvaOI14")).toBe("n2hOvvaOI14");
  expect(parseYoutubeVideoId("https://m.youtube.com/watch?v=MP7pMT6gUgA")).toBe("MP7pMT6gUgA");
  expect(parseYoutubeVideoId("https://music.youtube.com/watch?v=oLHfnK9IVZs")).toBe("oLHfnK9IVZs");
 });

 it("handles query parameters, missing scheme, and surrounding whitespace", () => {
  expect(
   parseYoutubeVideoId("  https://www.youtube.com/watch?v=oLHfnK9IVZs&t=42s&list=PL1234567890  "),
  ).toBe("oLHfnK9IVZs");
  expect(parseYoutubeVideoId("  youtu.be/G-mJQjn3L-8?si=abc&t=15  ")).toBe("G-mJQjn3L-8");
  expect(parseYoutubeVideoId("youtube.com/watch?v=N55ZNxgKA3I")).toBe("N55ZNxgKA3I");
  expect(parseYoutubeVideoId("m.youtube.com/shorts/l5eMUEGHv5Y?feature=share")).toBe("l5eMUEGHv5Y");
 });

 it("returns empty string for non-YouTube URLs, invalid IDs, and empty strings", () => {
  expect(parseYoutubeVideoId("")).toBe("");
  expect(parseYoutubeVideoId("   ")).toBe("");
  expect(parseYoutubeVideoId("https://vimeo.com/12345678901")).toBe("");
  expect(parseYoutubeVideoId("https://notyoutube.com/watch?v=oLHfnK9IVZs")).toBe("");
  expect(parseYoutubeVideoId("https://www.youtube.com/watch?v=short")).toBe("");
  expect(parseYoutubeVideoId("https://www.youtube.com/watch?v=waytoolongvideoid")).toBe("");
  expect(parseYoutubeVideoId("https://www.youtube.com/channel/UC12345678901")).toBe("");
  expect(parseYoutubeVideoId("javascript://youtube.com/watch?v=oLHfnK9IVZs")).toBe("");
  expect(parseYoutubeVideoId("oLHfnK9IVZs")).toBe("");
 });
});
