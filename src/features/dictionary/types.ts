import type {
 AiRelatedCompound,
 AiWordRelation,
 PersonalNoteMode,
 VocabData,
} from "@/types/database";
import { z } from "zod";

export type ExampleItem = {
 zh: string;
 pinyin: string;
 vi: string;
 note?: string;
};

export type MeaningItem = {
 meaning: string;
 pos?: string;
 examples: ExampleItem[];
};

export type StructureComponent = {
 part?: string;
 name?: string;
 meaning?: string;
};

export type DictionarySentenceViewModel = {
 mode: "sentence";
 text: string;
 characters: string[];
 isLoading: boolean;
 translation: string;
 pinyin: string;
 error: z.infer<z.ZodNullable<z.ZodString>>;
};

export type DictionaryWordLoadingViewModel = {
 mode: "word";
 state: "loading";
};

export type DictionaryWordNotFoundViewModel = {
 mode: "word";
 state: "not-found";
};

export type DictionaryWordReadyViewModel = {
 mode: "word";
 state: "ready";
 rawText: string;
 chineseCharacters: string[];
 selectedCharacter: string;
 setActiveCharacter: (character: string) => void;
 vocabData: VocabData;
 ai: VocabData["ai_analysis"];
 meaningSummary: string;
 meaningItems: MeaningItem[];
 extraExamples: ExampleItem[];
 relatedCompounds: AiRelatedCompound[];
 synonyms: AiWordRelation[];
 antonyms: AiWordRelation[];
 hasLearningInsights: boolean;
 canRenderDashboard: boolean;
 isAiLoading: boolean;
 isSaved: z.infer<z.ZodNullable<z.ZodBoolean>>;
 isSaving: boolean;
 srsLevel: z.infer<z.ZodNullable<z.ZodNumber>>;
 srsStatusLabel: string;
 savedPersonalNote: string;
 personalNoteMode: PersonalNoteMode;
 requestAiAnalysis: () => void;
 handleSpeak: () => void;
 handleSave: () => void;
 handleSavePersonalNote: (note: string) => void;
};

type DictionaryWordViewModelMap = {
 loading: DictionaryWordLoadingViewModel;
 notFound: DictionaryWordNotFoundViewModel;
 ready: DictionaryWordReadyViewModel;
};
export type DictionaryWordViewModel = DictionaryWordViewModelMap[keyof DictionaryWordViewModelMap];

type DictionaryPageViewModelMap = {
 sentence: DictionarySentenceViewModel;
 word: DictionaryWordViewModel;
};
export type DictionaryPageViewModel = DictionaryPageViewModelMap[keyof DictionaryPageViewModelMap];
