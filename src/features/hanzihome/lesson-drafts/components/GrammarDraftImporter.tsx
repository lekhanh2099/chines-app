"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
 ArrowLeft,
 CheckCircle2,
 FileText,
 GraduationCap,
 Plus,
 Save,
 WandSparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUpdateLessonDraftMutation } from "@/features/hanzihome/lesson-drafts/use-lesson-drafts";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { GrammarDraftManualEditor } from "@/features/hanzihome/lesson-drafts/components/GrammarDraftManualEditor";
import { parseLessonDraftImport } from "@/features/hanzihome/lesson-drafts/import-parser";
import {
 createEmptyGrammarDraftItem,
 createEmptyLessonDraftNotes,
 grammarDraftItemSchema,
 lessonDraftNotesSchema,
 type GrammarDraftItem,
 type LessonDraftNotes,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import { cn } from "@/lib/utils";

type GrammarDraftImporterProps = {
 draft: LessonDraft;
 reviewOnly?: boolean;
};

type ImportStep = "source" | "review";
type SaveMode = "append" | "replace";

function isGrammarDraftItem(value: unknown): value is GrammarDraftItem {
 return grammarDraftItemSchema.safeParse(value).success;
}

function getItemWarnings(item: GrammarDraftItem) {
 const warnings: string[] = [];

 if (!item.title.trim()) warnings.push("thiếu tên điểm ngữ pháp");
 if (!item.coreLogic.trim() && !item.shortMeaning.trim()) {
  warnings.push("thiếu công dụng / logic");
 }
 if (item.formulas.length === 0) warnings.push("chưa có công thức");
 if (item.examples.length === 0) warnings.push("chưa có ví dụ");

 return warnings;
}

function getAllWarnings(items: GrammarDraftItem[]) {
 return items.flatMap((item, index) =>
  getItemWarnings(item).map(
   (warning) => `${item.title || `Mục ${index + 1}`}: ${warning}`,
  ),
 );
}

function dedupeById(items: GrammarDraftItem[]) {
 const seen = new Set<string>();

 return items.map((item, index) => {
  if (!seen.has(item.id)) {
   seen.add(item.id);
   return item;
  }

  let nextId = `${item.id}-${index + 1}`;
  let suffix = 2;

  while (seen.has(nextId)) {
   nextId = `${item.id}-${index + 1}-${suffix}`;
   suffix += 1;
  }

  seen.add(nextId);

  return {
   ...item,
   id: nextId,
  };
 });
}

function mergeItems(
 currentItems: GrammarDraftItem[],
 incomingItems: GrammarDraftItem[],
 mode: SaveMode,
) {
 if (mode === "replace") return dedupeById(incomingItems);

 return dedupeById([...currentItems, ...incomingItems]);
}

function mergeNotes(
 currentNotes: LessonDraftNotes,
 incomingNotes: LessonDraftNotes | undefined,
 mode: SaveMode,
): LessonDraftNotes {
 if (!incomingNotes) return currentNotes;
 if (mode === "replace") return incomingNotes;

 return {
  overviewMarkdown: [
   currentNotes.overviewMarkdown,
   incomingNotes.overviewMarkdown,
  ]
   .filter(Boolean)
   .join("\n\n---\n\n"),
  grammarSummary: [currentNotes.grammarSummary, incomingNotes.grammarSummary]
   .filter(Boolean)
   .join("\n"),
  vocabularyText: [currentNotes.vocabularyText, incomingNotes.vocabularyText]
   .filter(Boolean)
   .join("\n"),
  properNounsText: [currentNotes.properNounsText, incomingNotes.properNounsText]
   .filter(Boolean)
   .join("\n"),
  applicationMarkdown: [
   currentNotes.applicationMarkdown,
   incomingNotes.applicationMarkdown,
  ]
   .filter(Boolean)
   .join("\n\n---\n\n"),
  personalNote: currentNotes.personalNote || incomingNotes.personalNote,
 };
}

function Textarea({
 className,
 ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
 return (
  <textarea
   className={cn(
    "min-h-24 w-full rounded-xl border border-border-default bg-bg-primary px-3 py-2 text-sm font-semibold text-text-primary placeholder:text-text-muted focus-visible:outline-none",
    className,
   )}
   {...props}
  />
 );
}

function NotesEditor({
 notes,
 onChange,
}: {
 notes: LessonDraftNotes;
 onChange: (notes: LessonDraftNotes) => void;
}) {
 const updateNotes = (patch: Partial<LessonDraftNotes>) => {
  onChange({
   ...notes,
   ...patch,
  });
 };

 return (
  <div className="grid gap-4">
   <Field label="Tổng quan bài / overview">
    <Textarea
     value={notes.overviewMarkdown}
     onChange={(event) => updateNotes({ overviewMarkdown: event.target.value })}
     className="min-h-36"
    />
   </Field>

   <Field label="Tóm tắt ngữ pháp">
    <Textarea
     value={notes.grammarSummary}
     onChange={(event) => updateNotes({ grammarSummary: event.target.value })}
    />
   </Field>

   <Field label="Từ vựng liên quan">
    <Textarea
     value={notes.vocabularyText}
     onChange={(event) => updateNotes({ vocabularyText: event.target.value })}
    />
   </Field>

   <Field label="Tên riêng">
    <Textarea
     value={notes.properNounsText}
     onChange={(event) => updateNotes({ properNounsText: event.target.value })}
    />
   </Field>

   <Field label="Ứng dụng / điển tích / đọc thêm">
    <Textarea
     value={notes.applicationMarkdown}
     onChange={(event) =>
      updateNotes({ applicationMarkdown: event.target.value })
     }
     className="min-h-36"
    />
   </Field>

   <Field label="Ghi chú cá nhân">
    <Textarea
     value={notes.personalNote}
     onChange={(event) => updateNotes({ personalNote: event.target.value })}
    />
   </Field>
  </div>
 );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
 return (
  <label className="grid gap-2">
   <span className="text-xs font-black uppercase tracking-wide text-text-muted">
    {label}
   </span>
   {children}
  </label>
 );
}

export function GrammarDraftImporter({
 draft,
 reviewOnly = false,
}: GrammarDraftImporterProps) {
 const searchParams = useSearchParams();
 const updateMutation = useUpdateLessonDraftMutation();

 const savedItems = useMemo(
  () => draft.content.grammarPoints.filter(isGrammarDraftItem),
  [draft.content.grammarPoints],
 );

 const savedNotes = useMemo(
  () =>
   lessonDraftNotesSchema.safeParse(draft.content.lesson.notes).success
    ? lessonDraftNotesSchema.parse(draft.content.lesson.notes)
    : createEmptyLessonDraftNotes(),
  [draft.content.lesson.notes],
 );

 const [step, setStep] = useState<ImportStep>(
  reviewOnly || savedItems.length > 0 ? "review" : "source",
 );
 const [saveMode, setSaveMode] = useState<SaveMode>("append");
 const [sourceText, setSourceText] = useState("");
 const [sourceDirty, setSourceDirty] = useState(false);
 const [items, setItems] = useState<GrammarDraftItem[]>(savedItems);
 const [notes, setNotes] = useState<LessonDraftNotes>(savedNotes);
 const [selectedItemId, setSelectedItemId] = useState<string | null>(
  searchParams.get("itemId") || savedItems[0]?.id || null,
 );
 const [warnings, setWarnings] = useState<string[]>([]);

 const selectedItem =
  items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;

 const selectedWarnings = selectedItem ? getItemWarnings(selectedItem) : [];

 const parseCurrentSource = () => {
  if (!sourceText.trim()) {
   throw new Error("Chưa có nội dung để parse.");
  }

  const result = parseLessonDraftImport(sourceText);

  return {
   items: result.grammarPoints,
   notes: result.lessonNotes ?? createEmptyLessonDraftNotes(),
   warnings: result.warnings.map((warning) =>
    warning.path ? `${warning.path}: ${warning.message}` : warning.message,
   ),
  };
 };

 const applyParsed = (
  nextItems: GrammarDraftItem[],
  nextNotes: LessonDraftNotes,
  nextWarnings: string[],
  nextSelectedId?: string,
 ) => {
  setItems(nextItems);
  setNotes(nextNotes);
  setWarnings(nextWarnings);
  setSelectedItemId(nextSelectedId ?? nextItems[0]?.id ?? null);
  setSourceDirty(false);
 };

 const saveGrammar = async (
  nextItems: GrammarDraftItem[],
  nextNotes: LessonDraftNotes,
  options: { strict: boolean },
 ) => {
  const parsedItems = nextItems.map((item) =>
   grammarDraftItemSchema.parse(item),
  );
  const parsedNotes = lessonDraftNotesSchema.parse(nextNotes);
  const nextWarnings = getAllWarnings(parsedItems);

  setWarnings(nextWarnings);

  if (options.strict && nextWarnings.length > 0) {
   toast.error("Còn cảnh báo. Sửa lại hoặc dùng lưu nhanh.");
   return;
  }

  const grammarPointIds = parsedItems.map((item) => item.id);

  await updateMutation.mutateAsync({
   draftId: draft.id,
   input: {
    content: {
     ...draft.content,
     lesson: {
      ...draft.content.lesson,
      grammarPointIds,
      notes: parsedNotes,
     },
     grammarPoints: parsedItems,
    },
   },
  });

  toast.success(`Đã lưu ${parsedItems.length} điểm ngữ pháp`);
 };

 const handlePreviewImport = () => {
  try {
   const result = parseCurrentSource();

   if (result.items.length === 0) {
    toast.error("Không parse được điểm ngữ pháp nào");
    return;
   }

   const mergedItems = mergeItems(items, result.items, saveMode);
   const mergedNotes = mergeNotes(notes, result.notes, saveMode);
   const firstIncomingId =
    saveMode === "append" ? mergedItems[items.length]?.id : mergedItems[0]?.id;

   applyParsed(mergedItems, mergedNotes, result.warnings, firstIncomingId);
   toast.success(
    saveMode === "append"
     ? `Đã thêm tạm ${result.items.length} điểm ngữ pháp vào review`
     : `Đã thay tạm bằng ${result.items.length} điểm ngữ pháp`,
   );
   setStep("review");
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : "Không parse được dữ liệu",
   );
  }
 };

 const handleImportAndSave = async (options: { strict: boolean }) => {
  try {
   const result = parseCurrentSource();

   if (result.items.length === 0) {
    toast.error("Không parse được điểm ngữ pháp nào");
    return;
   }

   const mergedItems = mergeItems(savedItems, result.items, saveMode);
   const mergedNotes = mergeNotes(savedNotes, result.notes, saveMode);
   const firstIncomingId =
    saveMode === "append"
     ? mergedItems[savedItems.length]?.id
     : mergedItems[0]?.id;

   applyParsed(mergedItems, mergedNotes, result.warnings, firstIncomingId);
   await saveGrammar(mergedItems, mergedNotes, options);
   setStep("review");
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : "Không lưu được ngữ pháp",
   );
  }
 };

 const handleAddManualItem = () => {
  const nextItem = createEmptyGrammarDraftItem();
  const nextItems = dedupeById([...items, nextItem]);
  const addedItem = nextItems[nextItems.length - 1];

  setItems(nextItems);
  setSelectedItemId(addedItem?.id ?? null);
 };

 const handleItemChange = (nextItem: GrammarDraftItem) => {
  setItems((currentItems) =>
   currentItems.map((item) => (item.id === nextItem.id ? nextItem : item)),
  );
 };

 const handleSaveReviewItems = async (options: { strict: boolean }) => {
  await saveGrammar(items, notes, options);
 };

 return (
  <div className="grid gap-4">
   {!reviewOnly && (
   <Card padding="sm" className="rounded-xl">
    <div className="flex flex-wrap items-center gap-2">
     <StepButton
      active={step === "source"}
      label="1. Nhập nguồn"
      onClick={() => setStep("source")}
     />
     <StepButton
      active={step === "review"}
      label="2. Review & sửa tay"
      disabled={items.length === 0}
      onClick={() => setStep("review")}
     />

     {sourceDirty && (
      <span className="justify-self-end rounded-full bg-bg-subtle px-3 py-1 text-xs font-black text-text-muted">
       Có source mới chưa xử lý
      </span>
     )}
    </div>
   </Card>
   )}

   {!reviewOnly && step === "source" && (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-3">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Step 1
        </p>
        <h2 className="text-xl font-black text-text-primary">
         Nhập nguồn ngữ pháp
        </h2>
        <p className="text-sm font-semibold text-text-muted">
         Dán outline ngắn, markdown dài, hoặc text copy từ docs/docx.
        </p>
       </div>

       <div className="flex flex-wrap gap-2 rounded-xl border border-border-default bg-bg-primary p-2">
        <button
         type="button"
         className={cn(
          "rounded-xl px-3 py-2 text-sm font-black",
          saveMode === "append"
           ? "bg-text-primary text-bg-primary"
           : "text-text-muted hover:text-text-primary",
         )}
         onClick={() => setSaveMode("append")}
        >
         Thêm vào bài
        </button>
        <button
         type="button"
         className={cn(
          "rounded-xl px-3 py-2 text-sm font-black",
          saveMode === "replace"
           ? "bg-text-primary text-bg-primary"
           : "text-text-muted hover:text-text-primary",
         )}
         onClick={() => setSaveMode("replace")}
        >
         Thay toàn bộ
        </button>
       </div>

       <textarea
        value={sourceText}
        onChange={(event) => {
         setSourceText(event.target.value);
         setSourceDirty(true);
        }}
        placeholder="Dán markdown/text ngữ pháp ở đây..."
        className="min-h-96 w-full rounded-xl border border-border-default bg-bg-primary px-3 py-3 text-sm font-semibold text-text-primary placeholder:text-text-muted focus-visible:outline-none"
       />

       <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handlePreviewImport}>
         <WandSparkles className="h-4 w-4" />
         Xem trước
        </Button>

        <Button
         type="button"
         variant="outline"
         disabled={updateMutation.isPending}
         onClick={() => void handleImportAndSave({ strict: false })}
        >
         <Save className="h-4 w-4" />
         Thêm & lưu nhanh
        </Button>

        <Button
         type="button"
         disabled={updateMutation.isPending}
         onClick={() => void handleImportAndSave({ strict: true })}
        >
         <CheckCircle2 className="h-4 w-4" />
         Check rồi lưu
        </Button>
       </div>
      </div>
     </Card>

     <Card padding="lg" className="rounded-xl">
      <div className="grid gap-4">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Parser grammar
        </p>
        <h2 className="text-xl font-black text-text-primary">
         Parse ra 2 loại dữ liệu
        </h2>
       </div>

       <div className="grid gap-3 text-sm font-semibold text-text-muted">
        <p>
         <b>Ghi chú bài</b>: tổng quan, từ vựng liên quan, tên riêng, phần ứng
         dụng.
        </p>
        <p>
         <b>Điểm ngữ pháp</b>: title, pattern, công thức, ví dụ, bẫy sai, so
         sánh.
        </p>
        <p>
         <b>Xem trước</b>: parse ra review, chưa lưu DB.
        </p>
        <p>
         <b>Thêm & lưu nhanh</b>: parse source hiện tại rồi lưu luôn.
        </p>
       </div>

       <div className="rounded-xl border border-border-default bg-bg-subtle p-4">
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         Trạng thái hiện tại
        </p>
        <p className="text-2xl font-black text-text-primary">
         {items.length} điểm ngữ pháp trong review
        </p>
        <p className="text-sm font-semibold text-text-muted">
         {savedItems.length} điểm ngữ pháp đang có trong draft database.
        </p>
       </div>
      </div>
     </Card>
    </div>
   )}

   {step === "review" && (
    <div className="grid gap-4 xl:grid-cols-[minmax(20rem,0.75fr)_minmax(0,1.5fr)]">
     <div className="grid content-start gap-4">
      <Card padding="md" className="rounded-xl">
       <div className="grid gap-3">
        <div className="flex items-start justify-between gap-3">
         <div>
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
           Grammar points
          </p>
          <h3 className="text-lg font-black text-text-primary">
           {items.length} mục
          </h3>
         </div>

         <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddManualItem}
         >
          <Plus className="h-4 w-4" />
          Thêm tay
         </Button>
        </div>

        {items.length === 0 ? (
         <div className="rounded-xl border border-dashed border-border-default p-4 text-sm font-semibold text-text-muted">
          Chưa có điểm ngữ pháp nào.
         </div>
        ) : (
         <div className="grid max-h-[42rem] gap-2 overflow-y-auto scrollbar-soft pr-1">
          {items.map((item) => {
           const itemWarnings = getItemWarnings(item);

           return (
            <button
             key={item.id}
             type="button"
             className={cn(
              "grid gap-1 rounded-xl border p-3 text-left transition-colors",
              selectedItem?.id === item.id
               ? "border-primary bg-bg-subtle"
               : "border-border-default bg-bg-primary hover:bg-bg-card-hover",
             )}
             onClick={() => setSelectedItemId(item.id)}
            >
             <span className="text-sm font-black text-text-primary">
              {item.title || "Chưa có tiêu đề"}
             </span>
             <span className="truncate text-xs font-bold text-text-muted">
              {item.pattern || item.formulas[0] || "Chưa có pattern"}
             </span>

             {itemWarnings.length > 0 && (
              <span className="rounded-full bg-bg-subtle px-2 py-1 text-xs font-bold text-text-muted">
               {itemWarnings.length} cảnh báo
              </span>
             )}
            </button>
           );
          })}
         </div>
        )}
       </div>
      </Card>

      {warnings.length > 0 && (
       <Card padding="md" className="rounded-xl">
        <div className="grid gap-2">
         <p className="text-xs font-black uppercase tracking-wide text-text-muted">
          Cảnh báo tổng
         </p>
         <ul className="grid max-h-60 gap-1 overflow-y-auto scrollbar-soft text-sm font-semibold text-text-muted">
          {warnings.map((warning) => (
           <li key={warning}>• {warning}</li>
          ))}
         </ul>
        </div>
       </Card>
      )}
     </div>

     <div className="grid gap-4">
      <Card padding="lg" className="rounded-xl">
       <div className="grid gap-3">
        <div className="flex items-start gap-3">
         <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
          <FileText className="h-5 w-5" />
         </span>

         <div>
          <p className="text-xs font-black uppercase tracking-wide text-text-muted">
           Lesson notes
          </p>
          <h2 className="text-xl font-black text-text-primary">
           Ghi chú tổng quan của bài
          </h2>
         </div>
        </div>

        <NotesEditor notes={notes} onChange={setNotes} />
       </div>
      </Card>

      <Card padding="lg" className="rounded-xl">
       {selectedItem ? (
        <div className="grid gap-3">
         <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
           <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-subtle">
            <GraduationCap className="h-5 w-5" />
           </span>

           <div>
            <p className="text-xs font-black uppercase tracking-wide text-text-muted">
             Manual editor
            </p>
            <h2 className="text-xl font-black text-text-primary">
             Sửa điểm ngữ pháp
            </h2>
           </div>
          </div>

          {selectedWarnings.length > 0 && (
           <div className="rounded-xl border border-border-default bg-bg-subtle px-3 py-2 text-xs font-bold text-text-muted">
            {selectedWarnings.join(",")}
           </div>
          )}
         </div>

         <GrammarDraftManualEditor
          item={selectedItem}
          onChange={handleItemChange}
         />
        </div>
       ) : (
        <div className="rounded-xl border border-dashed border-border-default p-4 text-sm font-semibold text-text-muted">
         Chọn một điểm ngữ pháp ở danh sách bên trái để sửa.
        </div>
       )}
      </Card>
     </div>
    </div>
   )}

   {step === "review" && (
    <Card padding="sm" className="rounded-xl">
     <div className="flex flex-wrap justify-between gap-2">
      {reviewOnly ? (
       <div className="text-sm font-semibold text-text-muted">
        Dùng nút Import Markdown phía trên để nhập nguồn mới.
       </div>
      ) : (
       <Button type="button" variant="ghost" onClick={() => setStep("source")}>
        <ArrowLeft className="h-4 w-4" />
        Quay lại nhập nguồn
       </Button>
      )}

      <div className="flex flex-wrap gap-2">
       <Button
        type="button"
        variant="outline"
        disabled={updateMutation.isPending || items.length === 0}
        onClick={() => void handleSaveReviewItems({ strict: false })}
       >
        <Save className="h-4 w-4" />
        Lưu chỉnh sửa
       </Button>

       <Button
        type="button"
        disabled={updateMutation.isPending || items.length === 0}
        onClick={() => void handleSaveReviewItems({ strict: true })}
       >
        <CheckCircle2 className="h-4 w-4" />
        Check & lưu
       </Button>
      </div>
     </div>
    </Card>
   )}
  </div>
 );
}

function StepButton({
 active,
 label,
 disabled,
 onClick,
}: {
 active: boolean;
 label: string;
 disabled?: boolean;
 onClick: () => void;
}) {
 return (
  <button
   type="button"
   disabled={disabled}
   className={cn(
    "rounded-full px-4 py-2 text-sm font-black transition-colors disabled:cursor-not-allowed disabled:opacity-50",
    active
     ? "bg-text-primary text-bg-primary"
     : "bg-bg-subtle text-text-muted hover:text-text-primary",
   )}
   onClick={onClick}
  >
   {label}
  </button>
 );
}
