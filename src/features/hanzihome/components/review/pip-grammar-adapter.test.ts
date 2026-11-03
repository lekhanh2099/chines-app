import { describe, expect, it } from "vitest";
import { getTextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { adaptTextbookGrammarToPip } from "./pip-grammar-adapter";

describe("adaptTextbookGrammarToPip", () => {
 it("extracts grammar points from nhip-cau lesson 5 with formula and examples", () => {
  const lesson = getTextbookLesson("nhip-cau", 5);
  if (!lesson) throw new Error("Lesson not found");
  const points = adaptTextbookGrammarToPip(lesson.sections);

  expect(points.length).toBeGreaterThan(0);
  const first = points[0];
  expect(first).toBeDefined();
  if (!first) throw new Error("Expected first point");

  expect(first.title).toContain("得慌");
  expect(first.explanation).toContain("bổ ngữ trình độ");
  expect(first.commonPhrases).toBeDefined();
  expect(first.commonPhrases?.length).toBeGreaterThan(0);
  expect(first.examples.length).toBeGreaterThan(0);
  expect(first.examples[0]?.zh).toBeDefined();
  expect(first.examples[0]?.vi).toBeDefined();
 });

 it("extracts grammar points from business chinese tm2 lesson 1 with markdown table examples", () => {
  const lesson = getTextbookLesson("tm2", 1);
  if (!lesson) throw new Error("Lesson not found");
  const points = adaptTextbookGrammarToPip(lesson.sections);

  expect(points.length).toBe(4);
  const first = points[0];
  expect(first).toBeDefined();
  if (!first) throw new Error("Expected first point");

  expect(first.title).toContain("是否");
  expect(first.formula).toContain("Chủ ngữ + 是否 + Động từ");
  expect(first.examples.length).toBe(3);
  expect(first.examples[0]?.zh).toContain("贵公司是否收到我公司的邮件？");
  expect(first.examples[0]?.vi).toContain("Quý công ty đã nhận được email");
 });

 it("extracts grammar points from khau-ngu lesson 1", () => {
  const lesson = getTextbookLesson("khau-ngu", 1);
  if (!lesson) throw new Error("Lesson not found");
  const points = adaptTextbookGrammarToPip(lesson.sections);

  expect(points.length).toBeGreaterThan(0);
  const first = points[0];
  expect(first).toBeDefined();
  if (!first) throw new Error("Expected first point");

  expect(first.title).toContain("算");
  expect(first.examples.length).toBeGreaterThan(0);
 });

 it("returns empty array when there are no grammar sections", () => {
  const points = adaptTextbookGrammarToPip([]);
  expect(points).toEqual([]);
 });
});
