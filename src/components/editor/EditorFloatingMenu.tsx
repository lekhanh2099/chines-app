"use client";

import { useEffect } from "react";
import { useSelector } from "@tanstack/react-store";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
 BasePopover as Popover,
 BasePopoverPositioner,
 BasePopoverPopup,
} from "@/components/ui/overlays/base-popover";
import { useDebounce } from "@/hooks/useDebounce";
import { DictionarySrsQueuedError } from "@/types/error";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { useTTS } from "@/hooks/useTTS";
import { extractChinese } from "@/lib/text/chinese-utils";
import { dictionaryLookupStore } from "@/stores/dictionary/dictionary-lookup-store";
import { vocabDetailDrawerStore } from "@/stores/dictionary/vocab-detail-drawer-store";
import { FloatingMenuFormatToolbar } from "./floating-menu/FloatingMenuFormatToolbar";
import { FloatingMenuLookupToolbar } from "./floating-menu/FloatingMenuLookupToolbar";
import {
 FloatingMenuInlineNotePanel,
 FloatingMenuLinkSearchPanel,
 FloatingMenuNotePanel,
} from "./floating-menu/FloatingMenuPanels";
import { SmartLookupSummary } from "./floating-menu/SmartLookupSummary";
import { preserveEditorSelection } from "./floating-menu/preserve-editor-selection";
import { useFloatingMenuEditorCommands } from "./floating-menu/useFloatingMenuEditorCommands";
import { useFloatingMenuFormatting } from "./floating-menu/useFloatingMenuFormatting";
import { useFloatingMenuPanels } from "./floating-menu/useFloatingMenuPanels";
import { useFloatingMenuSelection } from "./floating-menu/useFloatingMenuSelection";

const DEBOUNCE_DELAY = 500;

