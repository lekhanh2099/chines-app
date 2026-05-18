"use client";

import Link from "next/link";
import { BookOpen, Brain, CalendarDays, Flame, GraduationCap, Target, Trophy, WalletCards } from "lucide-react";
import { useMemo } from "react";
import { useVocabList } from "@/features/vocabulary/hooks/useVocabList";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import { cn } from "@/lib/utils";

const today = new Date("2026-05-12T12:00:00+07:00");

export default function HomePage() {
 const { data: vocabList = [] } = useVocabList();
 const { data: grammarNotes = [] } = useNotesList("grammar");

 const stats = useMemo(() => {
  const words = vocabList.filter((item) => item.type === "word");
  const sentences = vocabList.filter((item) => item.type === "sentence");
  const mastered = vocabList.filter((item) => item.status === "mastered").length;
  const review = vocabList.filter((item) => item.status !== "mastered").length;
  return {
   words: words.length,
   sentences: sentences.length,
   grammar: grammarNotes.length,
   mastered,
   review,
   xp: 324 + mastered * 3,
   levelProgress: Math.min(92, Math.max(12, Math.round((mastered / Math.max(vocabList.length, 1)) * 100))),
  };
 }, [grammarNotes.length, vocabList]);

 const heatmap = useMemo(() => buildHeatmap(), []);

 return (
  <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-7 px-5 py-7 lg:px-8">
   <section>
    <p className="text-lg font-bold text-stone-500">Giữ vững chuỗi học và nhận phần thưởng</p>
    <h1 className="mt-1 text-4xl font-black tracking-normal text-stone-900 md:text-5xl">
     Chào mừng trở lại
    </h1>
   </section>

   <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md">
    <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
     <div className="flex flex-col gap-5 md:flex-row md:items-center">
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border-2 border-orange-300 bg-orange-50 shadow-theme-sm">
       <Flame className="h-12 w-12 fill-red-500 text-red-500" />
      </div>
      <div>
       <p className="text-base font-bold text-stone-500">Streak hiện tại</p>
       <p className="text-4xl font-black text-stone-900">3 ngày</p>
       <p className="mt-1 text-sm font-bold text-stone-500">Streak cao nhất: 3 ngày</p>
      </div>
      <Link
       href="/vocabulary"
       className="inline-flex h-14 items-center justify-center rounded-2xl bg-red-500 px-6 text-base font-black uppercase tracking-wide text-white shadow-theme-md transition hover:bg-red-600 md:ml-auto"
      >
       Điểm danh ngay
      </Link>
     </div>

     <div className="grid gap-4 md:grid-cols-[96px_1fr] md:items-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-purple-300 bg-purple-100 text-4xl font-black text-purple-700 shadow-theme-sm">
       2
      </div>
      <div>
       <div className="flex items-center justify-between text-sm font-black text-stone-700">
        <span>Lên level 3</span>
        <span>{stats.xp} XP</span>
       </div>
       <div className="mt-3 h-4 rounded-full bg-stone-100">
        <div
         className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-rose-500"
         style={{ width: `${stats.levelProgress}%` }}
        />
       </div>
       <p className="mt-2 text-sm font-bold text-stone-500">
        Còn {Math.max(8, 100 - stats.levelProgress)} XP đến level tiếp
       </p>
      </div>
     </div>
    </div>

    <div className="mt-5 flex flex-wrap gap-3">
     <RewardPill icon={Target} label="Nhiệm vụ" value="0/3" tone="yellow" />
     <RewardPill icon={Trophy} label="XP hôm nay" value="+24" tone="green" />
     <RewardPill icon={Flame} label="Streak freeze" value="0" tone="blue" />
    </div>
   </section>

   <section className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md">
    <div className="mb-5 flex items-center gap-3">
     <Brain className="h-6 w-6 text-purple-500" />
     <h2 className="text-2xl font-black text-stone-900">Ôn tập nhanh</h2>
    </div>
    <div className="grid gap-4 xl:grid-cols-3">
     <QuickReviewCard
      href="/vocabulary"
      icon={WalletCards}
      title="Từ vựng"
      subtitle={stats.review ? `${stats.review} mục cần ôn` : "Bạn đã ôn xong hết"}
      tone="orange"
     />
     <QuickReviewCard
      href="/vocabulary"
      icon={BookOpen}
      title="Luyện tập"
      subtitle="Chọn Hán ngữ hoặc HSK trong module học"
      tone="red"
     />
     <QuickReviewCard
      href="/grammar"
      icon={GraduationCap}
      title="Ngữ pháp"
      subtitle={stats.grammar ? `${stats.grammar} ghi chú ngữ pháp` : "Bạn đã ôn xong hết"}
      tone="purple"
     />
    </div>
   </section>

   <section className="rounded-[28px] border-2 border-stone-200 bg-white p-6 shadow-theme-md">
    <div className="flex items-start justify-between gap-4">
     <div>
      <div className="flex items-center gap-3">
       <CalendarDays className="h-6 w-6 text-red-500" />
       <h2 className="text-2xl font-black text-stone-900">90 ngày gần nhất</h2>
      </div>
      <p className="mt-2 text-base font-bold text-stone-500">
       Ô càng đậm nghĩa là hôm đó học càng nhiều.
      </p>
     </div>
     <div className="hidden rounded-2xl border-2 border-stone-200 px-4 py-2 text-sm font-black text-stone-600 md:block">
      Hôm nay: 3p
     </div>
    </div>

    <div className="mt-7 grid gap-7 xl:grid-cols-[520px_1fr]">
     <div className="grid grid-cols-[repeat(15,1fr)] gap-2">
      {heatmap.map((day) => (
       <div
        key={day.key}
        className={cn(
         "aspect-square rounded-lg border-2",
         day.level === 0 && "border-stone-100 bg-stone-50",
         day.level === 1 && "border-emerald-200 bg-emerald-100",
         day.level === 2 && "border-emerald-300 bg-emerald-300",
         day.level === 3 && "border-emerald-500 bg-emerald-500",
         day.today && "ring-4 ring-red-400",
        )}
        title={day.label}
       />
      ))}
     </div>
     <div className="rounded-3xl border-2 border-stone-200 p-5">
      <div className="flex items-center justify-between gap-3">
       <p className="text-xl font-black text-stone-900">Thứ Ba, 12 tháng 5, 2026</p>
       <p className="text-sm font-black text-stone-500">3p</p>
      </div>
      <p className="mt-5 text-base font-bold text-stone-500">
       Hôm nay có {stats.words} từ, {stats.sentences} câu và {stats.grammar} mục ngữ pháp sẵn sàng để học.
      </p>
     </div>
    </div>
   </section>
  </div>
 );
}

