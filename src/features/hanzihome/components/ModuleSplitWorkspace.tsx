"use client";

import { ModuleSplitWorkspaceContent } from "@/features/hanzihome/components/layout/ModuleSplitWorkspaceContent";
import { HanziHomeFeatureProvider } from "@/features/hanzihome/context/HanziHomeFeatureProvider";
import type { StudyModule } from "@/features/hanzihome/context/types";
import type {
 HanziHomeLesson,
 LearningStatus,
 ReviewResult,
 UserLearningState,
} from "@/features/hanzihome/types";

type ModuleSplitWorkspaceProps = {
 lesson: HanziHomeLesson;
 learningState: UserLearningState;
 activeModule: StudyModule;
 onSelectModule: (module: StudyModule) => void;
 onBookmarkVocab: (id: string) => void;
 onMarkVocab: (id: string, status: LearningStatus) => void;
 onBookmarkGrammar: (id: string) => void;
 onMarkGrammar: (id: string, status: LearningStatus) => void;
 onAnswerReview: (
  item: { type: "vocab" | "grammar" | "radical"; id: string },
  result: ReviewResult,
 ) => void;
};

export function ModuleSplitWorkspace(props: ModuleSplitWorkspaceProps) {
 return (
  <HanziHomeFeatureProvider {...props}>
   <ModuleSplitWorkspaceContent />
  </HanziHomeFeatureProvider>
 );
}
