"use client";

import { createStore, useSelector } from "@tanstack/react-store";
import { createContext, useContext, useState, type ReactNode } from "react";

import type { PronunciationOverride } from "@/features/hanzihome/pronunciation/contextual-pronunciation";

export type ReaderPronunciationSessionInput = {
 text: string;
 readings: readonly string[];
 start: number;
 end: number;
};

type ReaderPronunciationSessionState = {
 overridesBySegmentId: ReadonlyMap<string, readonly PronunciationOverride[]>;
};

type ReaderPronunciationSessionActions = {
 upsert: (segmentId: string, sentenceText: string, input: ReaderPronunciationSessionInput) => void;
 remove: (segmentId: string, start: number, end: number) => void;
};

const EMPTY_OVERRIDES: readonly PronunciationOverride[] = [];

function createReaderPronunciationSessionStore() {
 return createStore<ReaderPronunciationSessionState, ReaderPronunciationSessionActions>(
  { overridesBySegmentId: new Map() },
  ({ setState }) => ({
   upsert: (segmentId, sentenceText, input) =>
    setState((state) => {
     const currentSegmentOverrides = state.overridesBySegmentId.get(segmentId) ?? EMPTY_OVERRIDES;
     const nextOverride: PronunciationOverride = {
      id: `local:${segmentId}:${input.start}:${input.end}`,
      text: input.text,
      readings: [...input.readings],
      scope: "sentence-instance",
      sentenceText,
      start: input.start,
      end: input.end,
      updatedAt: new Date().toISOString(),
     };
     const nextSegmentOverrides = [
      ...currentSegmentOverrides.filter(
       (override) =>
        override.scope !== "sentence-instance" ||
        override.start !== input.start ||
        override.end !== input.end,
      ),
      nextOverride,
     ];
     const overridesBySegmentId = new Map(state.overridesBySegmentId);
     overridesBySegmentId.set(segmentId, nextSegmentOverrides);
     return { overridesBySegmentId };
    }),
   remove: (segmentId, start, end) =>
    setState((state) => {
     const currentSegmentOverrides = state.overridesBySegmentId.get(segmentId);
     if (!currentSegmentOverrides) return state;
     const nextSegmentOverrides = currentSegmentOverrides.filter(
      (override) =>
       override.scope !== "sentence-instance" || override.start !== start || override.end !== end,
     );
     if (nextSegmentOverrides.length === currentSegmentOverrides.length) return state;
     const overridesBySegmentId = new Map(state.overridesBySegmentId);
     if (nextSegmentOverrides.length > 0) overridesBySegmentId.set(segmentId, nextSegmentOverrides);
     else overridesBySegmentId.delete(segmentId);
     return { overridesBySegmentId };
    }),
  }),
 );
}

type ReaderPronunciationSessionStore = ReturnType<typeof createReaderPronunciationSessionStore>;
const ReaderPronunciationSessionContext = createContext<ReaderPronunciationSessionStore | null>(null);

export function ReaderPronunciationSessionProvider({ children }: { children: ReactNode }) {
 const [store] = useState(createReaderPronunciationSessionStore);
 return (
  <ReaderPronunciationSessionContext.Provider value={store}>
   {children}
  </ReaderPronunciationSessionContext.Provider>
 );
}

function useReaderPronunciationSessionStore() {
 const store = useContext(ReaderPronunciationSessionContext);
 if (!store) throw new Error("Reader pronunciation hooks require ReaderPronunciationSessionProvider");
 return store;
}

export function useReaderPronunciationSessionOverrides(segmentId: string) {
 return useSelector(
  useReaderPronunciationSessionStore(),
  (state) => state.overridesBySegmentId.get(segmentId) ?? EMPTY_OVERRIDES,
 );
}

export function useReaderPronunciationSessionActions() {
 return useReaderPronunciationSessionStore().actions;
}
