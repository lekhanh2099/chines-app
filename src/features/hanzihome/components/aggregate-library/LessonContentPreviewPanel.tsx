"use client";

import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/display/typography";
import type { JsonFieldValue } from "@/types/json";
import { JsonObjectSchema, type JsonObject } from "@/types/json";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import type { Section } from "@/features/hanzihome/schemas/hanyu-lesson.types";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import { buildHanziHomeLessonHref } from "@/features/hanzihome/utils/lesson-route";
import { getVocabDisplayMeaning, getVocabItemKey } from "@/features/hanzihome/utils/vocab-item";
import { z } from "zod";

export const LessonContentModuleSchema = z.enum([
 "lessonText",
 "vocab",
 "grammar",
 "exercises",
 "reading",
]);
export type LessonContentModule = z.infer<typeof LessonContentModuleSchema>;

type LessonSectionMatch = {
 section: Section;
};

type FlatLine = {
 id: string;
 speaker?: string;
 zh: string;
 pinyin?: string;
 vi?: string;
};

export const DEFAULT_SELECTED_CONTENT_MODULES: LessonContentModule[] = ["lessonText", "grammar"];

const LESSON_CONTENT_MODULES: Array<{
 value: LessonContentModule;
}> = [
 { value: "lessonText" },
 { value: "vocab" },
 { value: "grammar" },
 { value: "exercises" },
 { value: "reading" },
];

function getSectionContentModule(
 sectionType: Section["type"],
): z.infer<z.ZodNullable<typeof LessonContentModuleSchema>> {
 if (sectionType === "text") return "lessonText";
 if (sectionType === "vocabulary" || sectionType === "proper_nouns") return "vocab";
 if (sectionType === "grammar") return "grammar";
 if (sectionType === "exercises" || sectionType === "character_writing") return "exercises";
 if (sectionType === "reading") return "reading";
 return null;
}

function getLessonSectionsForModule(
 lesson: HanziHomeLesson,
 module: LessonContentModule,
): LessonSectionMatch[] {
 const sections = lesson.sourceLesson?.lesson.sections ?? [];

 return sections
  .map((section) => ({ section }))
  .filter(({ section }) => getSectionContentModule(section.type) === module);
}

function asRecord(value: JsonFieldValue): JsonObject {
 const parsed = JsonObjectSchema.safeParse(value);
 return parsed.success ? parsed.data : {};
}

function stringValue(record: JsonObject, key: string) {
 const value = record[key];
 return typeof value === "string" ? value.trim() : "";
}

function arrayValue(record: JsonObject, key: string) {
 const value = record[key];
 return Array.isArray(value) ? value : [];
}

function instructionText(value: JsonFieldValue) {
 if (typeof value === "string") return value.trim();

 const record = asRecord(value);
 return (
  stringValue(record, "vi") ||
  stringValue(record, "zh") ||
  stringValue(record, "text") ||
  stringValue(record, "title")
 );
}

function itemTitle(record: JsonObject) {
 return (
  stringValue(record, "title_vi") ||
  stringValue(record, "title") ||
  stringValue(record, "prompt") ||
  stringValue(record, "question") ||
  stringValue(record, "text") ||
  stringValue(record, "zh")
 );
}

function getQuestionLikeText(value: JsonFieldValue) {
 const record = asRecord(value);
 return (
  stringValue(record, "question") ||
  stringValue(record, "prompt") ||
  stringValue(record, "sentence") ||
  stringValue(record, "text") ||
  stringValue(record, "zh")
 );
}

export function getOrderedLessonContentModules(
 currentModules: LessonContentModule[],
 nextModule: LessonContentModule,
) {
 const nextModules = currentModules.includes(nextModule)
  ? currentModules.filter((module) => module !== nextModule)
  : [...currentModules, nextModule];

 return LESSON_CONTENT_MODULES.filter((option) => nextModules.includes(option.value)).map(
  (option) => option.value,
 );
}

export function LessonContentPreviewPanel({
 lessons,
 selectedModules,
 selectedLessonCount,
 onToggleModule,
 onApplyPreset,
}: {
 lessons: HanziHomeLesson[];
 selectedModules: LessonContentModule[];
 selectedLessonCount: number;
 onToggleModule: (module: LessonContentModule) => void;
 onApplyPreset: (modules: LessonContentModule[]) => void;
}) {
 return (
  <div className="grid gap-3 rounded-xl bg-bg-primary">
   <LessonContentModuleSelector
    selectedModules={selectedModules}
    onToggleModule={onToggleModule}
    onApplyPreset={onApplyPreset}
   />
   <SelectedLessonContentPreview
    lessons={lessons}
    selectedModules={selectedModules}
    selectedLessonCount={selectedLessonCount}
   />
  </div>
 );
}

