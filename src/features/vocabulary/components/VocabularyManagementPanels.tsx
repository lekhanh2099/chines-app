"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
 Plus,
 Search,
 Sparkles,
 Trash2,
 Upload,
 PenLine,
 type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LearningDrawer } from "@/features/learning/components";
import { ActionButton } from "@/features/vocabulary/components/VocabularyStudyPrimitives";
import type {
 ImportedEntryDraft,
 ImportMode,
 WordFilter,
} from "@/features/vocabulary/types";
import {
 examplesToText,
 getMeaning,
 getStudyCharacters,
 lineText,
 parseLines,
 parseMarkdownVocabEntries,
 textToExamples,
} from "@/features/vocabulary/utils/vocab-study";
import { cn } from "@/lib/utils";
import type {
 AiAnalysis,
 VocabEntryWithProgress,
 VocabLessonWithStats,
} from "@/types/database";
import { InlineHskWritingPanel } from "@/features/vocabulary/components/VocabularyFlashcardPanels";

function AllWordsWorkspace({
 entries,
 lessons,
 searchQuery,
 wordFilter,
 onSearchChange,
 onFilterChange,
 onEdit,
 onAddEntry,
}: {
 entries: VocabEntryWithProgress[];
 lessons: VocabLessonWithStats[];
 searchQuery: string;
 wordFilter: WordFilter;
 onSearchChange: (value: string) => void;
 onFilterChange: (filter: WordFilter) => void;
 onEdit: (entry: VocabEntryWithProgress) => void;
 onAddEntry: () => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">
      Tổng hợp
     </p>
     <h2 className="text-3xl font-black text-stone-900">Tất cả từ vựng</h2>
     <p className="mt-2 text-sm font-bold text-stone-500">
      {entries.length} thẻ đang hiển thị · {lessons.length} bài
     </p>
    </div>
    <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
     <div className="relative min-w-0 flex-1">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
      <Input
       value={searchQuery}
       onChange={(event) => onSearchChange(event.target.value)}
       placeholder="Tìm Hán tự, pinyin, nghĩa..."
       className="h-12 rounded-2xl border-2 border-stone-200 bg-white pl-12 text-base font-bold"
      />
     </div>
     <ActionButton onClick={onAddEntry} icon={Plus}>
      Thêm từ
     </ActionButton>
    </div>
   </div>
   <FilterBar value={wordFilter} onChange={onFilterChange} />
   <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
    {entries.map((entry) => (
     <WordCard key={entry.id} entry={entry} onEdit={() => onEdit(entry)} />
    ))}
   </div>
  </section>
 );
}

function LessonEditWorkspace({
 lessons,
 onEditLesson,
 onEditEntry,
 onAddLesson,
 onAddEntry,
 onImportLesson,
}: {
 lessons: VocabLessonWithStats[];
 onEditLesson: (lesson: VocabLessonWithStats) => void;
 onEditEntry: (entry: VocabEntryWithProgress) => void;
 onAddLesson: () => void;
 onAddEntry: (lesson: VocabLessonWithStats) => void;
 onImportLesson: (lesson: VocabLessonWithStats) => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-7">
   <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-wide text-red-500">
      Quản lý bài
     </p>
     <h2 className="text-3xl font-black text-stone-900">Chỉnh sửa bài</h2>
    </div>
    <ActionButton onClick={onAddLesson} icon={Plus}>
     Thêm bài
    </ActionButton>
   </div>
   <div className="mt-5 grid gap-4">
    {lessons.map((lesson) => (
     <article
      key={lesson.id}
      className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm"
     >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
       <div>
        <h3 className="text-2xl font-black text-stone-900">{lesson.title}</h3>
        <p className="mt-1 text-sm font-bold text-stone-500">
         {lesson.lesson_key} · {lesson.entries.length} từ · order{" "}
         {lesson.lesson_order}
        </p>
       </div>
       <div className="flex flex-wrap gap-2">
        <ActionButton
         onClick={() => onAddEntry(lesson)}
         tone="neutral"
         icon={Plus}
        >
         Thêm từ
        </ActionButton>
        <ActionButton
         onClick={() => onImportLesson(lesson)}
         tone="neutral"
         icon={Upload}
        >
         Import bài
        </ActionButton>
        <ActionButton
         onClick={() => onEditLesson(lesson)}
         tone="neutral"
         icon={PenLine}
        >
         Sửa bài
        </ActionButton>
       </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
       {lesson.entries.slice(0, 12).map((entry) => (
        <button
         key={entry.id}
         type="button"
         onClick={() => onEditEntry(entry)}
         className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-3 text-left hover:bg-white"
        >
         <span className="block text-lg font-black text-stone-900">
          {entry.hanzi}
         </span>
         <span className="block truncate text-xs font-bold text-stone-500">
          {getMeaning(entry)}
         </span>
        </button>
       ))}
      </div>
     </article>
    ))}
   </div>
  </section>
 );
}

