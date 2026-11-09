"use client";

import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, PictureInPicture2 } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectLabel,
 SelectSeparator,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Card } from "@/components/ui/layout/card";
import { useDocumentPip } from "@/features/hanzihome/hooks/useDocumentPip";
import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 getItWebVocabCorpus,
 getItWebVocabItemsByFilter,
 type ItWebQuickPreset,
} from "@/features/hanzihome/static-json/it-web-vocab-static-content";
import { CustomVocabVaultManager } from "./CustomVocabVaultManager";
import { UniversalAmbientPip, type UniversalPipMode } from "./UniversalAmbientPip";
import {
 buildExercisesFromVocabItems,
 buildStudyBundleFromBookmarkedLessons,
 customVocabListToHanziHomeVocabItems,
 getBookmarkedTextbookGroups,
 type StudyBundle,
} from "./vocab-hub-adapter";

export type HubSourceMode = "it-quick" | "bookmarked-lessons" | "custom-vault";

const IT_PRESET_ITEMS: readonly { key: ItWebQuickPreset; label: string }[] = [
 { key: "core20", label: "20 từ cốt lõi ngày đầu" },
 { key: "all", label: "Tất cả IT (~270 từ)" },
 { key: "band-1-3", label: "Nhóm 1–3 (Giao tiếp & Tiến độ)" },
 { key: "band-4-6", label: "Nhóm 4–6 (UI/FE/BE & Debug)" },
 { key: "band-7-9", label: "Nhóm 7–9 (Vận hành & Cụm câu)" },
];

function parseSourceMode(value: string): HubSourceMode {
 if (value === "bookmarked-lessons" || value === "it-quick" || value === "custom-vault") {
  return value;
 }
 return "bookmarked-lessons";
}

export type UnifiedVocabStudyHubProps = {
 readonly defaultSource?: HubSourceMode;
 readonly defaultOpenInline?: boolean;
};