function LessonContentModuleSelector({
 selectedModules,
 onToggleModule,
 onApplyPreset,
}: {
 selectedModules: LessonContentModule[];
 onToggleModule: (module: LessonContentModule) => void;
 onApplyPreset: (modules: LessonContentModule[]) => void;
}) {
 const t = useTranslations("Vocab");
 const selectedModuleLabels = LESSON_CONTENT_MODULES.filter((module) =>
  selectedModules.includes(module.value),
 ).map((module) => t(`preview.modules.${module.value}.label`));
 const hasSelection = selectedModules.length > 0;
 const presets: Array<{ label: string; modules: LessonContentModule[] }> = [
  { label: t("preview.presets.lessonTextOnly"), modules: ["lessonText"] },
  { label: t("preview.presets.grammarOnly"), modules: ["grammar"] },
  { label: t("preview.presets.vocabOnly"), modules: ["vocab"] },
  { label: t("preview.presets.lessonTextVocab"), modules: ["lessonText", "vocab"] },
  { label: t("preview.presets.vocabExercises"), modules: ["vocab", "exercises"] },
  {
   label: t("preview.presets.all"),
   modules: ["lessonText", "vocab", "grammar", "exercises", "reading"],
  },
 ];

 return (
  <section className="grid gap-3">
   <div className="flex flex-wrap items-start justify-between gap-2">
    <div className="grid gap-1">
     <StudyInstructionText
      variant="overline"
      tone="muted"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      {t("preview.step")}
     </StudyInstructionText>
     <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
      {t("preview.title")}
     </Typography>
     <StudyInstructionText variant="bodySmall" tone="muted" weight="semibold">
      {t("preview.description")}
     </StudyInstructionText>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <StudyInstructionText
      variant="caption"
      tone="primary"
      weight="black"
      className="rounded-full bg-bg-subtle px-3 py-1"
     >
      {t("preview.selectedCount", { count: selectedModules.length })}
     </StudyInstructionText>
     <Button
      type="button"
      variant="surface"
      onClick={() => onApplyPreset([])}
      disabled={!hasSelection}
     >
      {t("preview.clear")}
     </Button>
    </div>
   </div>

   <div className="flex flex-wrap gap-1.5">
    {LESSON_CONTENT_MODULES.map((module) => {
     const isSelected = selectedModules.includes(module.value);

     return (
      <Button
       key={module.value}
       type="button"
       variant={isSelected ? "active" : "surface"}
       onClick={() => onToggleModule(module.value)}
       aria-pressed={isSelected}
       title={t(`preview.modules.${module.value}.description`)}
      >
       {t(`preview.modules.${module.value}.label`)}
      </Button>
     );
    })}
   </div>

   <div className="flex flex-wrap items-center gap-1.5">
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     {t("preview.presetLabel")}
    </StudyInstructionText>
    {presets.map((preset) => (
     <Button
      key={preset.label}
      type="button"
      variant="surfaceCard"
      onClick={() => onApplyPreset(preset.modules)}
     >
      {preset.label}
     </Button>
    ))}
   </div>

   <StudyInstructionText
    variant="label"
    tone="default"
    weight="black"
    className="grid gap-1 rounded-xl bg-bg-subtle px-3 py-2"
   >
    {t("preview.viewing")}{" "}
    <StudyInstructionText as="span" tone="primary">
     {selectedModuleLabels.length > 0 ? selectedModuleLabels.join(" + ") : t("preview.noModules")}
    </StudyInstructionText>
   </StudyInstructionText>
  </section>
 );
}

