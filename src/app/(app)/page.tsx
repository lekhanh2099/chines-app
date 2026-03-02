"use client";

import { useState } from "react";
import Link from "next/link";
import {
 Search,
 StickyNote,
 BookOpen,
 Sparkles,
 ChevronRight,
 ArrowRight,
 AlertTriangle,
 Calendar,
 ClipboardList,
 Zap,
} from "lucide-react";
import { QuickNoteButton } from "@/components/notes/QuickNoteButton";
import { useQuickNote } from "@/hooks/useQuickNote";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { containsChinese } from "@/lib/chinese-utils";

function ProgressRing({
 progress,
 size = 140,
 strokeWidth = 10,
}: {
 progress: number;
 size?: number;
 strokeWidth?: number;
}) {
 const radius = (size - strokeWidth) / 2;
 const circumference = 2 * Math.PI * radius;
 const offset = circumference - (progress / 100) * circumference;

 return (
  <svg width={size} height={size} className="transform -rotate-90">
   <circle
    cx={size / 2}
    cy={size / 2}
    r={radius}
    fill="none"
    stroke="var(--border)"
    strokeWidth={strokeWidth}
   />
   <circle
    cx={size / 2}
    cy={size / 2}
    r={radius}
    fill="none"
    stroke="var(--accent)"
    strokeWidth={strokeWidth}
    strokeDasharray={circumference}
    strokeDashoffset={offset}
    strokeLinecap="round"
    className="transition-all duration-700 ease-out"
   />
  </svg>
 );
}

const heroActions = [
 {
  icon: Zap,
  title: "Ghi Chú Nhanh",
  desc: "Bắt đầu viết ngay, không cần chọn loại",
  href: "__quick_note__",
 },
 {
  icon: StickyNote,
  title: "Tạo Ghi Chú Ngữ Pháp Mới",
  desc: "Viết và lưu lại các cấu trúc khó nhớ",
  href: "/notes",
 },
 {
  icon: BookOpen,
  title: "Thêm Bài Học Mới",
  desc: "Phân tích từ vựng từ văn bản bên ngoài",
  href: "/manager",
 },
 {
  icon: Sparkles,
  title: "Ôn Tập Nhanh (Flashcard)",
  desc: "Luyện tập ngẫu nhiên 10 từ vựng",
  href: "/practice",
 },
];

const recentNotes = [
 {
  icon: ClipboardList,
  title: "Phân biệt 知道 và 认识",
  tag: "GRAMMAR",
  tagColor: "info",
  desc: "Cách dùng từ vựng trong ngữ cảnh cụ thể",
  time: "2 phút trước",
 },
 {
  icon: ClipboardList,
  title: "Cấu trúc chữ 把 (Bǎ)",
  tag: "SYNTAX",
  tagColor: "purple",
  desc: "Câu bị động và cách chuyển đổi",
  time: "Hôm qua",
 },
 {
  icon: ClipboardList,
  title: "Tổng hợp từ vựng Bài 4",
  tag: "VOCAB",
  tagColor: "success",
  desc: "Từ vựng về mua sắm và hỏi giá",
  time: "Hôm qua",
 },
];

