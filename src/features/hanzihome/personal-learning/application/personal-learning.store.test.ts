import { describe, expect, it } from "vitest";

import {
 addPersonalLearningIntentInState,
 deletePersonalLearningAttemptInState,
 ingestPersonalLearningAttemptInState,
 resolvePersonalLearningHypothesisInState,
 type PersonalLearningIngestionInput,
} from "@/features/hanzihome/personal-learning/application/personal-learning.store";
import {
 attemptIntentRevisionSchema,
 emptyPersonalLearningStore,
} from "@/features/hanzihome/personal-learning/domain/personal-learning.schemas";

const now = "2026-08-01T12:00:00.000Z";

function context() {
 let counter = 0;
 return {
  now,
  userId: "current-user",
  createId: () => `id-${++counter}`,
 };
}

const writingInput: PersonalLearningIngestionInput = {
 sourceModule: "writing",
 sourceItemId: "exercise-1",
 originalInput: "他说的很快。",
 intendedMeaningVi: null,
 inputMode: "text",
 transcriptStatus: "not-applicable",
 assistanceUsed: false,
 durationMs: null,
 opportunityType: "TYPE_2",
};

describe("personal-learning canonical store", () => {
 it("requires a confirmed transcript before ingesting speaking evidence", () => {
  expect(() =>
   ingestPersonalLearningAttemptInState(
    emptyPersonalLearningStore,
    {
     ...writingInput,
     sourceModule: "speaking",
     inputMode: "audio",
     transcriptStatus: "machine-draft",
    },
    context(),
   ),
  ).toThrow("Speaking and interpreting transcripts must be user-confirmed before ingestion.");
 });

 it("creates a conservative hypothesis instead of silently confirming a learner error", () => {
  const store = ingestPersonalLearningAttemptInState(
   emptyPersonalLearningStore,
   writingInput,
   context(),
  );

  expect(store.attempts).toHaveLength(1);
  expect(store.hypotheses).toHaveLength(1);
  expect(store.hypotheses[0]).toMatchObject({
   knowledgeNodeId: "de-di-de",
   proposedSubtype: "DE_COMPLEMENT_SUB",
   status: "needs-intent",
   detector: "rule",
   confidence: 0.62,
  });
  expect(store.annotations).toHaveLength(0);
 });

 it("requires learner intent and quality review before accepting a hypothesis", () => {
  const mutationContext = context();
  const detected = ingestPersonalLearningAttemptInState(
   emptyPersonalLearningStore,
   writingInput,
   mutationContext,
  );
  const hypothesisId = detected.hypotheses[0]?.id;
  const attemptId = detected.attempts[0]?.id;
  expect(hypothesisId).toBeDefined();
  expect(attemptId).toBeDefined();
  if (hypothesisId === undefined || attemptId === undefined) return;

  expect(() =>
   resolvePersonalLearningHypothesisInState(
    detected,
    hypothesisId,
    "accepted",
    {
     grammaticality: "invalid",
     meaningAccuracy: "partially-preserved",
     naturalness: "awkward",
     registerFit: "fits",
    },
    mutationContext,
   ),
  ).toThrow("Intended meaning is required before confirmation.");

  const revision = attemptIntentRevisionSchema.parse({
   id: mutationContext.createId(),
   attemptId,
   intendedMeaningVi: "Anh ấy nói rất nhanh.",
   createdAt: now,
  });
  const withIntent = addPersonalLearningIntentInState(detected, revision, mutationContext);
  const accepted = resolvePersonalLearningHypothesisInState(
   withIntent,
   hypothesisId,
   "accepted",
   {
    grammaticality: "invalid",
    meaningAccuracy: "partially-preserved",
    naturalness: "awkward",
    registerFit: "fits",
   },
   mutationContext,
  );

  expect(accepted.hypotheses[0]?.status).toBe("accepted");
  expect(accepted.annotations).toHaveLength(1);
  expect(accepted.annotations[0]?.status).toBe("confirmed");
  expect(accepted.evidence).toHaveLength(1);
  expect(accepted.evidence[0]).toMatchObject({
   dimension: "M3",
   outcome: "failure",
   opportunityType: "TYPE_2",
   reasonCodes: ["SPONTANEOUS_FAILURE", "USER_CONFIRMED_ANNOTATION"],
  });
  expect(accepted.nodeStates.find((item) => item.knowledgeNodeId === "de-di-de")?.state).toBe(
   "PROVISIONAL_WEAKNESS",
  );
 });

 it("keeps accepted and rejected hypotheses immutable", () => {
  const mutationContext = context();
  const detected = ingestPersonalLearningAttemptInState(
   emptyPersonalLearningStore,
   { ...writingInput, intendedMeaningVi: "Anh ấy nói rất nhanh." },
   mutationContext,
  );
  const hypothesisId = detected.hypotheses[0]?.id;
  expect(hypothesisId).toBeDefined();
  if (hypothesisId === undefined) return;

  const accepted = resolvePersonalLearningHypothesisInState(
   detected,
   hypothesisId,
   "accepted",
   {
    grammaticality: "invalid",
    meaningAccuracy: "partially-preserved",
    naturalness: "awkward",
    registerFit: "fits",
   },
   mutationContext,
  );

  expect(() =>
   resolvePersonalLearningHypothesisInState(
    accepted,
    hypothesisId,
    "rejected",
    undefined,
    mutationContext,
   ),
  ).toThrow("Resolved hypotheses are immutable.");
 });

 it("deletes one attempt together with its derived learner evidence", () => {
  const mutationContext = context();
  const detected = ingestPersonalLearningAttemptInState(
   emptyPersonalLearningStore,
   { ...writingInput, intendedMeaningVi: "Anh ấy nói rất nhanh." },
   mutationContext,
  );
  const hypothesisId = detected.hypotheses[0]?.id;
  const attemptId = detected.attempts[0]?.id;
  expect(hypothesisId).toBeDefined();
  expect(attemptId).toBeDefined();
  if (hypothesisId === undefined || attemptId === undefined) return;

  const accepted = resolvePersonalLearningHypothesisInState(
   detected,
   hypothesisId,
   "accepted",
   {
    grammaticality: "invalid",
    meaningAccuracy: "partially-preserved",
    naturalness: "awkward",
    registerFit: "fits",
   },
   mutationContext,
  );
  const deleted = deletePersonalLearningAttemptInState(accepted, attemptId, mutationContext);

  expect(deleted.attempts).toHaveLength(0);
  expect(deleted.hypotheses).toHaveLength(0);
  expect(deleted.annotations).toHaveLength(0);
  expect(deleted.evidence).toHaveLength(0);
  expect(deleted.nodeStates.find((item) => item.knowledgeNodeId === "de-di-de")?.state).toBe(
   "UNOBSERVED",
  );
 });
});
