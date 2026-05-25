import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import type {
 Blockquote,
 Code,
 Content,
 Heading,
 Html,
 List,
 ListItem,
 Paragraph,
 Root,
 Table,
 ThematicBreak,
} from "mdast";

import type {
 LearningBlock,
 LearningDirective,
 LearningDoc,
 LearningListItem,
 LearningSection,
 LearningTable,
} from "@/features/hanzihome/importer/importer.types";

const parseVersion = "hanzihome-md-import-v1" as const;

type SectionStackItem = {
 section: LearningSection;
};

type BlockContext = {
 nextBlockId: () => string;
};

function isHeading(node: Content): node is Heading {
 return node.type === "heading";
}

function isBlockNode(node: Content): node is Content {
 return (
  node.type === "paragraph" ||
  node.type === "list" ||
  node.type === "code" ||
  node.type === "blockquote" ||
  node.type === "table" ||
  node.type === "thematicBreak"
 );
}

function normalizeDirectiveValue(value: string) {
 return value.trim().replace(/\s+/g, "");
}

function getHeadingDirectives(heading: Heading): LearningDirective[] {
 return heading.children.flatMap((child) => {
  if (child.type !== "html") return [];

  return parseDirectiveHtml(child);
 });
}

function parseDirectiveHtml(node: Html): LearningDirective[] {
 const value = node.value.trim();
 const directives: LearningDirective[] = [];
 const fieldMatch = value.match(/^<!--\s*@field:([a-zA-Z0-9_.-]+)\s*-->$/);
 const itemMatch = value.match(/^<!--\s*@item:([a-zA-Z0-9_.-]+)\s*-->$/);

 if (fieldMatch?.[1]) {
  directives.push({ type: "field", value: normalizeDirectiveValue(fieldMatch[1]) });
 }

 if (itemMatch?.[1]) {
  directives.push({ type: "item", value: normalizeDirectiveValue(itemMatch[1]) });
 }

 return directives;
}

function headingTitle(heading: Heading) {
 return heading.children
  .filter((child) => child.type !== "html")
  .map((child) => toString(child))
  .join(" ")
  .replace(/\s+/g, " ")
  .trim();
}

function createSection(
 heading: Heading,
 slugger: GithubSlugger,
 fallbackIndex: number,
): LearningSection {
 const title = headingTitle(heading) || `Untitled section ${fallbackIndex}`;
 const stableInput = `${heading.depth}-${title}`;

 return {
  id: slugger.slug(stableInput),
  level: heading.depth,
  title,
  directives: getHeadingDirectives(heading),
  blocks: [],
  children: [],
 };
}

function blockId(context: BlockContext, type: string) {
 return `${type}-${context.nextBlockId()}`;
}

function paragraphToBlock(node: Paragraph, context: BlockContext): LearningBlock {
 return {
  id: blockId(context, "paragraph"),
  type: "paragraph",
  text: toString(node).trim(),
 };
}

function codeToBlock(node: Code, context: BlockContext): LearningBlock {
 return {
  id: blockId(context, "code"),
  type: "code",
  lang: node.lang ?? undefined,
  value: node.value,
 };
}

function quoteToBlock(node: Blockquote, context: BlockContext): LearningBlock {
 return {
  id: blockId(context, "quote"),
  type: "quote",
  blocks: node.children.flatMap((child) => mdastBlockToLearningBlock(child, context)),
 };
}

function listItemToLearningItem(
 node: ListItem,
 context: BlockContext,
 index: number,
): LearningListItem {
 const blocks: LearningBlock[] = [];
 const children: LearningListItem[] = [];

 node.children.forEach((child) => {
  if (child.type === "list") {
   child.children.forEach((item, childIndex) => {
    children.push(listItemToLearningItem(item, context, childIndex));
   });
   return;
  }

  blocks.push(...mdastBlockToLearningBlock(child, context));
 });

 return {
  id: `${blockId(context, "list-item")}-${index + 1}`,
  blocks,
  children,
 };
}

function listToBlock(node: List, context: BlockContext): LearningBlock {
 return {
  id: blockId(context, "list"),
  type: "list",
  ordered: Boolean(node.ordered),
  items: node.children.map((item, index) =>
   listItemToLearningItem(item, context, index),
  ),
 };
}

function tableToBlock(node: Table, context: BlockContext): LearningBlock {
 const rows = node.children.map((row) =>
  row.children.map((cell) => toString(cell).trim()),
 );
 const [headers = [], ...bodyRows] = rows;
 const table: LearningTable = {
  headers,
  rows: bodyRows,
 };

 return {
  id: blockId(context, "table"),
  type: "table",
  table,
 };
}

function thematicBreakToBlock(
 _node: ThematicBreak,
 context: BlockContext,
): LearningBlock {
 return {
  id: blockId(context, "thematic-break"),
  type: "thematicBreak",
 };
}

function mdastBlockToLearningBlock(
 node: Content,
 context: BlockContext,
): LearningBlock[] {
 if (node.type === "paragraph") return [paragraphToBlock(node, context)];
 if (node.type === "list") return [listToBlock(node, context)];
 if (node.type === "code") return [codeToBlock(node, context)];
 if (node.type === "blockquote") return [quoteToBlock(node, context)];
 if (node.type === "table") return [tableToBlock(node, context)];
 if (node.type === "thematicBreak") return [thematicBreakToBlock(node, context)];

 return [];
}

function attachSection(
 roots: LearningSection[],
 stack: SectionStackItem[],
 section: LearningSection,
) {
 while (stack.length > 0) {
  const parent = stack[stack.length - 1]?.section;

  if (parent && parent.level < section.level) break;
  stack.pop();
 }

 const parent = stack[stack.length - 1]?.section;

 if (parent) {
  parent.children.push(section);
 } else {
  roots.push(section);
 }

 stack.push({ section });
}

function createLooseSection(
 slugger: GithubSlugger,
 context: BlockContext,
 title: string,
 blocks: LearningBlock[],
): LearningSection {
 return {
  id: slugger.slug(`0-${title}`),
  level: 1,
  title,
  directives: [],
  blocks,
  children: [],
 };
}

export function markdownToLearningDoc(markdown: string): LearningDoc {
 const tree = unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
 const slugger = new GithubSlugger();
 let blockIndex = 0;
 let sectionIndex = 0;
 const context: BlockContext = {
  nextBlockId: () => {
   blockIndex += 1;
   return String(blockIndex);
  },
 };
 const roots: LearningSection[] = [];
 const stack: SectionStackItem[] = [];
 const looseBlocks: LearningBlock[] = [];

 tree.children.forEach((node) => {
  if (isHeading(node)) {
   sectionIndex += 1;
   const section = createSection(node, slugger, sectionIndex);
   attachSection(roots, stack, section);
   return;
  }

  if (!isBlockNode(node)) return;

  const blocks = mdastBlockToLearningBlock(node, context);
  const activeSection = stack[stack.length - 1]?.section;

  if (activeSection) {
   activeSection.blocks.push(...blocks);
  } else {
   looseBlocks.push(...blocks);
  }
 });

 if (looseBlocks.length > 0) {
  roots.unshift(createLooseSection(slugger, context, "Introduction", looseBlocks));
 }

 const firstHeading = roots.find((section) => section.level === 1);

 return {
  title: firstHeading?.title ?? "Imported Markdown",
  sections: roots,
  rawMarkdown: markdown,
  parseVersion,
 };
}
