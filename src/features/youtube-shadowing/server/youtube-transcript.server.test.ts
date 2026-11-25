import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logger", () => ({
 logger: {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
 },
}));

import { fetchYoutubeTranscript, YoutubeTranscriptError } from "./youtube-transcript.server";

function jsonResponse(body: object, status = 200) {
 return new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json" },
 });
}

describe("fetchYoutubeTranscript", () => {
 const fetchMock = vi.fn();

 beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
 });

 afterEach(() => {
  vi.unstubAllGlobals();
 });

 it("selects Chinese caption tracks by priority and prefers manual over asr", async () => {
  fetchMock
   .mockResolvedValueOnce(
    jsonResponse({
     playabilityStatus: { status: "OK" },
     videoDetails: { title: "Chinese Vlog", lengthSeconds: "960" },
     captions: {
      playerCaptionsTracklistRenderer: {
       captionTracks: [
        {
         baseUrl: "https://www.youtube.com/api/timedtext?v=oLHfnK9IVZs&lang=zh-TW",
         languageCode: "zh-TW",
        },
        {
         baseUrl: "https://www.youtube.com/api/timedtext?v=oLHfnK9IVZs&lang=zh-Hans&kind=asr",
         languageCode: "zh-Hans",
         kind: "asr",
        },
        {
         baseUrl: "https://www.youtube.com/api/timedtext?v=oLHfnK9IVZs&lang=zh-Hans",
         languageCode: "zh-Hans",
        },
       ],
      },
     },
    }),
   )
   .mockResolvedValueOnce(
    jsonResponse({
     events: [{ tStartMs: 23000, dDurationMs: 4000, segs: [{ utf8: "早上好，我是佳佳" }] }],
    }),
   );

  const result = await fetchYoutubeTranscript("oLHfnK9IVZs");

  expect(result.outcome).toBe("ready");
  expect(result.language).toBe("zh-Hans");
  expect(result.segments).toEqual([{ startMs: 23000, endMs: 27000, text: "早上好，我是佳佳" }]);

  const timedTextUrl = String(fetchMock.mock.calls[1]?.[0]);
  expect(timedTextUrl).toContain("lang=zh-Hans");
  expect(timedTextUrl).not.toContain("kind=asr");
  expect(timedTextUrl).toContain("fmt=json3");
 });

 it("returns no-captions with availableLanguages when no Chinese track exists", async () => {
  fetchMock.mockResolvedValueOnce(
   jsonResponse({
    playabilityStatus: { status: "OK" },
    videoDetails: { title: "English Video", lengthSeconds: "268" },
    captions: {
     playerCaptionsTracklistRenderer: {
      captionTracks: [
       { baseUrl: "https://www.youtube.com/api/timedtext?lang=en", languageCode: "en" },
       { baseUrl: "https://www.youtube.com/api/timedtext?lang=vi", languageCode: "vi" },
      ],
     },
    },
   }),
  );

  const result = await fetchYoutubeTranscript("l5eMUEGHv5Y");

  expect(result).toEqual({
   outcome: "no-captions",
   videoId: "l5eMUEGHv5Y",
   title: "English Video",
   lengthSeconds: 268,
   language: "",
   availableLanguages: ["en", "vi"],
   segments: [],
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });

 it("returns too-long at 1801s and allows exactly 1800s", async () => {
  fetchMock.mockResolvedValueOnce(
   jsonResponse({
    playabilityStatus: { status: "OK" },
    videoDetails: { title: "Long Video", lengthSeconds: "1801" },
   }),
  );

  const tooLong = await fetchYoutubeTranscript("MP7pMT6gUgA");
  expect(tooLong.outcome).toBe("too-long");
  expect(tooLong.lengthSeconds).toBe(1801);
  expect(tooLong.segments).toEqual([]);

  fetchMock.mockResolvedValueOnce(
   jsonResponse({
    playabilityStatus: { status: "OK" },
    videoDetails: { title: "Boundary Video", lengthSeconds: "1800" },
   }),
  );

  const exactLimit = await fetchYoutubeTranscript("n2hOvvaOI14");
  expect(exactLimit.outcome).toBe("no-captions");
  expect(exactLimit.lengthSeconds).toBe(1800);
 });

 it("throws YOUTUBE_BLOCKED when playabilityStatus is not OK or HTTP is 403/429", async () => {
  fetchMock.mockResolvedValueOnce(
   jsonResponse({
    playabilityStatus: { status: "LOGIN_REQUIRED" },
   }),
  );

  await expect(fetchYoutubeTranscript("oLHfnK9IVZs")).rejects.toMatchObject({
   name: "YOUTUBE_BLOCKED",
   code: "YOUTUBE_BLOCKED",
  });

  fetchMock.mockResolvedValueOnce(new Response("Forbidden", { status: 403 }));
  await expect(fetchYoutubeTranscript("oLHfnK9IVZs")).rejects.toBeInstanceOf(
   YoutubeTranscriptError,
  );

  fetchMock.mockResolvedValueOnce(new Response("Too Many Requests", { status: 429 }));
  await expect(fetchYoutubeTranscript("oLHfnK9IVZs")).rejects.toMatchObject({
   code: "YOUTUBE_BLOCKED",
  });
 });

 it("throws YOUTUBE_FETCH_FAILED on network timeout or malformed JSON", async () => {
  fetchMock.mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));
  await expect(fetchYoutubeTranscript("oLHfnK9IVZs")).rejects.toMatchObject({
   code: "YOUTUBE_FETCH_FAILED",
  });

  fetchMock.mockResolvedValueOnce(new Response("not-json", { status: 200 }));
  await expect(fetchYoutubeTranscript("oLHfnK9IVZs")).rejects.toMatchObject({
   code: "YOUTUBE_FETCH_FAILED",
  });
 });

 it("rejects caption baseUrl outside youtube.com", async () => {
  fetchMock.mockResolvedValueOnce(
   jsonResponse({
    playabilityStatus: { status: "OK" },
    videoDetails: { title: "SSRF Test", lengthSeconds: "120" },
    captions: {
     playerCaptionsTracklistRenderer: {
      captionTracks: [{ baseUrl: "https://evil.example.com/timedtext", languageCode: "zh-Hans" }],
     },
    },
   }),
  );

  await expect(fetchYoutubeTranscript("oLHfnK9IVZs")).rejects.toMatchObject({
   code: "YOUTUBE_FETCH_FAILED",
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
 });
});
