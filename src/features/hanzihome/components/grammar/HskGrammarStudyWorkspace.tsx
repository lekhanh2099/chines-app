"use client";

import { useMemo, useState } from "react";
import { BookOpen, GraduationCap, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { StructuredGrammarContent } from "@/features/hanzihome/components/grammar/StructuredGrammarContent";
import { HskGrammarHeaderContextBridge } from "@/features/hanzihome/components/grammar/HskGrammarHeaderContextBridge";
import {
 LessonModuleFrame,
 LessonModuleSidebarRailItem,
} from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";
import { LessonModuleSidebarItem } from "@/features/hanzihome/components/lesson-overview/LessonModuleSidebarItem";
import {
 HanziAwareText,
 StudyInstructionText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { GrammarViewModel, HanziHomeLesson } from "@/features/hanzihome/types";
import { useRouter as useLocalizedRouter } from "@/i18n/navigation";

function buildHskGrammarHref(level: string, pointId?: string) {
 const params = new URLSearchParams({ level });
 if (pointId) params.set("point", pointId);
 return `/hsk/grammar?${params.toString()}`;
}

export function HskGrammarStudyWorkspace({
 levels,
 lesson,
 point,
}: {
 levels: ReadonlyArray<HanziHomeLesson>;
 lesson: HanziHomeLesson;
 point: GrammarViewModel;
}) {
 const router = useLocalizedRouter();
 const [sidebarOpen, setSidebarOpen] = useState(true);
 const [sidebarQuery, setSidebarQuery] = useState("");
 const selectedLevel = lesson.bookTitle ?? lesson.titleZh;
 const selectedPointIndex = lesson.grammar.findIndex((item) => item.id === point.id);
 const pointIndex = Math.max(1, selectedPointIndex + 1);
 const visiblePoints = useMemo(() => {
  const normalizedQuery = sidebarQuery.trim().toLocaleLowerCase("vi-VN");
  const indexedPoints = lesson.grammar.map((item, index) => ({ item, index }));
  if (!normalizedQuery) return indexedPoints;

  return indexedPoints.filter(({ item, index }) =>
   [
    String(index + 1),
    item.cleanTitle,
    item.title ?? "",
    item.titleVi ?? "",
    item.tags?.join(" ") ?? "",
   ]
    .join(" ")
    .toLocaleLowerCase("vi-VN")
    .includes(normalizedQuery),
  );
 }, [lesson.grammar, sidebarQuery]);

 const navigateToLevel = (level: string) => {
  router.push(buildHskGrammarHref(level));
 };
 const navigateToPoint = (pointId: string) => {
  router.push(buildHskGrammarHref(selectedLevel, pointId), { scroll: false });
 };

 const levelSelect = (
  <Select value={selectedLevel} onValueChange={navigateToLevel}>
   <SelectTrigger aria-label="Chọn cấp độ HSK" size="sm" width="full">
    <SelectValue />
   </SelectTrigger>
   <SelectContent align="start">
    <SelectGroup>
     {levels.map((item) => {
      const level = item.bookTitle ?? item.titleZh;
      return (
       <SelectItem key={item.id} value={level}>
        {level} · {item.grammarCount ?? 0} điểm
       </SelectItem>
      );
     })}
    </SelectGroup>
   </SelectContent>
  </Select>
 );

 const sidebar = (
  <div className="grid min-w-0 gap-2">
   <div className="grid gap-1.5">
    <StudyInstructionText
     variant="overline"
     tone="muted"
     weight="black"
     tracking="wide"
     transform="uppercase"
    >
     Cấp độ HSK
    </StudyInstructionText>
    {levelSelect}
   </div>
   <label className="relative block">
    <span className="sr-only">Tìm điểm ngữ pháp</span>
    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
    <Input
     value={sidebarQuery}
     onChange={(event) => setSidebarQuery(event.target.value)}
     placeholder="Tìm điểm ngữ pháp..."
     density="compact"
     adornment="start"
    />
   </label>
   {visiblePoints.length > 0 ? (
    visiblePoints.map(({ item, index }) => (
     <LessonModuleSidebarItem
      key={item.id}
      selected={item.id === point.id}
      title={`${index + 1}. ${item.cleanTitle}`}
      icon={<GraduationCap className="size-4" />}
      onClick={() => navigateToPoint(item.id)}
     />
    ))
   ) : (
    <StudyInstructionText variant="bodySmall" tone="muted" weight="semibold">
     Không tìm thấy điểm ngữ pháp phù hợp.
    </StudyInstructionText>
   )}
  </div>
 );

 return (
  <div className="hanzihome-static-page hanzihome-workspace-page min-w-0">
   <HskGrammarHeaderContextBridge
    selectedLevel={selectedLevel}
    selectedPointId={point.id}
    points={lesson.grammar}
   />
   <LessonModuleFrame
    title="Ngữ pháp HSK"
    subtitle={`${selectedLevel} · ${pointIndex}/${lesson.grammar.length}`}
    sidebarLabel="Điểm ngữ pháp"
    sidebarSummary={`${lesson.grammar.length} mục`}
    sidebarOpen={sidebarOpen}
    onSidebarOpenChange={setSidebarOpen}
    sidebar={sidebar}
    sidebarRail={
     <>
      <LessonModuleSidebarRailItem
       icon={<BookOpen className="size-4" />}
       label={`Chọn cấp độ HSK, hiện tại ${selectedLevel}`}
       selected={false}
       onClick={() => setSidebarOpen(true)}
      />
      {lesson.grammar.map((item, index) => (
       <LessonModuleSidebarRailItem
        key={item.id}
        icon={<GraduationCap className="size-4" />}
        label={`${index + 1}. ${item.cleanTitle}`}
        selected={item.id === point.id}
        onClick={() => navigateToPoint(item.id)}
       />
      ))}
     </>
    }
    sidebarSelectionKey={point.id}
   >
    <article className="grid min-w-0 gap-4 pb-4">
     <Card variant="section" padding="lg" className="grid gap-5">
      <header className="grid gap-3">
       <HanziAwareText
        as="h1"
        text={point.cleanTitle}
        variant="pageTitle"
        tone="default"
        weight="black"
       />
       <div className="flex flex-wrap gap-2">
        <Badge variant="default" size="sm" casing="natural">
         {point.examplesParsed.length} ví dụ
        </Badge>
       </div>
      </header>

      <StructuredGrammarContent point={point} />
     </Card>
    </article>
   </LessonModuleFrame>
  </div>
 );
}
