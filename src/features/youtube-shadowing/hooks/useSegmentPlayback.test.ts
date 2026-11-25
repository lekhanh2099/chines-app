import { describe, expect, it } from "vitest";

import { evaluateSegmentTimeTick } from "./useSegmentPlayback";

describe("evaluateSegmentTimeTick", () => {
 const segments = [
  { startMs: 1000, endMs: 3000, text: "早上好" },
  { startMs: 3500, endMs: 6000, text: "我是佳佳" },
  { startMs: 6000, endMs: 6000, text: "零时长句" },
 ];

 it("returns -1 when untimed or empty", () => {
  expect(
   evaluateSegmentTimeTick({
    segments,
    isTimed: false,
    isPlaying: true,
    currentMs: 2000,
    loopEnabled: false,
    loopIndex: -1,
    stopAtMs: -1,
   }),
  ).toEqual({ nextActiveIndex: -1, loopSeekMs: -1, shouldStopAtEnd: false });
 });

 it("resolves the active segment index by currentMs", () => {
  expect(
   evaluateSegmentTimeTick({
    segments,
    isTimed: true,
    isPlaying: true,
    currentMs: 4200,
    loopEnabled: false,
    loopIndex: -1,
    stopAtMs: -1,
   }),
  ).toEqual({ nextActiveIndex: 1, loopSeekMs: -1, shouldStopAtEnd: false });
 });

 it("loops back to segment startMs when loopEnabled and currentMs reaches endMs", () => {
  expect(
   evaluateSegmentTimeTick({
    segments,
    isTimed: true,
    isPlaying: true,
    currentMs: 3050,
    loopEnabled: true,
    loopIndex: 0,
    stopAtMs: -1,
   }),
  ).toEqual({ nextActiveIndex: 0, loopSeekMs: 1000, shouldStopAtEnd: false });
 });

 it("does not loop when segment has endMs <= startMs", () => {
  expect(
   evaluateSegmentTimeTick({
    segments,
    isTimed: true,
    isPlaying: true,
    currentMs: 6100,
    loopEnabled: true,
    loopIndex: 2,
    stopAtMs: -1,
   }),
  ).toEqual({ nextActiveIndex: 2, loopSeekMs: -1, shouldStopAtEnd: false });
 });

 it("stops playback when single-segment stopAtMs is reached", () => {
  expect(
   evaluateSegmentTimeTick({
    segments,
    isTimed: true,
    isPlaying: true,
    currentMs: 6000,
    loopEnabled: false,
    loopIndex: -1,
    stopAtMs: 6000,
   }),
  ).toEqual({ nextActiveIndex: 2, loopSeekMs: -1, shouldStopAtEnd: true });
 });
});
