import type { HanziHomeVocabItem } from "@/features/hanzihome/types";

export function getVocabItemKey(item: HanziHomeVocabItem) {
 return item.runtimeId;
}

export function getVocabDisplayMeaning(item: HanziHomeVocabItem) {
 return item.meaning.short_definition_vi || item.meaning.meaning_vi;
}

export function getVocabSearchText(item: HanziHomeVocabItem) {
 return [
  item.hanzi,
  item.pinyin,
  item.meaning.hanviet,
  item.meaning.meaning_vi,
  item.meaning.short_definition_vi,
  item.category,
  item.pos.raw_vi,
  item.pos.raw_cn,
  item.level_tag === "unknown" ? "" : item.level_tag,
  ...item.meaning.natural_translations_vi,
  ...item.tags,
 ]
  .filter(Boolean)
  .join(" ")
  .toLocaleLowerCase("vi-VN");
}
