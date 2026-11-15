"use client";

import { useEffect, type ComponentProps } from "react";

import { businessChineseReaderAnnotations } from "@/features/hanzihome/components/business-chinese/business-chinese-study-utils";
import { formatContextualReadingPinyin } from "@/features/hanzihome/pronunciation/contextual-pronunciation";
import type { useVocabInspector } from "@/features/dictionary/hooks/useVocabInspector";
import { Reader } from "@/features/reader/components/Reader";
import type { ReaderDocumentModel } from "@/features/reader/model/reader-document.types";
import { useReaderCommands } from "@/features/reader/runtime/reader-context";
import type { ReaderServices } from "@/features/reader/runtime/reader-services";
import type { useReaderSessionPronunciation } from "@/features/reading/hooks/useReaderSessionPronunciation";
import type { useMandarinReaderSpeechService } from "@/features/speech/MandarinTtsProvider";
import type { analyzeDailyReadingText } from "@/features/daily-reading/components/daily-reading-library-utils";
import type { useDailyReadingAnnotations } from "@/features/daily-reading/hooks/useDailyReadingAnnotations";

type DailyReadingAnnotations = ReturnType<typeof useDailyReadingAnnotations>;

type DailyReadingReaderTabProps = {
 readerDocument: ReaderDocumentModel;
 pronunciation: ReturnType<typeof useReaderSessionPronunciation>;
 titlePronunciation: ReturnType<typeof analyzeDailyReadingText>;
 display: NonNullable<ComponentProps<typeof Reader>["display"]>;
 speech: ReturnType<typeof useMandarinReaderSpeechService>;
 annotations: DailyReadingAnnotations["annotationsQuery"]["data"];
 selection: DailyReadingAnnotations["selection"];
 openInspector: ReturnType<typeof useVocabInspector>["openInspector"];
 /** The reader tab is showing: its toolbar sits in the tab row; otherwise playback stops. */
 readerTabActive: boolean;
 /** Lays out the article tabs around the Reader content and its inline toolbar. */
 renderLayout: NonNullable<ReaderServices["renderReader"]>;
};

export function DailyReadingReaderTab({
 readerDocument,
 pronunciation,
 titlePronunciation,
 display,
 speech,
 annotations,
 selection,
 openInspector,
 readerTabActive,
 renderLayout,
}: DailyReadingReaderTabProps) {
 return (
  <>
   <Reader
    data={{
     ...readerDocument,
     segments: pronunciation.segments,
     ...(titlePronunciation
      ? { titlePinyin: formatContextualReadingPinyin(titlePronunciation) }
      : {}),
    }}
    display={display}
    services={{
     speech,
     placeToolbarInLayout: readerTabActive,
     renderReader: (layout) => (
      <>
       <StopPlaybackWhenHidden hidden={!readerTabActive} />
       {renderLayout(layout)}
      </>
     ),
     toolbar: {
      hidePinyinToggle: true,
      hideTranslationToggle: true,
     },
     annotations: {
      items: businessChineseReaderAnnotations(annotations ?? []),
      onOpen: (annotation, rect) => {
       const source = annotations?.find((item) => item.id === annotation.id);
       if (source) selection.handleOpenAnnotation(source, rect);
      },
      onSelection: (target) => {
       if (!readerDocument) return;
       const index = readerDocument.segments.findIndex((s) => s.id === target.segmentId);
       const segment = readerDocument.segments[index];
       if (segment) selection.handleSelection({ ...target, segment, index });
      },
     },
     lookup: (selection) => {
      void openInspector(selection.text, { anchorRect: selection.rect });
     },
     pronunciationReview: pronunciation.service,
    }}
   />
   {pronunciation.popover}
   {selection.popover}
  </>
 );
}

/** The Reader stays mounted under every article tab; leaving the reader tab must not keep audio playing without controls. */
function StopPlaybackWhenHidden({ hidden }: { hidden: boolean }) {
 const commands = useReaderCommands();
 useEffect(() => {
  if (hidden) commands.stop();
 }, [commands, hidden]);
 return null;
}
