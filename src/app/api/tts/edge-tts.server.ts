import "server-only";

import { createHash } from "node:crypto";
import { Constants, EdgeTTS, type EdgeTTSOptions } from "@andresaya/edge-tts";
import { now } from "@andresaya/edge-tts/dist/core/clock.js";

function rotate16(value: number) {
 return ((value << 16) | (value >>> 16)) >>> 0;
}

// Matches the GEC v2 algorithm and captured vectors in edge-tts 7.3.0:
// https://github.com/rany2/edge-tts/blob/7.3.0/src/edge_tts/drm.py
export function generateSecMsGecV2(timestampMilliseconds = now()) {
 let ticks = timestampMilliseconds / 1_000 + 11_644_473_600;
 ticks -= ticks % 300;
 ticks *= 10_000_000;
 const data = Buffer.from(`${ticks.toFixed(0)}${Constants.TRUSTED_CLIENT_TOKEN}`, "ascii");
 const digest = createHash("sha256")
  .update("Copyright (C) Microsoft Corporation. All rights reserved.")
  .update(data)
  .digest();
 const keyA = (digest.readUInt32LE(0) | 1) >>> 0;
 const keyB = (digest.readUInt32LE(4) | 1) >>> 0;
 const factors = [Math.imul(keyA, 0x82893933) >>> 0, Math.imul(keyB, 0x82893933) >>> 0];
 const terms = [
  0xe82e91b1, 0x44de24c6, 0x3beb65bc, 0xc89c5933, 0x8d1ec211, 0x314ef5d5, 0xe92491b1, 0xf0a5b9d5,
  0x06064cf3, 0xda79fa60, 0xbed20560, 0x89f9c9f8, 0x35fa38c6, 0xcb49e3c6,
 ].map((coefficient, index) => Math.imul(coefficient, factors[index % 2]) >>> 0);
 const offsets = [
  0xb32700d0, 0x88dff51d, 0x29514038, 0xb328cbdf, 0xd405b4d5, 0x26e55f3c, 0x607801c6, 0x82b2c1fb,
  0xfa51a3da, 0x207cc464, 0x3c3c74f3, 0xd2d14b61, 0xbb04a2c1, 0xc5626167,
 ];
 const padded = Buffer.alloc(Math.ceil((data.length + 1) / 8) * 8);
 padded.set(data, 1);
 for (let index = 0; index < padded.length / 4; index += 1) {
  const word = padded.readUInt32LE(index * 4);
  let term = Math.imul(word, index % 2 === 0 ? keyA : keyB);
  let offset = Math.imul(rotate16(word), index % 2 === 0 ? 0xef0569fb : 0xc31713db);
  if (index === 0) {
   term = (term + Math.imul(0xf2f90b1a, factors[0])) >>> 0;
   offset = (offset + 0x0b1a0000) >>> 0;
  }
  terms.push(term >>> 0);
  offsets.push(offset >>> 0);
 }

 let swapAccumulator = 0;
 let swapLast = 0;
 let state = 0;
 let accumulator = 0;
 for (let index = 0; index < terms.length; index += 2) {
  const first = terms[index];
  const second = terms[index + 1];
  let rotated = rotate16((offsets[index] + first) >>> 0);
  let product = Math.imul(rotated, 0x76f50f34);
  swapAccumulator += (Math.imul(rotate16(product), 0xc3efea97) + product) >>> 0;
  rotated = rotate16((offsets[index + 1] + second) >>> 0);
  product = Math.imul(rotated, 0x1881ce3c);
  swapLast = (Math.imul(rotate16(product), 0x35bd1ec9) + product) >>> 0;
  swapAccumulator = (swapAccumulator + swapLast) >>> 0;

  state = (Math.imul(state, keyA) + first) >>> 0;
  for (const multiplier of [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83]) {
   state = Math.imul(rotate16(state), multiplier) >>> 0;
  }
  accumulator += state;
  rotated = (Math.imul(state, keyB) + second) >>> 0;
  rotated = Math.imul(rotate16(rotated), 0xa27416f5) >>> 0;
  rotated = Math.imul(rotate16(rotated), 0xd38396ff) >>> 0;
  state = Math.imul(rotate16(Math.imul(rotate16(rotated), 0x7c932b89)), 0xbfa49f69) >>> 0;
  accumulator = (accumulator + state) >>> 0;
 }
 const cs64 = Buffer.alloc(8);
 cs64.writeUInt32LE((swapLast ^ state) >>> 0, 0);
 cs64.writeUInt32LE((swapAccumulator ^ accumulator) >>> 0, 4);
 return `${cs64.toString("hex").toUpperCase()}-${digest.toString("hex").toUpperCase()}`;
}

export function edgeReadAloudUrl(url: string) {
 const endpoint = new URL(url);
 endpoint.searchParams.delete("Ocp-Apim-Subscription-Key");
 endpoint.searchParams.set("TrustedClientToken", Constants.TRUSTED_CLIENT_TOKEN);
 return endpoint.href;
}

export class EdgeTTSV2 extends EdgeTTS {
 constructor(options: EdgeTTSOptions = {}) {
  super({
   ...options,
   wssUrl: "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1",
   secMsGecVersion: "2-155.0.4283.45",
  });
 }

 protected override openSocket(url: string) {
  return super.openSocket(edgeReadAloudUrl(url));
 }

 protected override signature() {
  return Promise.resolve(generateSecMsGecV2());
 }
}