function SelectedLessonContentPreview({
 lessons,
 selectedModules,
 selectedLessonCount,
}: {
 lessons: HanziHomeLesson[];
 selectedModules: LessonContentModule[];
 selectedLessonCount: number;
}) {
 const t = useTranslations("Vocab");
 if (selectedLessonCount === 0) {
  return (
   <StudyInstructionText
    variant="label"
    tone="muted"
    weight="bold"
    className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4"
   >
    {t("preview.selectLessons")}
   </StudyInstructionText>
  );
 }

 if (selectedModules.length === 0) {
  return (
   <StudyInstructionText
    variant="label"
    tone="muted"
    weight="bold"
    className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4"
   >
    {t("preview.selectModule")}
   </StudyInstructionText>
  );
 }

 if (lessons.length === 0 || lessons.length < selectedLessonCount) {
  return (
   <div
    className="grid animate-pulse gap-3 rounded-xl border border-border-default bg-bg-primary p-4"
    aria-busy="true"
    aria-live="polite"
   >
    <div className="h-5 w-56 max-w-full rounded-md bg-bg-subtle" />
    {Array.from({ length: Math.min(Math.max(selectedLessonCount, 1), 3) }, (_, index) => (
     <div key={index} className="grid gap-3 rounded-xl bg-bg-subtle p-3">
      <div className="h-5 w-48 max-w-full rounded-md bg-bg-card" />
      <div className="h-20 rounded-lg bg-bg-card" />
     </div>
    ))}
    <span className="sr-only">{t("preview.loading")}</span>
   </div>
  );
 }

 return (
  <section className="grid gap-3">
   <div className="flex items-center gap-2 text-sm font-black text-text-primary">
    <Layers3 className="h-4 w-4 text-primary" />
    <span>{t("preview.quickView")}</span>
   </div>

   <div className="grid gap-3">
    {lessons.map((lesson) => (
     <article
      key={lesson.id}
      className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-3"
     >
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div>
        <Typography as="h3" variant="cardTitle" tone="default" weight="black">
         {t("filters.lessonOption", { number: lesson.lessonNumber, title: lesson.titleZh })}
        </Typography>
        <StudyInstructionText variant="label" tone="muted" weight="bold">
         {lesson.title}
        </StudyInstructionText>
       </div>

       {lesson.courseId && (
        <Button asChild variant="surface">
         <Link
          href={buildHanziHomeLessonHref({
           courseId: lesson.courseId,
           bookId: lesson.bookId,
           lessonNumber: lesson.lessonNumber,
           module: "overview",
          })}
         >
          {t("list.openLesson")}
         </Link>
        </Button>
       )}
      </div>

      <div className="grid gap-3">
       {selectedModules.map((module) => (
        <LessonModulePreview key={`${lesson.id}:${module}`} lesson={lesson} module={module} />
       ))}
      </div>
     </article>
    ))}
   </div>
  </section>
 );
}

function LessonModulePreview({
 lesson,
 module,
}: {
 lesson: HanziHomeLesson;
 module: LessonContentModule;
}) {
 const t = useTranslations("Vocab");
 const sections = getLessonSectionsForModule(lesson, module);
 const itemCount = getModuleItemCount(lesson, module, sections);

 return (
  <section className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3">
   <div className="flex items-center justify-between gap-3">
    <span>{t(`preview.modules.${module}.label`)}</span>
    <StudyInstructionText
     variant="caption"
     tone="muted"
     weight="black"
     scale="micro"
     className="rounded-full bg-bg-subtle px-2 py-1"
    >
     {t("list.count", { count: itemCount })}
    </StudyInstructionText>
   </div>

   <CompactModuleContent lesson={lesson} module={module} sections={sections} />
  </section>
 );
}

function getModuleItemCount(
 lesson: HanziHomeLesson,
 module: LessonContentModule,
 sections: LessonSectionMatch[],
) {
 if (module === "vocab") {
  const sectionCount = sections.reduce((count, { section }) => {
   const record = asRecord(section);
   return count + arrayValue(record, "items").length;
  }, 0);
  return sectionCount || lesson.vocab.length;
 }

 if (module === "grammar") {
  const sectionCount = sections.reduce((count, { section }) => {
   const record = asRecord(section);
   return count + arrayValue(record, "items").length;
  }, 0);
  return sectionCount || lesson.grammar.length;
 }

 if (module === "lessonText") return getLessonTextLines(sections).length;

 return sections.reduce((count, { section }) => {
  const record = asRecord(section);
  const items = arrayValue(record, "items");
  const blocks = arrayValue(record, "blocks");
  return count + (items.length || blocks.length || 1);
 }, 0);
}

function CompactModuleContent({
 lesson,
 module,
 sections,
}: {
 lesson: HanziHomeLesson;
 module: LessonContentModule;
 sections: LessonSectionMatch[];
}) {
 const t = useTranslations("Vocab");
 if (module === "lessonText") return <CompactLessonText sections={sections} />;
 if (module === "vocab") return <CompactVocabulary lesson={lesson} sections={sections} />;
 if (module === "grammar") return <CompactGrammar lesson={lesson} sections={sections} />;
 if (module === "exercises")
  return <CompactGenericItems sections={sections} emptyLabel={t("preview.empty.exercises")} />;
 if (module === "reading")
  return <CompactGenericItems sections={sections} emptyLabel={t("preview.empty.reading")} />;

 return <CompactEmpty label={t("preview.empty.unavailable")} />;
}

