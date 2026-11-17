/** Counters the converter fills in while it walks one source item. */
export type ExerciseCoverage = {
 lessonId: string;
 sectionType: string;
 itemId: string;
 itemType: string;
 title: string;
 /** Blocks written for the item, including its heading and instruction. */
 blocks: number;
 /** Blocks beyond the heading and instruction. */
 contentBlocks: number;
 questions: number;
 /** `prompt → answer` blocks and rows of answer tables. */
 answered: number;
 /** Subset of `answered` the reader parses as an A/B/C/D choice. */
 choiceAnswers: number;
 /** Subset of `answered` written as rows of a table with hidden answer columns. */
 tableAnswers: number;
 /** Questions whose source has no answer; written as plain prompts. */
 unanswered: number;
 /** Answers written in a hidden `Đáp án: →` block because they cannot be tied to one prompt. */
 keyBlockAnswers: number;
 /** Answers were moved off instruction lines onto the questions they belong to. */
 realigned: boolean;
 /** The source has answers but their pairing is ambiguous; they sit in a key block. */
 unaligned: boolean;
 /** The item only points at another section (reading, communication, character writing). */
 referenceOnly: boolean;
};

export type SectionCoverage = {
 lessonId: string;
 sectionType: string;
 sourceItems: number;
 emittedBlocks: number;
};

export type IgnoredTextCoverage = {
 lessonId: string;
 sectionType: string;
 path: string;
 characters: number;
 sample: string;
};

export type LessonCoverage = {
 lessonId: string;
 sourceLessonId: string;
 vocabIn: number;
 vocabOut: number;
 textFallback: boolean;
 grammarExamples: number;
 grammarExamplesInline: number;
 sections: SectionCoverage[];
 exercises: ExerciseCoverage[];
 ignoredText: IgnoredTextCoverage[];
};

export function createExerciseCoverage(
 identity: Pick<ExerciseCoverage, "lessonId" | "sectionType" | "itemId" | "itemType" | "title">,
): ExerciseCoverage {
 return {
  ...identity,
  blocks: 0,
  contentBlocks: 0,
  questions: 0,
  answered: 0,
  choiceAnswers: 0,
  tableAnswers: 0,
  unanswered: 0,
  keyBlockAnswers: 0,
  realigned: false,
  unaligned: false,
  referenceOnly: false,
 };
}
