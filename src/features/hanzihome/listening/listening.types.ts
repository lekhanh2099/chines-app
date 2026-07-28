import type { HanziHomeEditableRecordMeta } from "@/features/hanzihome/types";
import { z } from "zod";

export const LISTENING_CATEGORIES = ["listening_comprehension", "pronunciation", "extra_practice"];

export type ListeningCategory = (typeof LISTENING_CATEGORIES)[number];

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

export type ListeningItemType = (typeof LISTENING_ITEM_TYPES)[number];

export type ListeningCourse = {
 id: string;
 slug: string;
 title: string;
 subtitle?: string;
 type: "listening";
 order: number;
};

export type ListeningBook = {
 id: string;
 courseId: string;
 title: string;
 shortTitle?: string;
 order: number;
};

export type ListeningLesson = {
 id: string;
 bookId: string;
 lessonNumber: number;
 order: number;
 titleZh: string;
};

export type ListeningCatalog = {
 course: ListeningCourse;
 books: ListeningBook[];
 lessons: ListeningLesson[];
};

export type ListeningExerciseSection = {
 id: string;
 order: number;
 category: ListeningCategory;
 instructionZh?: string;
 instructionVi?: string;
};

export const ListeningTranscriptVoiceSchema = z.enum(["male", "female", "neutral"]);
export type ListeningTranscriptVoice = z.infer<typeof ListeningTranscriptVoiceSchema>;
export const ListeningTranscriptModeSchema = z.enum(["dialogue", "monologue"]);
export type ListeningTranscriptMode = z.infer<typeof ListeningTranscriptModeSchema>;

export type ListeningTranscriptSpeaker = {
 id: string;
 labelZh: string;
 labelVi: string;
 voice: ListeningTranscriptVoice;
};

export type ListeningTranscriptLine = {
 order: number;
 speakerId: string;
 zh: string;
 pinyin: string;
 vi?: string;
};

export type ListeningTranscriptText = {
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

export type ListeningOption = {
 key: string;
 textZh: string;
 textVi?: string;
};

export const ListeningAnswerSchema = z.discriminatedUnion("type", [
 z.object({ type: z.literal("choice"), value: z.string() }),
 z.object({ type: z.literal("boolean"), value: z.boolean() }),
 z.object({ type: z.literal("text"), accepted: z.array(z.string()) }),
 z.object({
  type: z.literal("matching"),
  pairs: z.array(z.object({ left: z.string(), right: z.string() })),
 }),
]);
export type ListeningAnswer = z.infer<typeof ListeningAnswerSchema>;

export type ListeningItem = {
 id: string;
 sectionId: string;
 order: number;
 type: ListeningItemType;
 transcript?: ListeningTranscript;
 promptZh?: string;
 options?: ListeningOption[];
 answer?: ListeningAnswer;
 explanationVi?: string;
};

export type ListeningVocabularyItem = {
 id: string;
 order: number;
 word: string;
 pinyin: string;
 meaningVi: string;
 pos?: string;
 isSeparable?: true;
};

export type ListeningLessonCounts = {
 sections: number;
 items: number;
 vocabulary: number;
 itemsByType: Partial<Record<ListeningItemType, number>>;
};

export type ListeningLessonManifest = {
 schemaVersion: "3.0.0";
 lessonId: string;
 bookId: string;
 lessonNumber: number;
 files: {
  sections: string;
  vocabulary: string;
  items: Partial<Record<ListeningItemType, string>>;
 };
 counts: ListeningLessonCounts;
};

export type ListeningLessonShardRef = {
 lessonId: string;
 bookId: string;
 lessonNumber: number;
 manifest: string;
 counts: ListeningLessonCounts;
};

export type ListeningDatasetManifest = {
 schemaVersion: "3.0.0";
 datasetId: string;
 courseId: string;
 catalog: string;
 lessons: ListeningLessonShardRef[];
 totals: {
  books: number;
  lessons: number;
  sections: number;
  items: number;
  vocabulary: number;
  itemsByType: Partial<Record<ListeningItemType, number>>;
 };
};

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

export type ListeningItemMetadata = {
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
