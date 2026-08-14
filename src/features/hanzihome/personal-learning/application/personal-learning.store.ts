import { personalLearningKnowledgeNodes } from "../data/knowledge-registry";
import {
 attemptIntentRevisionSchema,
 errorAnnotationSchema,
 errorHypothesisSchema,
 learningAttemptSchema,
 masteryEvidenceSchema,
 nodeStateTransitionSchema,
 personalLearningStoreSchema,
 type AttemptIntentRevision,
 type ErrorAnnotation,
 type ErrorHypothesis,
 type LearningAttempt,
 type MasteryEvidence,
 type PersonalLearningStore,
} from "../domain/personal-learning.schemas";
import { deriveLearnerNodeState, getPersonalLearningAlgorithmVersion } from "../domain/personal-learning.state";
import { detectPersonalLearningHypotheses } from "./personal-learning.detector";

export type PersonalLearningIngestionInput = {
 sourceModule: LearningAttempt["sourceModule"];
 sourceItemId: string | null;
 originalInput: string;
 intendedMeaningVi: string | null;
 inputMode: LearningAttempt["inputMode"];
 transcriptStatus: LearningAttempt["transcriptStatus"];
 assistanceUsed: boolean;
 durationMs: number | null;
 opportunityType: MasteryEvidence["opportunityType"];
};

export type HypothesisResolution = "accepted" | "rejected" | "uncertain";

export type AcceptHypothesisInput = {
 grammaticality: ErrorAnnotation["grammaticality"];
 meaningAccuracy: ErrorAnnotation["meaningAccuracy"];
 naturalness: ErrorAnnotation["naturalness"];
 registerFit: ErrorAnnotation["registerFit"];
};

type MutationContext = {
 now: string;
 userId: string;
 createId: () => string;
};

function currentIntent(store: PersonalLearningStore, attempt: LearningAttempt): string | null {
 const latest = store.intentRevisions
  .filter((entry) => entry.attemptId === attempt.id)
  .sort((first, second) => second.createdAt.localeCompare(first.createdAt))[0];
 return latest?.intendedMeaningVi ?? attempt.intendedMeaningVi;
}

function refreshNodeStates(
 store: PersonalLearningStore,
 context: MutationContext,
): PersonalLearningStore {
 let nextStore = store;
 const nextStates = personalLearningKnowledgeNodes.map((node) => {
  const result = deriveLearnerNodeState({
   annotations: nextStore.annotations,
   attempts: nextStore.attempts,
   evidence: nextStore.evidence,
   knowledgeNodeId: node.id,
   now: context.now,
   userId: context.userId,
  });
  const previous = nextStore.nodeStates.find((entry) => entry.knowledgeNodeId === node.id);
  if (previous !== undefined && previous.state !== result.nodeState.state) {
   const transition = nodeStateTransitionSchema.parse({
    id: context.createId(),
    userId: context.userId,
    knowledgeNodeId: node.id,
    fromState: previous.state,
    toState: result.nodeState.state,
    evidenceIds: nextStore.evidence
     .filter((entry) => entry.knowledgeNodeId === node.id)
     .map((entry) => entry.id),
    reasonCodes: result.reasonCodes,
    algorithmVersion: getPersonalLearningAlgorithmVersion(),
    createdAt: context.now,
   });
   nextStore = { ...nextStore, transitions: [...nextStore.transitions, transition] };
  }
  return result.nodeState;
 });
 return personalLearningStoreSchema.parse({ ...nextStore, nodeStates: nextStates });
}

export function ingestPersonalLearningAttemptInState(
 store: PersonalLearningStore,
 input: PersonalLearningIngestionInput,
 context: MutationContext,
): PersonalLearningStore {
 if (
  (input.sourceModule === "speaking" || input.sourceModule === "interpreting") &&
  input.transcriptStatus !== "user-confirmed" &&
  input.transcriptStatus !== "reviewed"
 ) {
  throw new Error("Speaking and interpreting transcripts must be user-confirmed before ingestion.");
 }

 const attempt = learningAttemptSchema.parse({
  id: context.createId(),
  userId: context.userId,
  sourceModule: input.sourceModule,
  sourceItemId: input.sourceItemId,
  originalInput: input.originalInput,
  intendedMeaningVi: input.intendedMeaningVi,
  inputMode: input.inputMode,
  audioAssetId: null,
  transcriptStatus: input.transcriptStatus,
  assistanceUsed: input.assistanceUsed,
  timeLimitSeconds: null,
  durationMs: input.durationMs,
  createdAt: context.now,
  contentVersion: "personal-learning-v1.0.0",
 });
 const hypotheses =
  input.sourceModule === "dictation"
   ? []
   : detectPersonalLearningHypotheses(attempt.id, attempt.originalInput, context.now, context.createId);

 return refreshNodeStates(
  { ...store, attempts: [...store.attempts, attempt], hypotheses: [...store.hypotheses, ...hypotheses] },
  context,
 );
}

