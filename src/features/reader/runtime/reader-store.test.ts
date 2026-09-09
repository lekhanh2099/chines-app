import { describe, expect, it } from "vitest";

import { createReaderStore } from "./reader-store";
import { cookReaderData } from "../model/cook-reader-data";
import { selectSegmentIsActive, selectPlaybackProgress } from "./reader-selectors";
import { createStore } from "@tanstack/react-store";

describe("normalized Reader store", () => {
 const content = cookReaderData(["一。", "二。", "三。", "四。"]);
 it("bounds index navigation and preserves active identity after a reorder", () => {
  const store = createReaderStore(content);
  store.actions.next();
  const active = store.state.navigation.activeSegmentId;
  store.actions.replaceContent({ ...content, segmentIds: [...content.segmentIds].reverse() });
  expect(store.state.navigation).toMatchObject({ activeSegmentId: active, activeIndex: 2 });
  store.actions.previous();
  expect(store.state.navigation.activeIndex).toBe(1);
  store.actions.selectIndex(99);
  expect(store.state.navigation.activeIndex).toBe(3);
  store.actions.selectIndex(-1);
  expect(store.state.navigation.activeIndex).toBe(0);
 });
 it("clears removed playback, bounds removed active position and resets a new document", () => {
  const store = createReaderStore(content);
  store.actions.selectIndex(3);
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: store.state.navigation.activeSegmentId,
   status: "playing",
   progress: 0.5,
  });
  store.actions.toggleLoop();
  store.actions.replaceContent({ ...content, segmentIds: [], segmentsById: {} });
  expect(store.state.navigation).toMatchObject({ activeIndex: 0, activeSegmentId: null });
  expect(store.state.playback).toMatchObject({
   segmentId: null,
   status: "idle",
   progress: 0,
   loopCurrent: true,
  });
  store.actions.openOutline();
  store.actions.replaceContent({ ...content, id: "different" });
  expect(store.state.navigation.activeIndex).toBe(0);
  expect(store.state.ui.outlineOpen).toBe(false);
  expect(store.state.playback.loopCurrent).toBe(false);
 });
 it("keeps unrelated selector subscribers quiet", () => {
  const store = createReaderStore(content);
  const activeUpdates = [0, 0, 0, 0];
  const progressUpdates = [0, 0, 0, 0];
  const subscriptions = content.segmentIds.flatMap((id, index) => {
   const active = createStore(() => selectSegmentIsActive(id)(store.get()));
   const progress = createStore(() => selectPlaybackProgress(id)(store.get()));
   return [
    active.subscribe(() => {
     activeUpdates[index] = (activeUpdates[index] ?? 0) + 1;
    }),
    progress.subscribe(() => {
     progressUpdates[index] = (progressUpdates[index] ?? 0) + 1;
    }),
   ];
  });
  store.actions.selectIndex(1);
  expect(activeUpdates).toEqual([1, 1, 0, 0]);
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: store.state.navigation.activeSegmentId,
   status: "playing",
   progress: 0.5,
  });
  expect(progressUpdates).toEqual([0, 1, 0, 0]);
  expect(activeUpdates).toEqual([1, 1, 0, 0]);
  for (const subscription of subscriptions) subscription.unsubscribe();
 });
});

describe("unified reader runtime store", () => {
 it("keeps active position bounded and stable across source updates", () => {
  const store = createReaderStore(
   cookReaderData(["a", "b", "c"].map((id) => ({ id, zh: "一二三四五" }))),
  );
  store.actions.selectIndex(99);
  expect(store.state.navigation.activeIndex).toBe(2);
  expect(store.state.navigation.activeSegmentId).toBe("c");

  store.actions.replaceContent({
   ...cookReaderData(["a", "b"].map((id) => ({ id, zh: "一二三四五" }))),
   id: store.state.content.id,
  });
  expect(store.state.navigation.activeIndex).toBe(1);
  expect(store.state.navigation.activeSegmentId).toBe("b");
 });

 it("auto-advances by default and keeps loop mutually exclusive", () => {
  const store = createReaderStore(
   cookReaderData(["a", "b"].map((id) => ({ id, zh: "一二三四五" }))),
  );
  expect(store.state.playback.autoAdvance).toBe(true);
  expect(store.state.playback.loopCurrent).toBe(false);

  store.actions.toggleLoop();
  expect(store.state.playback.loopCurrent).toBe(true);
  expect(store.state.playback.autoAdvance).toBe(false);

  store.actions.toggleAutoAdvance();
  expect(store.state.playback.autoAdvance).toBe(true);
  expect(store.state.playback.loopCurrent).toBe(false);
 });

 it("does not let passive scroll tracking steal the position during playback", () => {
  const store = createReaderStore(
   cookReaderData(["a", "b"].map((id) => ({ id, zh: "一二三四五" }))),
  );
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: "a",
   status: "playing",
   progress: 0.3,
   rate: 1,
   error: null,
  });
  store.actions.selectIndex(1, "scroll");

  expect(store.state.navigation.activeSegmentId).toBe("a");
  expect(store.state.navigation.positionSource).toBe("initial");
 });

 it("publishes high-frequency progress without changing unrelated position state", () => {
  const store = createReaderStore(
   cookReaderData(["a", "b"].map((id) => ({ id, zh: "一二三四五" }))),
  );
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: "a",
   status: "playing",
   progress: 0.25,
   rate: 1,
   error: null,
  });
  const positionBeforeProgress = {
   activeIndex: store.state.navigation.activeIndex,
   activeSegmentId: store.state.navigation.activeSegmentId,
   positionSource: store.state.navigation.positionSource,
  };
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: "a",
   status: "playing",
   progress: 0.75,
   rate: 1,
   error: null,
  });

  expect(store.state.playback.progress).toBe(0.75);
  expect({
   activeIndex: store.state.navigation.activeIndex,
   activeSegmentId: store.state.navigation.activeSegmentId,
   positionSource: store.state.navigation.positionSource,
  }).toEqual(positionBeforeProgress);
 });

 it("preserves a character playback offset across progress ticks and clears it on stop", () => {
  const store = createReaderStore(cookReaderData(["a"].map((id) => ({ id, zh: "一二三四五" }))));
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: "a",
   status: "playing",
   startOffset: 4,
   progress: 0.1,
   rate: 1,
   error: null,
  });
  store.actions.syncPlayback({
   ...store.state.playback,
   segmentId: "a",
   status: "playing",
   progress: 0.6,
   rate: 1,
   error: null,
  });

  expect(store.state.playback.startOffset).toBe(4);
  expect(store.state.playback.progress).toBe(0.6);

  store.actions.resetPlayback();
  expect(store.state.playback.startOffset).toBe(0);
 });
});
