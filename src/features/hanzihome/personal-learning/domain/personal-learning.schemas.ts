import * as z from "zod";

export const knowledgeNodeIdSchema = z.enum([
 "de-di-de",
 "result-potential",
 "aspect",
 "ba-bei",
 "existential",
 "conditionals",
]);

export const masteryDimensionSchema = z.enum(["M1", "M2", "M3", "M4", "M5"]);
export const learnerNodeStatusSchema = z.enum([
 "UNOBSERVED",
 "PRIOR_ONLY",
 "PROVISIONAL_WEAKNESS",
 "CONFIRMED_GAP",
 "DECLARATIVE_ONLY",
 "CONTROLLED_MASTERY",
 "AUTOMATING",
 "STABLE_TRANSFER",
 "CONTESTED",
]);
export const opportunityTypeSchema = z.enum(["TYPE_1", "TYPE_2", "TYPE_3"]);
export const confidenceSchema = z.enum(["sure", "unsure", "guess"]);
export const reviewStatusSchema = z.enum([
 "draft",
 "source-checked",
 "academic-reviewed",
 "published",
 "blocked",
]);

export const sourceReferenceSchema = z.strictObject({
 id: z.string().min(1),
 title: z.string().min(1),
 locator: z.string().min(1),
 sourceType: z.enum(["official", "corpus", "reference", "peer-reviewed", "research-pack"]),
 noteVi: z.string(),
});

export const knowledgeClaimSchema = z.strictObject({
 id: z.string().min(1),
 statementVi: z.string().min(1),
 sourceIds: z.array(z.string().min(1)).min(1),
 confidence: z.enum(["high", "medium", "low", "unresolved"]),
});

export const minimalContrastSchema = z.strictObject({
 id: z.string().min(1),
 firstZh: z.string().min(1),
 secondZh: z.string().min(1),
 explanationVi: z.string().min(1),
});

export const anticipatedQuestionSchema = z.strictObject({
 id: z.string().min(1),
 questionVi: z.string().min(1),
 answerVi: z.string().min(1),
});

export const diagnosticTaskSchema = z.strictObject({
 id: z.string().min(1),
 dimension: masteryDimensionSchema,
 taskType: z.enum(["choose", "explain", "transform", "timed", "transfer"]),
 promptVi: z.string().min(1),
});

export const opportunityRuleSchema = z.strictObject({
 id: z.string().min(1),
 opportunityType: opportunityTypeSchema,
 ruleVi: z.string().min(1),
 humanReviewed: z.boolean(),
 version: z.string().min(1),
});

export const knowledgeNodeSchema = z.strictObject({
 id: knowledgeNodeIdSchema,
 version: z.string().min(1),
 titleVi: z.string().min(1),
 titleZh: z.string().min(1),
 shortLabelVi: z.string().min(1),
 reviewStatus: reviewStatusSchema,
 contentChecksum: z.string().min(1),
 coreQuestionVi: z.string().min(1),
 functionVi: z.string().min(1),
 whyVi: z.string().min(1),
 decisionStepsVi: z.array(z.string().min(1)).min(2),
 frames: z.array(z.string().min(1)).min(1),
 competingNodeIds: z.array(knowledgeNodeIdSchema),
 markedCasesVi: z.array(z.string().min(1)).min(1),
 errorSubtypes: z.array(z.string().min(1)).min(1),
 minimalContrasts: z.array(minimalContrastSchema).min(2),
 anticipatedQuestions: z.array(anticipatedQuestionSchema).min(2),
 diagnosticTasks: z.array(diagnosticTaskSchema).min(3),
 opportunityRules: z.array(opportunityRuleSchema).min(1),
 claims: z.array(knowledgeClaimSchema).min(1),
 sources: z.array(sourceReferenceSchema).min(1),
 researchGapsVi: z.array(z.string().min(1)),
});

export const learningAttemptSchema = z.strictObject({
 id: z.string().min(1),
 userId: z.string().min(1),
 sourceModule: z.enum([
  "reading",
  "dictation",
  "translation",
  "interpreting",
  "speaking",
  "writing",
  "notes",
  "grammar",
  "calibration",
 ]),
 sourceItemId: z.string().nullable(),
 originalInput: z.string(),
 intendedMeaningVi: z.string().nullable(),
 inputMode: z.enum(["text", "audio", "mixed"]),
 audioAssetId: z.string().nullable(),
 transcriptStatus: z.enum(["not-applicable", "machine-draft", "user-confirmed", "reviewed"]),
 assistanceUsed: z.boolean(),
 timeLimitSeconds: z.number().int().positive().nullable(),
 durationMs: z.number().int().nonnegative().nullable(),
 createdAt: z.iso.datetime(),
 contentVersion: z.string().min(1),
});

