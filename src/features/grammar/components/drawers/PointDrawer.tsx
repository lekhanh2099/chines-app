"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
 ActionButton,
 Drawer,
 Field,
 Textarea,
} from "@/features/grammar/components/ui";
import {
 getAnswerText,
 lines,
 type ExerciseDraft,
} from "@/features/grammar/utils/exercise";
import type {
 DbGrammarExercise,
 GrammarExerciseType,
 GrammarLessonWithStats,
 GrammarPointContent,
 GrammarPointWithProgress,
} from "@/types/database";

const exerciseLabels: Record<GrammarExerciseType, string> = {
 fill_blank: "Điền từ",
 multiple_choice: "Trắc nghiệm",
 reorder_sentence: "Sắp xếp câu",
 translate_zh: "Dịch Trung",
 identify_error: "Tìm lỗi sai",
};

export function PointDrawer({
 point,
 lessons,
 onClose,
 onSave,
 onDelete,
}: {
 point: GrammarPointWithProgress;
 lessons: GrammarLessonWithStats[];
 onClose: () => void;
 onSave: (point: GrammarPointWithProgress, exercises: ExerciseDraft[]) => void;
 onDelete: (point: GrammarPointWithProgress) => void;
}) {
 const queryClient = useQueryClient();
 const [draft, setDraft] = useState(point);
 const [tagsText, setTagsText] = useState(point.tags.join(", "));
 const [structuresText, setStructuresText] = useState(
  (point.content.structures || []).join("\n"),
 );
 const [usageText, setUsageText] = useState(
  (point.content.usage_notes || []).join("\n"),
 );
 const [mistakesText, setMistakesText] = useState(
  (point.content.common_mistakes || []).join("\n"),
 );
 const [comparisonsText, setComparisonsText] = useState(
  (point.content.comparisons || []).join("\n"),
 );
 const [isFillingAi, setIsFillingAi] = useState(false);
 const [exerciseDrafts, setExerciseDrafts] = useState<ExerciseDraft[]>(() =>
  point.exercises.map((exercise) => ({
   id: exercise.id,
   exercise_type: exercise.exercise_type,
   prompt: exercise.prompt,
   answerText: getAnswerText(exercise),
   explanation: exercise.explanation || "",
  })),
 );

 const updateContent = (patch: Partial<GrammarPointContent>) =>
  setDraft((current) => ({
   ...current,
   content: { ...current.content, ...patch },
  }));
 const save = () =>
  onSave(
   {
    ...draft,
    tags: tagsText
     .split(",")
     .map((tag) => tag.trim())
     .filter(Boolean),
    content: {
     ...draft.content,
     structures: lines(structuresText),
     usage_notes: lines(usageText),
     common_mistakes: lines(mistakesText),
     comparisons: lines(comparisonsText),
    },
   },
   exerciseDrafts,
  );
 const fillMissing = async () => {
  if (point.id.startsWith("new-")) {
   toast.message("Lưu ngữ pháp trước rồi mới bổ sung AI phần thiếu.");
   return;
  }
  setIsFillingAi(true);
  try {
   const response = await fetch(
    `/api/grammar/points/${point.id}/fill-missing`,
    { method: "POST" },
   );
   const result = (await response.json().catch(() => null)) as {
    error?: string;
    point?: GrammarPointWithProgress;
    insertedExercises?: DbGrammarExercise[];
   } | null;
   if (!response.ok || !result?.point) {
    throw new Error(result?.error || "Không bổ sung được AI");
   }
   const nextContent = result.point.content || draft.content;
   setDraft((current) => ({ ...current, content: nextContent }));
   setStructuresText((nextContent.structures || []).join("\n"));
   setUsageText((nextContent.usage_notes || []).join("\n"));
   setMistakesText((nextContent.common_mistakes || []).join("\n"));
   setComparisonsText((nextContent.comparisons || []).join("\n"));
   if (result.insertedExercises?.length) {
    setExerciseDrafts(
     result.insertedExercises.map((exercise) => ({
      id: exercise.id,
      exercise_type: exercise.exercise_type,
      prompt: exercise.prompt,
      answerText: getAnswerText(exercise),
      explanation: exercise.explanation || "",
     })),
    );
   }
   await queryClient.invalidateQueries({ queryKey: ["grammar-points"] });
   toast.success("Đã bổ sung phần thiếu, dữ liệu cũ được giữ nguyên");
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : "Không bổ sung được AI",
   );
  } finally {
   setIsFillingAi(false);
  }
 };

 return (
  <Drawer
   title={point.id.startsWith("new-") ? "Thêm ngữ pháp" : `Sửa ${point.title}`}
   onClose={onClose}
  >
   <div className="grid gap-4">
    <div className="rounded-[24px] border-2 border-blue-200 bg-blue-50 p-4">
     <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
       <p className="text-sm font-black text-blue-800">Bổ sung AI phần thiếu</p>
       <p className="mt-1 text-xs font-bold leading-5 text-blue-700">
        Chỉ fill ô trống như giải thích, cấu trúc, ví dụ hoặc bài tập. Nội dung
        đã có sẽ không bị ghi đè.
       </p>
      </div>
      <ActionButton
       onClick={fillMissing}
       tone="neutral"
       icon={Sparkles}
       loading={isFillingAi}
       disabled={point.id.startsWith("new-")}
      >
       Bổ sung AI
      </ActionButton>
     </div>
    </div>
    <Field label="Bài">
     <Select
      value={draft.lesson_id || ""}
      onChange={(event) =>
       setDraft({ ...draft, lesson_id: event.target.value || null })
      }
      className="h-11 text-sm"
     >
      {lessons.map((lesson) => (
       <option key={lesson.id} value={lesson.id}>
        {lesson.title}
       </option>
      ))}
     </Select>
    </Field>
    <Field label="Tên ngữ pháp / Hán tự">
     <Input
      value={draft.title}
      onChange={(event) =>
       setDraft({
        ...draft,
        title: event.target.value,
        hanzi: event.target.value,
       })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Pinyin">
     <Input
      value={draft.pinyin || ""}
      onChange={(event) => setDraft({ ...draft, pinyin: event.target.value })}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <Field label="Tên tiếng Việt">
     <Input
      value={draft.vietnamese_title || ""}
      onChange={(event) =>
       setDraft({ ...draft, vietnamese_title: event.target.value })
      }
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <div className="grid gap-4 md:grid-cols-3">
     <Field label="Level">
      <Input
       value={draft.level || ""}
       onChange={(event) => setDraft({ ...draft, level: event.target.value })}
       className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
      />
     </Field>
     <Field label="Loại">
      <Input
       value={draft.category || ""}
       onChange={(event) =>
        setDraft({ ...draft, category: event.target.value })
       }
       className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
      />
     </Field>
     <Field label="Thứ tự">
      <Input
       type="number"
       value={draft.row_number}
       onChange={(event) =>
        setDraft({ ...draft, row_number: Number(event.target.value) })
       }
       className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
      />
     </Field>
    </div>
    <Field label="Tags">
     <Input
      value={tagsText}
      onChange={(event) => setTagsText(event.target.value)}
      className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
     />
    </Field>
    <div className="rounded-[24px] border-2 border-stone-200 p-4">
     <p className="mb-3 text-sm font-black text-stone-900">Ví dụ nhanh</p>
     <div className="grid gap-3">
      <Input
       value={draft.content.quick_example?.zh || ""}
       onChange={(event) =>
        updateContent({
         quick_example: {
          ...draft.content.quick_example,
          zh: event.target.value,
         },
        })
       }
       placeholder="我们都去。"
       className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
      />
      <Input
       value={draft.content.quick_example?.pinyin || ""}
       onChange={(event) =>
        updateContent({
         quick_example: {
          ...draft.content.quick_example,
          pinyin: event.target.value,
         },
        })
       }
       placeholder="Wǒmen dōu qù."
       className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
      />
      <Input
       value={draft.content.quick_example?.vi || ""}
       onChange={(event) =>
        updateContent({
         quick_example: {
          ...draft.content.quick_example,
          vi: event.target.value,
         },
        })
       }
       placeholder="Chúng tôi đều đi."
       className="h-11 rounded-2xl border-2 border-stone-200 font-bold"
      />
     </div>
    </div>
    <Field label="Giải thích">
     <Textarea
      value={draft.content.explanation || ""}
      onChange={(value) => updateContent({ explanation: value })}
      rows={5}
     />
    </Field>
    <Field label="Cấu trúc">
     <Textarea value={structuresText} onChange={setStructuresText} />
    </Field>
    <Field label="Cách dùng / lưu ý">
     <Textarea value={usageText} onChange={setUsageText} />
    </Field>
    <Field label="Lỗi thường gặp">
     <Textarea value={mistakesText} onChange={setMistakesText} />
    </Field>
    <Field label="So sánh">
     <Textarea value={comparisonsText} onChange={setComparisonsText} />
    </Field>
    <div className="rounded-[24px] border-2 border-stone-200 p-4">
     <div className="mb-3 flex items-center justify-between gap-3">
      <p className="text-sm font-black text-stone-900">Bài tập</p>
      <ActionButton
       onClick={() =>
        setExerciseDrafts((current) => [
         ...current,
         {
          exercise_type: "fill_blank",
          prompt: "",
          answerText: "",
          explanation: "",
         },
        ])
       }
       tone="neutral"
       icon={Plus}
      >
       Thêm
      </ActionButton>
     </div>
     <div className="grid gap-3">
      {exerciseDrafts.map((exercise, index) => (
       <div
        key={`${exercise.id || "new"}-${index}`}
        className="rounded-2xl bg-stone-50 p-3"
       >
        <Select
         value={exercise.exercise_type}
         onChange={(event) =>
          setExerciseDrafts((current) =>
           current.map((item, itemIndex) =>
            itemIndex === index
             ? {
                ...item,
                exercise_type: event.target.value as GrammarExerciseType,
               }
             : item,
           ),
          )
         }
         className="mb-2 h-10 rounded-xl text-sm"
        >
         {Object.entries(exerciseLabels).map(([key, label]) => (
          <option key={key} value={key}>
           {label}
          </option>
         ))}
        </Select>
        <Textarea
         value={exercise.prompt}
         onChange={(value) =>
          setExerciseDrafts((current) =>
           current.map((item, itemIndex) =>
            itemIndex === index ? { ...item, prompt: value } : item,
           ),
          )
         }
         rows={2}
         placeholder="Prompt bài tập..."
        />
        <Input
         value={exercise.answerText}
         onChange={(event) =>
          setExerciseDrafts((current) =>
           current.map((item, itemIndex) =>
            itemIndex === index
             ? { ...item, answerText: event.target.value }
             : item,
           ),
          )
         }
         placeholder="Đáp án đúng / đáp án mẫu"
         className="mt-2 h-10 rounded-xl border-2 border-stone-200 font-bold"
        />
        <Input
         value={exercise.explanation}
         onChange={(event) =>
          setExerciseDrafts((current) =>
           current.map((item, itemIndex) =>
            itemIndex === index
             ? { ...item, explanation: event.target.value }
             : item,
           ),
          )
         }
         placeholder="Giải thích sau khi check"
         className="mt-2 h-10 rounded-xl border-2 border-stone-200 font-bold"
        />
        <button
         type="button"
         onClick={() =>
          setExerciseDrafts((current) =>
           current.filter((_, itemIndex) => itemIndex !== index),
          )
         }
         className="mt-2 text-xs font-black text-red-500"
        >
         Xoá bài tập
        </button>
       </div>
      ))}
     </div>
    </div>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     {!point.id.startsWith("new-") && (
      <ActionButton
       onClick={() => onDelete(point)}
       tone="neutral"
       icon={Trash2}
      >
       Xoá
      </ActionButton>
     )}
     <ActionButton onClick={onClose} tone="neutral">
      Huỷ
     </ActionButton>
     <ActionButton onClick={save}>Lưu ngữ pháp</ActionButton>
    </div>
   </div>
  </Drawer>
 );
}
