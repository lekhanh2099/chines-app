"use client";

import { useEffect } from "react";
import { mergeRegister } from "@lexical/utils";
import type { LexicalEditor } from "lexical";
import {
 $getSelection,
 $isRangeSelection,
 COMMAND_PRIORITY_CRITICAL,
 COMMAND_PRIORITY_LOW,
 KEY_DOWN_COMMAND,
 SELECTION_CHANGE_COMMAND,
} from "lexical";

/** Keeps selection state in sync with the editor and binds Ctrl/Cmd+K to the note-link search. */
export function useFloatingMenuEditorCommands(
 editor: LexicalEditor,
 updateSelectionState: () => void,
 openLinkSearch: () => void,
) {
 useEffect(() => {
  return mergeRegister(
   editor.registerCommand(
    SELECTION_CHANGE_COMMAND,
    () => {
     updateSelectionState();
     return false;
    },
    COMMAND_PRIORITY_LOW,
   ),
   editor.registerUpdateListener(({ editorState }) => {
    editorState.read(() => updateSelectionState());
   }),
   editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event: KeyboardEvent) => {
     if ((event.metaKey || event.ctrlKey) && event.key === "k") {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && !selection.isCollapsed()) {
       event.preventDefault();
       openLinkSearch();
       return true;
      }
     }
     return false;
    },
    COMMAND_PRIORITY_CRITICAL,
   ),
  );
 }, [editor, openLinkSearch, updateSelectionState]);
}
