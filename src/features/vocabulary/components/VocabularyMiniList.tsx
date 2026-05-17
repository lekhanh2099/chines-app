import Link from "next/link";
import type { VocabEntryWithProgress } from "@/types/database";

export function VocabularyMiniList({
 entries,
 title = "Ôn nhanh trước khi làm bài",
 emptyText = "Chưa tìm thấy từ vựng match số bài này. Khi vocab và grammar cùng lesson number, danh sách sẽ tự hiện ở đây.",
}: {
 entries: VocabEntryWithProgress[];
 title?: string;
 emptyText?: string;
}) {
 return (
  <aside className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-center justify-between gap-3">
    <div>
     <p className="text-xs font-black uppercase tracking-wide text-red-500">Từ vựng cùng bài</p>
     <h3 className="text-xl font-black text-stone-900">{title}</h3>
    </div>
    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">{entries.length}</span>
   </div>
   {!entries.length ? (
    <p className="mt-4 rounded-2xl bg-stone-50 p-4 text-sm font-bold leading-6 text-stone-500">{emptyText}</p>
   ) : (
    <div className="mt-4 grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-1">
     {entries.map((entry) => (
      <Link
       key={entry.id}
       href={`/dictionary/${encodeURIComponent(entry.hanzi)}`}
       className="rounded-2xl border-2 border-stone-100 bg-stone-50 p-3 hover:border-red-200 hover:bg-red-50/30"
      >
       <span className="block text-lg font-black text-stone-900">{entry.hanzi}</span>
       <span className="block truncate text-xs font-black text-red-500">{entry.pinyin}</span>
       <span className="mt-1 block line-clamp-2 text-xs font-bold leading-5 text-stone-500">{entry.meaning}</span>
      </Link>
     ))}
    </div>
   )}
  </aside>
 );
}