export function UnifiedVocabStudyHub({
 defaultSource = "bookmarked-lessons",
 defaultOpenInline = false,
}: UnifiedVocabStudyHubProps) {
 const learning = useLearningState();
 const bookmarkedLessonIds = useMemo(
  () => learning.state.bookmarks.lessons ?? [],
  [learning.state.bookmarks.lessons],
 );
 const customVocabItems = useMemo(
  () => learning.state.settings.customVocab ?? [],
  [learning.state.settings.customVocab],
 );

 const bookmarkedGroups = useMemo(
  () => getBookmarkedTextbookGroups(bookmarkedLessonIds),
  [bookmarkedLessonIds],
 );
 const allBookmarkedLessons = useMemo(
  () => bookmarkedGroups.flatMap((g) => g.lessons),
  [bookmarkedGroups],
 );
 const totalBookmarkedLessons = allBookmarkedLessons.length;
 const allBookmarkedVocabCount = useMemo(
  () => allBookmarkedLessons.reduce((sum, l) => sum + l.vocabCount, 0),
  [allBookmarkedLessons],
 );

 // Derive active source mode dynamically when the user hasn't explicitly picked one yet,
 // so hydrated bookmarked lessons automatically activate "bookmarked-lessons".
 const [userSelectedSource, setUserSelectedSource] = useState<HubSourceMode | null>(null);
 const sourceMode: HubSourceMode = useMemo(() => {
  if (userSelectedSource) return userSelectedSource;
  if (defaultSource === "bookmarked-lessons") {
   return totalBookmarkedLessons > 0 ? "bookmarked-lessons" : "it-quick";
  }
  return defaultSource;
 }, [defaultSource, totalBookmarkedLessons, userSelectedSource]);

 // IT Quick State (single selector value: "preset:<key>" or "group:<id>")
 const itCorpus = useMemo(() => getItWebVocabCorpus(), []);
 const [itSelection, setItSelection] = useState<string>("preset:core20");

 // Bookmarked Textbook Scope State ("all" | "book:<bookKey>" | "lesson:<lessonId>")
 const [bookmarkedSelection, setBookmarkedSelection] = useState<string>("all");

 // Custom Vault Drawer State
 const [isVaultDrawerOpen, setIsVaultDrawerOpen] = useState<boolean>(false);

 // Inline & PiP Flow State
 const [activeFlowMode] = useState<UniversalPipMode>("dictation");
 const [isInlineOpen, setIsInlineOpen] = useState<boolean>(defaultOpenInline);
 const [isInAppFloatingOpen, setIsInAppFloatingOpen] = useState<boolean>(false);
 const {
  isSupported: isPipSupported,
  isOpen: isPipOpen,
  pipWindow,
  openPip,
  closePip,
 } = useDocumentPip();

 const selectedBookmarkedLessons = useMemo(() => {
  if (bookmarkedSelection === "all") return allBookmarkedLessons;
  if (bookmarkedSelection.startsWith("book:")) {
   const bookKey = bookmarkedSelection.slice("book:".length);
   const matchedGroup = bookmarkedGroups.find((g) => g.bookKey === bookKey);
   return matchedGroup ? matchedGroup.lessons : allBookmarkedLessons;
  }
  if (bookmarkedSelection.startsWith("lesson:")) {
   const lessonId = bookmarkedSelection.slice("lesson:".length);
   const matchedLesson = allBookmarkedLessons.find((l) => l.id === lessonId);
   return matchedLesson ? [matchedLesson] : allBookmarkedLessons;
  }
  return allBookmarkedLessons;
 }, [allBookmarkedLessons, bookmarkedGroups, bookmarkedSelection]);

 const activeBundle = useMemo<StudyBundle>(() => {
  if (sourceMode === "it-quick") {
   const isGroup = itSelection.startsWith("group:");
   const rawKey = itSelection.replace(/^(preset|group):/u, "");
   const presetKey: ItWebQuickPreset =
    !isGroup &&
    (rawKey === "core20" ||
     rawKey === "all" ||
     rawKey === "band-1-3" ||
     rawKey === "band-4-6" ||
     rawKey === "band-7-9")
     ? rawKey
     : "core20";

   const vocabItems = getItWebVocabItemsByFilter({
    preset: isGroup ? "all" : presetKey,
    groupIds: isGroup ? [rawKey] : undefined,
   });
   const practiceItems = buildExercisesFromVocabItems(vocabItems);
   const groupLabel = isGroup
    ? (itCorpus.groups.find((g) => g.id === rawKey)?.label ?? "Từ vựng IT")
    : (IT_PRESET_ITEMS.find((p) => p.key === presetKey)?.label ?? "Từ vựng IT");

   return {
    title: `IT / Làm Web · ${groupLabel}`,
    vocabItems,
    grammarItems: [],
    practiceItems,
   };
  }

  if (sourceMode === "bookmarked-lessons") {
   return buildStudyBundleFromBookmarkedLessons(selectedBookmarkedLessons);
  }

  const vocabItems = customVocabListToHanziHomeVocabItems(customVocabItems);
  const practiceItems = buildExercisesFromVocabItems(vocabItems);
  return {
   title: "Kho từ vựng riêng",
   vocabItems,
   grammarItems: [],
   practiceItems,
  };
 }, [customVocabItems, itCorpus.groups, itSelection, selectedBookmarkedLessons, sourceMode]);

 const handleLaunchPip = useCallback(async () => {
  if (isPipOpen) {
   return;
  }
  if (isPipSupported) {
   const win = await openPip({ width: 460, height: 420 });
   if (!win) {
    setIsInAppFloatingOpen(true);
   }
  } else {
   setIsInAppFloatingOpen(true);
  }
 }, [isPipOpen, isPipSupported, openPip]);

 const hasActiveVocab = activeBundle.vocabItems.length > 0;
 const hasActivePractice = activeBundle.practiceItems.length > 0;

 const sourceModeLabel =
  sourceMode === "bookmarked-lessons"
   ? `Bài đã mark (${totalBookmarkedLessons})`
   : sourceMode === "it-quick"
     ? `Học nhanh IT (${itCorpus.meta.vocabCount})`
     : `Kho riêng (${customVocabItems.length})`;

 const bookmarkedSelectionLabel =
  bookmarkedSelection === "all"
   ? `Ôn tất cả (${totalBookmarkedLessons} bài · ${allBookmarkedVocabCount} từ)`
   : activeBundle.title;

 return (
  <section aria-labelledby="unified-vocab-hub-heading" className="grid h-full w-full min-w-0 gap-3">
   <Card
    variant="section"
    padding="md"
    className="flex h-full min-w-0 flex-col justify-between gap-3"
   >
    {/* Top Block: Left Eyebrow + Right Source Selector + Middle Title */}
    <div className="grid min-w-0 gap-1.5">
     <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
       <PictureInPicture2 className="size-3.5 text-primary" />
       <span>Học từ vựng & Bài tập PiP</span>
      </span>

      <Select
       value={sourceMode}
       onValueChange={(value) => setUserSelectedSource(parseSourceMode(value))}
      >
       <SelectTrigger
        size="compact"
        aria-label="Chọn nguồn từ vựng"
        className="max-w-44 min-w-0 shrink-0"
       >
        <SelectValue placeholder={sourceModeLabel}>{sourceModeLabel}</SelectValue>
       </SelectTrigger>
       <SelectContent align="end">
        <SelectGroup>
         <SelectItem value="bookmarked-lessons">
          {`Bài đã mark (${totalBookmarkedLessons})`}
         </SelectItem>
         <SelectItem value="it-quick">{`Học nhanh IT (${itCorpus.meta.vocabCount})`}</SelectItem>
         <SelectItem value="custom-vault">{`Kho riêng (${customVocabItems.length})`}</SelectItem>
        </SelectGroup>
       </SelectContent>
      </Select>
     </div>

     <Typography id="unified-vocab-hub-heading" as="h3" variant="body" weight="black" clamp="one">
      {`${activeBundle.title} · ${activeBundle.vocabItems.length} từ, ${activeBundle.practiceItems.length} bài tập`}
     </Typography>
    </div>

    {/* Bottom Block: 1 Scope Select on Left + 1 Primary Button on Right */}
    <div className="flex items-center justify-between gap-2 border-t border-border-default/60 pt-2">
     <div className="min-w-0 flex-1">
      {sourceMode === "bookmarked-lessons" ? (
       bookmarkedGroups.length > 0 ? (
        <Select value={bookmarkedSelection} onValueChange={setBookmarkedSelection}>
         <SelectTrigger
          size="compact"
          aria-label="Chọn bài học đã đánh dấu"
          className="w-full max-w-72 min-w-0"
         >
          <SelectValue placeholder={bookmarkedSelectionLabel}>
           {bookmarkedSelectionLabel}
          </SelectValue>
         </SelectTrigger>
         <SelectContent align="start">
          <SelectGroup>
           <SelectItem value="all">
            {`Ôn tất cả (${totalBookmarkedLessons} bài · ${allBookmarkedVocabCount} từ)`}
           </SelectItem>
          </SelectGroup>

          {bookmarkedGroups.length > 1 ? (
           <>
            <SelectSeparator />
            <SelectGroup>
             <SelectLabel>Theo giáo trình đã đánh dấu</SelectLabel>
             {bookmarkedGroups.map((group) => (
              <SelectItem key={`book:${group.bookKey}`} value={`book:${group.bookKey}`}>
               {`Cả bộ: ${group.bookLabel} (${group.lessons.length} bài · ${group.totalVocabCount} từ)`}
              </SelectItem>
             ))}
            </SelectGroup>
           </>
          ) : null}

          {bookmarkedGroups.map((group) => (
           <div key={group.bookKey}>
            <SelectSeparator />
            <SelectGroup>
             <SelectLabel>{group.bookLabel}</SelectLabel>
             {group.lessons.map((lesson) => (
              <SelectItem key={lesson.id} value={`lesson:${lesson.id}`}>
               {`${lesson.title} (${lesson.vocabCount} từ)`}
              </SelectItem>
             ))}
            </SelectGroup>
           </div>
          ))}
         </SelectContent>
        </Select>
       ) : (
        <Typography variant="caption" tone="muted" clamp="one">
         Chưa có bài đã mark trong giáo trình
        </Typography>
       )
      ) : null}

      {sourceMode === "it-quick" ? (
       <Select value={itSelection} onValueChange={setItSelection}>
        <SelectTrigger
         size="compact"
         aria-label="Chọn nhóm từ vựng IT"
         className="w-full max-w-72 min-w-0"
        >
         <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
         <SelectGroup>
          <SelectLabel>Lộ trình học nhanh</SelectLabel>
          {IT_PRESET_ITEMS.map((preset) => (
           <SelectItem key={preset.key} value={`preset:${preset.key}`}>
            {preset.label}
           </SelectItem>
          ))}
         </SelectGroup>
         <SelectSeparator />
         <SelectGroup>
          <SelectLabel>Chọn riêng từng nhóm chuyên đề</SelectLabel>
          {itCorpus.groups.map((group) => (
           <SelectItem key={group.id} value={`group:${group.id}`}>
            {`${group.label} (${group.items.length} từ)`}
           </SelectItem>
          ))}
         </SelectGroup>
        </SelectContent>
       </Select>
      ) : null}

      {sourceMode === "custom-vault" ? (
       <Button
        type="button"
        size="compact"
        variant={isVaultDrawerOpen ? "active" : "outline"}
        onClick={() => setIsVaultDrawerOpen((prev) => !prev)}
       >
        <FolderPlus className="size-3.5" />
        <span>
         {isVaultDrawerOpen ? "Ẩn quản lý kho" : `Thêm / Sửa kho (${customVocabItems.length})`}
        </span>
       </Button>
      ) : null}
     </div>

     <Button
      type="button"
      size="compact"
      variant={isPipOpen || isInAppFloatingOpen ? "active" : "default"}
      disabled={!hasActiveVocab}
      onClick={handleLaunchPip}
     >
      <PictureInPicture2 className="size-3.5" />
      <span>Mở PiP học ngay</span>
     </Button>
    </div>

    {/* Collapsible Custom Vocab Manager */}
    {sourceMode === "custom-vault" && (isVaultDrawerOpen || customVocabItems.length === 0) ? (
     <div className="border-t border-border-default/60 pt-2.5">
      <CustomVocabVaultManager
       items={customVocabItems}
       onAddItems={learning.addCustomVocab}
       onUpdateItem={learning.updateCustomVocab}
       onRemoveItem={learning.removeCustomVocab}
      />
     </div>
    ) : null}

    {/* Inline Unified Study Flow (when defaultOpenInline is used on /vocab/review) */}
    {isInlineOpen && (hasActiveVocab || hasActivePractice) ? (
     <div className="mx-auto w-full max-w-3xl pt-1">
      <Card variant="default" padding="none" className="min-h-[380px] overflow-hidden">
       {isPipOpen || isInAppFloatingOpen ? (
        <div className="flex min-h-[380px] flex-col items-center justify-center gap-3 p-8 text-center">
         <IconTile size="lg" tone="accent" className="mx-auto">
          <PictureInPicture2 />
         </IconTile>
         <div className="grid gap-1">
          <Typography variant="sectionTitle" weight="black">
           Đang ôn tập trong cửa sổ nổi
          </Typography>
          <Typography variant="bodySmall" tone="muted" className="max-w-md">
           Thẻ ôn tập đang chạy trong cửa sổ Picture-in-Picture. Bạn có thể thu nhỏ hoặc chuyển sang
           ứng dụng khác trong khi học.
          </Typography>
         </div>
         <Button
          type="button"
          variant="outline"
          size="compact"
          onClick={() => {
           if (isPipOpen) closePip();
           if (isInAppFloatingOpen) setIsInAppFloatingOpen(false);
          }}
         >
          Đưa về trang này (Đóng cửa sổ nổi)
         </Button>
        </div>
       ) : (
        <UniversalAmbientPip
         key={`${sourceMode}-${activeBundle.title}-${activeFlowMode}`}
         initialMode={activeFlowMode}
         lessonTitle={activeBundle.title}
         vocabItems={activeBundle.vocabItems}
         grammarItems={activeBundle.grammarItems}
         practiceItems={activeBundle.practiceItems}
         onClose={() => setIsInlineOpen(false)}
         isInline
        />
       )}
      </Card>
     </div>
    ) : null}
   </Card>

   {/* Document PiP Portal */}
   {isPipOpen && pipWindow
    ? createPortal(
       <UniversalAmbientPip
        key={`pip-${sourceMode}-${activeBundle.title}-${activeFlowMode}`}
        initialMode={activeFlowMode}
        lessonTitle={activeBundle.title}
        vocabItems={activeBundle.vocabItems}
        grammarItems={activeBundle.grammarItems}
        practiceItems={activeBundle.practiceItems}
        onClose={closePip}
       />,
       pipWindow.document.body,
      )
    : null}

   {/* In-App Floating PiP Fallback */}
   {isInAppFloatingOpen ? (
    <UniversalAmbientPip
     key={`floating-${sourceMode}-${activeBundle.title}-${activeFlowMode}`}
     initialMode={activeFlowMode}
     lessonTitle={activeBundle.title}
     vocabItems={activeBundle.vocabItems}
     grammarItems={activeBundle.grammarItems}
     practiceItems={activeBundle.practiceItems}
     onClose={() => setIsInAppFloatingOpen(false)}
     isFloatingInApp
    />
   ) : null}
  </section>
 );
}
