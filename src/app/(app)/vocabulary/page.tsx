"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
 BookOpen,
 Brain,
 CalendarDays,
 Check,
 Eye,
 FileText,
 Keyboard,
 Loader2,
 RotateCcw,
 Search,
 Settings,
 Sparkles,
 Trash2,
 Upload,
 WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { VocabImportModal } from "@/components/vocabulary/VocabImportModal";
import { useDeleteVocab } from "@/features/vocabulary/hooks/useDeleteVocab";
import { useVocabList } from "@/features/vocabulary/hooks/useVocabList";
import { cn } from "@/lib/utils";
import type { VocabWithProgress } from "@/types/database";

type StudyMode = "guess" | "flashcard" | "write" | "quiz" | "reverse";

type UnitGroup = {
 key: string;
 title: string;
 subtitle: string;
 items: VocabWithProgress[];
 lessonNumber: number;
 mastered: number;
 learning: number;
 fresh: number;
 progress: number;
};

const studyModes: {
 key: StudyMode;
 label: string;
 icon: typeof Brain;
 ready: boolean;
}[] = [
 { key: "guess", label: "Đoán từ", icon: Brain, ready: false },
 { key: "flashcard", label: "Flashcard", icon: Eye, ready: true },
 { key: "write", label: "Luyện viết", icon: Keyboard, ready: false },
 { key: "quiz", label: "Trắc nghiệm", icon: FileText, ready: false },
 { key: "reverse", label: "Trắc nghiệm ngược", icon: RotateCcw, ready: false },
];

function matchesQuery(item: VocabWithProgress, query: string) {
 if (!query.trim()) return true;
 const normalized = query.trim().toLowerCase();
 return (
  item.hanzi.toLowerCase().includes(normalized) ||
  item.pinyin.toLowerCase().includes(normalized) ||
  item.meaning.toLowerCase().includes(normalized) ||
  item.source?.category?.toLowerCase().includes(normalized)
 );
}

function buildUnitGroups(items: VocabWithProgress[]): UnitGroup[] {
 const grouped = new Map<string, VocabWithProgress[]>();

 for (const item of items) {
  const key = item.source?.lessonKey || "saved";
  const current = grouped.get(key) || [];
  current.push(item);
  grouped.set(key, current);
 }

 return Array.from(grouped.entries())
  .map(([key, groupItems]) => {
   const first = groupItems[0];
   const lessonNumber = first.source?.lessonNumber ?? 999;
   const mastered = groupItems.filter((item) => item.status === "mastered").length;
   const learning = groupItems.filter((item) => item.status === "learning").length;
   const fresh = groupItems.filter((item) => item.status === "new").length;
   const progress = groupItems.length ? Math.round((mastered / groupItems.length) * 100) : 0;

   return {
    key,
    title: key === "saved" ? "Từ đã lưu" : `Bài ${lessonNumber}`,
    subtitle: key === "saved" ? "Không có source lesson" : first.source?.category || first.source?.lessonKey || key,
    items: groupItems,
    lessonNumber,
    mastered,
    learning,
    fresh,
    progress,
   };
  })
  .sort((a, b) => a.lessonNumber - b.lessonNumber || a.title.localeCompare(b.title));
}

