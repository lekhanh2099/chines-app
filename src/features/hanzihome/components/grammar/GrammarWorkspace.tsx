"use client";

import { useMemo } from "react";
import { GraduationCap, Layers } from "lucide-react";
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
import {
 useHanziHomeEditMode,
 useHanziHomeFeatureSelector,
} from "@/features/hanzihome/context/selectors";
import { EditableNodeWrapper, type NullableEditableNodePath } from "@/features/hanzihome/editing";
import {
 LessonModuleFrame,
 LessonModuleSidebarRailItem,
} from "@/features/hanzihome/components/lesson-overview/LessonModuleFrame";

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
 const editMode = useHanziHomeEditMode();
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
 const selectedPointPath = useMemo<NullableEditableNodePath>(() => {
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
  <AllGrammarPointReader lessonId={lesson.id} points={grammarPoints} editMode={editMode} />
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
   editLabel="Sửa ngữ pháp"
  >
   <GrammarPointReader
    point={selectedPoint}
    pointPath={selectedPointPath}
    status={progress[selectedPoint.id]?.status || "new"}
    bookmarked={bookmarks.includes(selectedPoint.id)}
    relatedVocab={relatedVocab}
    lessonId={lesson.id}
    editMode={editMode}
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
   editMode={editMode}
   onBookmark={() => selectedPoint && runtime.bookmarkGrammar(selectedPoint.id)}
   onMarkStatus={(status) => selectedPoint && runtime.markGrammar(selectedPoint.id, status)}
  />
 );

 return (
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
   sidebarRail={
    <>
     <LessonModuleSidebarRailItem
      icon={<Layers className="h-4 w-4" />}
      label="Xem toàn bộ điểm ngữ pháp"
      selected={isAllView}
      onClick={() => actions.selectGrammarPoint(ALL_GRAMMAR_POINTS_ID)}
     />
     {grammarPoints.map((point, index) => (
      <LessonModuleSidebarRailItem
       key={point.id}
       icon={<GraduationCap className="h-4 w-4" />}
       label={`${index + 1}. ${point.cleanTitle}`}
       selected={point.id === selectedPoint?.id}
       onClick={() => actions.selectGrammarPoint(point.id)}
      />
     ))}
    </>
   }
   sidebarSelectionKey={effectiveSelectedPointId}
   mobileNavigation={{
    label: "Điểm ngữ pháp",
    value: effectiveSelectedPointId ?? ALL_GRAMMAR_POINTS_ID,
    items: [
     { value: ALL_GRAMMAR_POINTS_ID, label: "Xem toàn bộ" },
     ...(reading ? [{ value: READING_VIEW_ID, label: "Bài đọc áp dụng" }] : []),
     ...grammarPoints.map((point, index) => ({
      value: point.id,
      label: `${index + 1}. ${point.cleanTitle}`,
     })),
    ],
    onChange: actions.selectGrammarPoint,
   }}
   compact={compact}
  >
   {readerContent}
  </LessonModuleFrame>
 );
}
