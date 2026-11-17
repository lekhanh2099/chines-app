import type { ExerciseCoverage, LessonCoverage } from "./conversion-coverage";
import type { CourseBookConversion } from "./convert-course-book";

const IGNORED_TEXT_MINIMUM = 100;

function sum<Item>(items: readonly Item[], pick: (item: Item) => number) {
 return items.reduce((total, item) => total + pick(item), 0);
}

function table(headers: readonly string[], rows: readonly (string | number)[][]) {
 return [
  `| ${headers.join(" | ")} |`,
  `| ${headers.map(() => "---").join(" | ")} |`,
  ...rows.map((row) => `| ${row.join(" | ")} |`),
 ].join("\n");
}

function groupBy<Item>(items: readonly Item[], key: (item: Item) => string) {
 const groups = new Map<string, Item[]>();
 for (const item of items) groups.set(key(item), [...(groups.get(key(item)) ?? []), item]);
 return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function producedNothing(exercise: ExerciseCoverage) {
 return exercise.contentBlocks === 0 && !exercise.referenceOnly;
}

function itemLine(exercise: ExerciseCoverage) {
 return `- ${exercise.lessonId} · ${exercise.sectionType} · \`${exercise.itemId}\` · ${exercise.itemType} · ${exercise.title}`;
}

function sectionRows(lessons: readonly LessonCoverage[]) {
 return groupBy(
  lessons.flatMap((lesson) => lesson.sections),
  (section) => section.sectionType,
 ).map(([sectionType, sections]) => [
  sectionType,
  sections.length,
  sum(sections, (section) => section.sourceItems),
  sum(sections, (section) => section.emittedBlocks),
  sections.filter((section) => section.sourceItems > 0 && section.emittedBlocks === 0).length,
 ]);
}

function exerciseRows(exercises: readonly ExerciseCoverage[]) {
 return groupBy(exercises, (exercise) => `${exercise.sectionType} / ${exercise.itemType}`).map(
  ([type, group]) => [
   type,
   group.length,
   sum(group, (exercise) => exercise.questions),
   sum(group, (exercise) => exercise.answered),
   sum(group, (exercise) => exercise.choiceAnswers),
   sum(group, (exercise) => exercise.tableAnswers),
   sum(group, (exercise) => exercise.keyBlockAnswers),
   sum(group, (exercise) => exercise.unanswered),
   group.filter((exercise) => exercise.realigned).length,
   group.filter((exercise) => exercise.unaligned).length,
   group.filter((exercise) => exercise.referenceOnly).length,
   group.filter(producedNothing).length,
  ],
 );
}

function ignoredRows(lessons: readonly LessonCoverage[]) {
 const groups = groupBy(
  lessons.flatMap((lesson) => lesson.ignoredText),
  (ignored) => `${ignored.sectionType}${ignored.path}`,
 ).map(([path, group]) => ({
  path,
  count: group.length,
  characters: sum(group, (ignored) => ignored.characters),
  sample: (group[0]?.sample ?? "").replace(/\|/gu, "¦"),
 }));
 const listed = groups
  .filter((group) => group.characters >= IGNORED_TEXT_MINIMUM)
  .sort((left, right) => right.characters - left.characters);
 return {
  rows: listed.map((group) => [`\`${group.path}\``, group.count, group.characters, group.sample]),
  restPaths: groups.length - listed.length,
  restCharacters: sum(
   groups.filter((group) => group.characters < IGNORED_TEXT_MINIMUM),
   (group) => group.characters,
  ),
 };
}

function scopeReport(title: string, lessons: readonly LessonCoverage[], bytes: string) {
 const exercises = lessons.flatMap((lesson) => lesson.exercises);
 const ignored = ignoredRows(lessons);
 const nothing = exercises.filter(producedNothing);
 const references = exercises.filter((exercise) => exercise.referenceOnly);
 const realigned = exercises.filter((exercise) => exercise.realigned);
 const unaligned = exercises.filter((exercise) => exercise.unaligned);
 const list = (items: readonly ExerciseCoverage[]) =>
  items.length > 0 ? items.map(itemLine).join("\n") : "- none";
 return [
  `## ${title}`,
  "",
  `- Lessons: ${lessons.length}${bytes}`,
  `- Vocabulary rows: ${sum(lessons, (lesson) => lesson.vocabIn)} in → ${sum(lessons, (lesson) => lesson.vocabOut)} out`,
  `- Lessons whose text came from the \`hanzihome_lesson_texts\` markdown fallback: ${lessons.filter((lesson) => lesson.textFallback).length}`,
  `- Grammar/notes examples: ${sum(lessons, (lesson) => lesson.grammarExamples)} written, ${sum(lessons, (lesson) => lesson.grammarExamplesInline)} in a form the reader's example parser splits (the rest carry the Vietnamese in the block \`translation\`)`,
  "",
  "### Sections",
  "",
  "Source items: text = dialogue lines + narrative paragraphs; other types = `items` + `blocks` of the payload. Emitted blocks include headings.",
  "",
  table(
   [
    "Source section type",
    "Lessons",
    "Source items",
    "Emitted blocks",
    "Lessons with source items but no block",
   ],
   sectionRows(lessons),
  ),
  "",
  "### Exercises and exercise-like items by source type",
  "",
  "Questions = prompts written. Answered = `prompt → answer` blocks plus rows of hidden-answer tables. Key-block answers sit in a hidden `Đáp án: →` block because the source ties them to blanks of a passage/dialogue or their pairing is unknown; they are not counted in Answered.",
  "",
  table(
   [
    "Section / type",
    "Items",
    "Questions",
    "Answered",
    "…as A–D choice",
    "…as table row",
    "Key-block answers",
    "Plain prompts (no source answer)",
    "Items realigned",
    "Items unaligned",
    "Reference-only items",
    "Items that produced nothing",
   ],
   exerciseRows(exercises),
  ),
  "",
  `### Items that produced nothing (${nothing.length})`,
  "",
  list(nothing),
  "",
  `### Reference-only items (${references.length}) — content lives in another section of the lesson`,
  "",
  list(references),
  "",
  `### Items whose answers were moved off instruction/word-bank lines (${realigned.length})`,
  "",
  list(realigned),
  "",
  `### Items whose answers could not be tied to prompts (${unaligned.length}) — prompts are plain, answers are listed in one key block`,
  "",
  list(unaligned),
  "",
  "### Payload text not found in the output",
  "",
  `Strings of ≥ 4 letters that appear nowhere in the converted lesson, grouped by payload path (paths with ≥ ${IGNORED_TEXT_MINIMUM} characters in total). Pinyin, ids, references, raw import copies (\`source_*\`), flashcards, POS details and \`empty_*\` reasons are excluded by design.`,
  "",
  ignored.rows.length > 0
   ? table(["Path", "Strings", "Characters", "Sample"], ignored.rows)
   : "none",
  "",
  `Plus ${ignored.restPaths} smaller paths totalling ${ignored.restCharacters} characters.`,
  "",
 ].join("\n");
}

/** Markdown coverage report: totals first, then one section per book. */
export function renderCoverageReport(
 conversions: readonly CourseBookConversion[],
 fileBytes: ReadonlyMap<string, number>,
) {
 const all = conversions.flatMap((conversion) => conversion.coverage);
 return [
  "# Course conversion coverage",
  "",
  "Generated by `npm run content:build-courses`. Numbers are counted by the converter while it writes blocks.",
  "",
  scopeReport("Total", all, ""),
  ...conversions.map((conversion) =>
   scopeReport(
    `${conversion.book.id} — ${conversion.book.label}`,
    conversion.coverage,
    ` · file size ${fileBytes.get(conversion.book.id) ?? 0} bytes`,
   ),
  ),
 ].join("\n");
}
