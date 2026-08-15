import { describe, expect, it } from "vitest";

import { evaluateHumanitiesAnswer } from "./humanities-evaluator";

describe("HanziHome Humanities evaluator", () => {
 it("scores required information units deterministically", () => {
  const result = evaluateHumanitiesAnswer("Chiều thứ tư chuyển sang 9 giờ sáng thứ năm.", {
   mode: "translation",
   direction: "zh-vi",
   informationUnits: [
    {
     id: "old-time",
     type: "time",
     canonicalMeaningVi: "chiều thứ Tư",
     required: true,
     weight: 1,
     acceptedRealizations: ["chiều thứ tư"],
    },
    {
     id: "new-time",
     type: "time",
     canonicalMeaningVi: "9 giờ sáng thứ Năm",
     required: true,
     weight: 1,
     acceptedRealizations: ["9 giờ sáng thứ năm"],
    },
   ],
   rubric: [{ id: "terms", labelVi: "Thuật ngữ", weight: 100, deterministic: true }],
   references: [{ id: "reference", text: "Bản tham khảo" }],
   preparationSeconds: null,
   maxRecordingSeconds: null,
   replayPolicy: null,
   replayLimit: null,
   noteTakingAllowed: null,
  });
  expect(result.score).toBe(100);
  expect(result.evidenceCoverage).toBe(100);
  expect(result.missingRequiredUnitIds).toEqual([]);
 });

 it("does not award a missing required unit", () => {
  const result = evaluateHumanitiesAnswer("Chuyển sang sáng thứ năm.", {
   mode: "interpreting",
   direction: "zh-vi",
   informationUnits: [
    {
     id: "old-time",
     type: "time",
     canonicalMeaningVi: "chiều thứ Tư",
     required: true,
     weight: 1,
     acceptedRealizations: ["chiều thứ tư"],
    },
   ],
   rubric: [{ id: "terms", labelVi: "Thuật ngữ", weight: 100, deterministic: true }],
   references: [{ id: "reference", text: "Bản tham khảo" }],
   preparationSeconds: 10,
   maxRecordingSeconds: 60,
   replayPolicy: "limited",
   replayLimit: 2,
   noteTakingAllowed: true,
  });
  expect(result.score).toBe(0);
  expect(result.missingRequiredUnitIds).toEqual(["old-time"]);
 });
});
