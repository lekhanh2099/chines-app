import type { NoteSearchRow } from "@/services/notes/notes.service";
import type { JsonFieldValue } from "@/types/json";

import type { SearchDocument } from "./search-engine";

const MAX_LEXICAL_DEPTH = 64;
const MAX_DERIVED_TITLE_LENGTH = 80;

function collectLexicalText(value: JsonFieldValue, output: string[], depth: number) {
 if (depth > MAX_LEXICAL_DEPTH || value === null || typeof value !== "object") return;
 if (Array.isArray(value)) {
  for (const child of value) collectLexicalText(child, output, depth + 1);
  return;
 }
 const text = value.text;
 if (typeof text === "string") output.push(text);
 if (Array.isArray(value.children)) {
  collectLexicalText(value.children, output, depth + 1);
  output.push("\n");
 }
 if (value.root !== undefined) collectLexicalText(value.root, output, depth + 1);
}

/** Plain text of a Lexical editor document, one line per block node. */
export function lexicalPlainText(content: NoteSearchRow["content"]) {
 if (content === null) return "";
 const output: string[] = [];
 collectLexicalText(content, output, 0);
 return output
  .join("")
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean)
  .join("\n");
}

export function collectNoteDocuments(rows: readonly NoteSearchRow[]) {
 return rows.flatMap((row): SearchDocument[] => {
  const body = lexicalPlainText(row.content);
  const title = row.title.trim() || body.split("\n")[0]?.slice(0, MAX_DERIVED_TITLE_LENGTH) || "";
  if (!title) return [];
  const tags = row.tags.join(" · ");
  return [
   {
    item: {
     id: `note:${row.id}`,
     kind: "note",
     title,
     subtitle: tags || undefined,
     href: `/notes/${row.id}`,
     metadata: { source: "note", noteId: row.id },
    },
    title: row.title,
    pinyin: "",
    subtitle: tags,
    body,
   },
  ];
 });
}
