export const dictionaryQueryKeys = {
 vocabListRoot: ["vocab-list"] as const,
 vocabDetail: (hanzi: string) => ["vocab-detail", hanzi] as const,
};
