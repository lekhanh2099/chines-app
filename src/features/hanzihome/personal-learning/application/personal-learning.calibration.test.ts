import { describe, expect, it } from "vitest";

import {
 buildCalibrationSession,
 startOrResumeCalibrationInState,
 submitCalibrationAnswerInState,
} from "@/features/hanzihome/personal-learning/application/personal-learning.calibration";
import {
 emptyPersonalLearningStore,
 type PersonalLearningStore,
} from "@/features/hanzihome/personal-learning/domain/personal-learning.schemas";

const now = "2026-08-01T12:00:00.000Z";

function createContext() {
 let counter = 0;
 return {
  now,
  userId: "current-user",
  createId: () => `cal-${++counter}`,
 };
}

describe("personal-learning calibration", () => {
 it("starts with one primary item per knowledge node", () => {
  const session = buildCalibrationSession(emptyPersonalLearningStore, createContext());

  expect(session.status).toBe("active");
  expect(session.currentIndex).toBe(0);
  expect(session.answers).toHaveLength(0);
  expect(session.itemIds).toEqual([
   "de-primary",
   "result-primary",
   "aspect-primary",
   "ba-primary",
   "exist-primary",
   "condition-primary",
  ]);
 });

 it("inserts the parallel item after a wrong primary answer and records evidence", () => {
  const context = createContext();
  const initial = startOrResumeCalibrationInState(emptyPersonalLearningStore, context);
  const next = submitCalibrationAnswerInState(
   initial,
   {
    itemId: "de-primary",
    selectedOptionId: "b",
    confidence: "sure",
    selfCorrectionText: "",
    revisionHintLevel: 0,
   },
   context,
  );

  expect(next.calibrationSession?.itemIds.slice(0, 3)).toEqual([
   "de-primary",
   "de-parallel",
   "result-primary",
  ]);
  expect(next.calibrationSession?.currentIndex).toBe(1);
  expect(next.hypotheses).toHaveLength(1);
  expect(next.hypotheses[0]).toMatchObject({
   knowledgeNodeId: "de-di-de",
   proposedSubtype: "CALIBRATION_CONTRAST_ERROR",
   status: "pending",
  });
  expect(next.evidence).toHaveLength(1);
  expect(next.evidence[0]).toMatchObject({
   dimension: "M1",
   outcome: "failure",
   opportunityType: "TYPE_1",
   reasonCodes: ["CALIBRATION_FAILURE"],
  });
 });

 it("inserts the parallel item after an unsure correct answer without fabricating an error", () => {
  const context = createContext();
  const initial = startOrResumeCalibrationInState(emptyPersonalLearningStore, context);
  const next = submitCalibrationAnswerInState(
   initial,
   {
    itemId: "de-primary",
    selectedOptionId: "a",
    confidence: "unsure",
    selfCorrectionText: "",
    revisionHintLevel: 0,
   },
   context,
  );

  expect(next.calibrationSession?.itemIds[1]).toBe("de-parallel");
  expect(next.hypotheses).toHaveLength(0);
  expect(next.evidence[0]?.reasonCodes).toEqual(["CALIBRATION_SUCCESS", "LOW_CONFIDENCE"]);
 });

 it("keeps the primary sequence for a sure correct answer", () => {
  const context = createContext();
  const initial = startOrResumeCalibrationInState(emptyPersonalLearningStore, context);
  const next = submitCalibrationAnswerInState(
   initial,
   {
    itemId: "de-primary",
    selectedOptionId: "a",
    confidence: "sure",
    selfCorrectionText: "",
    revisionHintLevel: 0,
   },
   context,
  );

  expect(next.calibrationSession?.itemIds[1]).toBe("result-primary");
  expect(next.hypotheses).toHaveLength(0);
  expect(next.evidence[0]?.reasonCodes).toEqual(["CALIBRATION_SUCCESS"]);
 });

 it("stores self-correction as a revision plus separate partial M3 evidence", () => {
  const context = createContext();
  const initial = startOrResumeCalibrationInState(emptyPersonalLearningStore, context);
  const next = submitCalibrationAnswerInState(
   initial,
   {
    itemId: "de-primary",
    selectedOptionId: "b",
    confidence: "unsure",
    selfCorrectionText: "我想说的不是这个。",
    revisionHintLevel: 2,
   },
   context,
  );

  expect(next.revisions).toHaveLength(1);
  expect(next.revisions[0]).toMatchObject({
   kind: "self-correction",
   text: "我想说的不是这个。",
   authorType: "user",
  });
  expect(next.evidence).toHaveLength(2);
  expect(
   next.evidence.some((entry) => entry.dimension === "M3" && entry.outcome === "partial"),
  ).toBe(true);
 });

 it("rejects an answer that is not for the current calibration item", () => {
  const context = createContext();
  const initial = startOrResumeCalibrationInState(emptyPersonalLearningStore, context);

  expect(() =>
   submitCalibrationAnswerInState(
    initial,
    {
     itemId: "result-primary",
     selectedOptionId: "b",
     confidence: "sure",
     selfCorrectionText: "",
     revisionHintLevel: 0,
    },
    context,
   ),
  ).toThrow("Calibration item is not the current item.");
 });

 it("is idempotent for an already-recorded current answer", () => {
  const context = createContext();
  const initial = startOrResumeCalibrationInState(emptyPersonalLearningStore, context);
  const answered = submitCalibrationAnswerInState(
   initial,
   {
    itemId: "de-primary",
    selectedOptionId: "b",
    confidence: "sure",
    selfCorrectionText: "",
    revisionHintLevel: 0,
   },
   context,
  );

  const replayable: PersonalLearningStore = {
   ...answered,
   calibrationSession:
    answered.calibrationSession === null
     ? null
     : {
        ...answered.calibrationSession,
        currentIndex: 0,
       },
  };
  const replayed = submitCalibrationAnswerInState(
   replayable,
   {
    itemId: "de-primary",
    selectedOptionId: "b",
    confidence: "sure",
    selfCorrectionText: "",
    revisionHintLevel: 0,
   },
   context,
  );

  expect(replayed).toBe(replayable);
 });

 it("skips nodes already automating or stable when starting a new calibration", () => {
  const seeded: PersonalLearningStore = {
   ...emptyPersonalLearningStore,
   nodeStates: [
    {
     userId: "current-user",
     knowledgeNodeId: "de-di-de",
     state: "STABLE_TRANSFER",
     evidenceCoverage: { M1: 1, M2: 1, M3: 1, M4: 1, M5: 2 },
     recurrenceRate: 0,
     type1ErrorRate: 0,
     hintDependence: 0,
     lastObservedAt: now,
     nextReviewAt: "2026-08-15T12:00:00.000Z",
     version: 1,
    },
    {
     userId: "current-user",
     knowledgeNodeId: "result-potential",
     state: "AUTOMATING",
     evidenceCoverage: { M1: 1, M2: 1, M3: 1, M4: 2, M5: 0 },
     recurrenceRate: 0,
     type1ErrorRate: 0,
     hintDependence: 0,
     lastObservedAt: now,
     nextReviewAt: "2026-08-02T12:00:00.000Z",
     version: 1,
    },
   ],
  };

  const session = buildCalibrationSession(seeded, createContext());
  expect(session.itemIds).not.toContain("de-primary");
  expect(session.itemIds).not.toContain("result-primary");
  expect(session.itemIds).toContain("aspect-primary");
 });
});
