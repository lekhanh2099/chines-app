function stripPunctuation(text: string): string {
 return text.replace(/[\s\p{P}\p{S}]+/gu, "");
}

export function normalizeChineseAnswer(text: string): string {
 return stripPunctuation(text.normalize("NFKC"));
}

export function normalizeVietnameseAnswer(text: string): string {
 return text
  .normalize("NFKC")
  .toLocaleLowerCase("vi-VN")
  .replace(/[\p{P}\p{S}]+/gu, " ")
  .replace(/\s+/gu, " ")
  .trim();
}

export function levenshteinDistance(left: string, right: string): number {
 const leftCharacters = Array.from(left);
 const rightCharacters = Array.from(right);
 const previous = Array.from({ length: rightCharacters.length + 1 }, (_, index) => index);

 for (let leftIndex = 1; leftIndex <= leftCharacters.length; leftIndex += 1) {
  const current = [leftIndex];
  for (let rightIndex = 1; rightIndex <= rightCharacters.length; rightIndex += 1) {
   const substitutionCost =
    leftCharacters[leftIndex - 1] === rightCharacters[rightIndex - 1] ? 0 : 1;
   current[rightIndex] = Math.min(
    (current[rightIndex - 1] ?? 0) + 1,
    (previous[rightIndex] ?? 0) + 1,
    (previous[rightIndex - 1] ?? 0) + substitutionCost,
   );
  }
  previous.splice(0, previous.length, ...current);
 }
 return previous[rightCharacters.length] ?? 0;
}

export function calculateChineseAccuracy(expected: string, actual: string): number {
 const normalizedExpected = normalizeChineseAnswer(expected);
 const normalizedActual = normalizeChineseAnswer(actual);
 if (normalizedExpected.length === 0) return normalizedActual.length === 0 ? 100 : 0;
 const distance = levenshteinDistance(normalizedExpected, normalizedActual);
 const denominator = Math.max(
  Array.from(normalizedExpected).length,
  Array.from(normalizedActual).length,
  1,
 );
 return Math.max(0, Math.round((1 - distance / denominator) * 100));
}

function tokenFrequency(tokens: string[]): Map<string, number> {
 const frequencies = new Map<string, number>();
 for (const token of tokens) frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
 return frequencies;
}

export function calculateTranslationSimilarity(reference: string, actual: string): number {
 const normalizedReference = normalizeVietnameseAnswer(reference);
 const normalizedActual = normalizeVietnameseAnswer(actual);
 if (normalizedReference.length === 0) return normalizedActual.length === 0 ? 100 : 0;
 if (normalizedActual.length === 0) return 0;

 const referenceTokens = normalizedReference.split(" ").filter(Boolean);
 const actualTokens = normalizedActual.split(" ").filter(Boolean);
 const referenceFrequency = tokenFrequency(referenceTokens);
 const actualFrequency = tokenFrequency(actualTokens);
 let overlap = 0;
 for (const [token, count] of referenceFrequency) {
  overlap += Math.min(count, actualFrequency.get(token) ?? 0);
 }
 const precision = actualTokens.length === 0 ? 0 : overlap / actualTokens.length;
 const recall = referenceTokens.length === 0 ? 0 : overlap / referenceTokens.length;
 const tokenF1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
 const editRatio = Math.max(
  0,
  1 -
   levenshteinDistance(normalizedReference, normalizedActual) /
    Math.max(normalizedReference.length, normalizedActual.length, 1),
 );
 return Math.round((tokenF1 * 0.65 + editRatio * 0.35) * 100);
}
