import type { HanziHomeEditableRecordMeta } from "@/features/hanzihome/types";
import { z } from "zod";

export const LISTENING_CATEGORIES = ["listening_comprehension", "pronunciation", "extra_practice"];

type ListeningCategory = (typeof LISTENING_CATEGORIES)[number];

export const LISTENING_ITEM_TYPES = [
 "sentence_mcq",
 "dialogue_mcq",
 "passage_mcq",
 "stress_choice",
 "true_false",
 "matching",
 "fill_blank",
 "open_answer",
 "oral_response",
 "shadowing",
 "dictation",
];

type ListeningItemType = (typeof LISTENING_ITEM_TYPES)[number];

const ListeningTranscriptVoiceSchema = z.enum(["male", "female", "neutral"]);
type ListeningTranscriptVoice = z.infer<typeof ListeningTranscriptVoiceSchema>;
const ListeningTranscriptModeSchema = z.enum(["dialogue", "monologue"]);
type ListeningTranscriptMode = z.infer<typeof ListeningTranscriptModeSchema>;

type ListeningTranscriptSpeaker = {
 id: string;
 labelZh: string;
 labelVi: string;
 voice: ListeningTranscriptVoice;
};

type ListeningTranscriptLine = {
 order: number;
 speakerId: string;
 zh: string;
 pinyin: string;
 vi?: string;
};

type ListeningTranscriptText = {
 zh: string;
 pinyin: string;
 vi?: string;
};

export type ListeningTranscript = {
 mode: ListeningTranscriptMode;
 speakers: ListeningTranscriptSpeaker[];
 lines: ListeningTranscriptLine[];
 full: ListeningTranscriptText;
};

type ListeningOption = {
 key: string;
 textZh: string;
 textVi?: string;
};

const ListeningAnswerSchema = z.discriminatedUnion("type", [
 z.object({ type: z.literal("choice"), value: z.string() }),
 z.object({ type: z.literal("boolean"), value: z.boolean() }),
 z.object({ type: z.literal("text"), accepted: z.array(z.string()) }),
 z.object({
  type: z.literal("matching"),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })),
 }),
]);
type ListeningAnswer = z.infer<typeof ListeningAnswerSchema>;

export type ListeningItemQuery = {
 lessonId: string;
 sectionId?: string;
 category?: ListeningCategory;
 itemType?: ListeningItemType;
 offset?: number;
 limit?: number;
};

export const LISTENING_EXERCISE_TYPES = [
 "single_choice",
 "short_answer",
 "oral_response",
 "true_false",
 "matching",
 "same_different",
 "shadowing",
 "stress_choice",
 "fill_blank",
];

export type ListeningExerciseType = (typeof LISTENING_EXERCISE_TYPES)[number];

export type ListeningRuntimeOption = ListeningOption & {
 stress?: string[];
};

export type ListeningMatchingSide = {
 id: string;
 textZh: string;
 textVi?: string;
};

type ListeningItemMetadata = {
 variant?: ListeningExerciseType;
 promptVi?: string;
 sampleAnswerZh?: string;
 sampleAnswerVi?: string;
 printedPinyin?: string;
 heardZh?: string;
 heardPinyin?: string;
 pinyin?: string;
 translationVi?: string;
 groupId?: string;
 groupTitleZh?: string;
 groupTitleVi?: string;
 promptParts?: [string, string];
 acceptedAnswers?: string[];
 answerDisplay?: string;
 left?: ListeningMatchingSide[];
 right?: ListeningMatchingSide[];
};

export type ListeningRuntimeItem = {
 id: string;
 sectionId: string;
 order: number;
 type: ListeningItemType;
 transcript?: ListeningTranscript;
 promptZh?: string;
 options: ListeningRuntimeOption[];
 answer?: ListeningAnswer;
 explanationVi?: string;
 metadata: ListeningItemMetadata;
 editMeta?: HanziHomeEditableRecordMeta;
};

export type ListeningRuntimeSection = {
 id: string;
 sourceSectionId: string;
 order: number;
 category: ListeningCategory;
 titleZh: string;
 titleVi?: string;
 exerciseType: ListeningExerciseType;
 transcript?: ListeningTranscript;
 suggestionsZh: string[];
};

export type ListeningLessonBundle = {
 lesson: {
  id: string;
  titleZh: string;
  titleVi?: string;
 };
 sections: ListeningRuntimeSection[];
 items: ListeningRuntimeItem[];
};