export function addPersonalLearningEvidenceInState(
 store: PersonalLearningStore,
 evidence: MasteryEvidence,
 context: MutationContext,
): PersonalLearningStore {
 const parsed = masteryEvidenceSchema.parse(evidence);
 if (!store.attempts.some((entry) => entry.id === parsed.attemptId)) {
  throw new Error("Attempt not found.");
 }
 if (store.evidence.some((entry) => entry.id === parsed.id)) return store;
 return refreshNodeStates({ ...store, evidence: [...store.evidence, parsed] }, context);
}

export function addPersonalLearningIntentInState(
 store: PersonalLearningStore,
 revision: AttemptIntentRevision,
 context: MutationContext,
): PersonalLearningStore {
 const parsed = attemptIntentRevisionSchema.parse(revision);
 if (!store.attempts.some((entry) => entry.id === parsed.attemptId)) {
  throw new Error("Attempt not found.");
 }
 return refreshNodeStates({ ...store, intentRevisions: [...store.intentRevisions, parsed] }, context);
}

export function resolvePersonalLearningHypothesisInState(
 store: PersonalLearningStore,
 id: string,
 resolution: HypothesisResolution,
 quality: AcceptHypothesisInput | undefined,
 context: MutationContext,
): PersonalLearningStore {
 const hypothesis = store.hypotheses.find((entry) => entry.id === id);
 if (hypothesis === undefined) throw new Error("Hypothesis not found.");
 if (hypothesis.status === resolution) return store;
 if (hypothesis.status === "accepted" || hypothesis.status === "rejected") {
  throw new Error("Resolved hypotheses are immutable.");
 }
 const attempt = store.attempts.find((entry) => entry.id === hypothesis.attemptId);
 if (attempt === undefined) throw new Error("Attempt not found.");
 if (resolution === "accepted" && hypothesis.status === "needs-intent" && currentIntent(store, attempt) === null) {
  throw new Error("Intended meaning is required before confirmation.");
 }
 const updated = errorHypothesisSchema.parse({ ...hypothesis, status: resolution });
 let nextStore: PersonalLearningStore = {
  ...store,
  hypotheses: store.hypotheses.map((entry) => (entry.id === id ? updated : entry)),
 };
 if (resolution === "accepted") {
  if (quality === undefined) throw new Error("Quality dimensions are required for confirmed annotations.");
  const annotation = errorAnnotationSchema.parse({
   id: context.createId(),
   attemptId: attempt.id,
   hypothesisId: hypothesis.id,
   knowledgeNodeId: hypothesis.knowledgeNodeId,
   errorFamily: hypothesis.knowledgeNodeId,
   errorSubtype: hypothesis.proposedSubtype,
   operation: "selection",
   dimensions: ["syntax", "semantics"],
   severity: 2,
   grammaticality: quality.grammaticality,
   meaningAccuracy: quality.meaningAccuracy,
   naturalness: quality.naturalness,
   registerFit: quality.registerFit,
   status: "confirmed",
   confidence: hypothesis.confidence,
   sourceIds: ["research-pack-v1"],
   createdAt: context.now,
  });
  const evidence = masteryEvidenceSchema.parse({
   id: context.createId(),
   userId: context.userId,
   knowledgeNodeId: hypothesis.knowledgeNodeId,
   attemptId: attempt.id,
   dimension: "M3",
   outcome: "failure",
   opportunityType: "TYPE_2",
   hintLevel: 0,
   confidence: null,
   mode:
    attempt.sourceModule === "speaking" || attempt.sourceModule === "interpreting"
     ? "speaking"
     : "writing",
   reasonCodes: ["SPONTANEOUS_FAILURE", "USER_CONFIRMED_ANNOTATION"],
   observedAt: context.now,
  });
  nextStore = {
   ...nextStore,
   annotations: [...nextStore.annotations, annotation],
   evidence: [...nextStore.evidence, evidence],
  };
 }
 return refreshNodeStates(nextStore, context);
}

export function deletePersonalLearningAttemptInState(
 store: PersonalLearningStore,
 attemptId: string,
 context: MutationContext,
): PersonalLearningStore {
 const hypothesisIds = new Set(
  store.hypotheses.filter((entry) => entry.attemptId === attemptId).map((entry) => entry.id),
 );
 return refreshNodeStates(
  {
   ...store,
   attempts: store.attempts.filter((entry) => entry.id !== attemptId),
   revisions: store.revisions.filter((entry) => entry.attemptId !== attemptId),
   intentRevisions: store.intentRevisions.filter((entry) => entry.attemptId !== attemptId),
   hypotheses: store.hypotheses.filter((entry) => entry.attemptId !== attemptId),
   annotations: store.annotations.filter(
    (entry) =>
     entry.attemptId !== attemptId &&
     (entry.hypothesisId === null || !hypothesisIds.has(entry.hypothesisId)),
   ),
   evidence: store.evidence.filter((entry) => entry.attemptId !== attemptId),
  },
  context,
 );
}
