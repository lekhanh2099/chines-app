import { describe, expect, it } from "vitest";

import { createReaderRuntimeStore } from "./reader-runtime-store";

describe("unified reader runtime store", () => {
 it("keeps active position bounded and stable across source updates", () => {
  const store = createReaderRuntimeStore(["a", "b", "c"]);
  store.actions.selectIndex(99);
  expect(store.state.activeIndex).toBe(2);
  expect(store.state.activeSegmentId).toBe("c");

  store.actions.replaceSegments(["a", "b"]);
  expect(store.state.activeIndex).toBe(1);
  expect(store.state.activeSegmentId).toBe("b");
 });

 it("auto-advances by default and keeps loop mutually exclusive", () => {
  const store = createReaderRuntimeStore(["a", "b"]);
  expect(store.state.autoAdvance).toBe(true);
  expect(store.state.loopCurrent).toBe(false);

  store.actions.toggleLoop();
  expect(store.state.loopCurrent).toBe(true);
  expect(store.state.autoAdvance).toBe(false);

  store.actions.toggleAutoAdvance();
  expect(store.state.autoAdvance).toBe(true);
  expect(store.state.loopCurrent).toBe(false);
 });

 it("does not let passive scroll tracking steal the position during playback", () => {
  const store = createReaderRuntimeStore(["a", "b"]);
  store.actions.syncPlayback({
   playbackSegmentId: "a",
   playbackStatus: "playing",
   progress: 0.3,
   rate: 1,
   error: null,
  });
  store.actions.selectIndex(1, "scroll");

  expect(store.state.activeSegmentId).toBe("a");
  expect(store.state.positionSource).toBe("initial");
 });

 it("publishes high-frequency progress without changing unrelated position state", () => {
  const store = createReaderRuntimeStore(["a", "b"]);
  store.actions.syncPlayback({
   playbackSegmentId: "a",
   playbackStatus: "playing",
   progress: 0.25,
   rate: 1,
   error: null,
  });
  const positionBeforeProgress = {
   activeIndex: store.state.activeIndex,
   activeSegmentId: store.state.activeSegmentId,
   positionSource: store.state.positionSource,
  };
  store.actions.syncPlayback({
   playbackSegmentId: "a",
   playbackStatus: "playing",
   progress: 0.75,
   rate: 1,
   error: null,
  });

  expect(store.state.progress).toBe(0.75);
  expect({
   activeIndex: store.state.activeIndex,
   activeSegmentId: store.state.activeSegmentId,
   positionSource: store.state.positionSource,
  }).toEqual(positionBeforeProgress);
 });
});
