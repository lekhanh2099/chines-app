import { afterEach, describe, expect, it, vi } from "vitest";

import {
 createReaderAutosaveController,
 hasPendingReaderStateChange,
 readerFeatureStateEqual,
 type ReaderAutosaveSave,
 type ReaderFeatureState,
} from "@/features/reading/model/reading-session";

const initialFeatureState: ReaderFeatureState = {
 completed: false,
 answers: {},
};

function withFeatureChange(change: Partial<ReaderFeatureState>): ReaderFeatureState {
 return { ...initialFeatureState, ...change };
}

describe("HanziHome reader persistence session", () => {
 afterEach(() => vi.useRealTimers());

 it("only reports state changes that have not been persisted", () => {
  expect(hasPendingReaderStateChange(0, 0)).toBe(false);
  expect(hasPendingReaderStateChange(2, 1)).toBe(true);
  expect(hasPendingReaderStateChange(1, 2)).toBe(false);
 });

 it("compares persisted feature state without runtime playback fields", () => {
  expect(readerFeatureStateEqual(initialFeatureState, { ...initialFeatureState })).toBe(true);
  expect(
   readerFeatureStateEqual(initialFeatureState, {
    ...initialFeatureState,
    answers: {
     question: { answer: "回答", score: 1, completed: true, responseMs: 1200 },
    },
   }),
  ).toBe(false);
 });

 it("debounces changes and flushes the latest state with the returned revision", async () => {
  vi.useFakeTimers();
  const firstState = withFeatureChange({ completed: true });
  const latestState = withFeatureChange({
   answers: { first: { answer: "一", score: 1, completed: true, responseMs: 300 } },
  });
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

  controller.schedule(
   withFeatureChange({
    answers: { second: { answer: "二", score: 1, completed: true, responseMs: 400 } },
   }),
  );
  expect(saveCalls).toHaveLength(1);
  controller.setPersistedSnapshot(initialFeatureState);
  releaseFirst({ revision: 3 });
  await vi.runAllTimersAsync();

  expect(saveCalls).toHaveLength(2);
  expect(saveCalls[1]).toEqual({
   state: withFeatureChange({
    answers: { second: { answer: "二", score: 1, completed: true, responseMs: 400 } },
   }),
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

 it("does not send a request when the scheduled state matches persistence", () => {
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
  controller.schedule(withFeatureChange({ completed: true }));
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
  controller.schedule(withFeatureChange({ completed: true }));
  vi.advanceTimersByTime(500);
  await Promise.resolve();
  controller.dispose();
  expect(activeSignal.aborted).toBe(true);
 });
});
