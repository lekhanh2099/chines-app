import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTTS } from "./useTTS";
import { createMandarinReaderSpeechService } from "@/features/speech/MandarinTtsProvider";
import { cookReaderData } from "@/features/reader/model/cook-reader-data";
import { createReaderStore } from "@/features/reader/runtime/reader-store";
import { createReaderPlayback } from "@/features/reader/runtime/reader-playback";

vi.mock("@/lib/tts-cache", () => ({
 buildCacheKey: (text: string, voice: string, rate: number) => `${voice}:${rate}:${text}`,
 getCachedAudio: async () => null,
 setCachedAudio: async () => {},
}));

const audioInstances: TestAudio[] = [];
class TestAudio {
 paused = true;
 ended = false;
 duration = 10;
 currentTime = 0;
 playbackRate = 1;
 onended = () => {};
 onerror = () => {};
 onpause = () => {};
 onplay = () => {};
 onloadedmetadata = () => {};
 ontimeupdate = () => {};
 constructor() {
  audioInstances.push(this);
 }
 play = vi.fn(async () => {
  this.paused = false;
  this.onplay?.();
 });
 pause = vi.fn(() => {
  this.paused = true;
  this.onpause?.();
 });
 removeAttribute = vi.fn();
 load = vi.fn();
}

const fetchAudio = vi.fn<typeof fetch>();

// SSR captures the real hook callbacks/refs. It does not test React effects,
// rerenders or browser media behavior; audio and network are controlled here.
function controller() {
 const captures: ReturnType<typeof useTTS>[] = [];
 function Probe() {
  captures.push(useTTS());
  return null;
 }
 renderToStaticMarkup(<Probe />);
 const tts = captures[0];
 if (!tts) throw new Error("Missing TTS controller");
 return tts;
}

async function activeAudio(index = 0) {
 await vi.waitFor(() => expect(audioInstances.length).toBeGreaterThan(index));
 const audio = audioInstances[index];
 if (!audio) throw new Error("Missing audio");
 return audio;
}

beforeEach(() => {
 audioInstances.length = 0;
 fetchAudio.mockReset();
 fetchAudio.mockImplementation(async (_url, init) =>
  init?.method === "POST"
   ? new Response(new Blob(["audio"]))
   : Response.json([
      { name: "Voice", shortName: "zh-CN-Voice", gender: "Female", locale: "zh-CN" },
     ]),
 );
 vi.stubGlobal("Audio", TestAudio);
 vi.stubGlobal("fetch", fetchAudio);
 vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:tts-test");
 vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
});
afterEach(() => {
 vi.unstubAllGlobals();
 vi.restoreAllMocks();
});

