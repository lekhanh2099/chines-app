import type { AiAnalysis } from "@/types/database";

export type StudyMode =
 | "list"
 | "guess"
 | "flashcard"
 | "write"
 | "examples"
 | "quiz"
 | "reverse";

export type MainTab = "study" | "all" | "edit";

export type WordFilter =
 | "all"
 | "new"
 | "learning"
 | "mastered"
 | "examples"
 | "missing";

export type ImportMode = "paste" | "manual";

export type FlashStatus = "new" | "known" | "hard" | "again";
export type FlashStatusFilter = "all" | FlashStatus;
export type FlashOrder = "lesson" | "random" | "hardFirst";
export type FlashFrontMode = "hanzi" | "meaning" | "pinyin";
export type AutoplayBehavior = "flipNext" | "frontOnly" | "speakFlipNext";

export type ImportedEntryDraft = {
 hanzi: string;
 pinyin: string;
 sino_vietnamese?: string;
 meaning: string;
 word_type?: string;
 category?: string;
 row_number?: number;
 ai_analysis: AiAnalysis;
};

export type {
 VocabData,
 VocabWithProgress,
 AiAnalysis,
} from "@/types/database";
