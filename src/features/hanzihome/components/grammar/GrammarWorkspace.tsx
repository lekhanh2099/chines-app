"use client";

import { useMemo } from "react";
import { GrammarPointList } from "@/features/hanzihome/components/GrammarPointList";
import { GrammarPointReader } from "@/features/hanzihome/components/grammar/GrammarPointReader";
import { AllGrammarPointReader } from "@/features/hanzihome/components/grammar/AllGrammarPointReader";
import { GrammarReadingReader } from "@/features/hanzihome/components/grammar/GrammarReadingReader";
import {
 extractGrammarReading,
 extractReadingFromMarkdown,
} from "@/features/hanzihome/components/grammar/grammar-reading";
import { useHanziHomeRuntime } from "@/features/hanzihome/context/runtime";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeFeatureSelector } from "@/features/hanzihome/context/selectors";
import { EditableNodeWrapper, type EditableNodePath } from "@/features/hanzihome/editing";
import { LessonModuleFrame } from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";

type GrammarWorkspaceProps = {
 compact?: boolean;
};

const ALL_GRAMMAR_POINTS_ID = "__all__";
const READING_VIEW_ID = "__reading__";

export function GrammarWorkspace({ compact = false }: GrammarWorkspaceProps) {
 const runtime = useHanziHomeRuntime();
 const { lesson, learningState: state } = runtime;
 const actions = useHanziHomeFeatureActions();
 const grammarPoints = lesson.grammar;
 const vocabItems = lesson.vocab;
 const selectedPointId = useHanziHomeFeatureSelector(
  (featureState) => featureState.grammarSelectedPointId,
 );
 const isGrammarSidebarOpen = useHanziHomeFeatureSelector(
  (featureState) => featureState.grammarSidebarOpen,
 );

 const reading = useMemo(
  () =>
   extractReadingFromMarkdown(lesson.notes?.applicationMarkdown) ??
   extractReadingFromMarkdown(lesson.notes?.overviewMarkdown) ??
   extractGrammarReading(grammarPoints),
  [grammarPoints, lesson.notes?.applicationMarkdown, lesson.notes?.overviewMarkdown],
 );
 const effectiveSelectedPointId = useMemo(() => {
  if (selectedPointId === ALL_GRAMMAR_POINTS_ID) return ALL_GRAMMAR_POINTS_ID;
  if (selectedPointId === READING_VIEW_ID) {
   return reading ? READING_VIEW_ID : grammarPoints[0]?.id || null;
  }
  if (selectedPointId && grammarPoints.some((point) => point.id === selectedPointId)) {
   return selectedPointId;
  }

  return grammarPoints[0]?.id || null;
 }, [grammarPoints, reading, selectedPointId]);
 const isAllView = effectiveSelectedPointId === ALL_GRAMMAR_POINTS_ID;
 const isReadingView = effectiveSelectedPointId === READING_VIEW_ID;

 const selectedPoint = useMemo(
  () =>
   isAllView || isReadingView
    ? null
    : grammarPoints.find((point) => point.id === effectiveSelectedPointId) ||
      grammarPoints[0] ||
      null,
  [effectiveSelectedPointId, grammarPoints, isAllView, isReadingView],
 );

 const progress = state.progress.grammar || {};
 const bookmarks = state.bookmarks.grammar || [];
 const selectedPointPath = useMemo<EditableNodePath | null>(() => {
  if (!selectedPoint) return null;

  const index = lesson.grammar.findIndex((point) => point.id === selectedPoint.id);
  return index >= 0 ? ["grammar", index] : null;
 }, [lesson.grammar, selectedPoint]);

 const relatedVocab = useMemo(() => {
  if (!selectedPoint) return [];

  const text = [
   selectedPoint.cleanTitle,
   selectedPoint.core,
   selectedPoint.structuresView.join(" "),
   selectedPoint.examplesParsed.map((example) => example.zh).join(" "),
  ].join(" ");

  return vocabItems.filter((word) => text.includes(word.hanzi)).slice(0, 8);
 }, [selectedPoint, vocabItems]);

 const renderGrammarSidebar = () => (
  <div className="grid min-w-0 max-w-full content-start gap-3 overflow-hidden">
   <GrammarPointList
    points={grammarPoints}
    selectedPointId={
     isAllView || isReadingView ? effectiveSelectedPointId : selectedPoint?.id || null
    }
    progress={progress}
    onSelectPoint={(pointId) => {
     actions.selectGrammarPoint(pointId);
    }}
    allPointId={ALL_GRAMMAR_POINTS_ID}
   />
  </div>
 );

 const readerContent = isAllView ? (
  <AllGrammarPointReader points={grammarPoints} />
 ) : isReadingView && reading ? (
  <GrammarReadingReader reading={reading} />
 ) : selectedPoint && selectedPointPath ? (
  <EditableNodeWrapper
   lessonId={lesson.id}
   entityType="grammar_point"
   entityId={selectedPoint.id}
   path={selectedPointPath}
   value={selectedPoint}
   label={selectedPoint.cleanTitle}
  >
   <GrammarPointReader
    point={selectedPoint}
    pointPath={selectedPointPath}
    status={progress[selectedPoint.id]?.status || "new"}
    bookmarked={bookmarks.includes(selectedPoint.id)}
    relatedVocab={relatedVocab}
    lessonId={lesson.id}
    onBookmark={() => runtime.bookmarkGrammar(selectedPoint.id)}
    onMarkStatus={(status) => runtime.markGrammar(selectedPoint.id, status)}
   />
  </EditableNodeWrapper>
 ) : (
  <GrammarPointReader
   point={selectedPoint}
   status={selectedPoint ? progress[selectedPoint.id]?.status || "new" : "new"}
   bookmarked={selectedPoint ? bookmarks.includes(selectedPoint.id) : false}
   relatedVocab={relatedVocab}
   lessonId={lesson.id}
   onBookmark={() => selectedPoint && runtime.bookmarkGrammar(selectedPoint.id)}
   onMarkStatus={(status) => selectedPoint && runtime.markGrammar(selectedPoint.id, status)}
  />
 );

 return (
  <div className="grid gap-3">
   <LessonModuleFrame
    title="Ngữ pháp"
    subtitle={
     selectedPoint?.cleanTitle || (isAllView ? "Xem toàn bộ điểm ngữ pháp" : "Bài đọc áp dụng")
    }
    sidebarLabel="Điểm ngữ pháp"
    sidebarSummary={`${grammarPoints.length} mục`}
    sidebarOpen={isGrammarSidebarOpen}
    onSidebarOpenChange={actions.setGrammarSidebarOpen}
    sidebar={renderGrammarSidebar()}
    sidebarSelectionKey={effectiveSelectedPointId}
    compact={compact}
   >
    {readerContent}
   </LessonModuleFrame>
  </div>
 );
}
