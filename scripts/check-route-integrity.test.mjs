import path from "node:path";
import { describe, expect, it } from "vitest";

import { routeFromAppEntrypoint } from "./check-route-integrity.mjs";

describe("routeFromAppEntrypoint", () => {
 it("treats the top-level locale segment as routing infrastructure", () => {
  expect(
   routeFromAppEntrypoint(
    path.resolve("src/app/[locale]/(app)/settings/page.tsx"),
   ),
  ).toBe("/settings");
 });

 it("keeps unlocalized infrastructure routes unchanged", () => {
  expect(routeFromAppEntrypoint(path.resolve("src/app/api/learning-state/route.ts"))).toBe(
   "/api/learning-state",
  );
  expect(routeFromAppEntrypoint(path.resolve("src/app/auth/callback/route.ts"))).toBe(
   "/auth/callback",
  );
 });
});
