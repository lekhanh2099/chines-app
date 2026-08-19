"use client";

import { useMemo, type ReactNode } from "react";

import { useHanziHomeSearchNavigationIntent } from "@/features/hanzihome/search/searchNavigationStore";
import type {
 HanziHomeLesson,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

import { createHanziHomeFeatureStore } from "./hanzihomeFeatureStore";
import { HanziHomeFeatureStoreProvider } from "./hanzihomeFeatureContext";
import { createHanziHomeFeatureActions } from "./actions";
import { createHanziHomeFeatureServices } from "./services";
import type { LearningSyncUiState, ReviewItem, StudyModule } from "./types";

export function HanziHomeFeatureProvider({
 lesson,
 learningState,
 learningSync,
 activeModule,
 onSelectModule,
 onUpdateLearningSettings,
 onBookmarkVocab,
 onMarkVocab,
 onBookmarkGrammar,
 onMarkGrammar,
 onAnswerReview,
 children,
}: {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 learningSync?: LearningSyncUiState;
 activeModule: StudyModule;
 onSelectModule: (module: StudyModule) => void;
 onUpdateLearningSettings: (settings: Partial<UserLearningState["settings"]>) => void;
 onBookmarkVocab: (id: string) => void;
 onMarkVocab: (id: string, status: LearningStatus) => void;
 onBookmarkGrammar: (id: string) => void;
 onMarkGrammar: (id: string, status: LearningStatus) => void;
 onAnswerReview: (item: ReviewItem, result: ReviewResult) => void;
 children: ReactNode;
}) {
 const searchIntent = useHanziHomeSearchNavigationIntent();
 const matchingIntent = searchIntent?.lessonId === lesson.id ? searchIntent : null;
 const store = useMemo(
  () =>
   createHanziHomeFeatureStore({
    vocabSelectedWordId:
     matchingIntent?.module === "vocab" ? (matchingIntent.targetId ?? null) : null,
    grammarSelectedPointId:
     matchingIntent?.module === "grammar" ? (matchingIntent.targetId ?? null) : null,
    lessonTextSelectedSectionId:
     matchingIntent?.module === "lessonText"
      ? (matchingIntent.targetId ?? "__all_lesson_sections__")
      : "__all_lesson_sections__",
   }),
  [matchingIntent?.module, matchingIntent?.targetId],
 );
 const actions = useMemo(() => createHanziHomeFeatureActions(store), [store]);
 const services = useMemo(() => createHanziHomeFeatureServices(lesson), [lesson]);
 const runtime = useMemo(
  () => ({
   originalLesson: lesson,
   lesson,
   learningState,
   learningSync,
   activeModule,
   selectModule: onSelectModule,
   updateLearningSettings: onUpdateLearningSettings,
   bookmarkVocab: onBookmarkVocab,
   markVocab: onMarkVocab,
   bookmarkGrammar: onBookmarkGrammar,
   markGrammar: onMarkGrammar,
   answerReview: onAnswerReview,
  }),
  [
   activeModule,
   learningSync,
   learningState,
   lesson,
   onAnswerReview,
   onBookmarkGrammar,
   onBookmarkVocab,
   onMarkGrammar,
   onMarkVocab,
   onSelectModule,
   onUpdateLearningSettings,
  ],
 );
 const value = useMemo(
  () => ({ store, actions, services, runtime }),
  [actions, runtime, services, store],
 );

 return <HanziHomeFeatureStoreProvider value={value}>{children}</HanziHomeFeatureStoreProvider>;
}
