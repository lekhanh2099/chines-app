import type { Voice } from "edge-tts-ts";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JsonFieldValue } from "@/types/json";

const { communicate, createClient, getUser, listVoices, stream } = vi.hoisted(() => ({
 communicate: vi.fn(),
 createClient: vi.fn(),
 getUser: vi.fn(),
 listVoices: vi.fn(),
 stream: vi.fn(),
}));

vi.mock("edge-tts-ts", () => ({
 listVoices,
 Communicate: class {
  constructor(text: string, options?: { voice?: string; rate?: string }) {
   communicate(text, options);
  }

  stream() {
   return stream();
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
 SuggestedCodec: "audio-24khz-48kbitrate-mono-mp3",
 FriendlyName: "Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)",
 Status: "GA",
 VoiceTag: {
  ContentCategories: ["General"],
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

async function* audioChunks() {
 yield { type: "audio", data: new Uint8Array([1, 2]) };
 yield { type: "audio", data: new Uint8Array([3]) };
}

function postRequest(body: JsonFieldValue) {
 return new NextRequest("https://app.example/api/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
 });
}

describe("/api/tts", () => {
 beforeEach(() => {
  communicate.mockReset();
  createClient.mockReset();
  getUser.mockReset();
  listVoices.mockReset();
  stream.mockReset();
  createClient.mockResolvedValue({ auth: { getUser } });
  getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
  listVoices.mockResolvedValue([xiaoxiaoVoice, taiwanVoice]);
  stream.mockImplementation(audioChunks);
 });

 it("rejects requests without an authenticated user", async () => {
  getUser.mockResolvedValue({ data: { user: null } });

  const getResponse = await GET();
  const postResponse = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 1 }),
  );

  expect(getResponse.status).toBe(401);
  expect(postResponse.status).toBe(401);
  expect(listVoices).not.toHaveBeenCalled();
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
  expect(communicate).not.toHaveBeenCalled();
 });

 it("streams Edge audio as one private MPEG response", async () => {
  const response = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 0.9 }),
  );

  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  expect(communicate).toHaveBeenCalledWith("你好", {
   voice: xiaoxiaoVoice.ShortName,
   rate: "-10%",
  });
 });

 it("returns 502 when Edge synthesis fails", async () => {
  stream.mockImplementation(async function* failingStream() {
   throw new Error("WebSocket unavailable");
  });

  const response = await POST(
   postRequest({ text: "你好", voice: xiaoxiaoVoice.ShortName, rate: 1 }),
  );

  expect(response.status).toBe(502);
  await expect(response.json()).resolves.toEqual({ error: "Không thể tạo audio" });
 });
});
