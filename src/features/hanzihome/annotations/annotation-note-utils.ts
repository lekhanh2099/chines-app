import type { DbNote } from "@/types/database";
import type { JsonFieldValue } from "@/types/json";

function nodeText(node: JsonFieldValue): string {
 if (node === null || typeof node !== "object") return "";
 if (Array.isArray(node)) return node.map(nodeText).join("");
 if (typeof node.text === "string") return node.text;
 if (node.type === "linebreak") return "\n";
 const children = Array.isArray(node.children)
  ? node.children
  : Array.isArray(node.content)
    ? node.content
    : [];
 const text = children.map(nodeText).join("");
 return node.type === "paragraph" || node.type === "heading" || node.type === "listitem"
  ? `${text}\n`
  : text;
}

// Display projection only. The full document remains the CAS/conflict snapshot.
export function extractAnnotationNoteText(content: DbNote["content"]): string {
 return nodeText(content.root ?? content).trim();
}