function getLessonTextLines(sections: LessonSectionMatch[]) {
 return sections.flatMap(({ section }) => {
  const record = asRecord(section);
  return arrayValue(record, "blocks").flatMap((block) => {
   const blockRecord = asRecord(block);
   const directLines = arrayValue(blockRecord, "lines");
   const sceneLines = arrayValue(blockRecord, "scenes").flatMap((scene) =>
    arrayValue(asRecord(scene), "lines"),
   );
   const paragraphs = arrayValue(blockRecord, "paragraphs");
   return [...directLines, ...sceneLines, ...paragraphs].map((entry, index): FlatLine => {
    const entryRecord = asRecord(entry);
    return {
     id: stringValue(entryRecord, "id") || `${stringValue(blockRecord, "id") || "line"}-${index}`,
     speaker: stringValue(entryRecord, "speaker"),
     zh: stringValue(entryRecord, "zh") || stringValue(entryRecord, "text"),
     pinyin: stringValue(entryRecord, "pinyin"),
     vi: stringValue(entryRecord, "vi") || stringValue(entryRecord, "translation_vi"),
    };
   });
  });
 });
}

function CompactLessonText({ sections }: { sections: LessonSectionMatch[] }) {
 const t = useTranslations("Vocab");
 const lines = getLessonTextLines(sections).filter((line) => line.zh || line.vi);

 if (lines.length === 0) return <CompactEmpty label={t("preview.empty.lessonText")} />;

 return (
  <div className="grid gap-2">
   {lines.slice(0, 2).map((line) => (
    <div key={line.id} className="grid gap-1 rounded-xl bg-bg-subtle px-3 py-2">
     {line.speaker && (
      <StudyInstructionText
       variant="caption"
       tone="muted"
       weight="black"
       scale="micro"
       className="justify-self-start rounded-full bg-bg-card px-2 py-0.5"
      >
       {line.speaker}
      </StudyInstructionText>
     )}
     {line.zh && (
      <StudyInstructionText
       lang="zh-CN"
       variant="cardTitle"
       tone="default"
       weight="black"
       clamp="two"
      >
       {line.zh}
      </StudyInstructionText>
     )}
     {line.vi && (
      <StudyInstructionText variant="label" tone="muted" weight="bold" clamp="two">
       {line.vi}
      </StudyInstructionText>
     )}
    </div>
   ))}
   {lines.length > 2 && (
    <StudyInstructionText variant="caption" tone="muted" weight="black">
     {t("preview.moreLines", { count: lines.length - 2 })}
    </StudyInstructionText>
   )}
  </div>
 );
}

function CompactVocabulary({
 lesson,
 sections,
}: {
 lesson: HanziHomeLesson;
 sections: LessonSectionMatch[];
}) {
 const t = useTranslations("Vocab");
 const sourceItems = sections.flatMap(({ section }) =>
  arrayValue(asRecord(section), "items").map(asRecord),
 );

 if (sourceItems.length > 0) {
  return (
   <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
    {sourceItems.slice(0, 12).map((item, index) => {
     const hanzi =
      stringValue(item, "hanzi") || stringValue(item, "zh") || stringValue(item, "word");
     const meaning = stringValue(item, "meaning_vi") || stringValue(item, "vi");
     const pinyin = stringValue(item, "pinyin");

     return (
      <div
       key={stringValue(item, "id") || `${hanzi}-${index}`}
       className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2"
      >
       <div className="flex flex-wrap items-baseline gap-2">
        <StudyInstructionText lang="zh-CN" variant="sectionTitle" tone="default" weight="black">
         {hanzi || "—"}
        </StudyInstructionText>
        {pinyin && (
         <StudyInstructionText variant="caption" tone="primary" weight="black">
          {pinyin}
         </StudyInstructionText>
        )}
       </div>
       {meaning && (
        <StudyInstructionText variant="caption" tone="muted" weight="bold" clamp="two">
         {meaning}
        </StudyInstructionText>
       )}
      </div>
     );
    })}
    {sourceItems.length > 12 && (
     <StudyInstructionText variant="caption" tone="muted" weight="black" className="col-span-full">
      {t("preview.moreWords", { count: sourceItems.length - 12 })}
     </StudyInstructionText>
    )}
   </div>
  );
 }

 if (lesson.vocab.length === 0) return <CompactEmpty label={t("preview.empty.vocab")} />;

 return (
  <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
   {lesson.vocab.slice(0, 12).map((word) => (
    <div
     key={getVocabItemKey(word)}
     className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2"
    >
     <div className="flex flex-wrap items-baseline gap-2">
      <StudyInstructionText lang="zh-CN" variant="sectionTitle" tone="default" weight="black">
       {word.hanzi}
      </StudyInstructionText>
      <StudyInstructionText variant="caption" tone="primary" weight="black">
       {word.pinyin}
      </StudyInstructionText>
     </div>
     <StudyInstructionText variant="caption" tone="muted" weight="bold" clamp="two">
      {getVocabDisplayMeaning(word)}
     </StudyInstructionText>
    </div>
   ))}
   {lesson.vocab.length > 12 && (
    <StudyInstructionText variant="caption" tone="muted" weight="black" className="col-span-full">
     {t("preview.moreWords", { count: lesson.vocab.length - 12 })}
    </StudyInstructionText>
   )}
  </div>
 );
}

