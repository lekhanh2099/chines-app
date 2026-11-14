"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/layout/card";
import type { HanziHomeVocabItem } from "@/features/hanzihome/types";
import { AmbientPipDictationPractice } from "./AmbientPipDictationPractice";
import { AmbientPipDictationSummary } from "./AmbientPipDictationSummary";
import {
 AmbientPipDictationFooter,
 AmbientPipDictationHeader,
} from "./AmbientPipDictationToolbars";
import type { DictationMode } from "./pip-dictation-utils";
import {
 useAmbientPipDictationKeyboard,
 useAmbientPipDictationSpeech,
} from "./useAmbientPipDictationEffects";
import { useAmbientPipDictationSession } from "./useAmbientPipDictationSession";

export type { DictationMode } from "./pip-dictation-utils";

export type AmbientPipDictationCardProps = {
 readonly items: readonly HanziHomeVocabItem[];
 readonly lessonTitle?: string;
 readonly initialMode?: DictationMode;
 readonly onClose?: () => void;
 readonly isFloatingInApp?: boolean;
 readonly isInline?: boolean;
 readonly extraHeaderActions?: ReactNode;
};

export function AmbientPipDictationCard({
 items,
 lessonTitle = "Nghe chép từ vựng",
 initialMode,
 onClose,
 isFloatingInApp = false,
 isInline = false,
 extraHeaderActions,
}: AmbientPipDictationCardProps) {
 const session = useAmbientPipDictationSession({ items, initialMode });
 const rootRef = useAmbientPipDictationKeyboard(session);
 useAmbientPipDictationSpeech(session);
 const { currentItem, isCompleted } = session;

 if (!currentItem && !isCompleted) {
  return null;
 }

 const content = (
  <>
   {/* Window Title & Progress Bar */}
   <AmbientPipDictationHeader
    session={session}
    lessonTitle={lessonTitle}
    onClose={onClose}
    extraHeaderActions={extraHeaderActions}
   />

   {/* Main Interactive Practice Surface */}
   <div className="relative flex flex-1 flex-col justify-center px-4 py-2">
    {isCompleted ? (
     <AmbientPipDictationSummary session={session} />
    ) : (
     <AmbientPipDictationPractice session={session} />
    )}
   </div>

   {/* Bottom Navigation Toolbar */}
   <AmbientPipDictationFooter session={session} />
  </>
 );

 if (isFloatingInApp) {
  return (
   <Card
    variant="elevated"
    padding="none"
    className="fixed bottom-5 right-5 z-50 flex h-72 w-92 max-w-[calc(100vw-2.5rem)] flex-col justify-between overflow-hidden select-none"
   >
    <div ref={rootRef} className="contents">
     {content}
    </div>
   </Card>
  );
 }

 if (isInline) {
  return (
   <div
    ref={rootRef}
    className="flex h-96 w-full flex-col justify-between overflow-hidden rounded-xl border border-border-default/60 bg-surface select-none"
   >
    {content}
   </div>
  );
 }

 return (
  <div
   ref={rootRef}
   className="flex h-screen w-screen flex-col justify-between overflow-hidden select-none bg-surface"
  >
   {content}
  </div>
 );
}
