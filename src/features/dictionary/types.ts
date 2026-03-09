import type {
 AiAnalysis,
 AiRelatedCompound,
 AiWordRelation,
 PersonalNoteMode,
 VocabData,
} from "@/types/database";

export type ExampleItem = {
 zh: string;
 pinyin: string;
 vi: string;
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

export type HanziWriterInstance = {
 animateCharacter?: () => Promise<unknown>;
 hideCharacter?: (options?: { duration?: number }) => Promise<unknown>;
 quiz?: (options?: { onComplete?: () => void }) => Promise<unknown>;
 cancelQuiz?: () => void;
};

export type DictionarySentenceViewModel = {
 mode: "sentence";
 text: string;
 characters: string[];
 isLoading: boolean;
 translation: string;
 pinyin: string;
 error: string | null;
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
 ai: AiAnalysis | undefined;
 meaningSummary: string;
 meaningItems: MeaningItem[];
 extraExamples: ExampleItem[];
 relatedCompounds: AiRelatedCompound[];
 synonyms: AiWordRelation[];
 antonyms: AiWordRelation[];
 hasLearningInsights: boolean;
 canRenderDashboard: boolean;
 isAiLoading: boolean;
 isSaved: boolean | null;
 isSaving: boolean;
 srsLevel: number | null;
 srsStatusLabel: string;
 savedPersonalNote: string;
 personalNoteMode: PersonalNoteMode;
 requestAiAnalysis: () => void;
 handleSpeak: () => void;
 handleSave: () => void;
 handleSavePersonalNote: (note: string) => void;
};

export type DictionaryWordViewModel =
 | DictionaryWordLoadingViewModel
 | DictionaryWordNotFoundViewModel
 | DictionaryWordReadyViewModel;

export type DictionaryPageViewModel =
 | DictionarySentenceViewModel
 | DictionaryWordViewModel;
