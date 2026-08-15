import { afterEach, describe, expect, it, vi } from "vitest";

import {
 createReaderAutosaveController,
 emptyReaderSessionState,
 hasPendingReaderStateChange,
 moveReaderParagraph,
 readerFeatureStateFromSession,
 resolveReaderPlaybackEnd,
 readerSessionStateSchema,
 setReaderAnswer,
 toggleReaderAutoAdvance,
 toggleReaderLoop,
 type ReaderAutosaveSave,
 type ReaderFeatureState,
} from "./reader-session";

const initialFeatureState = readerFeatureStateFromSession(emptyReaderSessionState);

function withFeatureChange(change: Partial<ReaderFeatureState>): ReaderFeatureState {
 return { ...initialFeatureState, ...change };
}

describe("HanziHome reader session", () => {
 afterEach(() => vi.useRealTimers());

 it("only reports state changes that have not been persisted", () => {
  expect(hasPendingReaderStateChange(0, 0)).toBe(false);
  expect(hasPendingReaderStateChange(2, 1)).toBe(true);
  expect(hasPendingReaderStateChange(1, 2)).toBe(false);
 });

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
  expect(next.answers).toEqual({
   "question-1": { answer: "回答", score: null, completed: false, responseMs: null },
  });
  expect(readerSessionStateSchema.parse(next)).toEqual(next);
 });

 it("debounces changes and flushes the latest state with the returned revision", async () => {
  vi.useFakeTimers();
  const firstState = withFeatureChange({ showPinyin: true });
  const latestState = withFeatureChange({ showPinyin: true, showMeaning: true });
  let releaseFirst = (_result: { revision: number }): void => undefined;
  let saveCount = 0;
  const saveCalls: Array<{ state: ReaderFeatureState; expectedRevision: number }> = [];
  const save: ReaderAutosaveSave = (state, expectedRevision) => {
   saveCalls.push({ state, expectedRevision });
   saveCount += 1;
   if (saveCount === 1) {
    return new Promise<{ revision: number }>((resolve) => {
     releaseFirst = resolve;
    });
   }
   return Promise.resolve({ revision: expectedRevision + 1 });
  };
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 2,
   save,
   recoverConflict: () => Promise.resolve(null),
   isConflict: () => false,
   onSaved: () => undefined,
   onError: () => undefined,
  });
  controller.setPersistedSnapshot(initialFeatureState);

  controller.schedule(firstState);
  controller.schedule(latestState);
  vi.advanceTimersByTime(499);
  expect(saveCalls).toHaveLength(0);
  vi.advanceTimersByTime(1);
  await Promise.resolve();
  expect(saveCalls).toEqual([{ state: latestState, expectedRevision: 2 }]);

  controller.schedule(withFeatureChange({ showPinyin: false, showMeaning: true }));
  expect(saveCalls).toHaveLength(1);
  controller.setPersistedSnapshot(initialFeatureState);
  releaseFirst({ revision: 3 });
  await vi.runAllTimersAsync();

  expect(saveCalls).toHaveLength(2);
  expect(saveCalls[1]).toEqual({
   state: withFeatureChange({ showPinyin: false, showMeaning: true }),
   expectedRevision: 3,
  });
  controller.dispose();
 });

 it("recovers one conflict and stops without an automatic retry loop", async () => {
  vi.useFakeTimers();
  const save = vi.fn<ReaderAutosaveSave>(async () => {
   throw new Error("conflict");
  });
  const onError = vi.fn();
  const recoverConflict = vi.fn(() => Promise.resolve(8));
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 7,
   save,
   recoverConflict,
   isConflict: () => true,
   onSaved: () => undefined,
   onError,
  });
  controller.schedule(withFeatureChange({ completed: true }));
  await vi.runAllTimersAsync();

  expect(save).toHaveBeenCalledTimes(2);
  expect(recoverConflict).toHaveBeenCalledOnce();
  expect(onError).toHaveBeenCalledOnce();
  controller.dispose();
 });

 it("does not send a request when only non-persisted state is scheduled", () => {
  vi.useFakeTimers();
  const save = vi.fn<ReaderAutosaveSave>(() => Promise.resolve(null));
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 0,
   save,
   recoverConflict: () => Promise.resolve(null),
   isConflict: () => false,
   onSaved: () => undefined,
   onError: () => undefined,
  });
  controller.setPersistedSnapshot(initialFeatureState);
  controller.schedule(initialFeatureState);
  vi.advanceTimersByTime(500);
  expect(save).not.toHaveBeenCalled();
  controller.dispose();
 });

 it("cleans the pending debounce when disposed", () => {
  vi.useFakeTimers();
  const save = vi.fn<ReaderAutosaveSave>(() => Promise.resolve(null));
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 0,
   save,
   recoverConflict: () => Promise.resolve(null),
   isConflict: () => false,
   onSaved: () => undefined,
   onError: () => undefined,
  });
  controller.schedule(withFeatureChange({ showPinyin: true }));
  controller.dispose();
  vi.advanceTimersByTime(500);
  expect(save).not.toHaveBeenCalled();
 });

 it("aborts an in-flight request when disposed", async () => {
  vi.useFakeTimers();
  let activeSignal = new AbortController().signal;
  const save: ReaderAutosaveSave = (_state, _revision, signal) => {
   activeSignal = signal;
   return new Promise<null>(() => undefined);
  };
  const controller = createReaderAutosaveController({
   delayMs: 500,
   initialRevision: 0,
   save,
   recoverConflict: () => Promise.resolve(null),
   isConflict: () => false,
   onSaved: () => undefined,
   onError: () => undefined,
  });
  controller.schedule(withFeatureChange({ showPinyin: true }));
  vi.advanceTimersByTime(500);
  await Promise.resolve();
  controller.dispose();
  expect(activeSignal.aborted).toBe(true);
 });
});
