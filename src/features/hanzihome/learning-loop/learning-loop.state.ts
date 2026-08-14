import {
 learningEventSchema,
 learningSessionSchema,
 reviewItemSchema,
 type LearningActivity,
 type LearningEventKind,
 type LearningLoopState,
 type LearningSessionStatus,
 type ReviewItemKind,
 type ReviewRating,
} from "@/features/hanzihome/learning-loop/learning-loop.schemas";
import { scheduleReviewItem } from "@/features/hanzihome/learning-loop/learning-loop.scheduler";

export type RecordLearningSessionInput = {
 activity: LearningActivity;
 sourceId: string;
 href: string;
 titleZh?: string;
 titleVi?: string;
 positionLabel?: string;
 position?: Record<string, string | number | boolean>;
 progressCurrent?: number;
 progressTotal?: number;
 status?: LearningSessionStatus;
};

export type AddReviewItemInput = {
 stableKey: string;
 kind: ReviewItemKind;
 sourceId: string;
 sourceHref: string;
 titleZh?: string;
 titleVi?: string;
 promptZh: string;
 pinyin?: string;
 meaningVi?: string;
 userAnswer?: string;
 errorKey?: string;
};

export type RecordLearningEventInput = {
 kind: LearningEventKind;
 sourceId: string;
 sourceHref: string;
 term: string;
 contextText?: string;
};

export function recordLearningSessionInState(
 state: LearningLoopState,
 input: RecordLearningSessionInput,
 id: string,
 now = new Date(),
): LearningLoopState {
 const timestamp = now.toISOString();
 const current = state.latestSession;
 const sessionId =
  current?.activity === input.activity && current.sourceId === input.sourceId ? current.id : id;
 const session = learningSessionSchema.parse({
  id: sessionId,
  activity: input.activity,
  sourceId: input.sourceId,
  href: input.href,
  titleZh: input.titleZh ?? "",
  titleVi: input.titleVi ?? "",
  positionLabel: input.positionLabel ?? "",
  position: input.position ?? {},
  progressCurrent: input.progressCurrent ?? 0,
  progressTotal: input.progressTotal ?? 0,
  status: input.status ?? "active",
  startedAt: current?.id === sessionId ? current.startedAt : timestamp,
  updatedAt: timestamp,
 });

 return { ...state, latestSession: session };
}

export function addReviewItemInState(
 state: LearningLoopState,
 input: AddReviewItemInput,
 now = new Date(),
): LearningLoopState {
 const timestamp = now.toISOString();
 const id = `review:${input.kind}:${input.stableKey}`;
 const current = state.reviewItems.find((item) => item.id === id);
 const item = reviewItemSchema.parse({
  id,
  kind: input.kind,
  sourceId: input.sourceId,
  sourceHref: input.sourceHref,
  titleZh: input.titleZh ?? "",
  titleVi: input.titleVi ?? "",
  promptZh: input.promptZh,
  pinyin: input.pinyin ?? "",
  meaningVi: input.meaningVi ?? "",
  userAnswer: input.userAnswer ?? "",
  errorKey: input.errorKey ?? "",
  state: current === undefined ? "new" : "learning",
  dueAt: timestamp,
  intervalDays: 0,
  correctStreak: 0,
  lapseCount: current === undefined ? 0 : current.lapseCount + 1,
  createdAt: current?.createdAt ?? timestamp,
  updatedAt: timestamp,
 });

 return {
  ...state,
  reviewItems: [...state.reviewItems.filter((entry) => entry.id !== item.id), item],
 };
}

export function rateReviewItemInState(
 state: LearningLoopState,
 id: string,
 rating: ReviewRating,
 now = new Date(),
): LearningLoopState {
 const current = state.reviewItems.find((item) => item.id === id);
 if (current === undefined) throw new Error("Review item not found.");
 const updated = scheduleReviewItem(current, rating, now);

 return {
  ...state,
  reviewItems: state.reviewItems.map((item) => (item.id === id ? updated : item)),
 };
}

export function recordLearningEventInState(
 state: LearningLoopState,
 input: RecordLearningEventInput,
 id: string,
 now = new Date(),
): LearningLoopState {
 const event = learningEventSchema.parse({
  id,
  kind: input.kind,
  sourceId: input.sourceId,
  sourceHref: input.sourceHref,
  term: input.term,
  contextText: input.contextText ?? "",
  createdAt: now.toISOString(),
 });

 return {
  ...state,
  events: [...state.events, event].slice(-5_000),
 };
}
