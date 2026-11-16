import { execFileSync } from "node:child_process";

import { expect, it } from "vitest";

it("keeps the generated radical data in sync with the notes in docs/radicals", () => {
 expect(() =>
  execFileSync("node", ["scripts/build-radical-characters.mjs", "--check"], { stdio: "pipe" }),
 ).not.toThrow();
});
