import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
 getUser: vi.fn(),
 fetchYoutubeTranscript: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
 createClient: vi.fn(async () => ({ auth: { getUser: mocks.getUser } })),
}));
vi.mock("@/features/youtube-shadowing/server/youtube-transcript.server", async () => {
 const actual = await vi.importActual<
  typeof import("@/features/youtube-shadowing/server/youtube-transcript.server")
 >("@/features/youtube-shadowing/server/youtube-transcript.server");
 return {
  ...actual,
  fetchYoutubeTranscript: mocks.fetchYoutubeTranscript,
 };
});

import { YoutubeTranscriptError } from "@/features/youtube-shadowing/server/youtube-transcript.server";

import { GET } from "./route";

function createRequest(query = "") {
 return new NextRequest(`https://app.example/api/shadowing/youtube-transcript${query}`);
}

describe("GET /api/shadowing/youtube-transcript", () => {
 beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.fetchYoutubeTranscript.mockReset();
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
 });

 it("returns 401 when unauthenticated", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });

  const response = await GET(createRequest("?videoId=oLHfnK9IVZs"));

  expect(response.status).toBe(401);
  await expect(response.json()).resolves.toMatchObject({ code: "UNAUTHORIZED" });
  expect(mocks.fetchYoutubeTranscript).not.toHaveBeenCalled();
 });

 it("returns 400 when videoId is missing or invalid", async () => {
  const response = await GET(createRequest("?videoId=invalid"));

  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ code: "YOUTUBE_INVALID_VIDEO_ID" });
  expect(mocks.fetchYoutubeTranscript).not.toHaveBeenCalled();
 });

 it("returns 200 with transcript payload for ready, no-captions, and too-long outcomes", async () => {
  const outcomes = [
   {
    outcome: "ready",
    videoId: "oLHfnK9IVZs",
    title: "Vlog",
    lengthSeconds: 960,
    language: "zh-Hans",
    availableLanguages: ["zh-Hans"],
    segments: [{ startMs: 1000, endMs: 4000, text: "早上好，我是佳佳" }],
   },
   {
    outcome: "no-captions",
    videoId: "l5eMUEGHv5Y",
    title: "English",
    lengthSeconds: 268,
    language: "",
    availableLanguages: ["en"],
    segments: [],
   },
   {
    outcome: "too-long",
    videoId: "MP7pMT6gUgA",
    title: "Long",
    lengthSeconds: 3454,
    language: "",
    availableLanguages: [],
    segments: [],
   },
  ];

  for (const payload of outcomes) {
   mocks.fetchYoutubeTranscript.mockResolvedValueOnce(payload);
   const response = await GET(createRequest(`?videoId=${payload.videoId}`));
   expect(response.status).toBe(200);
   expect(response.headers.get("cache-control")).toBe("private, no-store");
   await expect(response.json()).resolves.toEqual(payload);
  }
 });

 it("returns 502 with YOUTUBE_BLOCKED and YOUTUBE_FETCH_FAILED codes", async () => {
  mocks.fetchYoutubeTranscript.mockRejectedValueOnce(
   new YoutubeTranscriptError("YOUTUBE_BLOCKED", "Blocked"),
  );
  const blockedResponse = await GET(createRequest("?videoId=oLHfnK9IVZs"));
  expect(blockedResponse.status).toBe(502);
  await expect(blockedResponse.json()).resolves.toMatchObject({ code: "YOUTUBE_BLOCKED" });

  mocks.fetchYoutubeTranscript.mockRejectedValueOnce(
   new YoutubeTranscriptError("YOUTUBE_FETCH_FAILED", "Failed"),
  );
  const failedResponse = await GET(createRequest("?videoId=oLHfnK9IVZs"));
  expect(failedResponse.status).toBe(502);
  await expect(failedResponse.json()).resolves.toMatchObject({ code: "YOUTUBE_FETCH_FAILED" });
 });
});
