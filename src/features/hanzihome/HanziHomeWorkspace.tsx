"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, GraduationCap, Home, Layers3, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { GrammarWorkspace } from "@/features/hanzihome/components/GrammarWorkspace";
import { LessonOverview } from "@/features/hanzihome/components/LessonOverview";
import { LessonPicker } from "@/features/hanzihome/components/LessonPicker";
import { RadicalWorkspace } from "@/features/hanzihome/components/RadicalWorkspace";
import { ReviewWorkspace } from "@/features/hanzihome/components/ReviewWorkspace";
import { VocabWorkspace } from "@/features/hanzihome/components/VocabWorkspace";
import { useHanziHomeData } from "@/features/hanzihome/hooks/useHanziHomeData";
import { useHanziHomeLesson } from "@/features/hanzihome/hooks/useHanziHomeLesson";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import type {
 HanziHomeModule,
 LearningStatus,
 ReviewResult,
} from "@/features/hanzihome/types";

const tabs = [
 { key: "overview" as const, label: "Tổng quan", icon: Home },
 { key: "vocab" as const, label: "Từ vựng", icon: BookOpen },
 { key: "grammar" as const, label: "Ngữ pháp", icon: GraduationCap },
 { key: "radicals" as const, label: "Bộ thủ", icon: Layers3 },
 { key: "review" as const, label: "Ôn tập", icon: RotateCcw },
];

function parseModule(value: string | null | undefined): HanziHomeModule | null {
 return tabs.some((item) => item.key === value) ? (value as HanziHomeModule) : null;
}

export function HanziHomeWorkspace() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const data = useHanziHomeData();
 const learning = useLearningState();
 const lessonId =
  searchParams.get("lessonId") ||
  learning.state.settings.lastLessonId ||
  data.lessons[0]?.id ||
  "";
 const activeModule =
  parseModule(searchParams.get("module")) ||
  learning.state.settings.lastModule ||
  "overview";
 const lesson = useHanziHomeLesson(data, lessonId);

 const selectedLessonId = lesson?.id || lessonId;
 const subtitle = useMemo(() => {
  if (!lesson) return "Không có dữ liệu bài học.";
  return `${lesson.vocab.length} từ · ${lesson.grammar.length} điểm ngữ pháp · ${lesson.radicals.length} bộ thủ`;
 }, [lesson]);

 if (!lesson) {
  return (
   <main className="hanzihome-static-page">
    <Card padding="lg" className="rounded-2xl">
     <p className="text-sm font-semibold text-text-muted">Không tìm thấy dữ liệu HanziHome.</p>
    </Card>
   </main>
  );
 }

 const replaceWorkspaceParams = (updates: Partial<Record<"lessonId" | "module", string>>) => {
  const nextParams = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
   if (value) nextParams.set(key, value);
   else nextParams.delete(key);
  });
  router.replace(`/hanzihome?${nextParams.toString()}`);
 };
 const selectLesson = (nextLessonId: string) => {
  replaceWorkspaceParams({ lessonId: nextLessonId });
  learning.updateSettings({ lastLessonId: nextLessonId });
 };
 const selectModule = (nextModule: HanziHomeModule) => {
  replaceWorkspaceParams({ module: nextModule });
  learning.updateSettings({ lastModule: nextModule });
 };
 const markVocab = (id: string, status: LearningStatus) => {
  learning.updateVocabProgress(id, status);
 };
 const markGrammar = (id: string, status: LearningStatus) => {
  learning.updateGrammarProgress(id, status);
 };
 const answerReview = (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => {
  learning.appendReviewHistory(item, result);
  if (item.type === "vocab") {
   markVocab(item.id, result === "known" ? "known" : result === "hard" ? "hard" : "learning");
  }
  if (item.type === "grammar") {
   markGrammar(item.id, result === "known" ? "known" : result === "hard" ? "hard" : "learning");
  }
 };

 return (
  <main className="hanzihome-static-page">
   <div className="hanzihome-static-topbar">
    <div className="hanzihome-topbar-title">
     <p>HanziHome / Tự học</p>
     <h1>{lesson.title}</h1>
     <p>{subtitle}</p>
    </div>
    <div className="hanzihome-topbar-controls">
     <LessonPicker
      lessons={data.lessons}
      selectedLessonId={selectedLessonId}
      onSelectLesson={selectLesson}
     />
     {learning.isSaving && (
      <span className="text-xs font-black uppercase tracking-wide text-text-muted">
       Đang lưu...
      </span>
     )}
    </div>
   </div>

   <Tabs
    value={activeModule}
    items={tabs}
    onValueChange={selectModule}
    className="grid gap-5"
   >
    <TabsContent active={activeModule === "overview"}>
     <LessonOverview lesson={lesson} onOpenModule={selectModule} />
    </TabsContent>
    <TabsContent active={activeModule === "vocab"}>
     <VocabWorkspace
      lesson={lesson}
      state={learning.state}
      onBookmark={(id) => learning.toggleBookmark("vocab", id)}
      onMarkStatus={markVocab}
     />
    </TabsContent>
    <TabsContent active={activeModule === "grammar"}>
     <GrammarWorkspace
      lesson={lesson}
      state={learning.state}
      onBookmark={(id) => learning.toggleBookmark("grammar", id)}
      onMarkStatus={markGrammar}
     />
    </TabsContent>
    <TabsContent active={activeModule === "radicals"}>
     <RadicalWorkspace lesson={lesson} />
    </TabsContent>
    <TabsContent active={activeModule === "review"}>
     <ReviewWorkspace lesson={lesson} onAnswer={answerReview} />
    </TabsContent>
   </Tabs>

   <div className="flex flex-wrap gap-2">
    {tabs.map((item) => (
     <Button
      key={item.key}
      variant={activeModule === item.key ? "default" : "outline"}
      size="sm"
      onClick={() => selectModule(item.key)}
     >
      <item.icon className="h-4 w-4" />
      {item.label}
     </Button>
    ))}
   </div>
  </main>
 );
}