export default function DashboardPage() {
 const { openInspector } = useVocabInspector();
 const [heroSearch, setHeroSearch] = useState("");

 const handleHeroSearch = (e: React.FormEvent) => {
  e.preventDefault();
  const trimmed = heroSearch.trim();
  if (!trimmed) return;
  if (containsChinese(trimmed)) {
   openInspector(trimmed);
   setHeroSearch("");
  }
 };

 return (
  <div className="w-full h-full">
   <div className="grid grid-cols-12 gap-6 max-w-[1400px]">
    <div className="col-span-12 lg:col-span-8 bg-bg-card rounded-[32px] p-8 shadow-theme-sm border border-border-default">
     <div className="mb-1">
      <h2 className="text-lg font-bold text-text-primary">Trung Tâm Chỉ Huy</h2>
      <p className="text-sm text-text-muted">
       Công cụ học tập & phân tích ngôn ngữ tức thời
      </p>
     </div>

     <form onSubmit={handleHeroSearch} className="relative my-5">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
      <input
       type="text"
       value={heroSearch}
       onChange={(e) => setHeroSearch(e.target.value)}
       placeholder="Nhập văn bản tiếng Trung để phân tích, hoặc gõ từ để tra nhanh"
       className="w-full h-14 bg-bg-input border border-border-default rounded-xl pl-12 pr-16 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
      />
      <kbd className="absolute right-4 top-1/2 -translate-y-1/2 bg-bg-subtle text-text-muted text-[10px] font-bold px-2 py-1 rounded-md border border-border-default">
       ⌘K
      </kbd>
     </form>

     <div className="flex flex-col">
      {heroActions.map((action, i) =>
       action.href === "__quick_note__" ? (
        <QuickNoteActionItem key={i} action={action} />
       ) : (
        <Link
         key={i}
         href={action.href}
         className="group flex items-center gap-4 px-4 py-4 -mx-2 rounded-xl hover:bg-bg-card-hover transition-colors"
        >
         <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center shrink-0 group-hover:border-border-hover transition-colors">
          <action.icon className="w-[18px] h-[18px] text-text-secondary" />
         </div>
         <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary group-hover:text-accent-text transition-colors">
           {action.title}
          </p>
          <p className="text-xs text-text-muted">{action.desc}</p>
         </div>
         <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-text transition-colors shrink-0" />
        </Link>
       ),
      )}
     </div>
    </div>

    <div className="col-span-12 lg:col-span-4 bg-bg-card rounded-[32px] p-6 shadow-theme-sm border border-border-default flex flex-col">
     <span className="text-[11px] font-bold uppercase tracking-widest text-accent-text mb-4 flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      Đang học dở
     </span>

     <div className="flex-1">
      <h3 className="text-2xl font-bold text-text-primary leading-snug">
       Bài 5: Cửa hàng ở đâu
      </h3>
      <p className="text-sm text-text-muted mt-1">
       Giáo trình Hán ngữ 1 • Quyển Thượng
      </p>
     </div>

     <div className="mt-6">
      <div className="flex justify-between items-end mb-2">
       <span className="text-3xl font-black text-accent">60%</span>
       <span className="text-xs text-text-muted">Đã hoàn thành</span>
      </div>
      <div className="w-full bg-bg-subtle rounded-full h-2 overflow-hidden">
       <div
        className="bg-accent rounded-full h-2 transition-all duration-500"
        style={{ width: "60%" }}
       />
      </div>
     </div>

     <Link
      href="/lesson/5"
      className="mt-5 w-full inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-text-inverse py-3.5 rounded-xl text-sm font-bold transition-colors shadow-theme-sm"
     >
      Tiếp Tục Học
      <ArrowRight className="w-4 h-4" />
     </Link>
    </div>

    <div className="col-span-12 lg:col-span-4 bg-bg-card rounded-[32px] p-6 shadow-theme-sm border border-border-default flex flex-col">
     <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-text-primary">Cần Ôn Hôm Nay</h3>
      <Calendar className="w-5 h-5 text-text-muted" />
     </div>

     <div className="flex-1 flex items-center justify-center">
      <div className="relative">
       <ProgressRing progress={100} size={150} strokeWidth={10} />
       <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-black text-accent">24</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-0.5">
         Từ vựng
        </span>
       </div>
      </div>
     </div>

     <div className="mt-4 bg-danger-subtle rounded-xl p-3 flex items-start gap-2.5">
      <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
      <div>
       <p className="text-xs font-bold text-danger-text">Chú ý:</p>
       <p className="text-xs text-text-secondary leading-relaxed">
        Có <span className="font-bold text-danger">3 từ</span> bạn thường sai
        trong danh sách này.
       </p>
      </div>
     </div>
    </div>

    <div className="col-span-12 lg:col-span-8 bg-bg-card rounded-[32px] p-6 shadow-theme-sm border border-border-default">
     <div className="flex items-center justify-between mb-5">
      <h3 className="font-bold text-text-primary">Ghi chú Gần đây</h3>
      <Link
       href="/notes"
       className="text-sm font-medium text-accent-text hover:underline"
      >
       Xem tất cả
      </Link>
     </div>

     <div className="flex flex-col divide-y divide-border-default">
      {recentNotes.map((note, i) => (
       <div
        key={i}
        className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0 cursor-pointer"
       >
        <div className="w-10 h-10 rounded-xl bg-bg-elevated border border-border-default flex items-center justify-center shrink-0 mt-0.5">
         <note.icon className="w-[18px] h-[18px] text-text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
         <p className="text-sm font-semibold text-text-primary group-hover:text-accent-text transition-colors">
          {note.title}
         </p>
         <div className="flex items-center gap-2 mt-1">
          <span
           className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
            note.tagColor === "info"
             ? "bg-info-subtle text-info-text"
             : note.tagColor === "purple"
               ? "bg-purple-subtle text-purple-text"
               : "bg-success-subtle text-success-text"
           }`}
          >
           {note.tag}
          </span>
          <span className="text-xs text-text-muted">{note.desc}</span>
         </div>
        </div>
        <span className="text-xs text-text-muted whitespace-nowrap shrink-0">
         {note.time}
        </span>
       </div>
      ))}
     </div>
    </div>
   </div>
  </div>
 );
}

function QuickNoteActionItem({
 action,
}: {
 action: (typeof heroActions)[number];
}) {
 const { handleCreate, isCreating } = useQuickNote();

 return (
  <button
   onClick={handleCreate}
   disabled={isCreating}
   className="group flex items-center gap-4 px-4 py-4 -mx-2 rounded-xl hover:bg-bg-card-hover transition-colors w-full text-left disabled:opacity-60"
  >
   <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0 group-hover:border-accent/40 transition-colors">
    <action.icon className="w-[18px] h-[18px] text-accent" />
   </div>
   <div className="flex-1 min-w-0">
    <p className="text-sm font-semibold text-text-primary group-hover:text-accent-text transition-colors">
     {action.title}
    </p>
    <p className="text-xs text-text-muted">{action.desc}</p>
   </div>
   <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-text transition-colors shrink-0" />
  </button>
 );
}