export default function VocabularyPage() {
 const [activeUnitKey, setActiveUnitKey] = useState<string | null>(null);
 const [mode, setMode] = useState<StudyMode>("flashcard");
 const [searchQuery, setSearchQuery] = useState("");
 const [showWords, setShowWords] = useState(true);
 const [importOpen, setImportOpen] = useState(false);
 const { openInspector } = useVocabInspector();
 const deleteVocab = useDeleteVocab();
 const { data: vocabList = [], isLoading } = useVocabList();

 const words = useMemo(() => vocabList.filter((item) => item.type === "word"), [vocabList]);
 const groups = useMemo(() => buildUnitGroups(words), [words]);
 const activeGroup = groups.find((group) => group.key === activeUnitKey) || groups[0];
 const filteredItems = useMemo(
  () => (activeGroup?.items || []).filter((item) => matchesQuery(item, searchQuery)),
  [activeGroup?.items, searchQuery],
 );
 const totals = useMemo(() => {
  const mastered = words.filter((item) => item.status === "mastered").length;
  const learning = words.filter((item) => item.status === "learning").length;
  const fresh = words.filter((item) => item.status === "new").length;
  return { mastered, learning, fresh, total: words.length };
 }, [words]);

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

 return (
  <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-5 py-7 lg:px-8">
   <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
    <div>
     <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-2xl border-2 border-stone-200 bg-white px-4 text-sm font-black text-stone-700 shadow-theme-sm hover:bg-stone-50">
      ← Quay lại
     </Link>
     <h1 className="mt-5 text-4xl font-black tracking-normal text-stone-900">
      Từ vựng Hán ngữ
     </h1>
     <p className="mt-2 text-base font-bold text-stone-500">
      Học theo bài, ôn bằng flashcard và mở chi tiết khi cần hiểu sâu.
     </p>
    </div>

    <div className="flex flex-wrap items-center gap-2">
     <div className="flex rounded-2xl bg-stone-100 p-1">
      {studyModes.map((item) => {
       const Icon = item.icon;
       const active = mode === item.key;
       return (
        <button
         key={item.key}
         type="button"
         onClick={() => setMode(item.key)}
         className={cn(
          "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-black transition",
          active ? "bg-red-500 text-white shadow-theme-sm" : "text-stone-600 hover:bg-white",
         )}
        >
         <Icon className="h-4 w-4" />
         <span className="hidden md:inline">{item.label}</span>
        </button>
       );
      })}
     </div>
     <button className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm">
      <CalendarDays className="h-5 w-5" />
     </button>
     <button className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-600 shadow-theme-sm">
      <Settings className="h-5 w-5" />
     </button>
     <Button className="h-11 rounded-2xl bg-red-500 hover:bg-red-600" onClick={() => setImportOpen(true)}>
      <Upload className="h-4 w-4" />
      Import
     </Button>
    </div>
   </div>

   <div className="grid gap-6 xl:grid-cols-[330px_1fr]">
    <aside className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md xl:max-h-[calc(100vh-180px)] xl:overflow-y-auto">
     <div className="mb-4 flex items-center justify-between">
      <p className="text-lg font-black uppercase tracking-wide text-stone-900">Danh sách bài</p>
      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
       {groups.length}
      </span>
     </div>

     {isLoading ? (
      <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-stone-500">
       <Loader2 className="h-5 w-5 animate-spin" />
       Đang tải...
      </div>
     ) : groups.length === 0 ? (
      <EmptyUnitList onImport={() => setImportOpen(true)} />
     ) : (
      <div className="flex flex-col gap-3">
       {groups.map((group) => (
        <UnitButton
         key={group.key}
         group={group}
         active={activeGroup?.key === group.key}
         onClick={() => setActiveUnitKey(group.key)}
        />
       ))}
      </div>
     )}
    </aside>

    <main className="min-h-[620px] rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md md:p-8">
     {!activeGroup ? (
      <EmptyLearningPanel onImport={() => setImportOpen(true)} />
     ) : (
      <div className="flex min-h-[560px] flex-col">
       <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
         <p className="text-sm font-black uppercase tracking-wide text-red-500">
          {activeGroup.subtitle}
         </p>
         <h2 className="mt-1 text-3xl font-black text-stone-900">{activeGroup.title}</h2>
         <p className="mt-2 text-base font-bold text-stone-500">
          {activeGroup.items.length} từ trong nhóm này
         </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
         <Metric value={activeGroup.fresh} label="Đang học" tone="yellow" />
         <Metric value={activeGroup.learning} label="Đang ôn" tone="blue" />
         <Metric value={activeGroup.mastered} label="Thành thạo" tone="green" />
        </div>
       </div>

       <div className="mt-8 flex flex-1 flex-col items-center justify-center rounded-[24px] bg-stone-50 p-6 text-center">
        <ModePanel mode={mode} group={activeGroup} firstItem={filteredItems[0]} />
       </div>

       <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr]">
        <button
         type="button"
         onClick={() => setShowWords((value) => !value)}
         className="h-14 rounded-2xl border-2 border-stone-200 bg-white text-base font-black uppercase tracking-wide text-stone-800 shadow-theme-sm hover:bg-stone-50"
        >
         {showWords ? "Ẩn từ vựng" : "Xem từ vựng"}
        </button>
        <button
         type="button"
         className="h-14 rounded-2xl bg-red-500 text-base font-black uppercase tracking-wide text-white shadow-theme-md hover:bg-red-600"
        >
         Học nhóm tiếp theo
        </button>
       </div>

       {showWords && (
        <section className="mt-6">
         <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <Input
           value={searchQuery}
           onChange={(event) => setSearchQuery(event.target.value)}
           placeholder="Tìm Hán tự, pinyin, nghĩa..."
           className="h-12 rounded-2xl border-2 border-stone-200 bg-white pl-12 text-base font-bold"
          />
         </div>
         <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {filteredItems.map((item) => (
           <WordCard
            key={item.id}
            item={item}
            onInspect={openInspector}
            onDelete={handleDelete}
           />
          ))}
         </div>
        </section>
       )}
      </div>
     )}
    </main>
   </div>

   <VocabImportModal open={importOpen} onOpenChange={setImportOpen} />
  </div>
 );
}

