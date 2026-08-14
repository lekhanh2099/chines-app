import {
 calibrationItems,
 getCalibrationItem,
 getPrimaryCalibrationItemIds,
} from "../data/calibration-items";
import { personalLearningKnowledgeNodes } from "../data/knowledge-registry";
import {
 attemptRevisionSchema,
 calibrationAnswerSchema,
 calibrationSessionSchema,
 errorHypothesisSchema,
 learningAttemptSchema,
 masteryEvidenceSchema,
 nodeStateTransitionSchema,
 personalLearningStoreSchema,
 type CalibrationItem,
 type CalibrationSession,
 type Confidence,
 type PersonalLearningStore,
} from "../domain/personal-learning.schemas";
import {
 deriveLearnerNodeState,
 getPersonalLearningAlgorithmVersion,
} from "../domain/personal-learning.state";

export type SubmitCalibrationInput = {
 confidence: Confidence;
 itemId: string;
 revisionHintLevel: 0 | 1 | 2 | 3 | 4 | 5 | 6;
 selectedOptionId: string;
 selfCorrectionText: string;
};

type CalibrationContext = {
 now: string;
 userId: string;
 createId: () => string;
};

export function renderCalibrationAnswer(item: CalibrationItem, selectedOptionId: string): string {
 const option = item.options.find((entry) => entry.id === selectedOptionId);
 if (option === undefined) return item.contextZh;
 const replacements = option.textZh.split(/\s*\/\s*/u);
 let replacementIndex = 0;
 return item.contextZh.replaceAll("___", () => {
  const replacement = replacements[replacementIndex] ?? replacements.at(-1) ?? option.textZh;
  replacementIndex += 1;
  return replacement;
 });
}

function refreshNodeStates(
 store: PersonalLearningStore,
 context: CalibrationContext,
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
   nextStore = {
    ...nextStore,
    transitions: [
     ...nextStore.transitions,
     nodeStateTransitionSchema.parse({
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
     }),
    ],
   };
  }
  return result.nodeState;
 });
 return personalLearningStoreSchema.parse({ ...nextStore, nodeStates: nextStates });
}

export function buildCalibrationSession(
 store: PersonalLearningStore,
 context: CalibrationContext,
): CalibrationSession {
 const skippedNodeIds = store.nodeStates
  .filter((entry) => entry.state === "STABLE_TRANSFER" || entry.state === "AUTOMATING")
  .map((entry) => entry.knowledgeNodeId);
 const itemIds = getPrimaryCalibrationItemIds(skippedNodeIds);
 const safeItemIds =
  itemIds.length === 0
   ? calibrationItems.filter((item) => item.id.endsWith("-primary")).map((item) => item.id)
   : itemIds;
 return calibrationSessionSchema.parse({
  id: context.createId(),
  status: "active",
  itemIds: safeItemIds,
  currentIndex: 0,
  answers: [],
  startedAt: context.now,
  updatedAt: context.now,
 });
}

export function startOrResumeCalibrationInState(
 store: PersonalLearningStore,
 context: CalibrationContext,
): PersonalLearningStore {
 const session =
  store.calibrationSession !== null && store.calibrationSession.status !== "completed"
   ? calibrationSessionSchema.parse({
      ...store.calibrationSession,
      status: "active",
      updatedAt: context.now,
     })
   : buildCalibrationSession(store, context);
 return personalLearningStoreSchema.parse({ ...store, calibrationSession: session });
}

export function pauseCalibrationInState(
 store: PersonalLearningStore,
 context: CalibrationContext,
): PersonalLearningStore {
 if (store.calibrationSession === null) return store;
 return personalLearningStoreSchema.parse({
  ...store,
  calibrationSession: calibrationSessionSchema.parse({
   ...store.calibrationSession,
   status: "paused",
   updatedAt: context.now,
  }),
 });
}

