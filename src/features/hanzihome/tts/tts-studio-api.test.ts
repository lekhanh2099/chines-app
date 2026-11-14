import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildCacheKey } from "@/lib/audio/tts-cache";
import { createTtsFolder, fetchTtsLibrary, saveTtsClip } from "./tts-studio-api";

const request = vi.fn<typeof fetch>();
beforeEach(() => {
 request.mockReset();
 vi.stubGlobal("fetch", request);
});
afterEach(() => vi.unstubAllGlobals());
describe("TTS library transport", () => {
 it("reads a validated empty library and forwards cancellation", async () => {
  request.mockResolvedValue(Response.json({ folders: [], clips: [] }));
  const controller = new AbortController();
  await expect(fetchTtsLibrary(controller.signal)).resolves.toEqual({ folders: [], clips: [] });
  expect(request).toHaveBeenCalledWith("/api/hanzihome/tts/library", {
   cache: "no-store",
   signal: controller.signal,
  });
 });
 it.each([401, 409, 503])(
  "rejects HTTP %s instead of returning an empty library or successful write",
  async (status) => {
   request.mockImplementation(async () => new Response(null, { status }));
   await expect(fetchTtsLibrary()).rejects.toThrow();
   await expect(createTtsFolder("Test")).rejects.toThrow();
  },
 );
 it("requires a server row acknowledgement for a clip write", async () => {
  request.mockResolvedValue(Response.json({ clip: null }));
  const draft: Parameters<typeof saveTtsClip>[0] = {
   folderId: null,
   title: "Greeting",
   text: "你好。",
   voice: "zh-CN-XiaoxiaoNeural",
   rate: 1,
   cacheKey: buildCacheKey("你好。", "zh-CN-XiaoxiaoNeural", 1),
  };
  await expect(saveTtsClip(draft)).rejects.toThrow();
  expect(request).toHaveBeenCalledWith(
   "/api/hanzihome/tts/library",
   expect.objectContaining({ method: "POST", body: JSON.stringify({ action: "clip", draft }) }),
  );
 });
 it("rejects malformed JSON success bodies", async () => {
  request.mockResolvedValue(Response.json({ clips: [] }));
  await expect(fetchTtsLibrary()).rejects.toThrow();
 });
});
