"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import {
 ActionButton,
 Drawer,
 Field,
 Textarea,
} from "@/features/grammar/components/ui";
import type { GrammarLessonWithStats } from "@/types/database";

export function ImportDrawer({
 lesson,
 onClose,
 onImport,
}: {
 lesson: GrammarLessonWithStats;
 onClose: () => void;
 onImport: (text: string) => void;
}) {
 const [text, setText] = useState("");
 return (
  <Drawer title={`Import ngữ pháp vào ${lesson.title}`} onClose={onClose}>
   <div className="grid gap-4">
    <Field label="Dán block markdown từ AI">
     <Textarea
      value={text}
      onChange={setText}
      rows={18}
      placeholder={
       '## 都 – dōu – Phó từ "đều", "tất cả"\n*HSK 1 · Phó từ*\n\n**1. Ví dụ nhanh**\n我们都去。(Wǒmen dōu qù.)\nChúng tôi đều đi.\n\n**2. Giải thích**\n...\n\n**3. Cấu trúc**\n- Chủ ngữ + 都 + vị ngữ\n\n**7. Bài tập**\n- 我们 ___ 是老师。'
      }
     />
    </Field>
    <div className="rounded-2xl bg-stone-50 p-4 text-sm font-bold leading-6 text-stone-600">
     Parser nhận nhiều block bắt đầu bằng <span className="font-black">##</span>
     . Mỗi block sẽ thành một điểm ngữ pháp, mục Bài tập sẽ tự tạo exercise.
    </div>
    <div className="sticky bottom-0 flex flex-wrap gap-3 border-t-2 border-stone-100 bg-white py-4">
     <ActionButton onClick={onClose} tone="neutral">
      Huỷ
     </ActionButton>
     <ActionButton
      onClick={() => onImport(text)}
      icon={Upload}
      disabled={!text.trim()}
     >
      Import
     </ActionButton>
    </div>
   </div>
  </Drawer>
 );
}
