import { describe, expect, it } from "vitest";

import {
 emptyReaderSessionState,
 moveReaderParagraph,
 resolveReaderPlaybackEnd,
 readerSessionStateSchema,
 setReaderAnswer,
 toggleReaderAutoAdvance,
 toggleReaderLoop,
} from "./reader-session";

describe("HanziHome reader session", () => {
 it("keeps paragraph navigation bounded", () => {
  expect(moveReaderParagraph(emptyReaderSessionState, -1, 3).activeParagraphIndex).toBe(0);
  expect(moveReaderParagraph(emptyReaderSessionState, 10, 3).activeParagraphIndex).toBe(2);
  expect(moveReaderParagraph(emptyReaderSessionState, 10, 0).activeParagraphIndex).toBe(0);
 });

 it("makes loop and auto-advance mutually exclusive", () => {
  const auto = toggleReaderAutoAdvance(emptyReaderSessionState);
  expect(auto.autoAdvance).toBe(true);
  expect(auto.loopCurrent).toBe(false);
  const loop = toggleReaderLoop(auto);
  expect(loop.loopCurrent).toBe(true);
  expect(loop.autoAdvance).toBe(false);
 });

 it("advances or completes deterministically at playback end", () => {
  const auto = toggleReaderAutoAdvance(emptyReaderSessionState);
  expect(resolveReaderPlaybackEnd(auto, 3).activeParagraphIndex).toBe(1);
  const last = moveReaderParagraph(auto, 2, 3);
  expect(resolveReaderPlaybackEnd(last, 3).completed).toBe(true);
  expect(resolveReaderPlaybackEnd(toggleReaderLoop(last), 3)).toEqual(toggleReaderLoop(last));
 });

 it("keeps answers in the reader-owned session state", () => {
  const next = setReaderAnswer(emptyReaderSessionState, "question-1", "回答");
  expect(next.answers).toEqual({ "question-1": "回答" });
  expect(readerSessionStateSchema.parse(next)).toEqual(next);
 });
});
