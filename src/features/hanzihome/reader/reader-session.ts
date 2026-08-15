import { z } from "zod";

import { readerAnswerStateSchema } from "./reader.schemas";
import type { ReaderProgressRow } from "./reader-state.schemas";
import { readerFeatureStateSchema } from "./reader-state.schemas";

export const readerSessionStateSchema = z.strictObject({
 activeParagraphIndex: z.number().int().nonnegative(),
 showPinyin: z.boolean(),
 showMeaning: z.boolean(),
 autoAdvance: z.boolean(),
 loopCurrent: z.boolean(),
 focusMode: z.boolean(),
 shadowing: z.boolean(),
 completed: z.boolean(),
 summaryText: z.string(),
 answers: z.record(z.string().min(1), readerAnswerStateSchema),
});

export type ReaderSessionState = z.output<typeof readerSessionStateSchema>;
export type ReaderFeatureState = z.output<typeof readerFeatureStateSchema>;

type ReaderAutosaveResult = Pick<ReaderProgressRow, "revision"> | null;

export type ReaderAutosaveSave = (
 state: ReaderFeatureState,
 expectedRevision: number,
 signal: AbortSignal,
) => Promise<ReaderAutosaveResult>;

export type ReaderAutosaveController = {
 schedule: (state: ReaderFeatureState) => void;
 setPersistedSnapshot: (state: ReaderFeatureState) => void;
 updateRevision: (revision: number) => void;
 dispose: () => void;
};

type ReaderAutosaveControllerOptions = {
 delayMs: number;
 initialRevision: number;
 save: ReaderAutosaveSave;
 recoverConflict: () => Promise<number | null>;
 isConflict: (error: Error) => boolean;
 onSaved: (state: ReaderFeatureState, result: ReaderAutosaveResult) => void;
 onError: (error: Error) => void;
};

export const emptyReaderSessionState: ReaderSessionState = {
 activeParagraphIndex: 0,
 showPinyin: false,
 showMeaning: false,
 autoAdvance: false,
 loopCurrent: false,
 focusMode: false,
 shadowing: false,
 completed: false,
 summaryText: "",
 answers: {},
};

export function readerFeatureStateFromSession(state: ReaderSessionState): ReaderFeatureState {
 return {
  showPinyin: state.showPinyin,
  showMeaning: state.showMeaning,
  completed: state.completed,
  summaryText: state.summaryText,
  answers: state.answers,
 };
}

export function readerFeatureStateEqual(
 left: ReaderFeatureState,
 right: ReaderFeatureState,
): boolean {
 if (
  left.showPinyin !== right.showPinyin ||
  left.showMeaning !== right.showMeaning ||
  left.completed !== right.completed ||
  left.summaryText !== right.summaryText
 )
  return false;

 const leftAnswerIds = Object.keys(left.answers);
 const rightAnswerIds = Object.keys(right.answers);
 if (leftAnswerIds.length !== rightAnswerIds.length) return false;

 return leftAnswerIds.every((answerId) => {
  const leftAnswer = left.answers[answerId];
  const rightAnswer = right.answers[answerId];
  return (
   rightAnswer !== undefined &&
   leftAnswer.answer === rightAnswer.answer &&
   leftAnswer.score === rightAnswer.score &&
   leftAnswer.completed === rightAnswer.completed &&
   leftAnswer.responseMs === rightAnswer.responseMs
  );
 });
}

