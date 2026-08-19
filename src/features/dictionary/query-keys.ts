export const dictionaryQueryKeys = {
 vocabListRoot: ["vocab-list"],
 vocabDetail: (hanzi: string) => ["vocab-detail", hanzi],
 inspector: (hanzi: string, lessonId: string) => ["vocab-inspector", lessonId, hanzi],
};
