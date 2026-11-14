"use client";

import { createPortal } from "react-dom";
import {
 UniversalAmbientPip,
 type UniversalAmbientPipProps,
} from "@/features/hanzihome/components/review/UniversalAmbientPip";
import type { BusinessChinesePipControls } from "./useBusinessChinesePip";

/** Renders the ambient review deck into the PiP window, or the in-app floating fallback. */
export function BusinessChinesePipWindows({
 pip,
 lessonTitle,
 vocabItems,
 grammarItems,
 practiceItems,
}: {
 pip: BusinessChinesePipControls;
 lessonTitle: string;
 vocabItems: UniversalAmbientPipProps["vocabItems"];
 grammarItems: UniversalAmbientPipProps["grammarItems"];
 practiceItems: UniversalAmbientPipProps["practiceItems"];
}) {
 const { isPipOpen, pipWindow, closePip, isInAppFloatingOpen, setIsInAppFloatingOpen, pipMode } =
  pip;
 return (
  <>
   {isPipOpen && pipWindow
    ? createPortal(
       <UniversalAmbientPip
        key={pipMode}
        initialMode={pipMode}
        lessonTitle={lessonTitle}
        vocabItems={vocabItems}
        grammarItems={grammarItems}
        practiceItems={practiceItems}
        onClose={closePip}
       />,
       pipWindow.document.body,
      )
    : null}
   {isInAppFloatingOpen ? (
    <UniversalAmbientPip
     key={pipMode}
     initialMode={pipMode}
     lessonTitle={lessonTitle}
     vocabItems={vocabItems}
     grammarItems={grammarItems}
     practiceItems={practiceItems}
     onClose={() => setIsInAppFloatingOpen(false)}
     isFloatingInApp
    />
   ) : null}
  </>
 );
}
