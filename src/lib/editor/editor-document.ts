import { logger } from "@/lib/logger";
import type { JsonObject } from "@/types/json";

/**
 * Standard empty Lexical document tree.
 * Matches Lexical's root node structure with a single empty paragraph.
 */
export const EMPTY_LEXICAL_DOCUMENT: JsonObject = {
 root: {
  children: [
   {
    children: [],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
    textFormat: 0,
    textStyle: "",
   },
  ],
  direction: "ltr",
  format: "",
  indent: 0,
  type: "root",
  version: 1,
 },
};

function isObject(value: unknown): value is Record<string, unknown> {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Checks if the given JSON object has a valid Lexical root node shape.
 */
export function isLexicalDocument(value: unknown): value is JsonObject & { root: JsonObject } {
 if (!isObject(value)) {
  return false;
 }

 if (!("root" in value) || !isObject(value.root)) {
  return false;
 }

 return value.root.type === "root" && Array.isArray(value.root.children);
}

/**
 * Checks if the value is a legacy ProseMirror document ({ type: "doc", content: [...] }).
 */
export function isProseMirrorDocument(
 value: unknown,
): value is JsonObject & { type: "doc"; content?: unknown[] } {
 if (!isObject(value)) {
  return false;
 }

 return value.type === "doc" && (!("content" in value) || Array.isArray(value.content));
}

/**
 * Converts a legacy ProseMirror / TipTap document into a Lexical document state.
 * Preserves text nodes and basic headings/paragraphs so existing user notes don't lose data.
 */
export function convertProseMirrorToLexical(doc: JsonObject): JsonObject {
 const rawContent = "content" in doc && Array.isArray(doc.content) ? doc.content : [];

 const children: JsonObject[] = rawContent.map((rawNode) => {
  if (!isObject(rawNode)) {
   return {
    children: [],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
    textFormat: 0,
    textStyle: "",
   };
  }

  const inlineList = "content" in rawNode && Array.isArray(rawNode.content) ? rawNode.content : [];
  const textNodes: JsonObject[] = [];

  for (const inlineItem of inlineList) {
   if (isObject(inlineItem) && inlineItem.type === "text" && typeof inlineItem.text === "string") {
    textNodes.push({
     detail: 0,
     format: 0,
     mode: "normal",
     style: "",
     text: inlineItem.text,
     type: "text",
     version: 1,
    });
   }
  }

  if (rawNode.type === "heading") {
   let tag = "h2";
   if ("attrs" in rawNode && isObject(rawNode.attrs) && typeof rawNode.attrs.level === "number") {
    tag = `h${rawNode.attrs.level}`;
   }

   return {
    children: textNodes,
    direction: "ltr",
    format: "",
    indent: 0,
    type: "heading",
    tag,
    version: 1,
   };
  }

  return {
   children: textNodes,
   direction: "ltr",
   format: "",
   indent: 0,
   type: "paragraph",
   version: 1,
   textFormat: 0,
   textStyle: "",
  };
 });

 return {
  root: {
   children:
    children.length > 0
     ? children
     : [
        {
         children: [],
         direction: "ltr",
         format: "",
         indent: 0,
         type: "paragraph",
         version: 1,
         textFormat: 0,
         textStyle: "",
        },
       ],
   direction: "ltr",
   format: "",
   indent: 0,
   type: "root",
   version: 1,
  },
 };
}

/**
 * Safely parses any initial content into a serialized string for LexicalComposer,
 * or returns `undefined` so Lexical initializes an empty paragraph automatically.
 */
export function toLexicalEditorState(content?: JsonObject | null): string | undefined {
 if (!content) {
  return undefined;
 }

 if (isLexicalDocument(content)) {
  return JSON.stringify(content);
 }

 if (isProseMirrorDocument(content)) {
  const converted = convertProseMirrorToLexical(content);
  return JSON.stringify(converted);
 }

 logger.warn(
  "[LexicalEditor] Unrecognized content format, defaulting to empty editor state:",
  content,
 );
 return undefined;
}
