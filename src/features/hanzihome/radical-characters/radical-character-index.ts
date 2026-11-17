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

/** Simplified, positional and variant radical forms matched inside explanation tags. */
const RADICAL_VARIANTS = new Map<string, readonly string[]>([
 ["人", ["人", "亻"]],
 ["言", ["言", "讠"]],
 ["頁", ["頁", "页"]],
 ["心", ["心", "忄"]],
 ["手", ["手", "扌"]],
 ["攴", ["攴", "攵"]],
 ["門", ["門", "门"]],
 ["糸", ["糸", "纟"]],
 ["金", ["金", "钅"]],
 ["刀", ["刀", "刂"]],
 ["貝", ["貝", "贝"]],
 ["車", ["車", "车"]],
 ["水", ["水", "氵"]],
 ["火", ["火", "灬"]],
 ["艸", ["艸", "艹"]],
 ["肉", ["肉", "月", "⺼"]],
 ["阜", ["阜", "阝"]],
 ["邑", ["邑", "阝"]],
 ["辵", ["辵", "辶"]],
 ["示", ["示", "礻"]],
 ["衣", ["衣", "衤"]],
 ["馬", ["馬", "马"]],
 ["玉", ["玉", "王"]],
 ["食", ["食", "饣"]],
 ["見", ["見", "见"]],
 ["犬", ["犬", "犭"]],
 ["戶", ["戶", "户"]],
 ["乙", ["乙", "乛", "乚"]],
 ["爪", ["爪", "爫"]],
 ["爿", ["爿", "丬"]],
 ["老", ["老", "耂"]],
 ["長", ["長", "长"]],
 ["韋", ["韋", "韦"]],
 ["風", ["風", "风"]],
 ["飛", ["飛", "飞"]],
 ["魚", ["魚", "鱼"]],
 ["鳥", ["鳥", "鸟"]],
 ["鹵", ["鹵", "卤"]],
 ["麥", ["麥", "麦"]],
 ["黃", ["黃", "黄"]],
 ["黽", ["黽", "黾"]],
 ["齊", ["齊", "齐"]],
 ["齒", ["齒", "齿"]],
 ["龍", ["龍", "龙"]],
 ["龜", ["龜", "龟"]],
]);

function radicalLookupForms(radical: string): string[] {
 const forms = new Set<string>();
 for (const part of radical.split("/")) {
  forms.add(part);
  for (const variant of RADICAL_VARIANTS.get(part) ?? []) {
   forms.add(variant);
  }
 }
 return [...forms];
}

function isPrimaryRadicalNote(radical: string, explanation: string): boolean {
 const tag = /^\[([^\]]+)\]/u.exec(explanation)?.[1];
 if (!tag) return true;
 // Strip trailing component/phonetic remarks and character labels so only target radicals remain.
 const lookupScope = tag
  .replace(/\s*—.*$/u, "")
  .replace(/,\s*(?:chứa|đồng âm|Phồn thể\s+\S+\s+chứa).*$/u, "")
  .replace(/\bcho\s+\S+/gu, "")
  .replace(/\((?:phồn|giản|Phồn thể|Giản thể)\s+[^)]+\)/gu, "")
  .replace(/\b(?:phồn thể|giản thể|phồn|giản|dị thể)\s+\S+\s+(?=(?:tra|xếp)\s+bộ|gồm|rút)/giu, "")
  .replace(/\b(?:Khang Hy|Giản thể|Phồn thể)\s+\S+(?=:)/gu, "");
 return radicalLookupForms(radical).some((form) => lookupScope.includes(form));
}

const hanRun = "[\\p{Script=Han}]+";
const formLabel = "(?:Phồn thể|Giản thể|phồn thể|giản thể|phồn|giản)";
/** "Phồn thể 辭 xếp bộ 辛" / "giản 离 tra bộ 禸": a form named before its radical. */
const formBeforeRadical = new RegExp(
 `${formLabel}\\s+(${hanRun})\\s+(?:xếp|tra)\\s+bộ\\s+(${hanRun})`,
 "gu",
);
/** "隹 (phồn 離)": a radical followed by the form it applies to. */
const radicalBeforeForm = new RegExp(`(${hanRun})\\s*\\(${formLabel}\\s+(${hanRun})\\)`, "gu");

/** Radicals the explanation tag assigns to individual written forms. */
function formRadicalAssignments(explanation: string): ReadonlyMap<string, readonly string[]> {
 const tag = /^\[([^\]]+)\]/u.exec(explanation)?.[1] ?? "";
 const assignments = new Map<string, string[]>();
 const assign = (form: string, radical: string) =>
  assignments.set(form, [...(assignments.get(form) ?? []), radical]);
 for (const [, form = "", radical = ""] of tag.matchAll(formBeforeRadical)) assign(form, radical);
 for (const [, radical = "", form = ""] of tag.matchAll(radicalBeforeForm)) assign(form, radical);
 return assignments;
}

/**
 * Whether `form` belongs to `radical` in this row. A form the tag assigns
 * explicitly (simplified and traditional forms can sit under different
 * radicals) follows that assignment; any other form follows the row.
 */
function isPrimaryForForm(
 radical: string,
 explanation: string,
 form: string,
 assignments: ReadonlyMap<string, readonly string[]>,
): boolean {
 const assigned = assignments.get(form);
 if (!assigned) return isPrimaryRadicalNote(radical, explanation);
 const lookupForms = radicalLookupForms(radical);
 return assigned.some((target) => lookupForms.includes(target));
}

function appendNote(
 map: Map<string, RadicalCharacterNote[]>,
 form: string,
 note: RadicalCharacterNote,
) {
 const existing = map.get(form);
 if (existing) {
  existing.push(note);
 } else {
  map.set(form, [note]);
 }
}

/**
 * Builds lookup maps from the reviewed radical character dataset, ordering
 * primary entries ahead of cross-reference `[Tra bộ <other>]` entries per form.
 */
export function buildRadicalCharacterIndex(
 content: RadicalCharactersContent,
): RadicalCharacterIndex {
 const notesByForm = new Map<string, RadicalCharacterNote[]>();
 const crossRefsByForm = new Map<string, RadicalCharacterNote[]>();
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
    const assignments = formRadicalAssignments(character.explanation);
    for (const form of [character.hanzi, ...character.otherForms]) {
     const primary = isPrimaryForForm(set.radical, character.explanation, form, assignments);
     appendNote(primary ? notesByForm : crossRefsByForm, form, note);
    }
   }
  }
 }
 for (const [form, crossRefs] of crossRefsByForm) {
  for (const note of crossRefs) {
   appendNote(notesByForm, form, note);
  }
 }
 return { sets: content.radicals, notesByForm };
}

/** The character set that explains `hanzi`, preferring its primary radical ahead of cross-references. */
export function findRadicalCharacterSet(
 index: RadicalCharacterIndex,
 hanzi: string,
): RadicalCharacterSet[] {
 const order = index.notesByForm.get(hanzi)?.[0]?.radical.order;
 return index.sets.filter((set) => set.order === order);
}