function UnitButton({ group, active, onClick }: { group: UnitGroup; active: boolean; onClick: () => void }) {
 const complete = group.progress >= 100;
 return (
  <button
   type="button"
   onClick={onClick}
   className={cn(
    "flex min-h-20 items-center gap-3 rounded-3xl border-2 p-4 text-left shadow-theme-sm transition",
    active
     ? "border-red-700 bg-red-500 text-white"
     : group.progress > 0
       ? "border-yellow-300 bg-yellow-50 text-orange-700"
       : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
   )}
  >
   <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2", active ? "border-white/50 bg-white/20" : "border-stone-200 bg-white")}>
    {complete ? <Check className="h-5 w-5" /> : <span className="text-sm font-black">{group.progress}%</span>}
   </div>
   <div className="min-w-0 flex-1">
    <p className="truncate text-lg font-black">{group.title}</p>
    <p className={cn("mt-1 truncate text-sm font-bold", active ? "text-white/90" : "text-stone-500")}>
     {group.mastered}/{group.items.length} thẻ
    </p>
   </div>
  </button>
 );
}

function ModePanel({ mode, group, firstItem }: { mode: StudyMode; group: UnitGroup; firstItem?: VocabWithProgress }) {
 const modeConfig = studyModes.find((item) => item.key === mode)!;
 const Icon = modeConfig.icon;

 if (!modeConfig.ready) {
  return (
   <div className="mx-auto max-w-lg">
    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-theme-sm">
     <Icon className="h-12 w-12 text-red-500" />
    </div>
    <h3 className="mt-6 text-3xl font-black text-stone-900">{modeConfig.label}</h3>
    <p className="mt-3 text-base font-bold leading-7 text-stone-500">
     Mode này đã có vị trí trong UI. Engine học chi tiết sẽ gắn vào sau, còn hiện tại ông vẫn xem được danh sách từ và mở flashcard.
    </p>
   </div>
  );
 }

 if (!firstItem) {
  return (
   <div className="mx-auto max-w-md">
    <Sparkles className="mx-auto h-16 w-16 text-stone-300" />
    <h3 className="mt-4 text-2xl font-black text-stone-900">Không có từ phù hợp</h3>
    <p className="mt-2 text-base font-bold text-stone-500">Đổi tìm kiếm hoặc chọn bài khác.</p>
   </div>
  );
 }

 return (
  <div className="w-full max-w-2xl">
   <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-yellow-100 text-4xl shadow-theme-sm">
    🧠
   </div>
   <p className="text-sm font-black uppercase tracking-wide text-red-500">{group.title}</p>
   <h3 className="mt-2 text-6xl font-black text-stone-900">{firstItem.hanzi}</h3>
   <p className="mt-3 text-2xl font-black text-red-500">{firstItem.pinyin}</p>
   <p className="mx-auto mt-4 max-w-xl text-xl font-bold leading-8 text-stone-600">{firstItem.meaning}</p>
  </div>
 );
}

