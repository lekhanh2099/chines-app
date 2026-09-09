import { createStore } from "@tanstack/react-store";
import type { ReaderContentState, ReaderState } from "../model/reader.schemas";

export function createReaderStore(content: ReaderContentState) {
 const initial: ReaderState = {
  content,
  navigation: {
   activeIndex: 0,
   activeSegmentId: content.segmentIds[0] ?? null,
   positionSource: "initial",
  },
  playback: {
   segmentId: null,
   status: "idle",
   startOffset: 0,
   progress: 0,
   rate: 1,
   loopCurrent: false,
   autoAdvance: true,
   error: null,
  },
  ui: { outlineOpen: false, focusMode: false },
 };
 return createStore(initial, ({ setState, get }) => {
  const selectIndex = (
   index: number,
   source: ReaderState["navigation"]["positionSource"] = "command",
  ) =>
   setState((state) => {
    if (!Number.isFinite(index) || (source === "scroll" && state.playback.status !== "idle"))
     return state;
    const activeIndex = boundedIndex(Math.trunc(index), state.content.segmentIds.length);
    const activeSegmentId = state.content.segmentIds[activeIndex] ?? null;
    if (
     state.navigation.activeSegmentId === activeSegmentId &&
     state.navigation.positionSource === source
    )
     return state;
    return { ...state, navigation: { activeIndex, activeSegmentId, positionSource: source } };
   });
  return {
   replaceContent: (next: ReaderContentState) =>
    setState((state) => {
     if (state.content === next) return state;
     const same = next.id === state.content.id;
     const id = state.navigation.activeSegmentId;
     const index = same && id !== null ? next.segmentIds.indexOf(id) : -1;
     const activeIndex =
      index >= 0
       ? index
       : same
         ? Math.min(state.navigation.activeIndex, Math.max(0, next.segmentIds.length - 1))
         : 0;
     const playing = state.playback.segmentId;
     const oldSegment = playing === null ? undefined : state.content.segmentsById[playing];
     const newSegment = playing === null ? undefined : next.segmentsById[playing];
     const preserve =
      same &&
      oldSegment !== undefined &&
      newSegment !== undefined &&
      oldSegment.zh === newSegment.zh &&
      oldSegment.speechText === newSegment.speechText;
     return {
      content: next,
      navigation: {
       activeIndex,
       activeSegmentId: next.segmentIds[activeIndex] ?? null,
       positionSource: same ? state.navigation.positionSource : initial.navigation.positionSource,
      },
      playback: preserve
       ? state.playback
       : {
          ...initial.playback,
          rate: state.playback.rate,
          loopCurrent: same ? state.playback.loopCurrent : initial.playback.loopCurrent,
          autoAdvance: same ? state.playback.autoAdvance : initial.playback.autoAdvance,
         },
      ui: same ? state.ui : initial.ui,
     };
    }),
   selectIndex,
   previous: () => selectIndex(get().navigation.activeIndex - 1),
   next: () => selectIndex(get().navigation.activeIndex + 1),
   openOutline: () =>
    setState((state) =>
     state.ui.outlineOpen ? state : { ...state, ui: { ...state.ui, outlineOpen: true } },
    ),
   closeOutline: () =>
    setState((state) =>
     !state.ui.outlineOpen ? state : { ...state, ui: { ...state.ui, outlineOpen: false } },
    ),
   setRate: (rate: number) =>
    setState((state) =>
     !Number.isFinite(rate) || rate <= 0 || rate === state.playback.rate
      ? state
      : { ...state, playback: { ...state.playback, rate } },
    ),
   selectSegment: (id: string, source: ReaderState["navigation"]["positionSource"] = "command") =>
    setState((state) => {
     const index = state.content.segmentIds.indexOf(id);
     if (index < 0 || (source === "scroll" && state.playback.status !== "idle")) return state;
     if (state.navigation.activeSegmentId === id && state.navigation.positionSource === source)
      return state;
     return {
      ...state,
      navigation: { activeIndex: index, activeSegmentId: id, positionSource: source },
     };
    }),
   setOutlineOpen: (outlineOpen: boolean) =>
    setState((state) => ({ ...state, ui: { ...state.ui, outlineOpen } })),
   toggleFocus: () =>
    setState((state) => ({ ...state, ui: { ...state.ui, focusMode: !state.ui.focusMode } })),
   toggleLoop: () =>
    setState((state) => ({
     ...state,
     playback: {
      ...state.playback,
      loopCurrent: !state.playback.loopCurrent,
      autoAdvance: state.playback.loopCurrent ? state.playback.autoAdvance : false,
     },
    })),
   toggleAutoAdvance: () =>
    setState((state) => ({
     ...state,
     playback: {
      ...state.playback,
      autoAdvance: !state.playback.autoAdvance,
      loopCurrent: state.playback.autoAdvance ? state.playback.loopCurrent : false,
     },
    })),
   syncPlayback: (playback: ReaderState["playback"]) =>
    setState((state) => ({ ...state, playback })),
   resetPlayback: () =>
    setState((state) => ({
     ...state,
     playback: {
      ...initial.playback,
      rate: state.playback.rate,
      loopCurrent: state.playback.loopCurrent,
      autoAdvance: state.playback.autoAdvance,
     },
    })),
  };
 });
}
export type ReaderStore = ReturnType<typeof createReaderStore>;

function boundedIndex(index: number, segmentCount: number): number {
 if (segmentCount <= 0) return 0;
 return Math.min(Math.max(0, index), segmentCount - 1);
}