export const attemptRevisionSchema = z.strictObject({
 id: z.string().min(1),
 attemptId: z.string().min(1),
 parentRevisionId: z.string().nullable(),
 kind: z.enum(["self-correction", "minimal-correction", "natural-rewrite", "accepted-variant"]),
 text: z.string().min(1),
 authorType: z.enum(["user", "editor", "ai-assisted"]),
 evidenceIds: z.array(z.string().min(1)),
 createdAt: z.iso.datetime(),
});

export const attemptIntentRevisionSchema = z.strictObject({
 id: z.string().min(1),
 attemptId: z.string().min(1),
 intendedMeaningVi: z.string().min(1),
 createdAt: z.iso.datetime(),
});

export const errorHypothesisSchema = z.strictObject({
 id: z.string().min(1),
 attemptId: z.string().min(1),
 spanStart: z.number().int().nonnegative(),
 spanEnd: z.number().int().nonnegative(),
 knowledgeNodeId: knowledgeNodeIdSchema,
 proposedSubtype: z.string().min(1),
 confidence: z.number().min(0).max(1),
 explanationVi: z.string().min(1),
 intentQuestionVi: z.string().nullable(),
 candidateRevisionIds: z.array(z.string().min(1)),
 detector: z.enum(["rule", "parser", "llm", "teacher", "user"]),
 detectorVersion: z.string().min(1),
 status: z.enum(["pending", "needs-intent", "accepted", "rejected", "uncertain"]),
 createdAt: z.iso.datetime(),
});

export const errorAnnotationSchema = z.strictObject({
 id: z.string().min(1),
 attemptId: z.string().min(1),
 hypothesisId: z.string().nullable(),
 knowledgeNodeId: knowledgeNodeIdSchema,
 errorFamily: z.string().min(1),
 errorSubtype: z.string().min(1),
 operation: z.enum([
  "omission",
  "addition",
  "substitution",
  "misordering",
  "selection",
  "collocation",
  "register",
 ]),
 dimensions: z
  .array(
   z.enum([
    "form",
    "syntax",
    "semantics",
    "event-structure",
    "information-structure",
    "valency",
    "collocation",
    "discourse",
    "register",
    "pronunciation",
   ]),
  )
  .min(1),
 severity: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
 grammaticality: z.enum(["valid", "invalid", "marked", "uncertain"]),
 meaningAccuracy: z.enum(["preserved", "partially-preserved", "changed", "unknown"]),
 naturalness: z.enum(["natural", "acceptable", "awkward", "unknown"]),
 registerFit: z.enum(["fits", "too-formal", "too-casual", "genre-bound", "unknown"]),
 status: z.enum(["confirmed", "reviewed", "contested", "rejected"]),
 confidence: z.number().min(0).max(1),
 sourceIds: z.array(z.string().min(1)),
 createdAt: z.iso.datetime(),
});

export const masteryEvidenceSchema = z.strictObject({
 id: z.string().min(1),
 userId: z.string().min(1),
 knowledgeNodeId: knowledgeNodeIdSchema,
 attemptId: z.string().min(1),
 dimension: masteryDimensionSchema,
 outcome: z.enum(["success", "partial", "failure", "contested"]),
 opportunityType: opportunityTypeSchema,
 hintLevel: z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
 ]),
 confidence: confidenceSchema.nullable(),
 mode: z.enum(["recognition", "writing", "speaking", "revision"]),
 reasonCodes: z.array(z.string().min(1)),
 observedAt: z.iso.datetime(),
});

export const evidenceCoverageSchema = z.strictObject({
 M1: z.number().int().nonnegative(),
 M2: z.number().int().nonnegative(),
 M3: z.number().int().nonnegative(),
 M4: z.number().int().nonnegative(),
 M5: z.number().int().nonnegative(),
});

export const learnerNodeStateSchema = z.strictObject({
 userId: z.string().min(1),
 knowledgeNodeId: knowledgeNodeIdSchema,
 state: learnerNodeStatusSchema,
 evidenceCoverage: evidenceCoverageSchema,
 recurrenceRate: z.number().min(0).max(1).nullable(),
 type1ErrorRate: z.number().min(0).max(1).nullable(),
 hintDependence: z.number().min(0).max(1).nullable(),
 lastObservedAt: z.iso.datetime().nullable(),
 nextReviewAt: z.iso.datetime().nullable(),
 version: z.number().int().positive(),
});

