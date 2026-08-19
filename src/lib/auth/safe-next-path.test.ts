import { describe, expect, it } from "vitest";

import { getSafeNextPath } from "./safe-next-path";

describe("getSafeNextPath", () => {
 it.each([null, undefined, "", "https://evil.example", "//evil.example", "javascript:alert(1)"])(
  "falls back to home for unsafe destination %s",
  (value) => {
   expect(getSafeNextPath(value)).toBe("/");
  },
 );

 it.each(["/", "/hanzihome", "/settings?tab=profile"])("keeps same-origin path %s", (value) => {
  expect(getSafeNextPath(value)).toBe(value);
 });
});
