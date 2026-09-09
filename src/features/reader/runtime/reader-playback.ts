import type { ReaderContentState } from "../model/reader.schemas";
import type { ReaderStore } from "./reader-store";
import {
 readerSpeechInputSchema,
 readerSpeechResultSchema,
 type ReaderSpeechService,
} from "./reader-speech";

// A shared transport has one owner. A former owner cannot stop its successor.
const owners = new WeakMap<ReaderSpeechService, () => void>();

export function createReaderPlayback(store: ReaderStore, speech?: ReaderSpeechService) {
 let run = 0;
 let continuous = false;
 let characterStart = false;
 const reset = () => {
  run += 1;
  store.actions.resetPlayback();
 };
 const owns = () => speech !== undefined && owners.get(speech) === reset;
 const stop = () => {
  reset();
  if (speech && owns()) {
   owners.delete(speech);
   speech.stop();
  }
 };
 const play = async (id: string, offset: number, token: number): Promise<void> => {
  const segment = store.state.content.segmentsById[id];
  if (!speech || !segment || token !== run || !owns()) return;
  store.actions.selectSegment(id, "playback");
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: id,
   startOffset: offset,
   status: "loading",
   progress: 0,
   error: null,
  });
  try {
   const input = readerSpeechInputSchema.parse({
    segmentId: id,
    text: characterStart || offset > 0 ? segment.zh : (segment.speechText ?? segment.zh),
    startOffset: offset,
    rate: store.state.playback.rate,
    onProgress: (
     snapshot: Parameters<
      NonNullable<Parameters<ReaderSpeechService["speak"]>[0]["onProgress"]>
     >[0],
    ) => {
     if (token !== run || !owns()) return;
     store.actions.syncPlayback({
      ...store.state.playback,
      status: store.state.playback.status === "paused" ? "paused" : "playing",
      progress: snapshot.progress,
     });
    },
   });
   const result = readerSpeechResultSchema.parse(await speech.speak(input));
   if (token !== run || !owns()) return;
   if (result.cancelled) {
    stop();
    return;
   }
   if (store.state.playback.loopCurrent) {
    await play(id, offset, token);
    return;
   }
   const nextId = store.state.content.segmentIds[store.state.content.segmentIds.indexOf(id) + 1];
   if (nextId && !characterStart && (continuous || store.state.playback.autoAdvance)) {
    await play(nextId, 0, token);
   } else {
    owners.delete(speech);
    reset();
   }
  } catch (error) {
   if (token !== run || !owns()) return;
   stop();
   store.actions.syncPlayback({
    ...store.state.playback,
    error: error instanceof Error ? error.message : "Speech failed",
   });
  }
 };
 const start = (id: string, offset: number, all: boolean, fromCharacter: boolean) => {
  if (!Number.isFinite(offset) || !store.state.content.segmentIds.includes(id)) return;
  const segment = store.state.content.segmentsById[id];
  if (!speech || !segment) return;
  stop();
  const previousOwner = owners.get(speech);
  if (previousOwner) {
   previousOwner();
   owners.delete(speech);
   speech.stop();
  }
  owners.set(speech, reset);
  continuous = all;
  characterStart = fromCharacter;
  const bounded = Math.min(Math.max(0, Math.trunc(offset)), segment.zh.length);
  if (bounded === segment.zh.length) {
   stop();
   return;
  }
  void play(id, bounded, run);
 };
 const selectSegment = (id: string) => {
  if (!store.state.content.segmentIds.includes(id)) return;
  if (owns() && store.state.playback.status !== "idle") start(id, 0, continuous, characterStart);
  else store.actions.selectSegment(id);
 };
 return {
  playCurrent: () => {
   const id = store.state.navigation.activeSegmentId;
   if (id) start(id, 0, false, false);
  },
  playAll: () => {
   const id = store.state.content.segmentIds[0];
   if (id) start(id, 0, true, false);
  },
  playFromCharacter: (id: string, offset: number) => start(id, offset, false, true),
  selectSegment,
  previous: () => {
   const id = store.state.content.segmentIds[Math.max(0, store.state.navigation.activeIndex - 1)];
   if (id) selectSegment(id);
  },
  next: () => {
   const id =
    store.state.content.segmentIds[
     Math.min(store.state.content.segmentIds.length - 1, store.state.navigation.activeIndex + 1)
    ];
   if (id) selectSegment(id);
  },
  stop,
  pause: () => {
   if (owns() && speech?.pause && store.state.playback.status === "playing") {
    speech.pause();
    store.actions.syncPlayback({ ...store.state.playback, status: "paused" });
   }
  },
  resume: () => {
   if (owns() && speech?.resume && store.state.playback.status === "paused") {
    speech.resume();
    store.actions.syncPlayback({ ...store.state.playback, status: "playing" });
   }
  },
  restartCurrent: () => {
   const id = store.state.navigation.activeSegmentId;
   if (id) start(id, store.state.playback.startOffset, continuous, characterStart);
  },
  setRate: (rate: number) => {
   if (!Number.isFinite(rate) || rate <= 0) return;
   if (owns()) speech?.setRate?.(rate);
   store.actions.syncPlayback({ ...store.state.playback, rate });
  },
  replaceContent: (content: ReaderContentState) => {
   const id = store.state.playback.segmentId;
   const oldSegment = id === null ? undefined : store.state.content.segmentsById[id];
   const nextSegment = id === null ? undefined : content.segmentsById[id];
   if (
    store.state.content.id !== content.id ||
    oldSegment?.zh !== nextSegment?.zh ||
    oldSegment?.speechText !== nextSegment?.speechText
   )
    stop();
   store.actions.replaceContent(content);
  },
  dispose: stop,
 };
}
export type ReaderCommands = ReturnType<typeof createReaderPlayback>;