export const nodeStateTransitionSchema = z.strictObject({
 id: z.string().min(1),
 userId: z.string().min(1),
 knowledgeNodeId: knowledgeNodeIdSchema,
 fromState: learnerNodeStatusSchema,
 toState: learnerNodeStatusSchema,
 evidenceIds: z.array(z.string().min(1)),
 reasonCodes: z.array(z.string().min(1)).min(1),
 algorithmVersion: z.string().min(1),
 createdAt: z.iso.datetime(),
});

export const calibrationItemSchema = z.strictObject({
 id: z.string().min(1),
 version: z.string().min(1),
 knowledgeNodeId: knowledgeNodeIdSchema,
 dimension: masteryDimensionSchema,
 promptVi: z.string().min(1),
 contextZh: z.string().min(1),
 options: z.array(z.strictObject({ id: z.string().min(1), textZh: z.string().min(1) })).min(2),
 correctOptionId: z.string().min(1),
 decisionQuestionVi: z.string().min(1),
 explanationVi: z.string().min(1),
 selfCorrectionPromptVi: z.string().min(1),
 parallelItemId: z.string().nullable(),
 opportunityRuleId: z.string().min(1),
});

export const calibrationAnswerSchema = z.strictObject({
 itemId: z.string().min(1),
 selectedOptionId: z.string().min(1),
 confidence: confidenceSchema,
 selfCorrectionText: z.string(),
 hintLevel: z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
 ]),
 submittedAt: z.iso.datetime(),
});

export const calibrationSessionSchema = z.strictObject({
 id: z.string().min(1),
 status: z.enum(["active", "paused", "completed"]),
 itemIds: z.array(z.string().min(1)).min(1),
 currentIndex: z.number().int().nonnegative(),
 answers: z.array(calibrationAnswerSchema),
 startedAt: z.iso.datetime(),
 updatedAt: z.iso.datetime(),
});

export const personalLearningStoreSchema = z.strictObject({
 schemaVersion: z.literal(1),
 attempts: z.array(learningAttemptSchema),
 revisions: z.array(attemptRevisionSchema),
 intentRevisions: z.array(attemptIntentRevisionSchema),
 hypotheses: z.array(errorHypothesisSchema),
 annotations: z.array(errorAnnotationSchema),
 evidence: z.array(masteryEvidenceSchema),
 nodeStates: z.array(learnerNodeStateSchema),
 transitions: z.array(nodeStateTransitionSchema),
 calibrationSession: calibrationSessionSchema.nullable(),
});

export type KnowledgeNodeId = z.output<typeof knowledgeNodeIdSchema>;
export type MasteryDimension = z.output<typeof masteryDimensionSchema>;
export type LearnerNodeStatus = z.output<typeof learnerNodeStatusSchema>;
export type OpportunityType = z.output<typeof opportunityTypeSchema>;
export type Confidence = z.output<typeof confidenceSchema>;
export type KnowledgeNode = z.output<typeof knowledgeNodeSchema>;
export type SourceReference = z.output<typeof sourceReferenceSchema>;
export type DiagnosticTask = z.output<typeof diagnosticTaskSchema>;
export type LearningAttempt = z.output<typeof learningAttemptSchema>;
export type AttemptRevision = z.output<typeof attemptRevisionSchema>;
export type AttemptIntentRevision = z.output<typeof attemptIntentRevisionSchema>;
export type ErrorHypothesis = z.output<typeof errorHypothesisSchema>;
export type ErrorAnnotation = z.output<typeof errorAnnotationSchema>;
export type MasteryEvidence = z.output<typeof masteryEvidenceSchema>;
export type LearnerNodeState = z.output<typeof learnerNodeStateSchema>;
export type NodeStateTransition = z.output<typeof nodeStateTransitionSchema>;
export type CalibrationItem = z.output<typeof calibrationItemSchema>;
export type CalibrationAnswer = z.output<typeof calibrationAnswerSchema>;
export type CalibrationSession = z.output<typeof calibrationSessionSchema>;
export type PersonalLearningStore = z.output<typeof personalLearningStoreSchema>;

export const emptyPersonalLearningStore: PersonalLearningStore = {
 schemaVersion: 1,
 attempts: [],
 revisions: [],
 intentRevisions: [],
 hypotheses: [],
 annotations: [],
 evidence: [],
 nodeStates: [],
 transitions: [],
 calibrationSession: null,
};
