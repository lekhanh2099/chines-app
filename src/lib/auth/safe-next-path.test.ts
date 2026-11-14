import { describe, expect, it } from "vitest";

import { getSafeNextPath } from "./safe-next-path";

describe("getSafeNextPath", () => {
 it.each([null, undefined, "", "https://evil.example", "//evil.example", "javascript:alert(1)"])(
  "falls back to home for unsafe destination %s",
  (value) => {
   expect(getSafeNextPath(value)).toBe("/");
  },
 );

 it.each(["/", "/hanzihome", "/settings?tab=profile", "/vi/reader#section-2"])(
  "keeps same-origin path %s",
  (value) => {
   expect(getSafeNextPath(value)).toBe(value);
  },
 );

 // Each value passes a naive "starts with / but not //" check, yet the WHATWG
 // parser used by the redirect routes resolves it to a foreign host.
 it.each([
  "/\\evil.example",
  "/\t/evil.example",
  "/\n/evil.example",
  "/\r/evil.example",
  "/\\/evil",
  "/.//evil.example",
  "/..//evil.example",
  "/%2e//evil.example",
  "/a/..//evil.example",
 ])("rejects parser-normalized external destination %j", (value) => {
  const next = getSafeNextPath(value);
  expect(next).toBe("/");
  expect(new URL(next, "https://app.example").origin).toBe("https://app.example");
 });

 it("keeps encoded separators on the same origin", () => {
  const next = getSafeNextPath("/%5Cevil.example");
  expect(new URL(next, "https://app.example").origin).toBe("https://app.example");
 });
});
