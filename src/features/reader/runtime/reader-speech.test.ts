import { describe, expect, it, vi } from "vitest";

import { readerSpeechProgressSchema, readerSpeechServiceSchema } from "./reader-speech";

const input = { segmentId: "paragraph-1", text: "你好。", startOffset: 0, rate: 1 };

describe("reader speech service contract", () => {
 it.each([
  { completed: true, cancelled: false },
  { completed: false, cancelled: true },
 ])("accepts a terminal result: %o", async (result) => {
  const service = readerSpeechServiceSchema.parse({
   speak: async () => result,
   stop: vi.fn(),
  });
  await expect(service.speak(input)).resolves.toEqual(result);
 });

 it("keeps the request pending until the service settles", async () => {
  const finish = { complete: () => {} };
  const service = readerSpeechServiceSchema.parse({
   speak: () =>
    new Promise<{ completed: boolean; cancelled: boolean }>((resolve) => {
     finish.complete = () => resolve({ completed: true, cancelled: false });
    }),
   stop: vi.fn(),
  });
  const settled = vi.fn();
  const pending = service.speak(input).then(settled);
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  finish.complete();
  await pending;
  expect(settled).toHaveBeenCalledOnce();
 });

 it.each([
  { completed: false, cancelled: false },
  { completed: true, cancelled: true },
 ])("rejects an ambiguous terminal result: %o", async (result) => {
  const service = readerSpeechServiceSchema.parse({
   speak: async () => result,
   stop: vi.fn(),
  });
  await expect(service.speak(input)).rejects.toThrow();
 });

 it("propagates audio failure rather than reporting completion", async () => {
  const failure = new Error("Audio failed");
  const service = readerSpeechServiceSchema.parse({
   speak: async () => {
    throw failure;
   },
   stop: vi.fn(),
  });
  await expect(service.speak(input)).rejects.toBe(failure);
 });

 it("rejects invalid input before invoking speech", async () => {
  const speak = vi.fn(async () => ({ completed: true, cancelled: false }));
  const service = readerSpeechServiceSchema.parse({ speak, stop: vi.fn() });
  await expect(service.speak({ ...input, startOffset: -1 })).rejects.toThrow();
  expect(speak).not.toHaveBeenCalled();
 });

 it("rejects invalid progress and character offsets", () => {
  expect(readerSpeechProgressSchema.safeParse({ progress: 2 }).success).toBe(false);
  expect(readerSpeechProgressSchema.safeParse({ progress: 0.5, charIndex: -1 }).success).toBe(
   false,
  );
 });
});
