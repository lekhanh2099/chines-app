"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Typography } from "@/components/ui/display/typography";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import { dictationLessonLabel, READER_DICTATION_BOOK_ID } from "./dictation-workspace-utils";
import type { StudioDictationSourceState } from "./useStudioDictationSource";

/** Book, volume and lesson (or Reader course lesson) selection for the lesson source. */
export function StudioDictationLessonPicker({
 source,
 initialReaderDocuments,
 onReaderDocumentChange,
 onReset,
}: {
 source: StudioDictationSourceState;
 initialReaderDocuments: ReadonlyArray<ReaderDocumentRow>;
 onReaderDocumentChange: (documentId: string) => void;
 onReset: () => void;
}) {
 const t = useTranslations("Dictation");
 const {
  bookOptions,
  selectedBookId,
  selectedBook,
  selectedVolumeId,
  isReaderCoursePack,
  selectedReaderDocumentId,
  visibleLessons,
  selectedLessonId,
  setSelectedBookId,
  setSelectedVolumeId,
  setSelectedLessonId,
  setSelectedReaderDocumentId,
  setSelectedSectionId,
 } = source;
 return (
  <>
   <div className="grid gap-2" aria-label={t("bookAria")}>
    <Typography variant="caption" tone="muted" weight="black">
     {t("books")}
    </Typography>
    <div className="flex flex-wrap gap-2">
     {bookOptions.map((book) => (
      <Button
       key={book.id}
       type="button"
       size="sm"
       variant={selectedBookId === book.id ? "active" : "outline"}
       onClick={() => {
        setSelectedBookId(book.id);
        setSelectedVolumeId(book.volumes[0]?.id ?? "");
        setSelectedLessonId("");
        setSelectedReaderDocumentId("");
        setSelectedSectionId("");
        onReset();
       }}
      >
       {book.id === READER_DICTATION_BOOK_ID ? t("readerBook") : book.title}
      </Button>
     ))}
    </div>
   </div>
   {selectedBook && selectedBook.volumes.length > 1 ? (
    <div className="flex flex-wrap gap-2" aria-label={t("volumeAria")}>
     {selectedBook.volumes.map((volume) => (
      <Button
       key={volume.id}
       type="button"
       size="sm"
       variant={selectedVolumeId === volume.id ? "active" : "outline"}
       onClick={() => {
        setSelectedVolumeId(volume.id);
        setSelectedLessonId("");
        setSelectedSectionId("");
        onReset();
       }}
      >
       {volume.title}
      </Button>
     ))}
    </div>
   ) : null}
   {isReaderCoursePack && initialReaderDocuments.length > 0 ? (
    <div className="grid gap-2">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="caption" tone="muted" weight="black">
       {t("chooseLesson")}
      </Typography>
      <Typography variant="caption" tone="muted">
       {t("lessons", { count: initialReaderDocuments.length })}
      </Typography>
     </div>
     <Select value={selectedReaderDocumentId} onValueChange={onReaderDocumentChange}>
      <SelectTrigger aria-label={t("readerLessonAria")}>
       <SelectValue placeholder={t("chooseLesson")} />
      </SelectTrigger>
      <SelectContent>
       <SelectGroup>
        {initialReaderDocuments.map((document) => (
         <SelectItem key={document.id} value={document.id}>
          {t("lessonNumber", { number: document.reading_number ?? "" })} · {document.title_zh} ·{" "}
          {document.title_vi}
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>
    </div>
   ) : null}
   {!isReaderCoursePack && visibleLessons.length > 0 ? (
    <div className="grid gap-2">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="caption" tone="muted" weight="black">
       {t("chooseLesson")}
      </Typography>
      <Typography variant="caption" tone="muted">
       {t("lessons", { count: visibleLessons.length })}
      </Typography>
     </div>
     <Select
      value={selectedLessonId || visibleLessons[0]?.id}
      onValueChange={(lessonId) => {
       setSelectedLessonId(lessonId);
       setSelectedSectionId("");
       onReset();
      }}
     >
      <SelectTrigger aria-label={t("lessonAria")}>
       <SelectValue placeholder={t("chooseLesson")} />
      </SelectTrigger>
      <SelectContent>
       <SelectGroup>
        {visibleLessons.map((lesson) => (
         <SelectItem key={lesson.id} value={lesson.id}>
          {dictationLessonLabel(lesson)}
         </SelectItem>
        ))}
       </SelectGroup>
      </SelectContent>
     </Select>
    </div>
   ) : null}
  </>
 );
}
