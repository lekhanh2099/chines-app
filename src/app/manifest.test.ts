import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
 it("returns valid PWA manifest properties", () => {
  const result = manifest();
  expect(result.name).toBe("HanziHome — Chinese Learning Workspace");
  expect(result.short_name).toBe("HanziHome");
  expect(result.display).toBe("standalone");
  expect(result.start_url).toBe("/");
  expect(result.theme_color).toBe("#0f172a");
  expect(result.icons?.length).toBeGreaterThan(0);
 });
});
