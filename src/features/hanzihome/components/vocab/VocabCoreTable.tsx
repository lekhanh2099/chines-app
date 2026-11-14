"use client";

import { Input } from "@/components/ui/forms/input";
import type { CoreRow } from "@/features/hanzihome/components/vocab/vocab-bulk-edit-utils";

/** Inline editor for the core fields of each vocab row. */
export function VocabCoreTable({
 rows,
 onChange,
}: {
 rows: CoreRow[];
 onChange: (index: number, key: keyof CoreRow, value: string) => void;
}) {
 return (
  <div className="overflow-x-auto">
   <div className="grid min-w-[52rem] gap-2">
    {rows.map((row, index) => (
     <div
      key={row.id}
      className="grid grid-cols-[0.8fr_1fr_1.8fr_0.8fr_1fr] gap-2 rounded-xl border border-border-default p-2"
     >
      <Input
       aria-label={`Tiếng Trung ${index + 1}`}
       value={row.hanzi}
       onChange={(event) => onChange(index, "hanzi", event.target.value)}
      />
      <Input
       aria-label={`Pinyin ${index + 1}`}
       value={row.pinyin}
       onChange={(event) => onChange(index, "pinyin", event.target.value)}
      />
      <Input
       aria-label={`Nghĩa ${index + 1}`}
       value={row.meaningVi}
       onChange={(event) => onChange(index, "meaningVi", event.target.value)}
      />
      <Input
       aria-label={`Từ loại ${index + 1}`}
       value={row.pos}
       onChange={(event) => onChange(index, "pos", event.target.value)}
      />
      <Input
       aria-label={`Nhóm ${index + 1}`}
       value={row.category}
       onChange={(event) => onChange(index, "category", event.target.value)}
      />
     </div>
    ))}
   </div>
  </div>
 );
}
