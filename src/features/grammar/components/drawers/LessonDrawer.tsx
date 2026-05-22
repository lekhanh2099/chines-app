"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
 ActionButton,
 Drawer,
 Field,
 Textarea,
} from "@/features/grammar/components/ui";
import type { GrammarLessonWithStats } from "@/types/database";

export function LessonDrawer({
 lesson,
 onClose,
 onSave,
 onDelete,
}: {
 lesson: GrammarLessonWithStats;
 onClose: () => void;
 onSave: (lesson: GrammarLessonWithStats) => void;
 onDelete: (lesson: GrammarLessonWithStats) => void;
}) {
 const [draft, setDraft] = useState(lesson);
 return (
  <Drawer
   title={lesson.id.startsWith("new-") ? "Thêm bài ngữ pháp" : "Sửa bài"}
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
    <Field label="Mô tả">
     <Textarea
      value={draft.description || ""}
      onChange={(value) => setDraft({ ...draft, description: value })}
     />
    </Field>
    <div className="rounded-2xl bg-stone-50 p-4">
     <p className="text-sm font-black text-stone-700">
      {lesson.points.length} điểm ngữ pháp trong bài
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
