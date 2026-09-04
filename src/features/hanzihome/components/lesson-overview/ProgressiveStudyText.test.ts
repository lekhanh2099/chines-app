import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { getActiveCharacterIndex, ProgressiveStudyText } from "./ProgressiveStudyText";
import {
 nextAvailableRevealStage,
 nextRevealStage,
 shouldAdvanceReveal,
} from "./progressive-reveal";

describe("progressive study text", () => {
 it("maps audio progress to the character currently being read", () => {
  expect(getActiveCharacterIndex(6, 0, 6, 0)).toBe(0);
  expect(getActiveCharacterIndex(6, 0, 6, 0.5)).toBe(3);
  expect(getActiveCharacterIndex(6, 2, 4, 0)).toBe(2);
  expect(getActiveCharacterIndex(6, 2, 4, 0.75)).toBe(5);
 });

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
     autoDetectPinyin: false,
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

 it("derives contextual pinyin when a lesson line has no stored pinyin", () => {
  const markup = renderToStaticMarkup(
   createElement(ProgressiveStudyText, {
    zh: "一个人。",
    displayMode: {
     showPinyin: true,
     autoDetectPinyin: true,
     showMeaning: false,
     showAnswers: false,
     hanziFont: "songti",
     hanziSize: "lg",
     revealMode: "always",
    },
   }),
  );

  expect(markup).toContain("yí gè rén。");
 });

 it("keeps aligned source pinyin when automatic analysis is enabled", () => {
  const markup = renderToStaticMarkup(
   createElement(ProgressiveStudyText, {
    zh: "既然你的盾坚固得什么",
    pinyin: "Jìrán nǐ de dùn jiāngù de shénme",
    displayMode: {
     showPinyin: true,
     autoDetectPinyin: true,
     showMeaning: false,
     showAnswers: false,
     hanziFont: "songti",
     hanziSize: "lg",
     revealMode: "always",
    },
   }),
  );

  expect(markup).toContain("de");
  expect(markup).not.toContain("dé");
 });

 it("does not invent pinyin when source mode has no stored pinyin", () => {
  const markup = renderToStaticMarkup(
   createElement(ProgressiveStudyText, {
    zh: "一个人。",
    displayMode: {
     showPinyin: true,
     autoDetectPinyin: false,
     showMeaning: false,
     showAnswers: false,
     hanziFont: "songti",
     hanziSize: "lg",
     revealMode: "always",
    },
   }),
  );

  expect(markup).not.toContain("yí gè rén。");
 });

 it("renders each Hanzi character as a reading action when playback is available", () => {
  const markup = renderToStaticMarkup(
   createElement(ProgressiveStudyText, {
    zh: "离家的时候",
    pinyin: "Lí jiā de shíhou",
    vi: "Lúc rời khỏi nhà",
    displayMode: {
     showPinyin: true,
     autoDetectPinyin: false,
     showMeaning: true,
     showAnswers: false,
     hanziFont: "songti",
     hanziSize: "lg",
     revealMode: "always",
    },
    readingPlayback: {
     canSpeak: true,
     isSpeaking: true,
     progress: 0.5,
     speakingText: "离家的时候",
     speak: async () => undefined,
    },
    readingMode: true,
   }),
  );

  expect(markup.match(/aria-label="Đọc từ chữ/g)).toHaveLength(5);
  expect(markup.match(/aria-current="true"/g)).toHaveLength(1);
  expect(markup).toContain("reading-progress-highlight");
  expect(markup).toContain('data-no-inspector="true"');
 });

 it("keeps character actions disabled until reading mode starts", () => {
  const markup = renderToStaticMarkup(
   createElement(ProgressiveStudyText, {
    zh: "离家的时候",
    displayMode: {
     showPinyin: true,
     autoDetectPinyin: false,
     showMeaning: true,
     showAnswers: false,
     hanziFont: "songti",
     hanziSize: "lg",
     revealMode: "always",
    },
    readingPlayback: {
     canSpeak: true,
     isSpeaking: true,
     progress: 0.5,
     speakingText: "离家的时候",
     speak: async () => undefined,
    },
   }),
  );

  expect(markup).not.toContain('aria-label="Đọc từ chữ');
  expect(markup).toContain("离家的时候");
 });
});
