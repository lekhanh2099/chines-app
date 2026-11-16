import "server-only";

import radicalCharacters from "../static-json/radical-characters.json";
import { buildRadicalCharacterIndex, findRadicalCharacterSet } from "./radical-character-index";
import { radicalCharactersContentSchema } from "./radical-characters.schemas";

const index = buildRadicalCharacterIndex(radicalCharactersContentSchema.parse(radicalCharacters));

/** The radical character set that explains `hanzi`; empty when the character has no note. */
export function getRadicalCharacterSets(hanzi: string) {
 return findRadicalCharacterSet(index, hanzi);
}
