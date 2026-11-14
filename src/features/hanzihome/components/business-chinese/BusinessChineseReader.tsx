"use client";

import { useMemo } from "react";
import { useLessonReader } from "@/features/hanzihome/reader-adapters/useLessonReader";
import { Reader } from "@/features/reader/components/Reader";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";

export function BusinessChineseReader({
 document,
 bookKey,
 services,
}: {
 document: ReaderDocumentModel;
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
   toolbar: {
    stickyOffset: "page",
    hidePinyinToggle: true,
    hideTranslationToggle: true,
    ...integration.services.toolbar,
    ...services?.toolbar,
   },
   renderReader: ({ content, toolbar }) => {
    const workspace = services?.renderReader
     ? services.renderReader({ content, toolbar })
     : content;
    return integration.services.renderReader
     ? integration.services.renderReader({ content: workspace, toolbar: null })
     : workspace;
   },
  }),
  [integration.services, services],
 );

 return <Reader data={integration.data} display={integration.display} services={mergedServices} />;
}
