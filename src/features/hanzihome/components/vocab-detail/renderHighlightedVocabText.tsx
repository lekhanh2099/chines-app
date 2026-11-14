export function renderHighlightedVocabText(text: string, keyword: string) {
 if (!keyword || !text.includes(keyword)) return text;

 return text.split(keyword).map((part, index, parts) => (
  <span key={`${part}-${index}`}>
   {part}
   {index < parts.length - 1 && (
    <mark className="bg-transparent font-black text-accent-text">{keyword}</mark>
   )}
  </span>
 ));
}