export function submitCalibrationAnswerInState(
 store: PersonalLearningStore,
 input: SubmitCalibrationInput,
 context: CalibrationContext,
): PersonalLearningStore {
 const session = store.calibrationSession;
 if (session === null) throw new Error("Calibration session not found.");
 const item = getCalibrationItem(input.itemId);
 if (item === null) throw new Error("Calibration item not found.");
 if (session.itemIds[session.currentIndex] !== item.id) {
  throw new Error("Calibration item is not the current item.");
 }
 if (session.answers.some((entry) => entry.itemId === item.id)) return store;

 const correct = input.selectedOptionId === item.correctOptionId;
 const answer = calibrationAnswerSchema.parse({
  itemId: item.id,
  selectedOptionId: input.selectedOptionId,
  confidence: input.confidence,
  selfCorrectionText: input.selfCorrectionText,
  hintLevel: input.revisionHintLevel,
  submittedAt: context.now,
 });
 const attempt = learningAttemptSchema.parse({
  id: context.createId(),
  userId: context.userId,
  sourceModule: "calibration",
  sourceItemId: item.id,
  originalInput: renderCalibrationAnswer(item, input.selectedOptionId),
  intendedMeaningVi: item.promptVi,
  inputMode: "text",
  audioAssetId: null,
  transcriptStatus: "not-applicable",
  assistanceUsed: false,
  timeLimitSeconds: null,
  durationMs: null,
  createdAt: context.now,
  contentVersion: item.version,
 });

 let revisions = store.revisions;
 let evidence = store.evidence;
 if (input.selfCorrectionText.trim().length > 0) {
  const revisionEvidenceId = context.createId();
  revisions = [
   ...revisions,
   attemptRevisionSchema.parse({
    id: context.createId(),
    attemptId: attempt.id,
    parentRevisionId: null,
    kind: "self-correction",
    text: input.selfCorrectionText.trim(),
    authorType: "user",
    evidenceIds: [revisionEvidenceId],
    createdAt: context.now,
   }),
  ];
  evidence = [
   ...evidence,
   masteryEvidenceSchema.parse({
    id: revisionEvidenceId,
    userId: context.userId,
    knowledgeNodeId: item.knowledgeNodeId,
    attemptId: attempt.id,
    dimension: "M3",
    outcome: "partial",
    opportunityType: "TYPE_2",
    hintLevel: input.revisionHintLevel,
    confidence: input.confidence,
    mode: "revision",
    reasonCodes: ["SELF_CORRECTION_AFTER_CALIBRATION_FEEDBACK"],
    observedAt: context.now,
   }),
  ];
 }

 const reasonCodes = correct
  ? input.confidence === "guess"
    ? ["CORRECT_GUESS"]
    : input.confidence === "unsure"
      ? ["CALIBRATION_SUCCESS", "LOW_CONFIDENCE"]
      : ["CALIBRATION_SUCCESS"]
  : input.selfCorrectionText.trim().length > 0
    ? ["CALIBRATION_FAILURE", "SELF_CORRECTION_ATTEMPTED"]
    : ["CALIBRATION_FAILURE"];

 evidence = [
  ...evidence,
  masteryEvidenceSchema.parse({
   id: context.createId(),
   userId: context.userId,
   knowledgeNodeId: item.knowledgeNodeId,
   attemptId: attempt.id,
   dimension: item.dimension,
   outcome: correct ? "success" : "failure",
   opportunityType: "TYPE_1",
   hintLevel: 0,
   confidence: input.confidence,
   mode: "recognition",
   reasonCodes,
   observedAt: context.now,
  }),
 ];

 const hypotheses = correct
  ? store.hypotheses
  : [
     ...store.hypotheses,
     errorHypothesisSchema.parse({
      id: context.createId(),
      attemptId: attempt.id,
      spanStart: 0,
      spanEnd: attempt.originalInput.length,
      knowledgeNodeId: item.knowledgeNodeId,
      proposedSubtype: "CALIBRATION_CONTRAST_ERROR",
      confidence: 0.9,
      explanationVi: item.explanationVi,
      intentQuestionVi: null,
      candidateRevisionIds: [],
      detector: "rule",
      detectorVersion: "calibration-v1.0.0",
      status: "pending",
      createdAt: context.now,
     }),
    ];
 const needsParallel = !correct || input.confidence !== "sure";
 const nextItemIds =
  needsParallel && item.parallelItemId !== null && !session.itemIds.includes(item.parallelItemId)
   ? [
      ...session.itemIds.slice(0, session.currentIndex + 1),
      item.parallelItemId,
      ...session.itemIds.slice(session.currentIndex + 1),
     ]
   : session.itemIds;
 const nextIndex = session.currentIndex + 1;
 const nextSession = calibrationSessionSchema.parse({
  ...session,
  itemIds: nextItemIds,
  currentIndex: nextIndex,
  answers: [...session.answers, answer],
  status: nextIndex >= nextItemIds.length ? "completed" : "active",
  updatedAt: context.now,
 });

 return refreshNodeStates(
  {
   ...store,
   attempts: [...store.attempts, attempt],
   revisions,
   hypotheses,
   evidence,
   calibrationSession: nextSession,
  },
  context,
 );
}

export function getCurrentCalibrationItem(session: CalibrationSession): CalibrationItem | null {
 const itemId = session.itemIds[session.currentIndex];
 return itemId === undefined ? null : getCalibrationItem(itemId);
}