function Metric({ value, label, tone }: { value: number; label: string; tone: "yellow" | "blue" | "green" }) {
 const toneClass = {
  yellow: "border-yellow-300 bg-yellow-50 text-orange-600",
  blue: "border-blue-300 bg-blue-50 text-blue-600",
  green: "border-emerald-300 bg-emerald-50 text-emerald-600",
 }[tone];
 return (
  <div className={cn("min-w-24 rounded-2xl border-2 px-4 py-3 text-center shadow-theme-sm", toneClass)}>
   <p className="text-2xl font-black">{value}</p>
   <p className="text-xs font-black">{label}</p>
  </div>
 );
}

function WordCard({ item, onInspect, onDelete }: { item: VocabWithProgress; onInspect: (text: string) => void; onDelete: (id: string, hanzi: string) => void }) {
 return (
  <article className="rounded-3xl border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-start justify-between gap-3">
    <Link href={`/dictionary/${encodeURIComponent(item.hanzi)}`} className="min-w-0">
     <h3 className="truncate text-3xl font-black text-stone-900">{item.hanzi}</h3>
     <p className="mt-1 truncate text-sm font-black text-red-500">{item.pinyin || "Không có pinyin"}</p>
    </Link>
    <StatusPill status={item.status} />
   </div>
   <p className="mt-3 line-clamp-2 min-h-11 text-sm font-bold leading-6 text-stone-600">
    {item.meaning || "Chưa có nghĩa tiếng Việt"}
   </p>
   <div className="mt-4 flex items-center justify-between border-t-2 border-stone-100 pt-3">
    <span className="truncate text-xs font-black uppercase tracking-wide text-stone-400">
     {item.source?.category || item.source?.lessonKey || "Đã lưu"}
    </span>
    <div className="flex gap-1">
     <IconButton label="Tra nhanh" onClick={() => onInspect(item.hanzi)} icon={Eye} />
     <IconButton label="Xóa" onClick={() => onDelete(item.id, item.hanzi)} icon={Trash2} danger />
    </div>
   </div>
  </article>
 );
}

function StatusPill({ status }: { status: VocabWithProgress["status"] }) {
 const config = {
  new: "bg-yellow-50 text-orange-600 border-yellow-300",
  learning: "bg-blue-50 text-blue-600 border-blue-300",
  mastered: "bg-emerald-50 text-emerald-600 border-emerald-300",
 }[status];
 const label = { new: "Mới", learning: "Đang ôn", mastered: "Thuộc" }[status];
 return <span className={cn("rounded-full border-2 px-2.5 py-1 text-xs font-black", config)}>{label}</span>;
}

function IconButton({ label, onClick, icon: Icon, danger }: { label: string; onClick: () => void; icon: typeof Eye; danger?: boolean }) {
 return (
  <button
   type="button"
   onClick={onClick}
   title={label}
   className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition", danger ? "text-red-500 hover:bg-red-50" : "text-stone-500 hover:bg-stone-100")}
  >
   <Icon className="h-4 w-4" />
  </button>
 );
}

function EmptyUnitList({ onImport }: { onImport: () => void }) {
 return (
  <div className="rounded-3xl border-2 border-dashed border-stone-200 p-5 text-center">
   <WalletCards className="mx-auto h-10 w-10 text-stone-300" />
   <p className="mt-3 text-sm font-black text-stone-700">Chưa có bài từ vựng</p>
   <button type="button" onClick={onImport} className="mt-4 text-sm font-black text-red-500">
    Import ngay
   </button>
  </div>
 );
}

function EmptyLearningPanel({ onImport }: { onImport: () => void }) {
 return (
  <div className="flex min-h-[540px] flex-col items-center justify-center text-center">
   <WalletCards className="h-16 w-16 text-stone-300" />
   <h2 className="mt-5 text-3xl font-black text-stone-900">Chưa có từ vựng</h2>
   <p className="mt-3 max-w-md text-base font-bold leading-7 text-stone-500">
    Import danh sách đã soạn để bắt đầu học theo bài.
   </p>
   <Button className="mt-6 rounded-2xl bg-red-500 hover:bg-red-600" onClick={onImport}>
    <Upload className="h-4 w-4" />
    Import từ vựng
   </Button>
  </div>
 );
}
