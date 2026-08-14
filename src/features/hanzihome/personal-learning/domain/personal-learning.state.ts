import type {
 ErrorAnnotation,
 KnowledgeNodeId,
 LearnerNodeState,
 LearnerNodeStatus,
 LearningAttempt,
 MasteryDimension,
 MasteryEvidence,
} from "@/features/hanzihome/personal-learning/domain/personal-learning.schemas";

const algorithmVersion = "personal-state-v1.0.0";
const dimensions: readonly MasteryDimension[] = ["M1", "M2", "M3", "M4", "M5"];

type StateDecision = {
 state: LearnerNodeStatus;
 reasonCodes: string[];
};

type StateInput = {
 annotations: readonly ErrorAnnotation[];
 attempts: readonly LearningAttempt[];
 evidence: readonly MasteryEvidence[];
 knowledgeNodeId: KnowledgeNodeId;
 now: string;
 userId: string;
};

function countSuccess(evidence: readonly MasteryEvidence[], dimension: MasteryDimension): number {
 return evidence.filter((entry) => entry.dimension === dimension && entry.outcome === "success")
  .length;
}

function countFailure(
 evidence: readonly MasteryEvidence[],
 dimensionsToCount: readonly MasteryDimension[],
): number {
 return evidence.filter(
  (entry) => dimensionsToCount.includes(entry.dimension) && entry.outcome === "failure",
 ).length;
}

function decideState(
 evidence: readonly MasteryEvidence[],
 annotations: readonly ErrorAnnotation[],
 attempts: readonly LearningAttempt[],
): StateDecision {
 if (evidence.length === 0 && annotations.length === 0) {
  return { state: "UNOBSERVED", reasonCodes: ["NO_EVIDENCE"] };
 }

 const contestedCount =
  evidence.filter((entry) => entry.outcome === "contested").length +
  annotations.filter((entry) => entry.status === "contested").length;
 const confirmedAnnotations = annotations.filter(
  (entry) => entry.status === "confirmed" || entry.status === "reviewed",
 );
 if (contestedCount > 0 && confirmedAnnotations.length === 0) {
  return { state: "CONTESTED", reasonCodes: ["ANNOTATION_CONTESTED"] };
 }

 const type1Failures = evidence.filter(
  (entry) => entry.opportunityType === "TYPE_1" && entry.outcome === "failure",
 );
 const failureAttemptIds = new Set(type1Failures.map((entry) => entry.attemptId));
 const failureModules = new Set(
  attempts
   .filter((attempt) => failureAttemptIds.has(attempt.id))
   .map((attempt) => attempt.sourceModule),
 );
 const m1Success = countSuccess(evidence, "M1");
 const m2Success = countSuccess(evidence, "M2");
 const m3Success = countSuccess(evidence, "M3");
 const m4Success = countSuccess(evidence, "M4");
 const m5Success = countSuccess(evidence, "M5");
 const delayedSuccess = evidence.some(
  (entry) =>
   entry.dimension === "M5" &&
   entry.outcome === "success" &&
   entry.reasonCodes.includes("DELAYED_SUCCESS"),
 );
 const latest = [...evidence].sort((first, second) =>
  second.observedAt.localeCompare(first.observedAt),
 )[0];
 const recentSpontaneousFailure =
  latest?.outcome === "failure" && latest.reasonCodes.includes("SPONTANEOUS_FAILURE");

 if (m5Success >= 2 && delayedSuccess && !recentSpontaneousFailure) {
  return { state: "STABLE_TRANSFER", reasonCodes: ["TWO_TRANSFER_CONTEXTS", "DELAYED_SUCCESS"] };
 }
 if (recentSpontaneousFailure && (m5Success >= 1 || m4Success >= 2)) {
  return {
   state: "AUTOMATING",
   reasonCodes: ["RECENT_SPONTANEOUS_FAILURE", "PRIOR_TRANSFER_SUCCESS"],
  };
 }
 if (m4Success >= 2 || m5Success >= 1) {
  return { state: "AUTOMATING", reasonCodes: ["TWO_TIMED_SUCCESSES"] };
 }
 const productionFailures = countFailure(evidence, ["M3", "M4"]);
 if (m1Success > 0 && m2Success > 0 && productionFailures >= 2) {
  return {
   state: "DECLARATIVE_ONLY",
   reasonCodes: ["RECOGNITION_EXPLANATION_SUCCESS", "REPEATED_PRODUCTION_FAILURE"],
  };
 }
 if (m1Success > 0 && m2Success > 0 && m3Success > 0) {
  return { state: "CONTROLLED_MASTERY", reasonCodes: ["M1_M2_M3_SUCCESS"] };
 }
 if (type1Failures.length >= 2 && failureAttemptIds.size >= 2) {
  return {
   state: "CONFIRMED_GAP",
   reasonCodes:
    failureModules.size >= 2
     ? ["TWO_PARALLEL_ERRORS", "CROSS_MODE_RECURRENCE"]
     : ["TWO_PARALLEL_ERRORS"],
  };
 }
 if (type1Failures.length > 0 || confirmedAnnotations.length > 0) {
  return { state: "PROVISIONAL_WEAKNESS", reasonCodes: ["ONE_CONFIRMED_ERROR"] };
 }
 return { state: "PRIOR_ONLY", reasonCodes: ["INSUFFICIENT_DIRECT_EVIDENCE"] };
}

