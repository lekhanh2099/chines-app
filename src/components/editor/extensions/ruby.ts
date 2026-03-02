import { Node, mergeAttributes } from "@tiptap/core";

export interface RubyOptions {
 HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
 interface Commands<ReturnType> {
  ruby: {
   /**
    * Insert a ruby node (Chinese character + Pinyin)
    */
   setRuby: (options: { pinyin: string; char: string }) => ReturnType;
  };
 }
}

export const Ruby = Node.create<RubyOptions>({
 name: "ruby",
 group: "inline",
 inline: true,
 atom: true, // Treat as a single indivisible character block

 addOptions() {
  return {
   HTMLAttributes: {},
  };
 },

 addAttributes() {
  return {
   pinyin: {
    default: "",
   },
   char: {
    default: "",
   },
  };
 },

 parseHTML() {
  return [
   {
    tag: "ruby",
    getAttrs: (node) => {
     const element = node as HTMLElement;
     // Extract text nodes directly under <ruby> (the characters)
     const char = Array.from(element.childNodes)
      .filter((n) => n.nodeType === 3) // 3 is Node.TEXT_NODE
      .map((n) => n.textContent)
      .join("");
     const rt = element.querySelector("rt");
     return {
      char: char?.trim() || "",
      pinyin: rt?.innerText || "",
     };
    },
   },
  ];
 },

 renderHTML({ HTMLAttributes }) {
  return [
   "ruby",
   mergeAttributes(this.options.HTMLAttributes, {
    class:
     "ruby-node mx-[2px] cursor-pointer hover:bg-accent/10 rounded px-1 transition-colors leading-loose",
    "data-char": HTMLAttributes.char,
    "data-pinyin": HTMLAttributes.pinyin,
   }),
   HTMLAttributes.char,
   [
    "rt",
    {
     class:
      "ruby-pinyin text-text-muted select-none font-sans text-[0.6em] tracking-widest",
    },
    HTMLAttributes.pinyin,
   ],
  ];
 },

 addCommands() {
  return {
   setRuby:
    ({ pinyin, char }) =>
    ({ commands }) => {
     return commands.insertContent({
      type: this.name,
      attrs: { pinyin, char },
     });
    },
  };
 },
});