export default function EditorFloatingMenu() {
 const common = useTranslations("Common");
 const [editor] = useLexicalComposerContext();
 const { speak } = useTTS();
 const panels = useFloatingMenuPanels(editor);
 const { note, linkSearch, inlineNote, resetPanels, closePanels, openLinkSearch } = panels;
 const formatting = useFloatingMenuFormatting(editor);
 const { setIsPinyinActive, syncFormatsFromSelection } = formatting;
 const {
  draftSelection,
  hasAnchor,
  isViewportHidden,
  setIsViewportHidden,
  getAnchor,
  updateSelectionState,
 } = useFloatingMenuSelection({
  editor,
  showNote: note.isOpen,
  showLinkSearch: linkSearch.isOpen,
  showInlineNote: inlineNote.isOpen,
  resetPanels,
  setIsPinyinActive,
  syncFormatsFromSelection,
 });
 const pathname = usePathname();
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const lookupEnabled = dictionaryLookupStore.actions.isEnabled(pathname);
 const { hydrate: hydrateLookupSettings } = dictionaryLookupStore.actions;
 const { openDetailDrawer } = vocabDetailDrawerStore.actions;

 const debouncedSelection = useDebounce(draftSelection, DEBOUNCE_DELAY);
 const selectedText = debouncedSelection.text;
 const contextSentence = debouncedSelection.contextSentence;
 const selectionKey = `${selectedText}::${contextSentence}`;

 const {
  data: smartData,
  isLoading: smartLoading,
  isError: smartError,
  error,
  mode,
  isChineseSelection,
  saveSelection,
  isSaving,
 } = useSmartSelectionInsights(selectedText, contextSentence, {
  enabled: lookupEnabled,
 });

 const smartMode = smartData?.mode || mode;
 const detailTarget = smartData?.entry.hanzi || extractChinese(selectedText) || selectedText;

 useEffect(() => {
  hydrateLookupSettings();
 }, [hydrateLookupSettings]);

 useFloatingMenuEditorCommands(editor, updateSelectionState, openLinkSearch);

 const finalPopupOpen =
  hasAnchor &&
  !isViewportHidden &&
  Boolean(selectedText) &&
  draftSelection.text === selectedText &&
  draftSelection.contextSentence === contextSentence;
 const showChineseLookup = isChineseSelection && lookupEnabled;

 useEffect(() => {
  if (!finalPopupOpen) return;
  const hide = () => setIsViewportHidden(true);
  window.addEventListener("resize", hide);
  return () => window.removeEventListener("resize", hide);
 }, [finalPopupOpen, setIsViewportHidden]);

 const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  try {
   await saveSelection({
    personalNote: note.draft || smartData?.personal_note || "",
    personalNoteMode: "important",
   });
   toast.success(
    smartMode === "sentence"
     ? "Đã lưu câu mẫu vào kho ôn tập"
     : `Đã lưu "${smartData?.entry.hanzi || detailTarget}" vào kho ôn tập`,
   );
  } catch (saveError) {
   if (saveError instanceof DictionarySrsQueuedError)
    toast.warning(common("offlinePack.srsSaveQueued"));
   else toast.error(saveError instanceof Error ? saveError.message : "Không thể lưu selection");
  }
 };

 const handleSpeak = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  const speechText = smartMode === "sentence" ? selectedText : detailTarget;
  if (!speechText) return;
  void speak(speechText);
 };

 const handleOpenDetail = (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  if (!detailTarget) return;
  openDetailDrawer({
   text: detailTarget,
   contextSentence,
   mode: smartMode,
  });
  setIsViewportHidden(true);
 };

 const handleSaveNote = async (event: React.MouseEvent<HTMLButtonElement>) => {
  preserveEditorSelection(event);
  if (!smartData) return;

  try {
   await saveSelection({
    personalNote: note.draft,
    personalNoteMode: "important",
   });
   toast.success("Đã lưu ghi chú nhanh");
   note.setIsOpen(false);
  } catch (saveError) {
   if (saveError instanceof DictionarySrsQueuedError)
    toast.warning(common("offlinePack.srsSaveQueued"));
   else toast.error(saveError instanceof Error ? saveError.message : "Không thể lưu ghi chú");
  }
 };

 if (typeof window === "undefined" || !finalPopupOpen) return null;

 return (
  <Popover.Root
   open={finalPopupOpen}
   onOpenChange={(open) => {
    if (!open) {
     setIsViewportHidden(true);
     closePanels();
    }
   }}
   modal={false}
  >
   <Popover.Portal>
    <BasePopoverPositioner
     anchor={getAnchor}
     side="top"
     align="center"
     sideOffset={12}
     collisionPadding={12}
     positionMethod="fixed"
    >
     <BasePopoverPopup
      variant={showChineseLookup ? "lookupWide" : "default"}
      initialFocus={false}
      finalFocus={false}
      onMouseDown={preserveEditorSelection}
      data-no-inspector
     >
      <div className="grid gap-1.5 p-2">
       {showChineseLookup ? (
        <>
         <SmartLookupSummary
          smartLoading={smartLoading}
          smartError={smartError}
          error={error}
          smartData={smartData}
          smartMode={smartMode}
         />
         <FloatingMenuLookupToolbar
          smartData={smartData}
          isSaving={isSaving}
          hasLookupTarget={Boolean(detailTarget || selectedText)}
          isNoteOpen={note.isOpen}
          onSave={handleSave}
          onSpeak={handleSpeak}
          onToggleNote={(event) => note.toggle(event, selectionKey, smartData?.personal_note || "")}
          onOpenDetail={handleOpenDetail}
          linkSearch={linkSearch}
          inlineNote={inlineNote}
         />
        </>
       ) : null}

       <FloatingMenuFormatToolbar
        editor={editor}
        showPanelToggles={!showChineseLookup}
        pinyinSourceText={draftSelection.text || selectedText}
        formatting={formatting}
        linkSearch={linkSearch}
        inlineNote={inlineNote}
       />

       {note.isOpen ? (
        <FloatingMenuNotePanel
         note={note}
         isSaveDisabled={isSaving || !smartData}
         onSave={handleSaveNote}
        />
       ) : null}

       {linkSearch.isOpen ? <FloatingMenuLinkSearchPanel linkSearch={linkSearch} /> : null}

       {inlineNote.isOpen ? <FloatingMenuInlineNotePanel inlineNote={inlineNote} /> : null}
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
