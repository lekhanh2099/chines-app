"use client";

import { useMemo } from "react";
import { useLessonReader } from "@/features/hanzihome/reader-adapters/useLessonReader";
import { LessonReaderHeaderSettings } from "@/features/hanzihome/reader-adapters/LessonReaderTools";
import { Reader } from "@/features/reader/components/Reader";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { TextbookLesson } from "@/features/hanzihome/static-json/textbook-catalog";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";

export function BusinessChineseReader({
 document,
 lesson,
 bookKey,
 services,
}: {
 document: ReaderDocumentModel;
 lesson: TextbookLesson;
 bookKey: string;
 services?: ReaderServices;
}) {
 const integration = useLessonReader({
  document,
  bookKey,
 });

 const mergedServices = useMemo<ReaderServices>(
  () => ({
   ...integration.services,
   ...services,
   compactContent: true,
   toolbar: {
    stickyOffset: "page",
    hidePinyinToggle: true,
    hideTranslationToggle: true,
    hideAdvancedTools: true,
    ...integration.services.toolbar,
    ...services?.toolbar,
   },
   renderReader: ({ content, toolbar }) => {
    const workspace = services?.renderReader ? (
     <>
      <LessonReaderHeaderSettings
       lesson={lesson}
       displayMode={integration.displayMode}
       onDisplayModeChange={integration.updateDisplay}
      />
      {services.renderReader({ content, toolbar })}
     </>
    ) : (
     content
    );
    return integration.services.renderReader
     ? integration.services.renderReader({ content: workspace, toolbar: null })
     : workspace;
   },
  }),
  [integration.services, integration.displayMode, integration.updateDisplay, services, lesson],
 );

 return (
  <Reader
   data={integration.data}
   display={integration.display}
   services={mergedServices}
   className="[&_[data-reader-segment-playback]]:hidden xl:[&_[data-reader-segment-playback]]:inline-flex"
  />
 );
}
