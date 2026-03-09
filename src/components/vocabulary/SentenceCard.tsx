"use client";

import { Eye, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import type { VocabWithProgress } from "@/types/database";

const statusConfig = {
 mastered: {
  label: "Mastered",
  emoji: "🟢",
  className: "bg-success-subtle text-success-text",
 },
 learning: {
  label: "Learning",
  emoji: "🟡",
  className: "bg-warning-subtle text-warning-text",
 },
 new: {
  label: "New",
  emoji: "🔴",
  className: "bg-danger-subtle text-danger-text",
 },
};

export function SentenceCard({
 item,
 onInspect,
 onDelete,
}: {
 item: VocabWithProgress;
 onInspect: (hanzi: string) => void;
 onDelete: (id: string, hanzi: string) => void;
}) {
 const s = statusConfig[item.status];

 return (
  <div className="group rounded border border-border-default bg-bg-card hover:bg-bg-card-hover transition-colors p-4">
   <div className="flex items-start justify-between gap-3">
    <div className="flex-1 min-w-0">
     <Link
      href={`/dictionary/${encodeURIComponent(item.hanzi)}`}
      className="block"
     >
      <p className="text-lg font-bold text-text-primary leading-relaxed hover:text-accent transition-colors">
       {item.hanzi}
      </p>
     </Link>
     {item.pinyin && (
      <p className="text-sm text-text-muted mt-1">{item.pinyin}</p>
     )}
     {item.meaning && (
      <p className="text-sm text-text-secondary mt-2 leading-relaxed">
       {item.meaning}
      </p>
     )}
    </div>

    <div className="flex flex-col items-end gap-2 shrink-0">
     <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${s.className}`}
     >
      {s.emoji} {s.label}
     </span>
     <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
       onClick={() => onInspect(item.hanzi)}
       className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
       title="Tra nhanh"
      >
       <Eye className="w-3.5 h-3.5" />
      </button>
      <Link
       href={`/dictionary/${encodeURIComponent(item.hanzi)}`}
       className="p-1.5 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
       title="Xem chi tiết"
      >
       <ExternalLink className="w-3.5 h-3.5" />
      </Link>
      <button
       onClick={() => onDelete(item.id, item.hanzi)}
       className="p-1.5 rounded text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors"
       title="Xóa"
      >
       <Trash2 className="w-3.5 h-3.5" />
      </button>
     </div>
    </div>
   </div>
  </div>
 );
}
