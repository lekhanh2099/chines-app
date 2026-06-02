import type {
 Comparison,
 CultureNote,
 Meaning,
 Warning,
 WordFormation,
} from "@/features/hanzihome/static-json/schemas/vocab.schema";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";

import type { SectionView } from "./types";

function hasText(value: string | undefined) {
 return Boolean(value?.trim());
}

export function hasMeaningContent(meaning: Meaning) {
 return [
  meaning.short_definition_vi,
  meaning.meaning_vi,
  meaning.meaning_en,
  meaning.textbook_focus_vi,
  meaning.register_vi,
  meaning.usage_domain_vi,
  ...meaning.natural_translations_vi,
  ...meaning.notes.map((note) => note.text_vi),
 ].some(hasText);
}

export function hasWordFormationContent(formation: WordFormation) {
 return (
  formation.characters.length > 0 ||
  [
   formation.word_logic_vi,
   formation.memory_tip_vi,
   formation.warning_vi,
   ...formation.notes.map((note) => note.text_vi),
  ].some(hasText)
 );
}

export function hasComparisonContent(comparison: Comparison) {
 return (
  comparison.near_synonyms.length > 0 ||
  comparison.antonyms.length > 0 ||
  comparison.contrast_pairs.length > 0 ||
  comparison.usage_rules.length > 0 ||
  comparison.notes.length > 0
 );
}

export function hasCultureContent(culture: CultureNote | undefined) {
 return Boolean(culture && [culture.title, culture.content_vi].some(hasText));
}

export function hasWarningContent(warnings: Warning[]) {
 return warnings.some((warning) =>
  [
   warning.rule_vi,
   warning.explanation_vi,
   ...warning.notes.map((note) => note.text_vi),
  ].some(hasText),
 );
}

export function hasSectionInItem(
 item: HanziHomeVocabItem,
 section: SectionView,
) {
 if (section === "all") return true;
 if (section === "examples") return item.examples.length > 0;
 if (section === "meaning") return hasMeaningContent(item.meaning);
 if (section === "etymology")
  return hasWordFormationContent(item.word_formation);
 if (section === "comparisons") return hasComparisonContent(item.comparison);
 if (section === "notes") {
  return (
   hasCultureContent(item.culture_note) ||
   hasWarningContent(item.warnings) ||
   item.notes.length > 0
  );
 }

 return false;
}
