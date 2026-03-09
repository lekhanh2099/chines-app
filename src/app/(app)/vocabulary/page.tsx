"use client";

import { useState, useMemo, useCallback } from "react";
import {
 createColumnHelper,
 flexRender,
 getCoreRowModel,
 useReactTable,
 getFilteredRowModel,
 getSortedRowModel,
 type SortingState,
} from "@tanstack/react-table";
import {
 Search,
 Eye,
 ExternalLink,
 Trash2,
 ArrowUpDown,
 Loader2,
 Upload,
 BookOpen,
 MessageSquareText,
} from "lucide-react";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { useVocabList } from "@/features/vocabulary/hooks/useVocabList";
import { useDeleteVocab } from "@/features/vocabulary/hooks/useDeleteVocab";
import { VocabImportModal } from "@/components/vocabulary/VocabImportModal";
import { SentenceCard } from "@/components/vocabulary/SentenceCard";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { VocabWithProgress } from "@/types/database";

type TabKey = "words" | "sentences";

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

const columnHelper = createColumnHelper<VocabWithProgress>();

export default function VocabularyPage() {
 const [activeTab, setActiveTab] = useState<TabKey>("words");
 const [globalFilter, setGlobalFilter] = useState("");
 const [sorting, setSorting] = useState<SortingState>([]);
 const [importOpen, setImportOpen] = useState(false);
 const { openInspector } = useVocabInspector();
 const router = useRouter();

 const { data: vocabList = [], isLoading } = useVocabList();
 const deleteVocab = useDeleteVocab();

 const words = useMemo(
  () => vocabList.filter((v) => v.type === "word"),
  [vocabList],
 );
 const sentences = useMemo(
  () => vocabList.filter((v) => v.type === "sentence"),
  [vocabList],
 );

 const filteredSentences = useMemo(() => {
  if (!globalFilter) return sentences;
  const q = globalFilter.toLowerCase();
  return sentences.filter(
   (s) =>
    s.hanzi.toLowerCase().includes(q) ||
    s.pinyin.toLowerCase().includes(q) ||
    s.meaning.toLowerCase().includes(q),
  );
 }, [sentences, globalFilter]);

 const handleDelete = useCallback(
  (id: string, hanzi: string) => {
   const confirmed = window.confirm(`Xóa "${hanzi}" khỏi kho từ vựng?`);
   if (!confirmed) return;

   deleteVocab.mutate(
    { vocabId: id, hanzi },
    {
     onSuccess: () => toast.success(`Đã xóa "${hanzi}"`),
     onError: () => toast.error("Không thể xóa từ vựng"),
    },
   );
  },
  [deleteVocab],
 );

 const columns = useMemo(
  () => [
   columnHelper.accessor("hanzi", {
    header: ({ column }) => (
     <button
      onClick={() => column.toggleSorting()}
      className="flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
     >
      Hán tự
      <ArrowUpDown className="w-3.5 h-3.5" />
     </button>
    ),
    cell: (info) => (
     <Link
      href={`/dictionary/${encodeURIComponent(info.getValue())}`}
      onClick={(e) => e.stopPropagation()}
      className="font-bold text-xl text-text-primary hover:text-accent transition-colors"
     >
      {info.getValue()}
     </Link>
    ),
   }),
   columnHelper.accessor("pinyin", {
    header: "Pinyin",
    cell: (info) => (
     <span className="text-text-muted font-medium">{info.getValue()}</span>
    ),
   }),
   columnHelper.accessor("meaning", {
    header: "Nghĩa Việt",
    cell: (info) => (
     <span className="text-text-secondary font-medium text-sm">
      {info.getValue()}
     </span>
    ),
   }),
   columnHelper.accessor("status", {
    header: "Trạng thái",
    cell: (info) => {
     const s = statusConfig[info.getValue()];
     return (
      <span
       className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${s.className}`}
      >
       {s.emoji} {s.label}
      </span>
     );
    },
   }),
   columnHelper.display({
    id: "actions",
    header: "Hành động",
    cell: ({ row }) => (
     <div className="flex items-center gap-1">
      <button
       onClick={(e) => {
        e.stopPropagation();
        openInspector(row.original.hanzi);
       }}
       className="p-2 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
       title="Tra nhanh"
      >
       <Eye className="w-4 h-4" />
      </button>
      <Link
       href={`/dictionary/${encodeURIComponent(row.original.hanzi)}`}
       onClick={(e) => e.stopPropagation()}
       className="p-2 rounded text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
       title="Xem chi tiết"
      >
       <ExternalLink className="w-4 h-4" />
      </Link>
      <button
       onClick={(e) => {
        e.stopPropagation();
        handleDelete(row.original.id, row.original.hanzi);
       }}
       className="p-2 rounded text-text-muted hover:text-danger hover:bg-danger-subtle transition-colors"
       title="Xóa"
      >
       <Trash2 className="w-4 h-4" />
      </button>
     </div>
    ),
   }),
  ],
  [handleDelete, openInspector],
 );

 const table = useReactTable({
  data: words,
  columns,
  state: { globalFilter, sorting },
  onGlobalFilterChange: setGlobalFilter,
  onSortingChange: setSorting,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
 });

 const tabs = [
  {
   key: "words" as const,
   label: "Từ đơn",
   icon: BookOpen,
   count: words.length,
  },
  {
   key: "sentences" as const,
   label: "Mẫu câu",
   icon: MessageSquareText,
   count: sentences.length,
  },
 ];

 return (
  <div className="w-full h-full flex flex-col">
   {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6">
    <div>
     <h1 className="text-2xl font-bold text-text-primary">Kho Từ Vựng</h1>
     <p className="text-sm text-text-muted mt-1">
      Quản lý toàn bộ {vocabList.length} từ vựng đã lưu
     </p>
    </div>

    <div className="flex items-center gap-3 w-full md:w-auto">
     <button
      onClick={() => setImportOpen(true)}
      className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded bg-bg-elevated border border-border-default text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition-colors shrink-0"
     >
      <Upload className="w-4 h-4" />
      Import JSON
     </button>
     <div className="relative flex-1 md:w-80">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
       type="text"
       value={globalFilter ?? ""}
       onChange={(e) => setGlobalFilter(e.target.value)}
       placeholder="Tìm theo Hán tự, Pinyin, nghĩa..."
       className="w-full h-10 bg-bg-elevated border border-border-default rounded pl-10 pr-4 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
      />
     </div>
    </div>
   </div>

   {/* Tabs */}
   <div className="flex items-center gap-1 mb-4 border-b border-border-default">
    {tabs.map((tab) => (
     <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
       activeTab === tab.key
        ? "border-accent text-accent"
        : "border-transparent text-text-muted hover:text-text-secondary hover:border-border-default"
      }`}
     >
      <tab.icon className="w-4 h-4" />
      {tab.label}
      <span
       className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
        activeTab === tab.key
         ? "bg-accent/10 text-accent"
         : "bg-bg-elevated text-text-muted"
       }`}
      >
       {tab.count}
      </span>
     </button>
    ))}
   </div>

   {/* Content */}
   <div className="flex-1 bg-bg-card rounded border border-border-default shadow-theme-sm overflow-hidden flex flex-col">
    {isLoading ? (
     <div className="flex-1 flex items-center justify-center gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-accent" />
      <span className="text-sm text-text-muted">Đang tải từ vựng...</span>
     </div>
    ) : vocabList.length === 0 ? (
     <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12">
      <div className="w-16 h-16 rounded bg-bg-elevated border border-border-default flex items-center justify-center">
       <Search className="w-7 h-7 text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-primary">
       Chưa có từ vựng nào
      </h3>
      <p className="text-sm text-text-muted text-center max-w-sm">
       Bắt đầu tra cứu và lưu từ vựng bằng thanh Search ở Header hoặc bôi đen
       chữ Hán ở bất kỳ đâu.
      </p>
     </div>
    ) : activeTab === "words" ? (
     <div className="flex-1 overflow-auto">
      <table className="w-full text-left">
       <thead className="sticky top-0 bg-bg-elevated/90 backdrop-blur-sm z-10 border-b border-border-default">
        {table.getHeaderGroups().map((headerGroup) => (
         <tr key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
           <th
            key={header.id}
            className="px-5 py-3.5 text-xs font-bold text-text-muted uppercase tracking-wider"
           >
            {header.isPlaceholder
             ? null
             : flexRender(header.column.columnDef.header, header.getContext())}
           </th>
          ))}
         </tr>
        ))}
       </thead>
       <tbody className="divide-y divide-border-default">
        {table.getRowModel().rows.map((row) => (
         <tr
          key={row.id}
          onClick={() =>
           router.push(`/dictionary/${encodeURIComponent(row.original.hanzi)}`)
          }
          className="cursor-pointer hover:bg-bg-card-hover transition-colors"
         >
          {row.getVisibleCells().map((cell) => (
           <td key={cell.id} className="px-5 py-4">
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
           </td>
          ))}
         </tr>
        ))}
       </tbody>
      </table>

      {table.getRowModel().rows.length === 0 && globalFilter && (
       <div className="p-8 text-center text-text-muted text-sm">
        Không tìm thấy từ đơn nào khớp &ldquo;{globalFilter}&rdquo;
       </div>
      )}

      {words.length === 0 && !globalFilter && (
       <div className="p-8 text-center text-text-muted text-sm">
        Chưa có từ đơn nào. Hãy tra cứu và lưu từ vựng!
       </div>
      )}
     </div>
    ) : (
     <div className="flex-1 overflow-auto p-4">
      {filteredSentences.length > 0 ? (
       <div className="grid gap-3">
        {filteredSentences.map((item) => (
         <SentenceCard
          key={item.id}
          item={item}
          onInspect={openInspector}
          onDelete={handleDelete}
         />
        ))}
       </div>
      ) : globalFilter ? (
       <div className="p-8 text-center text-text-muted text-sm">
        Không tìm thấy mẫu câu nào khớp &ldquo;{globalFilter}&rdquo;
       </div>
      ) : (
       <div className="p-8 text-center text-text-muted text-sm">
        Chưa có mẫu câu nào. Hãy tra cứu câu tiếng Trung để bắt đầu!
       </div>
      )}
     </div>
    )}
   </div>

   <VocabImportModal open={importOpen} onOpenChange={setImportOpen} />
  </div>
 );
}
