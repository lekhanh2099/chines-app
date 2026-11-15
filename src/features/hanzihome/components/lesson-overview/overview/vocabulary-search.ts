function normalizeVocabularySearch(value: string) {
 return value.normalize("NFC").trim().toLocaleLowerCase("vi");
}

/** One search rule for every vocabulary list: case/normalization-insensitive substring over the given fields. */
export function matchesVocabularyQuery(query: string, fields: readonly string[]) {
 const normalizedQuery = normalizeVocabularySearch(query);
 return !normalizedQuery || normalizeVocabularySearch(fields.join(" ")).includes(normalizedQuery);
}
