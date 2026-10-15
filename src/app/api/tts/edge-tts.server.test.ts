import { afterEach, describe, expect, it, vi } from "vitest";
import { adjustClock, resetClock } from "@andresaya/edge-tts/dist/core/clock.js";
import { Constants } from "@andresaya/edge-tts";

vi.mock("server-only", () => ({}));

import { EdgeTTSV2, edgeReadAloudUrl, generateSecMsGecV2 } from "./edge-tts.server";

class EdgeTTSProbe extends EdgeTTSV2 {
 authenticationToken() {
  return this.signature();
 }

 authenticationVersion() {
  return this.options.secMsGecVersion;
 }

 endpoint() {
  return this.options.wssUrl;
 }
}

afterEach(() => {
 resetClock();
 vi.useRealTimers();
});

describe("Edge Read Aloud GEC v2", () => {
 it("uses the upstream Read Aloud endpoint and its trusted-token parameter", () => {
  const client = new EdgeTTSProbe();
  expect(client.endpoint()).toBe(
   "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1",
  );
  const url = edgeReadAloudUrl(
   "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1" +
    `?Ocp-Apim-Subscription-Key=${Constants.TRUSTED_CLIENT_TOKEN}` +
    "&Sec-MS-GEC=v2-token&Sec-MS-GEC-Version=2-155.0.4283.45&ConnectionId=connection-1",
  );

  expect(url).toBe(
   "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1" +
    "?Sec-MS-GEC=v2-token&Sec-MS-GEC-Version=2-155.0.4283.45&ConnectionId=connection-1" +
    `&TrustedClientToken=${Constants.TRUSTED_CLIENT_TOKEN}`,
  );
 });

 it.each([
  {
   time: "2026-10-13T10:40:00Z",
   token: "492D7694A183A45E-56E821F95D4579C5B7C7E33DC7303FF379EC36D510213555BBBB9EB17EF15876",
  },
  {
   time: "2026-10-13T10:44:59.999Z",
   token: "492D7694A183A45E-56E821F95D4579C5B7C7E33DC7303FF379EC36D510213555BBBB9EB17EF15876",
  },
  {
   time: "2026-10-13T10:45:00Z",
   token: "6D26B5F5B70269AD-280E82E1BBE24E4E8866E3502EB6277B9436F61ABDC1C224518A038BBD7BBDAD",
  },
  {
   time: "2026-10-15T12:55:00Z",
   token: "76707E2A950C5E30-BD2BA05446944521231E7F730A56DE9A41826BA10095690FE644B5CF4748D670",
  },
 ])("matches upstream token vector at $time", ({ time, token }) => {
  expect(generateSecMsGecV2(Date.parse(time))).toBe(token);
 });

 it("pairs the current token with the v2 handshake version", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-13T10:40:00Z"));
  const client = new EdgeTTSProbe({ voicesCacheTtl: 0 });

  expect(client.authenticationVersion()).toBe("2-155.0.4283.45");
  await expect(client.authenticationToken()).resolves.toBe(
   "492D7694A183A45E-56E821F95D4579C5B7C7E33DC7303FF379EC36D510213555BBBB9EB17EF15876",
  );
 });

 it("preserves the client clock correction across a five-minute boundary", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-13T10:39:00Z"));
  adjustClock(Date.parse("2026-10-13T10:40:00Z"));

  await expect(new EdgeTTSProbe().authenticationToken()).resolves.toBe(
   "492D7694A183A45E-56E821F95D4579C5B7C7E33DC7303FF379EC36D510213555BBBB9EB17EF15876",
  );
 });
});
