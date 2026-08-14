import { describe, expect, it } from "vitest";

import type {
 LearningAttempt,
 MasteryEvidence,
} from "@/features/hanzihome/personal-learning/domain/personal-learning.schemas";
import { deriveLearnerNodeState } from "@/features/hanzihome/personal-learning/domain/personal-learning.state";

const now = "2026-08-01T12:00:00.000Z";

function attempt(id: string, sourceModule: LearningAttempt["sourceModule"]): LearningAttempt {
 return {
  id,
  userId: "local-user",
  sourceModule,
  sourceItemId: null,
  originalInput: "测试",
  intendedMeaningVi: null,
  inputMode: "text",
  audioAssetId: null,
  transcriptStatus: "not-applicable",
  assistanceUsed: false,
  timeLimitSeconds: null,
  durationMs: null,
  createdAt: now,
  contentVersion: "personal-learning-v1.0.0",
 };
}

function evidence(
 id: string,
 attemptId: string,
 dimension: MasteryEvidence["dimension"],
 outcome: MasteryEvidence["outcome"],
 reasonCodes: string[] = [],
): MasteryEvidence {
 return {
  id,
  userId: "local-user",
  knowledgeNodeId: "de-di-de",
  attemptId,
  dimension,
  outcome,
  opportunityType: "TYPE_1",
  hintLevel: 0,
  confidence: "sure",
  mode: "writing",
  reasonCodes,
  observedAt: now,
 };
}

describe("deriveLearnerNodeState", () => {
 it("starts unobserved with no evidence", () => {
  const result = deriveLearnerNodeState({
   annotations: [],
   attempts: [],
   evidence: [],
   knowledgeNodeId: "de-di-de",
   now,
   userId: "local-user",
  });

  expect(result.nodeState.state).toBe("UNOBSERVED");
  expect(result.nodeState.nextReviewAt).toBeNull();
 });

 it("confirms a gap after two parallel type-1 failures", () => {
  const attempts = [attempt("a1", "writing"), attempt("a2", "speaking")];
  const result = deriveLearnerNodeState({
   annotations: [],
   attempts,
   evidence: [evidence("e1", "a1", "M3", "failure"), evidence("e2", "a2", "M3", "failure")],
   knowledgeNodeId: "de-di-de",
   now,
   userId: "local-user",
  });

  expect(result.nodeState.state).toBe("CONFIRMED_GAP");
  expect(result.reasonCodes).toContain("CROSS_MODE_RECURRENCE");
 });

 it("reaches controlled mastery after M1 M2 and M3 successes", () => {
  const attempts = [attempt("a1", "grammar")];
  const result = deriveLearnerNodeState({
   annotations: [],
   attempts,
   evidence: [
    evidence("e1", "a1", "M1", "success"),
    evidence("e2", "a1", "M2", "success"),
    evidence("e3", "a1", "M3", "success"),
   ],
   knowledgeNodeId: "de-di-de",
   now,
   userId: "local-user",
  });

  expect(result.nodeState.state).toBe("CONTROLLED_MASTERY");
 });

 it("reaches stable transfer with repeated M5 and delayed evidence", () => {
  const attempts = [attempt("a1", "writing"), attempt("a2", "speaking")];
  const result = deriveLearnerNodeState({
   annotations: [],
   attempts,
   evidence: [
    evidence("e1", "a1", "M5", "success", ["DELAYED_SUCCESS"]),
    evidence("e2", "a2", "M5", "success"),
   ],
   knowledgeNodeId: "de-di-de",
   now,
   userId: "local-user",
  });

  expect(result.nodeState.state).toBe("STABLE_TRANSFER");
  expect(result.nodeState.nextReviewAt).toBe("2026-08-15T12:00:00.000Z");
 });
});
