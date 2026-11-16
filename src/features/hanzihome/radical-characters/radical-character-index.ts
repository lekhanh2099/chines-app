import type {
 RadicalCharacter,
 RadicalCharacterSet,
 RadicalCharactersContent,
} from "./radical-characters.schemas";

export type RadicalCharacterNote = {
 character: RadicalCharacter;
 groupName: string;
 radical: Pick<RadicalCharacterSet, "order" | "radical" | "hanViet" | "radicalId">;
};

export type RadicalCharacterIndex = {
 sets: RadicalCharacterSet[];
 /** Notes by written form (simplified, traditional or variant). */
 notesByForm: ReadonlyMap<string, RadicalCharacterNote[]>;
};

export function buildRadicalCharacterIndex(
 content: RadicalCharactersContent,
): RadicalCharacterIndex {
 const notesByForm = new Map<string, RadicalCharacterNote[]>();
 for (const set of content.radicals) {
  const radical = {
   order: set.order,
   radical: set.radical,
   hanViet: set.hanViet,
   radicalId: set.radicalId,
  };
  for (const group of set.groups) {
   for (const character of group.characters) {
    const note = { character, groupName: group.name, radical };
    for (const form of [character.hanzi, ...character.otherForms]) {
     notesByForm.set(form, [...(notesByForm.get(form) ?? []), note]);
    }
   }
  }
 }
 return { sets: content.radicals, notesByForm };
}

/** The character set that explains `hanzi`, preferring the first radical that lists it. */
export function findRadicalCharacterSet(
 index: RadicalCharacterIndex,
 hanzi: string,
): RadicalCharacterSet[] {
 const order = index.notesByForm.get(hanzi)?.[0]?.radical.order;
 return index.sets.filter((set) => set.order === order);
}