function RewardPill({ icon: Icon, label, value, tone }: { icon: typeof Target; label: string; value: string; tone: "yellow" | "green" | "blue" }) {
 const toneClass = {
  yellow: "border-yellow-300 bg-yellow-50 text-orange-700",
  green: "border-emerald-300 bg-emerald-50 text-emerald-700",
  blue: "border-sky-300 bg-sky-50 text-sky-700",
 }[tone];

 return (
  <div className={cn("flex h-14 items-center gap-3 rounded-2xl border-2 px-4 font-black shadow-theme-sm", toneClass)}>
   <Icon className="h-5 w-5" />
   <span className="text-sm">{label}</span>
   <span>{value}</span>
  </div>
 );
}

function QuickReviewCard({ href, icon: Icon, title, subtitle, tone }: { href: string; icon: typeof WalletCards; title: string; subtitle: string; tone: "orange" | "red" | "purple" }) {
 const toneClass = {
  orange: "bg-orange-500 border-orange-600",
  red: "bg-red-500 border-red-700",
  purple: "bg-purple-500 border-purple-700",
 }[tone];

 return (
  <Link href={href} className={cn("flex min-h-28 items-center gap-4 rounded-3xl border-2 p-5 text-white shadow-theme-md transition hover:-translate-y-0.5", toneClass)}>
   <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20">
    <Icon className="h-8 w-8" />
   </div>
   <div className="min-w-0">
    <p className="text-2xl font-black uppercase tracking-wide">{title}</p>
    <p className="mt-1 truncate text-sm font-bold text-white/90">{subtitle}</p>
   </div>
  </Link>
 );
}

function buildHeatmap() {
 return Array.from({ length: 90 }, (_, index) => {
  const date = new Date(today);
  date.setDate(today.getDate() - (89 - index));
  const level = index % 13 === 0 ? 3 : index % 7 === 0 ? 2 : index % 5 === 0 ? 1 : 0;
  return {
   key: date.toISOString(),
   label: date.toLocaleDateString("vi-VN"),
   level,
   today: index === 89,
  };
 });
}
