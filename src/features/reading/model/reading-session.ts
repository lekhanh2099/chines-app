import { z } from "zod";

import {
 readerFeatureStateSchema,
 type ReaderProgressRow,
} from "@/features/reading/model/reading-progress.schemas";

export type ReaderFeatureState = z.output<typeof readerFeatureStateSchema>;

// Compatibility for DailyReadingWorkspace; playback/navigation no longer belong to this type.
export type ReaderSessionState = ReaderFeatureState;

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

export function readerFeatureStateEqual(
 left: ReaderFeatureState,
 right: ReaderFeatureState,
): boolean {
 if (left.completed !== right.completed) return false;

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