export function createReaderAutosaveController({
 delayMs,
 initialRevision,
 save,
 recoverConflict,
 isConflict,
 onSaved,
 onError,
}: ReaderAutosaveControllerOptions): ReaderAutosaveController {
 let timer: ReturnType<typeof setTimeout> | null = null;
 let pendingState: ReaderFeatureState | null = null;
 let persistedSnapshot: ReaderFeatureState | null = null;
 let conflictSnapshot: ReaderFeatureState | null = null;
 let revision = initialRevision;
 let inFlight = false;
 let disposed = false;
 let generation = 0;
 let activeAbortController: AbortController | null = null;

 const clearTimer = () => {
  if (timer === null) return;
  clearTimeout(timer);
  timer = null;
 };

 const queueFlush = (waitMs: number) => {
  if (disposed || inFlight || pendingState === null) return;
  clearTimer();
  timer = setTimeout(() => {
   timer = null;
   void flush();
  }, waitMs);
 };

 async function flush() {
  if (disposed || inFlight || pendingState === null) return;

  const snapshot = pendingState;
  const operationGeneration = generation;
  const abortController = new AbortController();
  activeAbortController = abortController;
  inFlight = true;
  let flushPendingAfterCompletion = false;

  try {
   const result = await save(snapshot, revision, abortController.signal);
   if (disposed || operationGeneration !== generation) return;

   revision = result?.revision ?? revision;
   persistedSnapshot = snapshot;
   conflictSnapshot = null;
   onSaved(snapshot, result);

   if (pendingState !== null && readerFeatureStateEqual(pendingState, snapshot)) {
    pendingState = null;
   } else if (pendingState !== null) {
    flushPendingAfterCompletion = true;
   }
  } catch (caughtError) {
   if (disposed || operationGeneration !== generation) return;

   const error =
    caughtError instanceof Error ? caughtError : new Error("Không lưu được tiến độ Reader.");
   const canRecoverConflict =
    isConflict(error) &&
    (conflictSnapshot === null || !readerFeatureStateEqual(conflictSnapshot, snapshot));

   if (canRecoverConflict) {
    conflictSnapshot = snapshot;
    try {
     const recoveredRevision = await recoverConflict();
     if (disposed || operationGeneration !== generation) return;
     revision = recoveredRevision ?? revision;
     flushPendingAfterCompletion = true;
    } catch (recoveryError) {
     if (disposed || operationGeneration !== generation) return;
     onError(
      recoveryError instanceof Error
       ? recoveryError
       : new Error("Không đồng bộ được revision Reader mới nhất."),
     );
    }
   } else {
    if (persistedSnapshot !== null && pendingState !== null) {
     if (readerFeatureStateEqual(pendingState, persistedSnapshot)) pendingState = null;
    }
    onError(error);
   }
  } finally {
   if (activeAbortController === abortController) activeAbortController = null;
   if (disposed || operationGeneration !== generation) return;
   inFlight = false;
   if (
    pendingState !== null &&
    persistedSnapshot !== null &&
    readerFeatureStateEqual(pendingState, persistedSnapshot)
   ) {
    pendingState = null;
   }
   if (flushPendingAfterCompletion && pendingState !== null) queueFlush(0);
  }
 }

 return {
  schedule: (state) => {
   if (disposed) return;
   pendingState = state;
   if (conflictSnapshot !== null && !readerFeatureStateEqual(conflictSnapshot, state)) {
    conflictSnapshot = null;
   }
   if (persistedSnapshot !== null && readerFeatureStateEqual(state, persistedSnapshot)) {
    if (!inFlight) {
     pendingState = null;
     clearTimer();
    }
    return;
   }
   if (!inFlight) queueFlush(delayMs);
  },
  setPersistedSnapshot: (state) => {
   if (disposed || inFlight || pendingState !== null) return;
   persistedSnapshot = state;
  },
  updateRevision: (nextRevision) => {
   if (disposed || inFlight || pendingState !== null) return;
   revision = nextRevision;
  },
  dispose: () => {
   if (disposed) return;
   disposed = true;
   generation += 1;
   clearTimer();
   activeAbortController?.abort();
   activeAbortController = null;
   pendingState = null;
  },
 };
}

export function hasPendingReaderStateChange(
 changeVersion: number,
 persistedChangeVersion: number,
): boolean {
 return changeVersion > persistedChangeVersion;
}

export function moveReaderParagraph(
 state: ReaderSessionState,
 nextIndex: number,
 paragraphCount: number,
): ReaderSessionState {
 if (paragraphCount <= 0) return { ...state, activeParagraphIndex: 0 };
 return {
  ...state,
  activeParagraphIndex: Math.min(paragraphCount - 1, Math.max(0, nextIndex)),
 };
}

export function toggleReaderAutoAdvance(state: ReaderSessionState): ReaderSessionState {
 const autoAdvance = !state.autoAdvance;
 return { ...state, autoAdvance, loopCurrent: autoAdvance ? false : state.loopCurrent };
}

export function toggleReaderLoop(state: ReaderSessionState): ReaderSessionState {
 const loopCurrent = !state.loopCurrent;
 return { ...state, loopCurrent, autoAdvance: loopCurrent ? false : state.autoAdvance };
}

export function resolveReaderPlaybackEnd(
 state: ReaderSessionState,
 paragraphCount: number,
): ReaderSessionState {
 if (state.loopCurrent || paragraphCount <= 0) return state;
 if (state.autoAdvance && state.activeParagraphIndex < paragraphCount - 1) {
  return moveReaderParagraph(state, state.activeParagraphIndex + 1, paragraphCount);
 }
 return { ...state, completed: true };
}

export function setReaderAnswer(
 state: ReaderSessionState,
 answerId: string,
 answer: string,
): ReaderSessionState {
 return {
  ...state,
  answers: {
   ...state.answers,
   [answerId]: { answer, score: null, completed: false, responseMs: null },
  },
 };
}
