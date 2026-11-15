export function getActiveCharacterIndex(
 characterCount: number,
 startIndex: number,
 activeCharacterCount: number,
 progress: number,
) {
 if (characterCount === 0 || startIndex < 0 || activeCharacterCount <= 0) return -1;

 const boundedProgress = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
 const offset = Math.min(
  activeCharacterCount - 1,
  Math.floor(boundedProgress * activeCharacterCount),
 );

 return Math.min(characterCount - 1, startIndex + offset);
}
