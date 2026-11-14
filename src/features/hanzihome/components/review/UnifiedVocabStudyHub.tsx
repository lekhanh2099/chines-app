"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, PictureInPicture2 } from "lucide-react";

import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Card } from "@/components/ui/layout/card";
import { useDocumentPip } from "@/features/hanzihome/hooks/useDocumentPip";
import { CustomVocabVaultManager } from "./CustomVocabVaultManager";
import { UniversalAmbientPip, type UniversalPipMode } from "./UniversalAmbientPip";
import { UnifiedVocabStudyHubInlineFlow } from "./UnifiedVocabStudyHubInlineFlow";
import {
 BookmarkedLessonScopeSelect,
 ItVocabScopeSelect,
} from "./UnifiedVocabStudyHubScopeSelects";
import { useVocabStudyHubDeck } from "./useVocabStudyHubDeck";
import { parseSourceMode, type HubSourceMode } from "./vocab-hub-model";

export type { HubSourceMode } from "./vocab-hub-model";

type UnifiedVocabStudyHubProps = {
 readonly defaultSource?: HubSourceMode;
 readonly defaultOpenInline?: boolean;
};

export function UnifiedVocabStudyHub({
 defaultSource = "bookmarked-lessons",
 defaultOpenInline = false,
}: UnifiedVocabStudyHubProps) {
 const {
  learning,
  customVocabItems,
  bookmarkedGroups,
  totalBookmarkedLessons,
  allBookmarkedVocabCount,
  sourceMode,
  setUserSelectedSource,
  itCorpus,
  itSelection,
  setItSelection,
  bookmarkedSelection,
  setBookmarkedSelection,
  activeBundle,
 } = useVocabStudyHubDeck({ defaultSource });

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
       <BookmarkedLessonScopeSelect
        bookmarkedGroups={bookmarkedGroups}
        bookmarkedSelection={bookmarkedSelection}
        setBookmarkedSelection={setBookmarkedSelection}
        bookmarkedSelectionLabel={bookmarkedSelectionLabel}
        totalBookmarkedLessons={totalBookmarkedLessons}
        allBookmarkedVocabCount={allBookmarkedVocabCount}
       />
      ) : null}

      {sourceMode === "it-quick" ? (
       <ItVocabScopeSelect
        itCorpus={itCorpus}
        itSelection={itSelection}
        setItSelection={setItSelection}
       />
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
     <UnifiedVocabStudyHubInlineFlow
      isExternalOpen={isPipOpen || isInAppFloatingOpen}
      sourceMode={sourceMode}
      activeBundle={activeBundle}
      activeFlowMode={activeFlowMode}
      onCloseInline={() => setIsInlineOpen(false)}
      onReturnFromExternal={() => {
       if (isPipOpen) closePip();
       if (isInAppFloatingOpen) setIsInAppFloatingOpen(false);
      }}
     />
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
