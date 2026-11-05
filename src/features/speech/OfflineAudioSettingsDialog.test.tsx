import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OfflineAudioSettingsDialog } from "./OfflineAudioSettingsDialog";
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
});
