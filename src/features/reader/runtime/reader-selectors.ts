import type { ReaderState } from "../model/reader.schemas";

export const selectSegment = (id: string) => (state: ReaderState) => state.content.segmentsById[id];
export const selectSegmentIsActive = (id: string) => (state: ReaderState) =>
 state.navigation.activeSegmentId === id;
export const selectPlaybackStatus = (id: string) => (state: ReaderState) =>
 state.playback.segmentId === id ? state.playback.status : "idle";
export const selectPlaybackProgress = (id: string) => (state: ReaderState) =>
 state.playback.segmentId === id ? state.playback.progress : 0;
export const selectPlaybackStartOffset = (id: string) => (state: ReaderState) =>
 state.playback.segmentId === id ? state.playback.startOffset : 0;
