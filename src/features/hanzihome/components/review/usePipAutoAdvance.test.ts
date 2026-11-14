import { describe, expect, it } from "vitest";

import { MAX_SPEECH_HOLD_SECONDS, pipAutoAdvanceTick } from "./usePipAutoAdvance";

function runCycle({
 intervalSeconds,
 speechSeconds,
}: {
 intervalSeconds: number;
 speechSeconds: number;
}) {
 let state = { remaining: intervalSeconds, held: 0 };
 for (let second = 1; second <= intervalSeconds + MAX_SPEECH_HOLD_SECONDS + 5; second += 1) {
  const step = pipAutoAdvanceTick({
   ...state,
   isSpeaking: second <= speechSeconds,
   intervalSeconds,
  });
  if (step.advance) return second;
  state = { remaining: step.remaining, held: step.held };
 }
 return null;
}

describe("pipAutoAdvanceTick", () => {
 it("advances on schedule when speech already finished", () => {
  expect(runCycle({ intervalSeconds: 15, speechSeconds: 4 })).toBe(15);
 });

 it("waits for a long example to finish instead of cutting it off", () => {
  expect(runCycle({ intervalSeconds: 10, speechSeconds: 17 })).toBe(18);
 });

 it("advances anyway once the hold cap is reached", () => {
  expect(runCycle({ intervalSeconds: 10, speechSeconds: 999 })).toBe(10 + MAX_SPEECH_HOLD_SECONDS);
 });

 it("flips the card at the halfway mark", () => {
  expect(
   pipAutoAdvanceTick({ remaining: 8, held: 0, isSpeaking: false, intervalSeconds: 15 }),
  ).toMatchObject({ halfway: true, remaining: 7 });
 });
});
