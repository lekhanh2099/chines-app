import type {
 HskGrammarExampleTier,
 HskGrammarLevel,
} from "./hsk-grammar.schemas";

export const HSK_GRAMMAR_LEVELS: readonly HskGrammarLevel[] = [
 "HSK1",
 "HSK2",
 "HSK3",
 "HSK4",
 "HSK5",
 "HSK6",
];

export const HSK_GRAMMAR_LEVEL_META: Record<
 HskGrammarLevel,
 { itemCount: number; assetKey: string; partCount: number }
> = {
 HSK1: { itemCount: 40, assetKey: "hsk1", partCount: 3 },
 HSK2: { itemCount: 97, assetKey: "hsk2", partCount: 4 },
 HSK3: { itemCount: 141, assetKey: "hsk3", partCount: 5 },
 HSK4: { itemCount: 161, assetKey: "hsk4", partCount: 7 },
 HSK5: { itemCount: 83, assetKey: "hsk5", partCount: 5 },
 HSK6: { itemCount: 55, assetKey: "hsk6", partCount: 4 },
};

export const HSK_GRAMMAR_EXAMPLE_TIERS: readonly HskGrammarExampleTier[] = [
 "source",
 "basic",
 "natural",
 "advanced",
 "contrast",
];

export function isHskGrammarLevel(value: string | null): value is HskGrammarLevel {
 return value !== null && HSK_GRAMMAR_LEVELS.some((level) => level === value);
}

export function normalizeHskGrammarSearch(value: string) {
 return value.trim().toLocaleLowerCase("vi-VN");
}