describe("useTTS terminal lifecycle", () => {
 it("chunks a long Reader segment within the existing TTS limit and settles after the final audio", async () => {
  const tts = controller();
  const onProgress = vi.fn();
  const complete = vi.fn();
  const text = "你".repeat(9_999) + "😀好";
  const pending = tts.speakWithLifecycle(text, { rate: 1, onProgress });
  void pending.then(complete);
  const first = await activeAudio();
  expect(fetchAudio).toHaveBeenCalledWith(
   "/api/tts",
   expect.objectContaining({
    body: JSON.stringify({ text: "你".repeat(9_999), voice: "zh-CN-Voice", rate: 1 }),
   }),
  );
  first.currentTime = 5;
  first.ontimeupdate();
  expect(onProgress).toHaveBeenLastCalledWith(4_999.5 / text.length);
  tts.setPlaybackRate(0.75);
  first.onended();
  const second = await activeAudio(1);
  expect(complete).not.toHaveBeenCalled();
  expect(fetchAudio).toHaveBeenCalledWith(
   "/api/tts",
   expect.objectContaining({
    body: JSON.stringify({ text: "😀好", voice: "zh-CN-Voice", rate: 0.75 }),
   }),
  );
  second.onended();
  await expect(pending).resolves.toEqual({ completed: true, cancelled: false });
 });
 it("rejects blocked startup and blocked resume", async () => {
  vi.stubGlobal(
   "Audio",
   class extends TestAudio {
    override play = vi.fn(async () => {
     throw new Error("blocked");
    });
   },
  );
  const tts = controller();
  await expect(tts.speakWithLifecycle("一", { rate: 1 })).rejects.toThrow(
   "Trình duyệt đã chặn phát audio",
  );
  vi.stubGlobal("Audio", TestAudio);
  const pending = tts.speakWithLifecycle("二", { rate: 1 });
  const rejected = expect(pending).rejects.toThrow("Trình duyệt đã chặn tiếp tục");
  const audio = await activeAudio(1);
  tts.pause();
  audio.play.mockRejectedValueOnce(new Error("blocked resume"));
  tts.resume();
  await rejected;
 });

 it("advances the real Reader command pipeline only after audio ends", async () => {
  const tts = controller();
  const adapter = createMandarinReaderSpeechService(tts);
  const store = createReaderStore(
   cookReaderData([
    { id: "a", zh: "一" },
    { id: "b", zh: "二" },
   ]),
  );
  const commands = createReaderPlayback(store, adapter.speech);
  commands.playAll();
  const first = await activeAudio();
  expect(store.state.playback).toMatchObject({ segmentId: "a", status: "playing" });
  expect(audioInstances).toHaveLength(1);
  first.onended();
  const second = await activeAudio(1);
  expect(store.state.playback.segmentId).toBe("b");
  second.onended();
  await vi.waitFor(() => expect(store.state.playback.status).toBe("idle"));
 });
 it("remains pending after startup, reports progress and resolves only on ended", async () => {
  const tts = controller();
  const onProgress = vi.fn();
  const onSettled = vi.fn();
  const completed = vi.fn();
  const pending = tts.speakWithLifecycle("你好。", { rate: 1.5, onProgress, onSettled });
  void pending.then(completed);
  const audio = await activeAudio();
  expect(completed).not.toHaveBeenCalled();
  expect(fetchAudio).toHaveBeenCalledWith(
   "/api/tts",
   expect.objectContaining({
    body: JSON.stringify({ text: "你好。", voice: "zh-CN-Voice", rate: 1.5 }),
   }),
  );
  audio.currentTime = 4;
  audio.ontimeupdate();
  expect(onProgress).toHaveBeenLastCalledWith(0.4);
  tts.pause();
  expect(audio.paused).toBe(true);
  tts.resume();
  await Promise.resolve();
  expect(onProgress).toHaveBeenLastCalledWith(0.4);
  tts.setPlaybackRate(0.75);
  expect(audio.playbackRate).toBe(0.5);
  audio.onended();
  await expect(pending).resolves.toEqual({ completed: true, cancelled: false });
  expect(onSettled).toHaveBeenCalledOnce();
 });

 it("cancels while voices are still loading without starting audio", async () => {
  const response = { resolve: (_response: Response) => {} };
  fetchAudio.mockImplementation(
   () =>
    new Promise((resolve) => {
     response.resolve = resolve;
    }),
  );
  const tts = controller();
  const pending = tts.speakWithLifecycle("你好", { rate: 1 });
  tts.stop();
  await expect(pending).resolves.toEqual({ completed: false, cancelled: true });
  response.resolve(
   Response.json([{ name: "Voice", shortName: "zh-CN-Voice", gender: "Female", locale: "zh-CN" }]),
  );
  await Promise.resolve();
  await Promise.resolve();
  expect(audioInstances).toHaveLength(0);
 });

 it("ignores old audio completion after replacement and settles each request once", async () => {
  const tts = controller();
  const first = tts.speakWithLifecycle("一", { rate: 1 });
  const firstAudio = await activeAudio();
  const oldEnded = firstAudio.onended;
  const second = tts.speakWithLifecycle("二", { rate: 1 });
  await expect(first).resolves.toEqual({ completed: false, cancelled: true });
  const secondAudio = await activeAudio(1);
  oldEnded();
  expect(secondAudio.pause).not.toHaveBeenCalled();
  secondAudio.onended();
  await expect(second).resolves.toEqual({ completed: true, cancelled: false });
 });

 it("rejects media errors rather than completing", async () => {
  const tts = controller();
  const pending = tts.speakWithLifecycle("你好", { rate: 1 });
  const rejected = expect(pending).rejects.toThrow("Không thể phát audio");
  const audio = await activeAudio();
  audio.onerror();
  await rejected;
 });

 it("rejects missing voices and HTTP audio errors", async () => {
  const tts = controller();
  fetchAudio.mockResolvedValue(Response.json([]));
  await expect(tts.speakWithLifecycle("你好", { rate: 1 })).rejects.toThrow("Không tải được giọng");
  fetchAudio.mockImplementation(async (_url, init) =>
   init?.method === "POST"
    ? new Response(null, { status: 503 })
    : Response.json([
       { name: "Voice", shortName: "zh-CN-Voice", gender: "Female", locale: "zh-CN" },
      ]),
  );
  await expect(tts.speakWithLifecycle("你好", { rate: 1 })).rejects.toThrow("TTS API 503");
 });

 it("keeps legacy speak startup semantics and cancels the preceding lifecycle", async () => {
  const tts = controller();
  const pending = tts.speakWithLifecycle("一", { rate: 1 });
  await activeAudio();
  await tts.speak("二");
  await expect(pending).resolves.toEqual({ completed: false, cancelled: true });
  const audio = await activeAudio(1);
  expect(audio.ended).toBe(false);
  tts.stop();
 });

 it("preserves the legacy sequence completion callback", async () => {
  const tts = controller();
  const complete = vi.fn();
  tts.speakSequence(["一", "二"], complete);
  const audio = await activeAudio();
  expect(complete).not.toHaveBeenCalled();
  audio.onended();
  expect(complete).toHaveBeenCalledOnce();
 });

 it("does not finish the legacy sequence merely because another legacy request starts", async () => {
  const tts = controller();
  const complete = vi.fn();
  tts.speakSequence(["一"], complete);
  await activeAudio();
  await tts.speak("二");
  expect(complete).not.toHaveBeenCalled();
  tts.stop();
  expect(complete).toHaveBeenCalledOnce();
 });

 it("adapts character offsets and cannot stop a legacy successor in the same tick", async () => {
  const tts = controller();
  const { speech } = createMandarinReaderSpeechService(tts);
  const pending = speech.speak({ segmentId: "a", text: "你好。", startOffset: 1, rate: 1 });
  await activeAudio();
  expect(fetchAudio).toHaveBeenCalledWith(
   "/api/tts",
   expect.objectContaining({
    body: JSON.stringify({ text: "好。", voice: "zh-CN-Voice", rate: 1 }),
   }),
  );
  const legacy = tts.speak("新的内容");
  speech.stop();
  await legacy;
  await expect(pending).resolves.toEqual({ completed: false, cancelled: true });
  const audio = await activeAudio(1);
  expect(audio.pause).not.toHaveBeenCalled();
  tts.stop();
 });
});
