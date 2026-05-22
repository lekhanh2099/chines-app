"use client";

import { Loader2, Plus } from "lucide-react";
import { HskLessonPracticeModule } from "@/features/hsk";
import { LessonHub } from "@/features/learning/components";
import {
 AllGrammarWorkspace,
 LessonEditWorkspace,
} from "@/features/grammar/components/GrammarAdminWorkspaces";
import {
 HskGrammarStudyBar,
 LearningHeader,
 LearningShell,
} from "@/features/grammar/components/GrammarLearningHeader";
import { GrammarCoachWorkspace } from "@/features/grammar/components/GrammarCoachWorkspace";
import { LessonList } from "@/features/grammar/components/LessonList";
import { MobileLessonSheet } from "@/features/grammar/components/MobileLessonSheet";
import { ImportDrawer } from "@/features/grammar/components/drawers/ImportDrawer";
import { LessonDrawer } from "@/features/grammar/components/drawers/LessonDrawer";
import { PointDrawer } from "@/features/grammar/components/drawers/PointDrawer";
import { ActionButton, EmptyState } from "@/features/grammar/components/ui";
import { useGrammarPageController } from "@/features/grammar/hooks/useGrammarPageController";
import { cn } from "@/lib/utils";

export default function GrammarPage() {
 const grammar = useGrammarPageController();

 if (grammar.source === "hsk") {
  return (
   <LearningShell>
    <HskGrammarStudyBar
     source={grammar.source}
     onSourceChange={grammar.setSource}
    />
    <HskLessonPracticeModule
     titlePrefix="Ngữ pháp HSK"
     visibleTabs={["grammar", "text", "quiz"]}
     initialTab="grammar"
    />
   </LearningShell>
  );
 }

 if (grammar.error) {
  return (
   <LearningShell>
    <EmptyState
     title={
      grammar.isMissingSchemaError
       ? "Chưa apply grammar migration"
       : "Không tải được ngữ pháp"
     }
     description={
      grammar.isMissingSchemaError
       ? "Apply supabase/migrations/20260312000016_grammar_learning.sql rồi tải lại trang."
       : grammar.error instanceof Error
         ? grammar.error.message
         : "Kiểm tra API grammar."
     }
    />
   </LearningShell>
  );
 }

 if (!grammar.isLoading && grammar.course && !grammar.hasLessonQuery) {
  return (
   <LearningShell>
    <LessonHub
     title="Chọn bài ngữ pháp"
     description="Chọn nguồn học trước, rồi vào từng bài để học lý thuyết, xem từ vựng liên quan và luyện practice."
     source={grammar.source}
     onSourceChange={grammar.setSource}
     lessons={grammar.hubLessons}
    />
   </LearningShell>
  );
 }

 return (
  <LearningShell>
   <LearningHeader
    source={grammar.source}
    onSourceChange={grammar.setSource}
    activeTab={grammar.activeTab}
    onTabChange={grammar.setActiveTab}
    onCreateLesson={grammar.createLessonDraft}
    onCreatePoint={() => grammar.createPointDraft()}
    onImportHanyu={grammar.importHanyuGrammar}
    onImportCoachJson={grammar.importCoachJson}
    isImportingHanyu={grammar.isImportingHanyu}
    isImportingCoachJson={grammar.isImportingCoachJson}
    lessons={grammar.lessons}
    workspace={grammar.lessonWorkspace}
   />

   {grammar.isLoading ? (
    <div className="flex min-h-130 items-center justify-center rounded-[28px] border-2 border-stone-200 bg-white shadow-theme-md">
     <Loader2 className="h-6 w-6 animate-spin text-red-500" />
     <span className="ml-3 text-sm font-black text-stone-500">
      Đang tải ngữ pháp...
     </span>
    </div>
   ) : !grammar.course ? (
    <EmptyState
     title="Chưa có kho ngữ pháp"
     description="Tạo bài hoặc paste nội dung ngữ pháp để bắt đầu."
     action={
      <ActionButton onClick={grammar.createLessonDraft} icon={Plus}>
       Tạo bài đầu tiên
      </ActionButton>
     }
    />
   ) : (
    <>
     <div
      className={cn(
       "grid gap-4 sm:gap-6",
       grammar.activeTab === "study"
        ? "grid-cols-1"
        : "lg:grid-cols-[340px_minmax(0,1fr)]",
      )}
     >
      {grammar.activeTab !== "study" && (
       <LessonList
        lessons={grammar.lessons}
        activeLessonId={grammar.activeLesson?.id}
        onSelect={grammar.selectLesson}
        onEdit={grammar.setEditingLesson}
        onImport={grammar.setImportingLesson}
       />
      )}

      <main className="min-w-0">
       {grammar.activeTab === "study" && (
        <GrammarCoachWorkspace
         lessons={grammar.lessons}
         points={grammar.coachPoints}
         point={grammar.coachPoint}
         activeIndex={grammar.coachIndex}
         stats={grammar.coachStats}
         lessonById={grammar.lessonById}
         tags={grammar.coachTags}
         fromLesson={grammar.coachFromLesson}
         toLesson={grammar.coachToLesson}
         status={grammar.coachStatus}
         order={grammar.coachOrder}
         tag={grammar.coachTag}
         searchQuery={grammar.searchQuery}
         activeTab={grammar.coachTab}
         vocabulary={grammar.coachVocabulary}
         workspace={grammar.lessonWorkspace}
         selectedChoice={grammar.selectedChoice}
         checked={grammar.exerciseChecked}
         correct={grammar.exerciseCorrect}
         isGeneratingExercises={grammar.isGeneratingExercises}
         onFromLessonChange={grammar.setCoachFromLesson}
         onToLessonChange={grammar.setCoachToLesson}
         onStatusChange={grammar.setCoachStatus}
         onOrderChange={grammar.setCoachOrder}
         onTagChange={grammar.setCoachTag}
         onSearchChange={grammar.setSearchQuery}
         onTabChange={grammar.setCoachTabAndReset}
         onSelectPoint={grammar.selectCoachPoint}
         onSelectChoice={grammar.setSelectedChoice}
         onCheckPractice={grammar.checkCoachPractice}
         onPrev={() => grammar.goCoach(-1)}
         onNext={() => grammar.goCoach(1)}
         onMarkWeak={() => grammar.markCoachPoint(2)}
         onMarkKnown={() => grammar.markCoachPoint(5)}
         onEditPoint={grammar.setEditingPoint}
         onGenerateExercises={grammar.generateCoachExerciseSet}
        />
       )}

       {grammar.activeTab === "all" && (
        <AllGrammarWorkspace
         points={grammar.visiblePoints}
         lessons={grammar.lessons}
         searchQuery={grammar.searchQuery}
         filter={grammar.filter}
         onSearchChange={grammar.setSearchQuery}
         onFilterChange={grammar.setFilter}
         onEdit={grammar.setEditingPoint}
         onAddPoint={() => grammar.createPointDraft()}
        />
       )}

       {grammar.activeTab === "edit" && (
        <LessonEditWorkspace
         lessons={grammar.lessons}
         onEditLesson={grammar.setEditingLesson}
         onEditPoint={grammar.setEditingPoint}
         onAddLesson={grammar.createLessonDraft}
         onAddPoint={grammar.createPointDraft}
         onImportLesson={grammar.setImportingLesson}
        />
       )}
      </main>
     </div>

     <MobileLessonSheet
      open={grammar.lessonSheetOpen}
      lessons={grammar.lessons}
      activeLessonId={grammar.activeLesson?.id}
      onClose={() => grammar.setLessonSheetOpen(false)}
      onSelect={grammar.selectLesson}
     />
    </>
   )}

   {grammar.editingLesson && (
    <LessonDrawer
     lesson={grammar.editingLesson}
     onClose={() => grammar.setEditingLesson(null)}
     onSave={grammar.saveLesson}
     onDelete={grammar.deleteLesson}
    />
   )}
   {grammar.editingPoint && (
    <PointDrawer
     point={grammar.editingPoint}
     lessons={grammar.lessons}
     onClose={() => grammar.setEditingPoint(null)}
     onSave={grammar.savePoint}
     onDelete={grammar.deletePoint}
    />
   )}
   {grammar.importingLesson && (
    <ImportDrawer
     lesson={grammar.importingLesson}
     onClose={() => grammar.setImportingLesson(null)}
     onImport={(text) =>
      grammar.importingLesson && grammar.importPaste(grammar.importingLesson, text)
     }
    />
   )}
  </LearningShell>
 );
}
