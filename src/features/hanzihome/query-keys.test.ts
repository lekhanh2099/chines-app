import { describe, expect, it } from "vitest";

import { hanzihomeQueryKeys } from "./query-keys";

describe("hanzihomeQueryKeys", () => {
 it("keeps catalog variants below the catalog root", () => {
  expect(hanzihomeQueryKeys.catalog(false)).toEqual([
   ...hanzihomeQueryKeys.catalogRoot,
   { includeLessons: false, includeRadicals: false },
  ]);
 });
});
