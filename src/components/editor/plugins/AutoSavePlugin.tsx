/**
 * AutoSavePlugin — Fires `onChange` callback when editor content changes.
 *
 * Serialises the editor state to JSON and passes it upstream so the
 * consumer (note editor page) can debounce-save to Supabase.
 */
"use client";

import { JsonObjectSchema, type JsonObject } from "@/types/json";
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { EditorState } from "lexical";

interface AutoSavePluginProps {
 onChange?: (json: JsonObject) => void;
}

export function serializeEditorState(editorState: EditorState): JsonObject {
 return JsonObjectSchema.parse(editorState.toJSON());
}

export default function AutoSavePlugin({ onChange }: AutoSavePluginProps) {
 const [editor] = useLexicalComposerContext();

 useEffect(() => {
  if (!onChange) return;

  return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
   // Only fire when there are actual changes
   if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;

   const json = serializeEditorState(editorState);
   onChange(json);
  });
 }, [editor, onChange]);

 return null;
}
