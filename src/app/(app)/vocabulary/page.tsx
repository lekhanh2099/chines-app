"use client";

import { useState } from "react";
import { HskLessonPracticeModule } from "@/features/hsk";
import VocabularyLearningModule from "@/features/vocabulary/components/VocabularyLearningModule";
import { cn } from "@/lib/utils";

type VocabSource = "hanyu" | "hsk";

export default function VocabularyPage() {
 const [source, setSource] = useState<VocabSource>("hanyu");

 return (
  <div className="min-h-screen bg-stone-50">
   <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-3 py-3 pb-24 sm:px-5 sm:py-5 lg:px-8">
    <SourceSwitch
     value={source}
     onChange={setSource}
     title="Từ vựng"
     description="Chọn nguồn học: kho Hán ngữ cá nhân hoặc HSK."
    />
    {source === "hanyu" ? (
     <VocabularyLearningModule />
    ) : (
     <HskLessonPracticeModule
      titlePrefix="Từ vựng HSK"
      visibleTabs={["vocab", "phrases", "flash", "quiz"]}
      initialTab="flash"
     />
    )}
   </div>
  </div>
 );
}

function SourceSwitch({
 value,
 onChange,
 title,
 description,
}: {
 value: VocabSource;
 onChange: (value: VocabSource) => void;
 title: string;
 description: string;
}) {
 return (
  <section className="rounded-[24px] border-2 border-stone-200 bg-white p-4 shadow-theme-sm md:rounded-[28px] md:p-5">
   <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div>
     <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Nguồn học</p>
     <h1 className="mt-1 text-3xl font-black text-stone-950 md:text-4xl">{title}</h1>
     <p className="mt-1 text-sm font-bold text-stone-500 md:text-base">{description}</p>
    </div>
    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-stone-100 p-1">
     {[
      { key: "hanyu" as const, label: "Hán ngữ" },
      { key: "hsk" as const, label: "HSK" },
     ].map((item) => (
      <button
       key={item.key}
       type="button"
       onClick={() => onChange(item.key)}
       className={cn(
        "h-11 rounded-xl px-4 text-sm font-black transition",
        value === item.key ? "bg-red-500 text-white shadow-theme-sm" : "text-stone-600 hover:bg-white",
       )}
      >
       {item.label}
      </button>
     ))}
    </div>
   </div>
  </section>
 );
}
