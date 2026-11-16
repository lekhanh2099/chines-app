import radicalCharacterForms from "../static-json/radical-character-forms.json";

const explainedForms = new Set(radicalCharacterForms.forms);

/** Distinct characters of `text` that have an explanation, in reading order. */
export function explainedCharactersIn(text: string): string[] {
 return [...new Set(text)].filter((character) => explainedForms.has(character));
}

/** Detail page of one explained character. */
export function radicalCharacterHref(hanzi: string): string {
 return `/radicals/characters/${encodeURIComponent(hanzi)}`;
}

/** Detail page of one radical from the radical catalog. */
export function radicalHref(radicalId: string): string {
 return `/radicals/${encodeURIComponent(radicalId)}`;
}
