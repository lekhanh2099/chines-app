import { Extension } from "@tiptap/core";
import Suggestion from "@tiptap/suggestion";

export interface SlashCommandOptions {
 suggestion: Omit<Parameters<typeof Suggestion>[0], "editor">;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
 name: "slashCommand",

 addOptions() {
  return {
   suggestion: {
    char: "/",
    command: ({ editor, range, props }: any) => {
     props.command({ editor, range });
    },
   },
  };
 },

 addProseMirrorPlugins() {
  return [
   Suggestion({
    editor: this.editor,
    ...this.options.suggestion,
   }),
  ];
 },
});
