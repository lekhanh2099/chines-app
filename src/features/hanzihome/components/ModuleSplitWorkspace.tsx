"use client";

import { ModuleSplitWorkspaceContent } from "@/features/hanzihome/components/layout/ModuleSplitWorkspaceContent";
import { HanziHomeFeatureProvider } from "@/features/hanzihome/context/HanziHomeFeatureProvider";
import type {
 LearningSyncUiState,
 ReviewItem,
 StudyModule,
} from "@/features/hanzihome/context/types";
import type {
 HanziHomeLesson,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

type ModuleSplitWorkspaceProps = {
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
};

export function ModuleSplitWorkspace(props: ModuleSplitWorkspaceProps) {
 return (
  <HanziHomeFeatureProvider {...props}>
   <div className="h-full min-h-0">
    <ModuleSplitWorkspaceContent />
   </div>
  </HanziHomeFeatureProvider>
 );
}
