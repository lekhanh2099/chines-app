"use client";

import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
 BookOpen,
 Brain,
 ChevronLeft,
 Eye,
 FileText,
 Keyboard,
 Layers3,
 Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { StaticGrammarWorkspace } from "@/features/hanzihome/components/StaticGrammarWorkspace";
import { StaticLessonHeader } from "@/features/hanzihome/components/StaticLessonHeader";
import { StaticRadicalWorkspace } from "@/features/hanzihome/components/StaticRadicalWorkspace";
import {
 getHanziHomeGrammarCourse,
 getHanziHomeRadicals,
 getHanziHomeVocabCourse,
} from "@/features/hanzihome/static-data";
import VocabularyLearningModule from "@/features/vocabulary/components/VocabularyLearningModule";
import type { StudyMode } from "@/features/vocabulary/types";

const moduleValues = ["vocab", "grammar", "radicals"] as const;
const vocabModeValues = ["list", "flashcard", "examples", "quiz"] as const;

type ModuleMode = (typeof moduleValues)[number];
type VocabMode = Extract<StudyMode, (typeof vocabModeValues)[number]>;
type SearchUpdate = {
 module?: ModuleMode;
 lesson?: number;
 vocabMode?: VocabMode;
};

function parseModule(value: string | null): ModuleMode {
 return moduleValues.includes(value as ModuleMode)
  ? (value as ModuleMode)
  : "vocab";
}

function parseVocabMode(value: string | null): VocabMode {
 return vocabModeValues.includes(value as VocabMode)
  ? (value as VocabMode)
  : "flashcard";
}

function parseLessonNumber(value: string | null, fallback: number) {
 const lessonNumber = Number(value);
 return Number.isInteger(lessonNumber) && lessonNumber > 0
  ? lessonNumber
  : fallback;
}

export function HanziHomeStaticLearningClient({
 children,
}: {
 children: ReactNode;
}) {
 const router = useRouter();
 const searchParams = useSearchParams();
 const vocabCourse = useMemo(() => getHanziHomeVocabCourse(), []);
 const grammarCourse = useMemo(() => getHanziHomeGrammarCourse(), []);
 const radicals = useMemo(() => getHanziHomeRadicals(), []);
 const fallbackLessonNumber = vocabCourse.lessons[0]?.lesson_number || 11;
 const activeModule = parseModule(searchParams.get("module"));
 const vocabMode = parseVocabMode(searchParams.get("mode"));
 const lessonNumber = parseLessonNumber(
  searchParams.get("lesson"),
  fallbackLessonNumber,
 );
 const activeVocabLesson =
  vocabCourse.lessons.find(
   (lesson) => lesson.lesson_number === lessonNumber,
  ) ||
  vocabCourse.lessons[0] ||
  null;
 const activeGrammarLesson =
  grammarCourse.lessons.find(
   (lesson) => lesson.lesson_number === lessonNumber,
  ) ||
  grammarCourse.lessons[0] ||
  null;

 const updateSearch = useCallback(
  (update: SearchUpdate) => {
   const params = new URLSearchParams(searchParams.toString());
   if (update.module) params.set("module", update.module);
   if (update.lesson) params.set("lesson", String(update.lesson));
   if (update.vocabMode) params.set("mode", update.vocabMode);
   router.replace(`?${params.toString()}`, { scroll: false });
  },
  [router, searchParams],
 );

 return (
  <>
   <header className="hanzihome-static-topbar">
    <Button asChild variant="outline" size="icon" className="rounded-2xl">
     <Link href="/" aria-label="Quay về trang chính">
      <ChevronLeft className="h-4 w-4" />
     </Link>
    </Button>
    <div className="min-w-0 flex-1">
     <p className="truncate text-sm font-black uppercase tracking-[0.18em] text-red-500">
      Static self-study
     </p>
     <h1 className="truncate text-xl font-black text-stone-950 sm:text-2xl">
      HanziHome Hán ngữ 2
     </h1>
    </div>
    <SegmentedControl
     value="hanyu"
     items={[
      { key: "hanyu", label: "Hán ngữ" },
      { key: "hsk", label: "HSK", disabled: true },
     ]}
     onChange={() => undefined}
     className="w-auto"
    />
    <div className="hanzihome-topbar-controls">
     <Select
      value={String(activeVocabLesson?.lesson_number || fallbackLessonNumber)}
      onChange={(event) =>
       updateSearch({ lesson: Number(event.target.value) })
      }
      className="h-10 rounded-2xl border-2 bg-white text-xs font-black sm:text-sm"
     >
      {vocabCourse.lessons.map((lesson) => (
       <option key={lesson.id} value={lesson.lesson_number || 0}>
        {lesson.title}
       </option>
      ))}
     </Select>
     <SegmentedControl
     value={activeModule}
      items={[
       { key: "vocab", label: "Từ vựng", icon: BookOpen },
       { key: "grammar", label: "Ngữ pháp", icon: Brain },
       { key: "radicals", label: "Bộ thủ", icon: Sparkles },
      ]}
      onChange={(value) => updateSearch({ module: value })}
     />
    </div>
   </header>

   <StaticLessonHeader
    vocabLesson={activeVocabLesson}
    grammarLesson={activeGrammarLesson}
    radicalCount={radicals.length}
   />

   {children}

   {activeModule === "vocab" && (
    <SegmentedControl
     value={vocabMode}
     onChange={(value) => updateSearch({ vocabMode: value })}
     className="w-full self-start sm:w-auto"
     items={[
      { key: "list", label: "Tổng quan", icon: Layers3 },
      { key: "flashcard", label: "Flashcard", icon: Eye },
      { key: "examples", label: "Chi tiết", icon: FileText },
      { key: "quiz", label: "Luyện tập", icon: Keyboard },
     ]}
    />
   )}

   {activeModule === "vocab" ? (
    <VocabularyLearningModule
     key={`hanzihome-vocab-${lessonNumber}-${vocabMode}`}
     staticCourse={vocabCourse}
     staticProgressKey="hanzihome:vocab-progress:v1"
     readOnly
     showHeader={false}
     sourceMode="hanyu"
     title="Từ vựng HanziHome"
     description="Mode tự học từ data tĩnh HanziHome."
     allowDocxReset={false}
     initialLessonNumber={lessonNumber}
     initialMode={vocabMode}
    />
   ) : activeModule === "grammar" ? (
    <StaticGrammarWorkspace
     lessonNumber={lessonNumber}
     lesson={activeGrammarLesson}
     onLessonNumberChange={(value) => updateSearch({ lesson: value })}
    />
   ) : (
    <StaticRadicalWorkspace radicals={radicals} />
   )}
  </>
 );
}
