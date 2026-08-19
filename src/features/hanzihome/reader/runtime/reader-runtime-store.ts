import { createStore } from "@tanstack/react-store";

export type ReaderPlaybackStatus = "idle" | "loading" | "playing" | "paused";
export type ReaderPositionSource = "initial" | "command" | "playback" | "scroll";

export type ReaderRuntimeState = {
 segmentIds: readonly string[];
 activeIndex: number;
 activeSegmentId: string | null;
 positionSource: ReaderPositionSource;
 loopCurrent: boolean;
 autoAdvance: boolean;
 focusMode: boolean;
 playbackSegmentId: string | null;
 playbackStatus: ReaderPlaybackStatus;
 progress: number;
 rate: number;
 error: string | null;
};

type ReaderPlaybackSnapshot = Pick<
 ReaderRuntimeState,
 "playbackSegmentId" | "playbackStatus" | "progress" | "rate" | "error"
>;

type ReaderRuntimeActions = {
 replaceSegments: (segmentIds: readonly string[]) => void;
 selectIndex: (index: number, source?: ReaderPositionSource) => void;
 selectSegment: (segmentId: string, source?: ReaderPositionSource) => void;
 previous: () => void;
 next: () => void;
 toggleLoop: () => void;
 toggleAutoAdvance: () => void;
 toggleFocus: () => void;
 syncPlayback: (snapshot: ReaderPlaybackSnapshot) => void;
 resetPlayback: () => void;
};

function boundedIndex(index: number, segmentCount: number): number {
 if (segmentCount <= 0) return 0;
 return Math.min(Math.max(0, index), segmentCount - 1);
}

function sameStringList(left: readonly string[], right: readonly string[]): boolean {
 return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function createReaderRuntimeStore(initialSegmentIds: readonly string[], initialRate = 1) {
 const segmentIds = [...initialSegmentIds];
 const initialState: ReaderRuntimeState = {
  segmentIds,
  activeIndex: 0,
  activeSegmentId: segmentIds[0] ?? null,
  positionSource: "initial",
  loopCurrent: false,
  autoAdvance: true,
  focusMode: false,
  playbackSegmentId: null,
  playbackStatus: "idle",
  progress: 0,
  rate: initialRate,
  error: null,
 };

 return createStore<ReaderRuntimeState, ReaderRuntimeActions>(initialState, ({ setState }) => ({
  replaceSegments: (nextIds) =>
   setState((state) => {
    const normalizedIds = [...nextIds];
    if (sameStringList(state.segmentIds, normalizedIds)) return state;
    const activeIndex = boundedIndex(state.activeIndex, normalizedIds.length);
    return {
     ...state,
     segmentIds: normalizedIds,
     activeIndex,
     activeSegmentId: normalizedIds[activeIndex] ?? null,
     positionSource: "initial",
     playbackSegmentId:
      state.playbackSegmentId && normalizedIds.includes(state.playbackSegmentId)
       ? state.playbackSegmentId
       : null,
    };
   }),
  selectIndex: (index, source = "command") =>
   setState((state) => {
    if (source === "scroll" && state.playbackStatus !== "idle") return state;
    const activeIndex = boundedIndex(index, state.segmentIds.length);
    const activeSegmentId = state.segmentIds[activeIndex] ?? null;
    if (
     state.activeIndex === activeIndex &&
     state.activeSegmentId === activeSegmentId &&
     state.positionSource === source
    ) {
     return state;
    }
    return { ...state, activeIndex, activeSegmentId, positionSource: source };
   }),
  selectSegment: (segmentId, source = "command") =>
   setState((state) => {
    if (source === "scroll" && state.playbackStatus !== "idle") return state;
    const index = state.segmentIds.indexOf(segmentId);
    if (index < 0) return state;
    if (
     state.activeIndex === index &&
     state.activeSegmentId === segmentId &&
     state.positionSource === source
    ) {
     return state;
    }
    return { ...state, activeIndex: index, activeSegmentId: segmentId, positionSource: source };
   }),
  previous: () =>
   setState((state) => {
    const activeIndex = boundedIndex(state.activeIndex - 1, state.segmentIds.length);
    return {
     ...state,
     activeIndex,
     activeSegmentId: state.segmentIds[activeIndex] ?? null,
     positionSource: "command",
    };
   }),
  next: () =>
   setState((state) => {
    const activeIndex = boundedIndex(state.activeIndex + 1, state.segmentIds.length);
    return {
     ...state,
     activeIndex,
     activeSegmentId: state.segmentIds[activeIndex] ?? null,
     positionSource: "command",
    };
   }),
  toggleLoop: () =>
   setState((state) => ({
    ...state,
    loopCurrent: !state.loopCurrent,
    autoAdvance: state.loopCurrent ? state.autoAdvance : false,
   })),
  toggleAutoAdvance: () =>
   setState((state) => ({
    ...state,
    autoAdvance: !state.autoAdvance,
    loopCurrent: state.autoAdvance ? state.loopCurrent : false,
   })),
  toggleFocus: () => setState((state) => ({ ...state, focusMode: !state.focusMode })),
  syncPlayback: (snapshot) =>
   setState((state) => {
    const progress = Math.min(1, Math.max(0, snapshot.progress));
    if (
     state.playbackSegmentId === snapshot.playbackSegmentId &&
     state.playbackStatus === snapshot.playbackStatus &&
     state.progress === progress &&
     state.rate === snapshot.rate &&
     state.error === snapshot.error
    ) {
     return state;
    }
    return { ...state, ...snapshot, progress };
   }),
  resetPlayback: () =>
   setState((state) =>
    state.playbackStatus === "idle" &&
    state.playbackSegmentId === null &&
    state.progress === 0 &&
    state.error === null
     ? state
     : {
        ...state,
        playbackSegmentId: null,
        playbackStatus: "idle",
        progress: 0,
        error: null,
       },
   ),
 }));
}

export type ReaderRuntimeStore = ReturnType<typeof createReaderRuntimeStore>;
