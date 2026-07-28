"use client";

import type { JsonFieldValue } from "@/types/json";
import { JsonObjectSchema, type JsonObject } from "@/types/json";
import Link from "next/link";
import { Layers3 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
 label: string;
 description: string;
}> = [
 {
  value: "lessonText",
  label: "Bài khóa",
  description: "Hội thoại, đoạn văn và nội dung chính của bài.",
 },
 {
  value: "vocab",
  label: "Từ vựng",
  description: "Từ vựng chính và tên riêng nếu bài có.",
 },
 {
  value: "grammar",
  label: "Ngữ pháp",
  description: "Điểm ngữ pháp và ví dụ theo bài.",
 },
 {
  value: "exercises",
  label: "Bài tập",
  description: "Các nhóm luyện tập, sửa câu, điền từ, hội thoại.",
 },
 {
  value: "reading",
  label: "Đọc hiểu",
  description: "Bài đọc, câu hỏi đọc hiểu và điền khuyết.",
 },
];

const LESSON_CONTENT_PRESETS: Array<{
 label: string;
 modules: LessonContentModule[];
}> = [
 { label: "Chỉ bài khóa", modules: ["lessonText"] },
 { label: "Chỉ ngữ pháp", modules: ["grammar"] },
 { label: "Chỉ từ vựng", modules: ["vocab"] },
 { label: "Bài khóa + Từ vựng", modules: ["lessonText", "vocab"] },
 { label: "Từ vựng + Bài tập", modules: ["vocab", "exercises"] },
 { label: "Tất cả", modules: ["lessonText", "vocab", "grammar", "exercises", "reading"] },
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
 const selectedModuleLabels = LESSON_CONTENT_MODULES.filter((module) =>
  selectedModules.includes(module.value),
 ).map((module) => module.label);
 const hasSelection = selectedModules.length > 0;

 return (
  <section className="grid gap-3">
   <div className="flex flex-wrap items-start justify-between gap-2">
    <div className="grid gap-1">
     <p className="text-xs font-black uppercase tracking-wide text-text-muted">
      Bước 2 · Nội dung hiển thị
     </p>
     <h2 className="text-base font-black text-text-primary">Chọn phần muốn xem trong bài</h2>
     <p className="text-sm font-semibold text-text-muted">
      Bật/tắt từng phần hoặc dùng preset nhanh. Phần preview bên dưới sẽ đổi theo bài đã chọn.
     </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <span className="rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-primary">
      {selectedModules.length} phần
     </span>
     <Button
      type="button"
      variant="surface"
      onClick={() => onApplyPreset([])}
      disabled={!hasSelection}
      className="rounded-full px-3 py-1 text-xs font-black"
     >
      Bỏ chọn
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
       title={module.description}
       className="rounded-full px-3 py-1.5 text-sm font-black"
      >
       {module.label}
      </Button>
     );
    })}
   </div>

   <div className="flex flex-wrap items-center gap-1.5">
    <span className="text-xs font-black uppercase tracking-wide text-text-muted">Preset</span>
    {LESSON_CONTENT_PRESETS.map((preset) => (
     <Button
      key={preset.label}
      type="button"
      variant="surfaceCard"
      onClick={() => onApplyPreset(preset.modules)}
      className="rounded-full px-3 py-1 text-xs font-black"
     >
      {preset.label}
     </Button>
    ))}
   </div>

   <p className="rounded-xl bg-bg-subtle px-3 py-2 text-sm font-black text-text-primary">
    Đang xem:{" "}
    <span className="text-primary">
     {selectedModuleLabels.length > 0 ? selectedModuleLabels.join(" + ") : "Chưa chọn nội dung"}
    </span>
   </p>
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
 if (selectedLessonCount === 0) {
  return (
   <p className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4 text-sm font-bold text-text-muted">
    Chọn một hoặc nhiều bài ở trên để xem nội dung theo phần.
   </p>
  );
 }

 if (selectedModules.length === 0) {
  return (
   <p className="rounded-xl border border-dashed border-border-default bg-bg-subtle p-4 text-sm font-bold text-text-muted">
    Chọn ít nhất một phần nội dung để hiển thị.
   </p>
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
    <span className="sr-only">Đang tải nội dung bài đã chọn</span>
   </div>
  );
 }

 return (
  <section className="grid gap-3">
   <div className="flex items-center gap-2 text-sm font-black text-text-primary">
    <Layers3 className="h-4 w-4 text-primary" />
    <span>Xem nhanh nội dung bài đã chọn</span>
   </div>

   <div className="grid gap-3">
    {lessons.map((lesson) => (
     <article
      key={lesson.id}
      className="grid gap-3 rounded-xl border border-border-default bg-bg-primary p-3"
     >
      <div className="flex flex-wrap items-center justify-between gap-2">
       <div>
        <h3 className="text-base font-black text-text-primary">
         Bài {lesson.lessonNumber}: {lesson.titleZh}
        </h3>
        <p className="text-sm font-bold text-text-muted">{lesson.title}</p>
       </div>

       {lesson.courseId && (
        <Button asChild variant="surface" className="rounded-xl px-3 py-1.5 text-xs font-black">
         <Link
          href={buildHanziHomeLessonHref({
           courseId: lesson.courseId,
           bookId: lesson.bookId,
           lessonNumber: lesson.lessonNumber,
           module: "overview",
          })}
          prefetch={false}
         >
          Mở bài
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
 const moduleMeta = LESSON_CONTENT_MODULES.find((option) => option.value === module);
 const sections = getLessonSectionsForModule(lesson, module);
 const itemCount = getModuleItemCount(lesson, module, sections);

 return (
  <section className="grid gap-2 rounded-xl border border-border-default bg-bg-card p-3">
   <div className="flex items-center justify-between gap-3">
    <span>{moduleMeta?.label ?? module}</span>
    <span className="rounded-full bg-bg-subtle px-2 py-1 text-[11px] font-black text-text-muted">
     {itemCount} mục
    </span>
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
 if (module === "lessonText") return <CompactLessonText sections={sections} />;
 if (module === "vocab") return <CompactVocabulary lesson={lesson} sections={sections} />;
 if (module === "grammar") return <CompactGrammar lesson={lesson} sections={sections} />;
 if (module === "exercises")
  return <CompactGenericItems sections={sections} emptyLabel="Chưa có bài tập." />;
 if (module === "reading")
  return <CompactGenericItems sections={sections} emptyLabel="Chưa có bài đọc." />;

 return <CompactEmpty label="Phần này chưa có dữ liệu render được cho bài đã chọn." />;
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
 const lines = getLessonTextLines(sections).filter((line) => line.zh || line.vi);

 if (lines.length === 0) return <CompactEmpty label="Chưa có bài khóa." />;

 return (
  <div className="grid gap-2">
   {lines.slice(0, 2).map((line) => (
    <div key={line.id} className="rounded-xl bg-bg-subtle px-3 py-2">
     {line.speaker && (
      <span className="mr-2 rounded-full bg-bg-card px-2 py-0.5 text-[11px] font-black text-text-muted">
       {line.speaker}
      </span>
     )}
     {line.zh && (
      <p lang="zh-CN" className="line-clamp-2 text-base font-black text-text-primary">
       {line.zh}
      </p>
     )}
     {line.vi && <p className="line-clamp-2 text-sm font-bold text-text-muted">{line.vi}</p>}
    </div>
   ))}
   {lines.length > 2 && (
    <p className="text-xs font-black text-text-muted">+{lines.length - 2} dòng nữa trong bài.</p>
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
        <span lang="zh-CN" className="text-lg font-black text-text-primary">
         {hanzi || "—"}
        </span>
        {pinyin && <span className="text-xs font-black text-primary">{pinyin}</span>}
       </div>
       {meaning && <p className="line-clamp-2 text-xs font-bold text-text-muted">{meaning}</p>}
      </div>
     );
    })}
    {sourceItems.length > 12 && (
     <p className="col-span-full text-xs font-black text-text-muted">
      +{sourceItems.length - 12} từ nữa.
     </p>
    )}
   </div>
  );
 }

 if (lesson.vocab.length === 0) return <CompactEmpty label="Chưa có từ vựng." />;

 return (
  <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
   {lesson.vocab.slice(0, 12).map((word) => (
    <div
     key={getVocabItemKey(word)}
     className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2"
    >
     <div className="flex flex-wrap items-baseline gap-2">
      <span lang="zh-CN" className="text-lg font-black text-text-primary">
       {word.hanzi}
      </span>
      <span className="text-xs font-black text-primary">{word.pinyin}</span>
     </div>
     <p className="line-clamp-2 text-xs font-bold text-text-muted">
      {getVocabDisplayMeaning(word)}
     </p>
    </div>
   ))}
   {lesson.vocab.length > 12 && (
    <p className="col-span-full text-xs font-black text-text-muted">
     +{lesson.vocab.length - 12} từ nữa.
    </p>
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
      <h4 className="font-black text-text-primary">{itemTitle(item) || "Điểm ngữ pháp"}</h4>
      {instructionText(item.core) && (
       <p className="line-clamp-2 text-sm font-bold text-text-muted">
        {instructionText(item.core)}
       </p>
      )}
     </div>
    ))}
    {sourceItems.length > 8 && (
     <p className="text-xs font-black text-text-muted">+{sourceItems.length - 8} mục nữa.</p>
    )}
   </div>
  );
 }

 if (lesson.grammar.length === 0) return <CompactEmpty label="Chưa có ngữ pháp." />;

 return (
  <div className="grid gap-1.5">
   {lesson.grammar.slice(0, 8).map((point) => (
    <div key={point.id} className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2">
     <h4 className="font-black text-text-primary">{point.cleanTitle}</h4>
     {point.core && <p className="line-clamp-2 text-sm font-bold text-text-muted">{point.core}</p>}
    </div>
   ))}
   {lesson.grammar.length > 8 && (
    <p className="text-xs font-black text-text-muted">+{lesson.grammar.length - 8} mục nữa.</p>
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
     <h4 className="font-black text-text-primary">{itemTitle(item) || `Mục ${index + 1}`}</h4>
     {instructionText(item.instruction) && (
      <p className="text-sm font-bold text-text-muted">{instructionText(item.instruction)}</p>
     )}
     {getQuestionLikeText(item) && (
      <p className="line-clamp-2 text-sm font-semibold text-text-secondary">
       {getQuestionLikeText(item)}
      </p>
     )}
    </div>
   ))}
  </div>
 );
}

function CompactEmpty({ label }: { label: string }) {
 return (
  <p className="rounded-xl border border-dashed border-border-default bg-bg-subtle px-3 py-2 text-sm font-bold text-text-muted">
   {label}
  </p>
 );
}
