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
