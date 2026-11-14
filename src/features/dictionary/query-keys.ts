type UserScope = string | null;

export const dictionaryQueryKeys = {
 vocabListRoot: (userId: UserScope) => ["vocab-list", userId],
 vocabDetail: (userId: UserScope, hanzi: string) => ["vocab-detail", userId, hanzi],
 inspector: (hanzi: string, lessonId: string) => ["vocab-inspector", lessonId, hanzi],
};
