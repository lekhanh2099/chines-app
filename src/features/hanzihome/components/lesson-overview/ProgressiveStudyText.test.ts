import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProgressiveStudyText } from "./ProgressiveStudyText";
import {
 nextAvailableRevealStage,
 nextRevealStage,
 shouldAdvanceReveal,
} from "./progressive-reveal";

describe("progressive study text", () => {
 it("cycles Hanzi to Pinyin to meaning and back to Hanzi", () => {
  expect(nextRevealStage(0)).toBe(1);
  expect(nextRevealStage(1)).toBe(2);
  expect(nextRevealStage(2)).toBe(0);
 });

 it("skips reveal stages that have no content", () => {
  expect(nextAvailableRevealStage(0, { hasPinyin: false, hasMeaning: true })).toBe(2);
  expect(nextAvailableRevealStage(0, { hasPinyin: true, hasMeaning: false })).toBe(1);
  expect(nextAvailableRevealStage(0, { hasPinyin: false, hasMeaning: false })).toBe(0);
 });

 it("advances from the progressive wrapper but not from nested actions or selections", () => {
  expect(shouldAdvanceReveal({ tapMode: true, hasSelection: false, interactiveChild: false })).toBe(
   true,
  );
  expect(shouldAdvanceReveal({ tapMode: true, hasSelection: false, interactiveChild: true })).toBe(
   false,
  );
  expect(shouldAdvanceReveal({ tapMode: true, hasSelection: true, interactiveChild: false })).toBe(
   false,
  );
  expect(
   shouldAdvanceReveal({
    tapMode: true,
    hasSelection: false,
    interactiveChild: false,
    key: "Enter",
   }),
  ).toBe(true);
  expect(
   shouldAdvanceReveal({
    tapMode: true,
    hasSelection: false,
    interactiveChild: false,
    key: "Escape",
   }),
  ).toBe(false);
 });

 it("reserves the Pinyin and meaning rows before they are revealed", () => {
  const markup = renderToStaticMarkup(
   createElement(ProgressiveStudyText, {
    zh: "离家的时候",
    pinyin: "Lí jiā de shíhou",
    vi: "Lúc rời khỏi nhà",
    displayMode: {
     showPinyin: true,
     showMeaning: true,
     showAnswers: false,
     hanziFont: "songti",
     hanziSize: "lg",
     revealMode: "tap",
    },
   }),
  );

  expect(markup).toContain("Lí jiā de shíhou");
  expect(markup).toContain("Lúc rời khỏi nhà");
  expect(markup).toContain("[grid-area:1/1]");
  expect(markup.match(/invisible/g)).toHaveLength(2);
  expect(markup.match(/aria-hidden="true"/g)).toHaveLength(2);
 });
});