function CompactGrammar({
 lesson,
 sections,
}: {
 lesson: HanziHomeLesson;
 sections: LessonSectionMatch[];
}) {
 const t = useTranslations("Vocab");
 const sourceItems = sections.flatMap(({ section }) =>
  arrayValue(asRecord(section), "items").map(asRecord),
 );

 if (sourceItems.length > 0) {
  return (
   <div className="grid gap-1.5">
    {sourceItems.slice(0, 8).map((item, index) => (
     <div
      key={stringValue(item, "id") || `${index}`}
      className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2"
     >
      <Typography as="h4" variant="cardTitle" tone="default" weight="black">
       {itemTitle(item) || t("preview.grammarPoint")}
      </Typography>
      {instructionText(item.core) && (
       <StudyInstructionText variant="label" tone="muted" weight="bold" clamp="two">
        {instructionText(item.core)}
       </StudyInstructionText>
      )}
     </div>
    ))}
    {sourceItems.length > 8 && (
     <StudyInstructionText variant="caption" tone="muted" weight="black">
      {t("preview.moreItems", { count: sourceItems.length - 8 })}
     </StudyInstructionText>
    )}
   </div>
  );
 }

 if (lesson.grammar.length === 0) return <CompactEmpty label={t("preview.empty.grammar")} />;

 return (
  <div className="grid gap-1.5">
   {lesson.grammar.slice(0, 8).map((point) => (
    <div key={point.id} className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2">
     <Typography as="h4" variant="cardTitle" tone="default" weight="black">
      {point.cleanTitle}
     </Typography>
     {point.core && (
      <StudyInstructionText variant="label" tone="muted" weight="bold" clamp="two">
       {point.core}
      </StudyInstructionText>
     )}
    </div>
   ))}
   {lesson.grammar.length > 8 && (
    <StudyInstructionText variant="caption" tone="muted" weight="black">
     {t("preview.moreItems", { count: lesson.grammar.length - 8 })}
    </StudyInstructionText>
   )}
  </div>
 );
}

function CompactGenericItems({
 sections,
 emptyLabel,
}: {
 sections: LessonSectionMatch[];
 emptyLabel: string;
}) {
 const t = useTranslations("Vocab");
 const items = sections.flatMap(({ section }) => {
  const record = asRecord(section);
  return [...arrayValue(record, "items"), ...arrayValue(record, "blocks")].map(asRecord);
 });

 if (items.length === 0) return <CompactEmpty label={emptyLabel} />;

 return (
  <div className="grid gap-1.5">
   {items.slice(0, 10).map((item, index) => (
    <div
     key={stringValue(item, "id") || `${index}`}
     className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2 grid gap-1"
    >
     <Typography as="h4" variant="cardTitle" tone="default" weight="black">
      {itemTitle(item) || t("preview.itemNumber", { number: index + 1 })}
     </Typography>
     {instructionText(item.instruction) && (
      <StudyInstructionText variant="label" tone="muted" weight="bold">
       {instructionText(item.instruction)}
      </StudyInstructionText>
     )}
     {getQuestionLikeText(item) && (
      <StudyInstructionText variant="bodySmall" tone="secondary" weight="semibold" clamp="two">
       {getQuestionLikeText(item)}
      </StudyInstructionText>
     )}
    </div>
   ))}
  </div>
 );
}

function CompactEmpty({ label }: { label: string }) {
 return (
  <StudyInstructionText
   variant="label"
   tone="muted"
   weight="bold"
   className="rounded-xl border border-dashed border-border-default bg-bg-subtle px-3 py-2"
  >
   {label}
  </StudyInstructionText>
 );
}
