import type { EdgeTTS, Voice } from "@andresaya/edge-tts";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JsonFieldValue } from "@/types/json";

const { createClient, generate, getUser, getVoices } = vi.hoisted(() => ({
 createClient: vi.fn(),
 generate: vi.fn<EdgeTTS["generate"]>(),
 getUser: vi.fn(),
 getVoices: vi.fn<EdgeTTS["getVoices"]>(),
}));

vi.mock("@andresaya/edge-tts", () => ({
 EdgeTTS: class {
  getVoices() {
   return getVoices();
  }

  generate(...args: Parameters<EdgeTTS["generate"]>) {
   return generate(...args);
  }
 },
}));
vi.mock("@/lib/supabase/server", () => ({ createClient }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

import { GET, POST } from "./route";

const xiaoxiaoVoice: Voice = {
 Name: "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)",
 ShortName: "zh-CN-XiaoxiaoNeural",
 Gender: "Female",
 Locale: "zh-CN",
 FriendlyName: "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)",
 LocalName: "Xiaoxiao",
 VoiceTag: {
  TailoredScenarios: ["General"],
  VoicePersonalities: ["Warm"],
 },
};
const taiwanVoice: Voice = {
 ...xiaoxiaoVoice,
 Name: "Microsoft Server Speech Text to Speech Voice (zh-TW, HsiaoChenNeural)",
 ShortName: "zh-TW-HsiaoChenNeural",
 Locale: "zh-TW",
 FriendlyName: "Microsoft HsiaoChen Online (Natural) - Chinese (Taiwan)",
};

function postRequest(body: JsonFieldValue) {
 return new NextRequest("https://app.example/api/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

describe("/api/tts", () => {
 beforeEach(() => {
  createClient.mockReset();
  generate.mockReset();
  getUser.mockReset();
  getVoices.mockReset();
  createClient.mockResolvedValue({ auth: { getUser } });
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  getVoices.mockResolvedValue([xiaoxiaoVoice, taiwanVoice]);
  generate.mockResolvedValue({
   audio: Buffer.from([1, 2, 3]),
   format: "mp3",
   outputFormat: "audio-24khz-48kbitrate-mono-mp3",
   wordBoundaries: [],
   sentenceBoundaries: [],
   duration: 1,
  });
 });

 it("rejects requests without an authenticated user", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const getResponse = await GET();
  const postResponse = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 1 }),
  );

  expect(getResponse.status).toBe(401);
  expect(postResponse.status).toBe(401);
  expect(getVoices).not.toHaveBeenCalled();
  expect(generate).not.toHaveBeenCalled();
 });

 it("returns only Mainland Mandarin voices", async () => {
  const response = await GET();

  expect(response.status).toBe(200);
  await expect(response.json()).resolves.toEqual([
   {
    name: xiaoxiaoVoice.FriendlyName,
    shortName: xiaoxiaoVoice.ShortName,
    gender: xiaoxiaoVoice.Gender,
    locale: xiaoxiaoVoice.Locale,
   },
  ]);
 });

 it("validates text, voice, and rate", async () => {
  const emptyText = await POST(postRequest({ text: "", voice: xiaoxiaoVoice.ShortName, rate: 1 }));
  const longText = await POST(
   postRequest({ text: "汉".repeat(10_001), voice: xiaoxiaoVoice.ShortName, rate: 1 }),
  );
  const invalidRate = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 2 }),
  );
  const invalidVoice = await POST(
   postRequest({ text: "你好", voice: taiwanVoice.ShortName, rate: 1 }),
  );

  expect(emptyText.status).toBe(400);
  expect(longText.status).toBe(400);
  expect(invalidRate.status).toBe(400);
  expect(invalidVoice.status).toBe(400);
  expect(generate).not.toHaveBeenCalled();
 });

 it("returns Edge audio as one private MPEG response", async () => {
  const response = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 0.9 }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
  expect(response.headers.get("Content-Length")).toBe("3");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  expect(generate).toHaveBeenCalledWith("你好", xiaoxiaoVoice.ShortName, {
   rate: "-10%",
  });
 });

 it("returns 502 when Edge synthesis fails", async () => {
  generate.mockRejectedValue(new Error("WebSocket unavailable"));

  const response = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 1 }),
  );

  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({ error: "Không thể tạo audio" });
 });

 it.each([
  { rate: 0.75, percentage: "-25%" },
  { rate: 0.9, percentage: "-10%" },
  { rate: 1, percentage: "+0%" },
  { rate: 1.1, percentage: "+10%" },
  { rate: 1.25, percentage: "+25%" },
 ])("preserves synthesis rate $rate", async ({ rate, percentage }) => {
  const response = await POST(postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate }));

  expect(response.status).toBe(200);
  expect(generate).toHaveBeenCalledWith("你好", xiaoxiaoVoice.ShortName, { rate: percentage });
 });

 it("preserves every character and joins audio across UTF-8 synthesis chunks", async () => {
  const text = "你".repeat(1_365) + "😀<&>尾".repeat(600);
  const response = await POST(postRequest({ text, voice: xiaoxiaoVoice.ShortName, rate: 0.9 }));
  const synthesisTexts = generate.mock.calls.map(([synthesisText]) => synthesisText);

  expect(response.status).toBe(200);
  expect(synthesisTexts.length).toBeGreaterThan(1);
  expect(synthesisTexts.join("")).toBe(text);
  for (const synthesisText of synthesisTexts) {
   expect(Buffer.byteLength(synthesisText)).toBeLessThanOrEqual(4_096);
   expect(synthesisText.isWellFormed()).toBe(true);
   expect(generate).toHaveBeenCalledWith(synthesisText, xiaoxiaoVoice.ShortName, { rate: "-10%" });
  }
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(
   new Uint8Array(synthesisTexts.flatMap(() => [1, 2, 3])),
  );
 });

 it("rejects empty audio from the client", async () => {
  generate.mockResolvedValue({
   audio: Buffer.alloc(0),
   format: "mp3",
   outputFormat: "audio-24khz-48kbitrate-mono-mp3",
   wordBoundaries: [],
   sentenceBoundaries: [],
   duration: 0,
  });

  const response = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 1 }),
  );

  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({ error: "Không thể tạo audio" });
 });

 it("does not return partial audio when a later synthesis chunk fails", async () => {
  generate.mockImplementationOnce(async () => ({
   audio: Buffer.from([1, 2, 3]),
   format: "mp3",
   outputFormat: "audio-24khz-48kbitrate-mono-mp3",
   wordBoundaries: [],
   sentenceBoundaries: [],
   duration: 1,
  }));
  generate.mockRejectedValue(new Error("WebSocket unavailable"));

  const response = await POST(
   postRequest({ text: "你".repeat(2_000), voice: xiaoxiaoVoice.ShortName, rate: 1 }),
  );

  expect(generate).toHaveBeenCalledTimes(2);
  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({ error: "Không thể tạo audio" });
 });
});
