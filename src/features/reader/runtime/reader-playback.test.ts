import { describe, expect, it, vi } from "vitest";

import { cookReaderData } from "../model/cook-reader-data";
import { createReaderPlayback } from "./reader-playback";
import type { ReaderSpeechService } from "./reader-speech";
import { createReaderStore } from "./reader-store";

function setup() {
 const pending: {
  input: Parameters<ReaderSpeechService["speak"]>[0];
  resolve: (result: Awaited<ReturnType<ReaderSpeechService["speak"]>>) => void;
  reject: (error: Error) => void;
 }[] = [];
 const speech: ReaderSpeechService = {
  speak: vi.fn<ReaderSpeechService["speak"]>(
   (input) => new Promise((resolve, reject) => pending.push({ input, resolve, reject })),
  ),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  setRate: vi.fn(),
 };
 const content = cookReaderData([
  { id: "a", zh: "你好。", speechText: "您好。" },
  { id: "b", zh: "中国。" },
  { id: "c", zh: "再见。" },
 ]);
 const store = createReaderStore(content);
 const commands = createReaderPlayback(store, speech);
 return { store, commands, speech, pending, content };
}

async function settle() {
 await Promise.resolve();
 await Promise.resolve();
}

describe("Reader speech commands", () => {
 it("ignores invalid character targets and non-finite offsets without interrupting playback", () => {
  const { commands, pending, speech, store } = setup();
  commands.playCurrent();
  commands.playFromCharacter("toString", 0);
  commands.playFromCharacter("missing", 0);
  commands.playFromCharacter("a", Number.NaN);
  commands.playFromCharacter("a", Number.POSITIVE_INFINITY);
  expect(pending).toHaveLength(1);
  expect(speech.stop).not.toHaveBeenCalled();
  expect(store.state.playback).toMatchObject({ segmentId: "a", status: "loading" });
  commands.dispose();
 });
 it("uses source text when character playback begins at offset zero", () => {
  const { commands, pending } = setup();
  commands.playFromCharacter("a", 0);
  expect(pending[0]?.input).toMatchObject({ text: "你好。", startOffset: 0 });
  commands.dispose();
 });
 it("waits for completion before auto advancing and finishes at the last segment", async () => {
  const { commands, pending, store } = setup();
  commands.playAll();
  expect(pending).toHaveLength(1);
  expect(pending[0]?.input).toMatchObject({ segmentId: "a", text: "您好。", startOffset: 0 });
  pending[0]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(pending[1]?.input.segmentId).toBe("b");
  pending[1]?.resolve({ completed: true, cancelled: false });
  await settle();
  pending[2]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(pending).toHaveLength(3);
  expect(store.state.playback.status).toBe("idle");
  expect(store.state.navigation.activeSegmentId).toBe("c");
 });

 it("plays only the current segment when auto advance is disabled", async () => {
  const { commands, pending, store } = setup();
  store.actions.toggleAutoAdvance();
  commands.selectSegment("b");
  commands.playCurrent();
  pending[0]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(pending).toHaveLength(1);
  expect(store.state.playback.status).toBe("idle");
 });

 it("starts from the source character offset, restarts there, and does not advance", async () => {
  const { commands, pending, store } = setup();
  commands.playFromCharacter("a", 1);
  expect(pending[0]?.input).toMatchObject({ text: "你好。", startOffset: 1 });
  commands.restartCurrent();
  expect(pending[1]?.input.startOffset).toBe(1);
  pending[1]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(pending).toHaveLength(2);
  expect(store.state.playback.status).toBe("idle");
 });

 it("synchronizes next/previous and ignores stale progress, completion and errors", async () => {
  const { commands, pending, store } = setup();
  commands.playCurrent();
  commands.next();
  commands.previous();
  expect(pending.map((request) => request.input.segmentId)).toEqual(["a", "b", "a"]);
  pending[0]?.input.onProgress?.({ progress: 0.9 });
  pending[0]?.resolve({ completed: true, cancelled: false });
  pending[1]?.reject(new Error("old request"));
  await settle();
  expect(pending).toHaveLength(3);
  expect(store.state.playback).toMatchObject({ segmentId: "a", progress: 0, error: null });
  pending[2]?.input.onProgress?.({ progress: 0.4 });
  expect(store.state.playback).toMatchObject({ status: "playing", progress: 0.4 });
  store.actions.selectSegment("c", "scroll");
  expect(store.state.navigation.activeSegmentId).toBe("a");
 });

 it("stops and ignores a late successful completion", async () => {
  const { commands, pending, store, speech } = setup();
  commands.playAll();
  commands.stop();
  pending[0]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(speech.stop).toHaveBeenCalledOnce();
  expect(pending).toHaveLength(1);
  expect(store.state.playback.status).toBe("idle");
 });

 it("does not advance cancelled or failed requests", async () => {
  const { commands, pending, store } = setup();
  commands.playAll();
  pending[0]?.resolve({ completed: false, cancelled: true });
  await settle();
  expect(pending).toHaveLength(1);
  commands.playCurrent();
  pending[1]?.reject(new Error("audio unavailable"));
  await settle();
  expect(store.state.playback).toMatchObject({ status: "idle", error: "audio unavailable" });
  expect(pending).toHaveLength(2);
 });

 it("loops one segment and supports rate, pause and resume", async () => {
  const { commands, pending, store, speech } = setup();
  store.actions.toggleLoop();
  commands.setRate(1.5);
  commands.playCurrent();
  expect(pending[0]?.input.rate).toBe(1.5);
  pending[0]?.input.onProgress?.({ progress: 0.1 });
  commands.pause();
  pending[0]?.input.onProgress?.({ progress: 0.2 });
  expect(store.state.playback.status).toBe("paused");
  commands.resume();
  commands.setRate(0.8);
  expect(speech.pause).toHaveBeenCalledOnce();
  expect(speech.resume).toHaveBeenCalledOnce();
  expect(speech.setRate).toHaveBeenCalledWith(0.8);
  pending[0]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(pending[1]?.input).toMatchObject({ segmentId: "a", rate: 0.8 });
  commands.stop();
 });

 it("preserves unchanged playback and cancels removed or changed content", async () => {
  const { commands, pending, store, speech, content } = setup();
  commands.playCurrent();
  commands.replaceContent({ ...content, title: { zh: "Title" } });
  expect(speech.stop).not.toHaveBeenCalled();
  commands.replaceContent({
   ...content,
   segmentsById: { ...content.segmentsById, a: { id: "a", kind: "sentence", zh: "新内容。" } },
  });
  expect(speech.stop).toHaveBeenCalledOnce();
  pending[0]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(store.state.playback.status).toBe("idle");
  expect(pending).toHaveLength(1);
 });

 it("transfers a shared service without letting the old owner stop the new owner", async () => {
  const { commands, speech, content, pending, store } = setup();
  const otherStore = createReaderStore(content);
  const other = createReaderPlayback(otherStore, speech);
  commands.playCurrent();
  other.playCurrent();
  expect(store.state.playback.status).toBe("idle");
  expect(speech.stop).toHaveBeenCalledOnce();
  commands.dispose();
  pending[0]?.resolve({ completed: true, cancelled: false });
  await settle();
  expect(speech.stop).toHaveBeenCalledOnce();
  expect(otherStore.state.playback.status).toBe("loading");
  other.dispose();
 });

 it("allows navigation without speech", () => {
  const { content } = setup();
  const store = createReaderStore(content);
  const commands = createReaderPlayback(store);
  commands.playCurrent();
  commands.next();
  expect(store.state.navigation.activeSegmentId).toBe("b");
  expect(store.state.playback.status).toBe("idle");
 });
});