function ImportLessonDrawer({
 lesson,
 onClose,
 onImport,
}: {
 lesson: VocabLessonWithStats;
 onClose: () => void;
 onImport: (entries: ImportedEntryDraft[]) => void;
}) {
 const [mode, setMode] = useState<ImportMode>("paste");
 const [pasteText, setPasteText] = useState("");
 const [manual, setManual] = useState<ImportedEntryDraft>(() =>
  createManualEntryDraft(lesson),
 );
 const parsedEntries = useMemo(
  () => parseMarkdownVocabEntries(pasteText, lesson),
  [lesson, pasteText],
 );
 const manualReady = Boolean(manual.hanzi.trim() && manual.meaning.trim());

 const updateManual = (
  patch: Partial<ImportedEntryDraft>,
  analysisPatch?: Partial<AiAnalysis>,
 ) => {
  setManual((current) => ({
   ...current,
   ...patch,
   ai_analysis: {
    ...current.ai_analysis,
    ...analysisPatch,
    ...(patch.hanzi !== undefined ? { hanzi: patch.hanzi } : {}),
    ...(patch.pinyin !== undefined ? { pinyin: patch.pinyin } : {}),
    ...(patch.sino_vietnamese !== undefined
     ? {
        sino_vietnamese: patch.sino_vietnamese,
        han_viet: patch.sino_vietnamese,
       }
     : {}),
    ...(patch.meaning !== undefined ? { meaning_summary: patch.meaning } : {}),
    ...(patch.word_type !== undefined ? { word_type: patch.word_type } : {}),
    source_metadata: {
     ...current.ai_analysis.source_metadata,
     ...(patch.category !== undefined ? { category: patch.category } : {}),
    },
   },
  }));
 };

 return (
  <Drawer title={`Import vào ${lesson.title}`} onClose={onClose}>
   <div className="grid gap-5">
    <div className="grid grid-cols-2 rounded-2xl bg-stone-100 p-1">
     {[
      { key: "paste" as const, label: "Paste nhiều từ" },
      { key: "manual" as const, label: "Nhập tay 1 từ" },
     ].map((item) => (
      <button
       key={item.key}
       type="button"
       onClick={() => setMode(item.key)}
       className={cn(
        "h-10 rounded-xl text-sm font-black transition",
        mode === item.key
         ? "bg-white text-red-500 shadow-theme-sm"
         : "text-stone-500 hover:text-stone-900",
       )}
      >
       {item.label}
      </button>
     ))}
    </div>

    {mode === "paste" ? (
     <>
      <Field label="Dán block markdown từ AI">
       <Textarea
        value={pasteText}
        onChange={setPasteText}
        rows={14}
        placeholder={
         "## 算命 – suànmìng – Toán mệnh – Bói toán, xem bói\n*Động từ 【动】*\n\n**1. Hán Việt & Liên hệ Tiếng Việt**\n..."
        }
       />
      </Field>
      <div className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-4">
       <p className="text-sm font-black text-stone-900">
        Preview: {parsedEntries.length} từ hợp lệ
       </p>
       <div className="mt-3 max-h-44 space-y-2 overflow-y-auto">
        {parsedEntries.slice(0, 8).map((entry) => (
         <div
          key={`${entry.hanzi}-${entry.row_number}`}
          className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-stone-700"
         >
          <span className="font-black text-red-500">{entry.hanzi}</span> ·{" "}
          {entry.pinyin} · {entry.meaning}
         </div>
        ))}
       </div>
      </div>
      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
       <ActionButton onClick={onClose} tone="neutral">
        Huỷ
       </ActionButton>
       <ActionButton onClick={() => onImport(parsedEntries)} icon={Upload}>
        Import {parsedEntries.length} từ
       </ActionButton>
      </div>
     </>
    ) : (
     <>
      <div className="grid gap-4 md:grid-cols-2">
       <Field label="Hán tự">
        <Input
         value={manual.hanzi}
         onChange={(event) => updateManual({ hanzi: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Pinyin">
        <Input
         value={manual.pinyin}
         onChange={(event) => updateManual({ pinyin: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Hán Việt">
        <Input
         value={manual.sino_vietnamese || ""}
         onChange={(event) =>
          updateManual({ sino_vietnamese: event.target.value })
         }
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Loại từ">
        <Input
         value={manual.word_type || ""}
         onChange={(event) => updateManual({ word_type: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Category">
        <Input
         value={manual.category || ""}
         onChange={(event) => updateManual({ category: event.target.value })}
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
       <Field label="Row">
        <Input
         type="number"
         value={manual.row_number || ""}
         onChange={(event) =>
          updateManual({ row_number: Number(event.target.value) })
         }
         className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
        />
       </Field>
      </div>
      <Field label="Nghĩa ngắn">
       <Input
        value={manual.meaning}
        onChange={(event) =>
         updateManual(
          { meaning: event.target.value },
          { meaning_detail: event.target.value },
         )
        }
        className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
       />
      </Field>
      <Field label="Chiết tự">
       <Textarea
        value={manual.ai_analysis.decomposition || ""}
        onChange={(value) => updateManual({}, { decomposition: value })}
       />
      </Field>
      <Field label="So sánh gần nghĩa">
       <Textarea
        value={lineText(manual.ai_analysis.comparisons)}
        onChange={(value) =>
         updateManual({}, { comparisons: parseLines(value) })
        }
       />
      </Field>
      <Field label="Cụm từ cố định">
       <Textarea
        value={lineText(manual.ai_analysis.collocations)}
        onChange={(value) =>
         updateManual({}, { collocations: parseLines(value) })
        }
       />
      </Field>
      <Field label="Ví dụ: zh | pinyin | vi | note">
       <Textarea
        value={examplesToText(manual.ai_analysis.examples)}
        onChange={(value) =>
         updateManual({}, { examples: textToExamples(value) })
        }
        rows={6}
       />
      </Field>
      <Field label="Văn hoá / Trung Việt">
       <Textarea
        value={manual.ai_analysis.cultural_note || ""}
        onChange={(value) => updateManual({}, { cultural_note: value })}
       />
      </Field>
      <Field label="Lưu ý">
       <Textarea
        value={manual.ai_analysis.usage_note || ""}
        onChange={(value) => updateManual({}, { usage_note: value })}
       />
      </Field>
      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
       <ActionButton onClick={onClose} tone="neutral">
        Huỷ
       </ActionButton>
       <ActionButton
        onClick={() => onImport([manual])}
        icon={Plus}
        disabled={!manualReady}
       >
        Thêm từ
       </ActionButton>
      </div>
     </>
    )}
   </div>
  </Drawer>
 );
}

function EntryEditDrawer({
 entry,
 lessons,
 onClose,
 onSave,
 onDelete,
}: {
 entry: VocabEntryWithProgress;
 lessons: VocabLessonWithStats[];
 onClose: () => void;
 onSave: (entry: VocabEntryWithProgress, analysis: AiAnalysis) => void;
 onDelete: (entry: VocabEntryWithProgress) => void;
}) {
 const [draft, setDraft] = useState(entry);
 const [analysis, setAnalysis] = useState<AiAnalysis>(entry.ai_analysis);
 const [examplesText, setExamplesText] = useState(
  examplesToText(entry.ai_analysis.examples),
 );
 const [collocationsText, setCollocationsText] = useState(
  lineText(entry.ai_analysis.collocations),
 );
 const [comparisonsText, setComparisonsText] = useState(
  lineText(entry.ai_analysis.comparisons),
 );

 const updateAnalysis = (patch: Partial<AiAnalysis>) =>
  setAnalysis((current) => ({ ...current, ...patch }));
 const save = () => {
  const selectedLesson = lessons.find(
   (lesson) => lesson.id === draft.lesson_id,
  );
  const nextAnalysis: AiAnalysis = {
   ...analysis,
   hanzi: draft.hanzi,
   pinyin: draft.pinyin,
   sino_vietnamese: draft.sino_vietnamese,
   han_viet: draft.sino_vietnamese || analysis.han_viet,
   meaning_summary: draft.meaning,
   word_type: draft.word_type,
   collocations: parseLines(collocationsText),
   comparisons: parseLines(comparisonsText),
   examples: textToExamples(examplesText),
   source_metadata: {
    ...analysis.source_metadata,
    ...(selectedLesson
     ? {
        lesson_key: selectedLesson.lesson_key,
        lesson_number: selectedLesson.lesson_number,
        lesson_title: selectedLesson.title,
       }
     : {}),
    row_number: draft.row_number,
    category: draft.category,
   },
  };
  onSave(draft, nextAnalysis);
 };

 return (
  <Drawer
   title={entry.id.startsWith("new-") ? "Thêm từ mới" : `Sửa từ ${entry.hanzi}`}
   onClose={onClose}
  >
   <div className="grid gap-4">
    <Field label="Bài">
     <Select
      value={draft.lesson_id}
      onChange={(event) => {
       const nextLesson = lessons.find(
        (lesson) => lesson.id === event.target.value,
       );
       setDraft({
        ...draft,
        lesson_id: event.target.value,
        course_id: nextLesson?.course_id || draft.course_id,
        row_number: nextLesson
         ? nextLesson.entries.length + 1
         : draft.row_number,
        source: nextLesson
         ? {
            ...draft.source,
            lessonKey: nextLesson.lesson_key,
            lessonNumber: nextLesson.lesson_number,
            lessonTitle: nextLesson.title,
            rowNumber: nextLesson.entries.length + 1,
           }
         : draft.source,
       });
      }}
      className="h-11 text-sm"
     >
      {lessons.map((lesson) => (
       <option key={lesson.id} value={lesson.id}>
        {lesson.title}
       </option>
      ))}
     </Select>
    </Field>
    <Field label="Row trong bài">
     <Input
      type="number"
      value={draft.row_number}
      onChange={(event) =>
       setDraft({ ...draft, row_number: Number(event.target.value) })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Hán tự">
     <Input
      value={draft.hanzi}
      onChange={(event) => setDraft({ ...draft, hanzi: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 bg-white font-bold"
     />
    </Field>
    <Field label="Pinyin">
     <Input
      value={draft.pinyin}
      onChange={(event) => setDraft({ ...draft, pinyin: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Hán Việt">
     <Input
      value={draft.sino_vietnamese || ""}
      onChange={(event) =>
       setDraft({ ...draft, sino_vietnamese: event.target.value })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Nghĩa ngắn">
     <Input
      value={draft.meaning}
      onChange={(event) => setDraft({ ...draft, meaning: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Loại từ">
     <Input
      value={draft.word_type || ""}
      onChange={(event) =>
       setDraft({ ...draft, word_type: event.target.value })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Category">
     <Input
      value={draft.category || ""}
      onChange={(event) => setDraft({ ...draft, category: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Nghĩa chi tiết">
     <Textarea
      value={analysis.meaning_detail || ""}
      onChange={(value) => updateAnalysis({ meaning_detail: value })}
     />
    </Field>
    <Field label="Chiết tự">
     <Textarea
      value={analysis.decomposition || ""}
      onChange={(value) => updateAnalysis({ decomposition: value })}
     />
    </Field>
    <Field label="So sánh gần nghĩa">
     <Textarea value={comparisonsText} onChange={setComparisonsText} />
    </Field>
    <Field label="Cụm từ cố định">
     <Textarea value={collocationsText} onChange={setCollocationsText} />
    </Field>
    <Field label="Ví dụ: zh | pinyin | vi | note">
     <Textarea value={examplesText} onChange={setExamplesText} rows={7} />
    </Field>
    <Field label="Văn hoá / Trung Việt">
     <Textarea
      value={analysis.cultural_note || ""}
      onChange={(value) => updateAnalysis({ cultural_note: value })}
     />
    </Field>
    <Field label="Lưu ý">
     <Textarea
      value={analysis.usage_note || ""}
      onChange={(value) => updateAnalysis({ usage_note: value })}
     />
    </Field>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     {!entry.id.startsWith("new-") && (
      <ActionButton
       onClick={() => onDelete(entry)}
       tone="neutral"
       icon={Trash2}
      >
       Xoá từ
      </ActionButton>
     )}
     <ActionButton onClick={onClose} tone="neutral">
      Huỷ
     </ActionButton>
     <ActionButton onClick={save}>Lưu từ</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}

function LessonEditDrawer({
 lesson,
 onClose,
 onSave,
 onDelete,
}: {
 lesson: VocabLessonWithStats;
 onClose: () => void;
 onSave: (lesson: VocabLessonWithStats) => void;
 onDelete: (lesson: VocabLessonWithStats) => void;
}) {
 const [draft, setDraft] = useState(lesson);
 return (
  <Drawer
   title={lesson.id.startsWith("new-") ? "Thêm bài mới" : "Sửa bài"}
   onClose={onClose}
  >
   <div className="grid gap-4">
    <Field label="Mã bài">
     <Input
      value={draft.lesson_key}
      onChange={(event) =>
       setDraft({ ...draft, lesson_key: event.target.value })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Số bài">
     <Input
      type="number"
      value={draft.lesson_number || ""}
      onChange={(event) =>
       setDraft({
        ...draft,
        lesson_number: event.target.value ? Number(event.target.value) : null,
       })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Tên bài">
     <Input
      value={draft.title}
      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Thứ tự">
     <Input
      type="number"
      value={draft.lesson_order}
      onChange={(event) =>
       setDraft({ ...draft, lesson_order: Number(event.target.value) })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <div className="rounded-2xl bg-stone-50 p-4">
     <p className="text-sm font-black text-stone-700">
      {lesson.entries.length} từ trong bài
     </p>
     <p className="mt-1 text-xs font-bold text-stone-500">
      Có thể chuyển từng từ sang bài khác trong drawer sửa từ. Dùng row number
      để giữ thứ tự học.
     </p>
    </div>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     {!lesson.id.startsWith("new-") && (
      <ActionButton
       onClick={() => onDelete(lesson)}
       tone="neutral"
       icon={Trash2}
      >
       Xoá bài
      </ActionButton>
     )}
     <ActionButton onClick={onClose} tone="neutral">
      Huỷ
     </ActionButton>
     <ActionButton onClick={() => onSave(draft)}>Lưu bài</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}

function ShortcutHelp() {
 return (
  <div className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <p className="text-sm font-black uppercase tracking-wide text-stone-500">
    Shortcut
   </p>
   <div className="mt-3 grid gap-2 text-sm font-bold text-stone-600 md:grid-cols-4">
    <span>
     <kbd>Space</kbd> xem/ẩn đáp án
    </span>
    <span>
     <kbd>1</kbd> chưa nhớ
    </span>
    <span>
     <kbd>2</kbd> cần ôn
    </span>
    <span>
     <kbd>3</kbd> đã nhớ
    </span>
    <span>
     <kbd>Enter</kbd> kiểm tra/tiếp
    </span>
    <span>
     <kbd>A-D</kbd> chọn đáp án
    </span>
    <span>
     <kbd>H</kbd> gợi ý
    </span>
    <span>
     <kbd>J/K</kbd> tới/lùi
    </span>
    <span>
     <kbd>S</kbd> phát âm
    </span>
    <span>
     <kbd>?</kbd> ẩn/hiện
    </span>
   </div>
  </div>
 );
}

function EmptyState({
 title,
 description,
 action,
 compact,
}: {
 title: string;
 description: string;
 action?: ReactNode;
 compact?: boolean;
}) {
 return (
  <div
   className={cn(
    "flex flex-col items-center justify-center rounded-[28px] border-2 border-stone-200 bg-white p-8 text-center shadow-theme-md",
    compact ? "min-h-64" : "min-h-[520px]",
   )}
  >
   <Sparkles className="h-12 w-12 text-stone-300" />
   <h2 className="mt-4 text-2xl font-black text-stone-900">{title}</h2>
   <p className="mt-2 max-w-md text-sm font-bold leading-6 text-stone-500">
    {description}
   </p>
   {action && <div className="mt-5">{action}</div>}
  </div>
 );
}

function FilterBar({
 value,
 onChange,
}: {
 value: WordFilter;
 onChange: (filter: WordFilter) => void;
}) {
 const filters: { key: WordFilter; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "new", label: "Đang học" },
  { key: "learning", label: "Đang ôn" },
  { key: "mastered", label: "Thành thạo" },
  { key: "examples", label: "Có ví dụ" },
  { key: "missing", label: "Thiếu dữ liệu" },
 ];
 return (
  <div className="mt-5 flex flex-wrap gap-2">
   {filters.map((filter) => (
    <button
     key={filter.key}
     type="button"
     onClick={() => onChange(filter.key)}
     className={cn(
      "h-9 rounded-xl border-2 px-3 text-xs font-black transition",
      value === filter.key
       ? "border-red-500 bg-red-500 text-white"
       : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50",
     )}
    >
     {filter.label}
    </button>
   ))}
  </div>
 );
}

function WordCard({
 entry,
 onEdit,
}: {
 entry: VocabEntryWithProgress;
 onEdit: () => void;
}) {
 const [writerCharIndex, setWriterCharIndex] = useState(0);

 return (
  <article className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-start justify-between gap-3">
    <Link
     href={`/dictionary/${encodeURIComponent(entry.hanzi)}`}
     className="min-w-0"
    >
     <div className="flex items-center gap-2">
      <h3 className="truncate text-3xl font-black text-stone-900">
       {entry.hanzi}
      </h3>
      <p className="truncate text-sm font-black text-red-500">
       [{entry.pinyin}]
      </p>
      <p className=" text-sm font-bold  text-stone-600">{getMeaning(entry)}</p>
     </div>
     <InlineHskWritingPanel
      entry={entry}
      activeIndex={writerCharIndex}
      onIndexChange={setWriterCharIndex}
     />
    </Link>
    <StatusPill status={entry.status} />
   </div>

   <div className="mt-4 flex items-center justify-between border-t-2 border-stone-100 pt-3">
    <span className="truncate text-xs font-black uppercase tracking-wide text-stone-400">
     {entry.source.lessonKey} · {entry.category || "Bổ sung"}
    </span>
    <button
     type="button"
     onClick={onEdit}
     className="inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-black text-stone-600 hover:bg-stone-100"
    >
     <PenLine className="h-4 w-4" />
     Sửa
    </button>
   </div>
  </article>
 );
}

function StatusPill({ status }: { status: VocabEntryWithProgress["status"] }) {
 const className = {
  new: "bg-yellow-50 text-orange-600 border-yellow-300",
  learning: "bg-blue-50 text-blue-600 border-blue-300",
  mastered: "bg-emerald-50 text-emerald-600 border-emerald-300",
 }[status];
 const label = { new: "Mới", learning: "Đang ôn", mastered: "Thuộc" }[status];
 return (
  <span
   className={cn(
    "rounded-full border-2 px-2.5 py-1 text-xs font-black",
    className,
   )}
  >
   {label}
  </span>
 );
}

function createManualEntryDraft(
 lesson: VocabLessonWithStats,
): ImportedEntryDraft {
 const category = lesson.categories[0]?.name || "Bổ sung";
 const rowNumber = lesson.entries.length + 1;
 return {
  hanzi: "",
  pinyin: "",
  sino_vietnamese: "",
  meaning: "",
  word_type: "",
  category,
  row_number: rowNumber,
  ai_analysis: {
   hanzi: "",
   pinyin: "",
   meaning_summary: "",
   meaning_detail: "",
   source_metadata: {
    lesson_key: lesson.lesson_key,
    lesson_number: lesson.lesson_number,
    lesson_title: lesson.title,
    row_number: rowNumber,
    category,
   },
  },
 };
}

function Drawer({
 title,
 children,
 onClose,
}: {
 title: string;
 children: ReactNode;
 onClose: () => void;
}) {
 return (
  <LearningDrawer title={title} onClose={onClose}>
   {children}
  </LearningDrawer>
 );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
 return (
  <label className="grid gap-2">
   <span className="text-xs font-black uppercase tracking-wide text-stone-500">
    {label}
   </span>
   {children}
  </label>
 );
}

function Textarea({
 value,
 onChange,
 rows = 4,
 placeholder,
}: {
 value: string;
 onChange: (value: string) => void;
 rows?: number;
 placeholder?: string;
}) {
 return (
  <textarea
   value={value}
   rows={rows}
   placeholder={placeholder}
   onChange={(event) => onChange(event.target.value)}
   className="w-full rounded-2xl border-2 border-stone-200 bg-white px-4 py-3 text-sm font-bold leading-6 text-stone-800 outline-none focus:border-red-300"
  />
 );
}

export {
 AllWordsWorkspace,
 EmptyState,
 EntryEditDrawer,
 ImportLessonDrawer,
 LessonEditDrawer,
 LessonEditWorkspace,
 ShortcutHelp,
};