function buildCoverage(evidence: readonly MasteryEvidence[]): LearnerNodeState["evidenceCoverage"] {
 return {
  M1: evidence.filter((entry) => entry.dimension === "M1").length,
  M2: evidence.filter((entry) => entry.dimension === "M2").length,
  M3: evidence.filter((entry) => entry.dimension === "M3").length,
  M4: evidence.filter((entry) => entry.dimension === "M4").length,
  M5: evidence.filter((entry) => entry.dimension === "M5").length,
 };
}

function calculateRate(numerator: number, denominator: number): number | null {
 return denominator === 0 ? null : numerator / denominator;
}

export function deriveLearnerNodeState(input: StateInput): {
 nodeState: LearnerNodeState;
 reasonCodes: string[];
} {
 const nodeEvidence = input.evidence.filter(
  (entry) => entry.knowledgeNodeId === input.knowledgeNodeId,
 );
 const nodeAnnotations = input.annotations.filter(
  (entry) => entry.knowledgeNodeId === input.knowledgeNodeId,
 );
 const relevantAttemptIds = new Set(nodeEvidence.map((entry) => entry.attemptId));
 const relevantAttempts = input.attempts.filter((entry) => relevantAttemptIds.has(entry.id));
 const decision = decideState(nodeEvidence, nodeAnnotations, relevantAttempts);
 const type1Evidence = nodeEvidence.filter(
  (entry) =>
   entry.opportunityType === "TYPE_1" &&
   (entry.outcome === "success" || entry.outcome === "failure"),
 );
 const failures = type1Evidence.filter((entry) => entry.outcome === "failure").length;
 const hinted = type1Evidence.filter((entry) => entry.hintLevel > 0).length;
 const failureModules = new Set(
  relevantAttempts
   .filter((attempt) =>
    nodeEvidence.some((entry) => entry.attemptId === attempt.id && entry.outcome === "failure"),
   )
   .map((attempt) => attempt.sourceModule),
 );
 const lastObservedAt =
  [...nodeEvidence].sort((first, second) => second.observedAt.localeCompare(first.observedAt))[0]
   ?.observedAt ?? null;
 const nextReviewAt =
  decision.state === "STABLE_TRANSFER"
   ? new Date(new Date(input.now).getTime() + 14 * 86_400_000).toISOString()
   : decision.state === "UNOBSERVED"
     ? null
     : new Date(new Date(input.now).getTime() + 86_400_000).toISOString();

 return {
  nodeState: {
   userId: input.userId,
   knowledgeNodeId: input.knowledgeNodeId,
   state: decision.state,
   evidenceCoverage: buildCoverage(nodeEvidence),
   recurrenceRate: calculateRate(
    Math.max(0, failureModules.size - 1),
    Math.max(1, failureModules.size),
   ),
   type1ErrorRate: calculateRate(failures, type1Evidence.length),
   hintDependence: calculateRate(hinted, type1Evidence.length),
   lastObservedAt,
   nextReviewAt,
   version: 1,
  },
  reasonCodes: decision.reasonCodes,
 };
}

export function getPersonalLearningAlgorithmVersion(): string {
 return algorithmVersion;
}

export function getMasteryDimensions(): readonly MasteryDimension[] {
 return dimensions;
}
