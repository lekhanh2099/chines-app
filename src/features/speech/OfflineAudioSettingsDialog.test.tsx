import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfflineAudioSettingsDialog } from "./OfflineAudioSettingsDialog";
import { STANDARD_MANDARIN_VOICES } from "./mandarin-voices";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";

describe("OfflineAudioSettingsDialog", () => {
 const lesson = getTextbookLesson("nhip-cau", 4);

 it("renders the trigger button with offline speech label", () => {
  const html = renderToStaticMarkup(
   createElement(OfflineAudioSettingsDialog, {
    lesson,
   }),
  );

  expect(html).toContain("Offline &amp; Giọng đọc");
 });

 it("renders custom trigger if provided", () => {
  const html = renderToStaticMarkup(
   createElement(OfflineAudioSettingsDialog, {
    lesson,
    trigger: createElement("button", null, "Custom Trigger"),
   }),
  );

  expect(html).toContain("Custom Trigger");
 });

 it("exposes standard Mandarin voices with clear descriptions", () => {
  expect(STANDARD_MANDARIN_VOICES.length).toBeGreaterThanOrEqual(4);
  expect(STANDARD_MANDARIN_VOICES[0]?.shortName).toBe("zh-CN-XiaoxiaoNeural");
  expect(STANDARD_MANDARIN_VOICES.some((v) => v.shortName === "zh-CN-YunxiNeural")).toBe(true);
  expect(STANDARD_MANDARIN_VOICES.some((v) => v.shortName === "zh-CN-YunjianNeural")).toBe(true);
 });
});
