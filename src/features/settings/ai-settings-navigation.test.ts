import { describe, expect, it } from "vitest";

import { resolveAiSettingsPanel } from "./ai-settings-navigation";

describe("resolveAiSettingsPanel", () => {
 it("keeps supported AI settings panels addressable", () => {
  expect(resolveAiSettingsPanel("conversation")).toBe("conversation");
  expect(resolveAiSettingsPanel("daily-reading")).toBe("daily-reading");
  expect(resolveAiSettingsPanel("providers")).toBe("providers");
  expect(resolveAiSettingsPanel("usage")).toBe("usage");
  expect(resolveAiSettingsPanel("advanced")).toBe("advanced");
 });

 it("uses conversation for missing or invalid panel values", () => {
  expect(resolveAiSettingsPanel(undefined)).toBe("conversation");
  expect(resolveAiSettingsPanel("reader")).toBe("conversation");
 });
});
