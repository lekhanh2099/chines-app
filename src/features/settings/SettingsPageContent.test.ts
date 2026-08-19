import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", () => ({
 useRouter: () => ({ push: vi.fn() }),
}));

import { resolveSettingsSection } from "./SettingsPageContent";

describe("resolveSettingsSection", () => {
 it("keeps supported Settings hub sections addressable", () => {
  expect(resolveSettingsSection("app")).toBe("app");
  expect(resolveSettingsSection("reading")).toBe("reading");
  expect(resolveSettingsSection("ai")).toBe("ai");
 });

 it("uses the app section for missing or invalid URL values", () => {
  expect(resolveSettingsSection(undefined)).toBe("app");
  expect(resolveSettingsSection("account")).toBe("app");
 });
});
