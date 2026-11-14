import { describe, expect, it } from "vitest";

import { injectRuntimeStateBridge, isRuntimeStateMessage } from "./html-artifact-runtime-bridge";

describe("HTML artifact runtime bridge", () => {
 it("injects the bridge and restrictive CSP into an existing head", () => {
  const output = injectRuntimeStateBridge(
   "<!doctype html><html><head><title>Lesson</title></head><body></body></html>",
   "artifact-1",
   { score: "8" },
  );

  expect(output).toContain("data-hanzihome-runtime-bridge");
  expect(output).toContain("default-src 'none'");
  expect(output.indexOf("data-hanzihome-runtime-bridge")).toBeLessThan(output.indexOf("<title>"));
 });

 it("wraps fragments and escapes values embedded in the inline script", () => {
  const output = injectRuntimeStateBridge("<main>Practice</main>", "</script>", {
   unsafe: "<script>alert(1)</script>",
  });

  expect(output).toMatch(/^<!doctype html>/);
  expect(output).not.toContain('const artifactId = "</script>"');
  expect(output).toContain("\\u003c/script\\u003e");
 });

 it("accepts only runtime messages with string state values", () => {
  expect(
   isRuntimeStateMessage({
    source: "hanzihome-html-artifact-runtime",
    type: "runtime-state",
    artifactId: "artifact-1",
    state: { answer: "A" },
   }),
  ).toBe(true);
  expect(
   isRuntimeStateMessage({
    source: "hanzihome-html-artifact-runtime",
    type: "runtime-state",
    artifactId: "artifact-1",
    state: { answer: 1 },
   }),
  ).toBe(false);
 });
});
