"use client";

import { useEffect } from "react";
import { useSelector } from "@tanstack/react-store";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { usePathname } from "next/navigation";

import {
 BasePopover as Popover,
 BasePopoverPositioner,
 BasePopoverPopup,
} from "@/components/ui/overlays/base-popover";
import { useDebounce } from "@/hooks/useDebounce";
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
} from "./floating-menu/FloatingMenuPanels";
import { SmartLookupSummary } from "./floating-menu/SmartLookupSummary";
import { preserveEditorSelection } from "./floating-menu/preserve-editor-selection";
import { useFloatingMenuEditorCommands } from "./floating-menu/useFloatingMenuEditorCommands";
import { useFloatingMenuFormatting } from "./floating-menu/useFloatingMenuFormatting";
import { useFloatingMenuPanels } from "./floating-menu/useFloatingMenuPanels";
import { useFloatingMenuSelection } from "./floating-menu/useFloatingMenuSelection";

const DEBOUNCE_DELAY = 500;

export default function EditorFloatingMenu() {
 const [editor] = useLexicalComposerContext();
 const { speak } = useTTS();
 const panels = useFloatingMenuPanels(editor);
 const { linkSearch, inlineNote, resetPanels, closePanels, openLinkSearch } = panels;
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

 const {
  data: smartData,
  isLoading: smartLoading,
  isError: smartError,
  error,
  mode,
  isChineseSelection,
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
          hasLookupTarget={Boolean(detailTarget || selectedText)}
          onSpeak={handleSpeak}
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

       {linkSearch.isOpen ? <FloatingMenuLinkSearchPanel linkSearch={linkSearch} /> : null}

       {inlineNote.isOpen ? <FloatingMenuInlineNotePanel inlineNote={inlineNote} /> : null}
      </div>
     </BasePopoverPopup>
    </BasePopoverPositioner>
   </Popover.Portal>
  </Popover.Root>
 );
}
