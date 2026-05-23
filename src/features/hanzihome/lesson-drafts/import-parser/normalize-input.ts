import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";

import { normalizeNewlines } from "@/features/hanzihome/lesson-drafts/import-parser/clean-markdown";

type MdNode = {
  type?: string;
  children?: MdNode[];
};

function countNodes(node: MdNode): number {
  return (
    1 +
    (node.children ?? []).reduce(
      (sum, child) => sum + countNodes(child),
      0,
    )
  );
}

export function normalizeImportInput(rawText: string) {
  const text = normalizeNewlines(rawText).trim();
  const tree = unified().use(remarkParse).use(remarkGfm).parse(text) as MdNode;

  return {
    text,
    markdownAstNodeCount: countNodes(tree),
  };
}
