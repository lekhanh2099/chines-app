import { describe, expect, it } from "vitest";

import { resolveAiSettingsPanel } from "./ai-settings-navigation";

describe("resolveAiSettingsPanel", () => {
 it("keeps supported AI settings panels addressable", () => {
  expect(resolveAiSettingsPanel("tasks")).toBe("tasks");
  expect(resolveAiSettingsPanel("conversation")).toBe("conversation");
  expect(resolveAiSettingsPanel("daily-reading")).toBe("daily-reading");
  expect(resolveAiSettingsPanel("providers")).toBe("providers");
  expect(resolveAiSettingsPanel("usage")).toBe("usage");
  expect(resolveAiSettingsPanel("advanced")).toBe("tasks");
 });

 it("uses task routing for missing or invalid panel values", () => {
  expect(resolveAiSettingsPanel(undefined)).toBe("tasks");
  expect(resolveAiSettingsPanel("reader")).toBe("tasks");
 });
});
