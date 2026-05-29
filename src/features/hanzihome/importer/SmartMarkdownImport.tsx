"use client";

import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, WandSparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Select,
 SelectContent,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
 applyParseProfile,
 learningFieldValueToPreview,
 sectionToPlainText,
} from "@/features/hanzihome/importer/apply-parse-profile";
import {
 applyParsedResultToDraft,
 type ApplyImportMode,
 type ApplyImportTarget,
} from "@/features/hanzihome/importer/applyParsedResultToDraft";
import { MarkdownContent } from "@/features/hanzihome/components/MarkdownContent";
import {
 normalizeLessonOverviewMarkdown,
 parseLessonOverviewMarkdownSections,
} from "@/features/hanzihome/importer/lesson-overview-markdown";
import {
 loadCustomImportProfiles,
 saveCustomImportProfiles,
} from "@/features/hanzihome/importer/import-profile-storage";
import type {
 AppliedParseResult,
 FieldRule,
 LearningDoc,
 LearningFieldName,
 LearningFieldValue,
 LearningSection,
 ParseProfile,
 SectionRoleRule,
} from "@/features/hanzihome/importer/importer.types";
import { markdownToLearningDoc } from "@/features/hanzihome/importer/markdown-to-learning-doc";
import {
 createEmptyLessonDraftNotes,
 lessonDraftNotesSchema,
} from "@/features/hanzihome/lesson-drafts/grammar/grammar-draft.schema";
import type { LessonDraft } from "@/features/hanzihome/lesson-drafts/lesson-draft.schema";
import { useUpdateLessonDraftMutation } from "@/features/hanzihome/lesson-drafts/use-lesson-drafts";
import { cn } from "@/lib/utils";

type SmartMarkdownImportProps = {
 draft: LessonDraft;
 kind: SmartImportKind;
};

type SmartImportKind = "grammar" | "lesson";

type SmartFieldValue = LearningFieldName | "ignore";
type SmartGrammarField = Extract<
 LearningFieldName,
 | "grammar.core"
 | "grammar.structures"
 | "grammar.blindSpots"
 | "grammar.comparisons"
 | "grammar.examples"
 | "grammar.notes"
 | "grammar.summary"
>;

type SmartMappingRow = {
 key: string;
 heading: string;
 normalizedHeading: string;
 level: 1 | 2 | 3 | 4 | 5 | 6;
 count: number;
 field: SmartFieldValue;
};

type RootDetection = {
 level: 1 | 2 | 3 | 4 | 5 | 6;
 pattern: "numbered" | "phan" | "plain";
 label: string;
 confidence: number;
};

type SmartImportScope = {
 label: string;
 sectionIds: Set<string>;
 scoped: boolean;
};

const smartProfilePrefix = "smart-learned-grammar";

const fieldOptions: Array<{
 value: SmartFieldValue;
 label: string;
 description: string;
}> = [
 {
  value: "grammar.core",
  label: "Cốt lõi / giải thích",
  description: "Nghĩa chính, công dụng, giải thích.",
 },
 {
  value: "grammar.structures",
  label: "Công thức",
  description: "Cấu trúc, pattern, công thức.",
 },
 {
  value: "grammar.blindSpots",
  label: "Logic / vì sao",
  description: "Cách hiểu, tư duy, lý do dùng.",
 },
 {
  value: "grammar.comparisons",
  label: "So sánh",
  description: "Phân biệt, dễ nhầm.",
 },
 {
  value: "grammar.examples",
  label: "Ví dụ",
  description: "Ví dụ trong sách hoặc ví dụ nhanh.",
 },
 {
  value: "grammar.notes",
  label: "Lưu ý / thực tế",
  description: "Cách dịch tự nhiên, bẫy sai, ghi chú.",
 },
 {
  value: "grammar.summary",
  label: "Chốt ý",
  description: "Tổng kết ngắn cho điểm ngữ pháp.",
 },
 {
  value: "ignore",
  label: "Bỏ qua",
  description: "Không đưa section này vào bài học.",
 },
];

const applyModeOptions: Array<{ value: ApplyImportMode; label: string }> = [
 { value: "replace", label: "Ghi đè phần này" },
 { value: "mergeByTitle", label: "Cập nhật theo tiêu đề" },
 { value: "append", label: "Thêm vào cuối" },
];

const lessonApplyModeOptions: Array<{ value: ApplyImportMode; label: string }> = [
 { value: "replace", label: "Ghi đè Tổng quan" },
 { value: "append", label: "Thêm vào cuối Tổng quan" },
];

const baseFieldAliases: Record<SmartGrammarField, string[]> = {
 "grammar.core": [
  "cốt lõi",
  "cốt lõi nghĩa",
  "nghĩa",
  "nghĩa chính",
  "bản chất",
  "công dụng",
  "giải thích",
  "ý nghĩa",
 ],
 "grammar.structures": ["công thức", "cấu trúc", "pattern", "mẫu câu"],
 "grammar.blindSpots": [
  "vì sao",
  "logic",
  "tư duy",
  "cách hiểu",
  "quy tắc ẩn",
 ],
 "grammar.comparisons": ["so sánh", "phân biệt", "dễ nhầm", "khác nhau"],
 "grammar.examples": ["ví dụ", "examples", "ví dụ trong sách", "ví dụ nhanh"],
 "grammar.notes": [
  "thực tế",
  "phủ định",
  "nghi vấn",
  "vị trí",
  "lưu ý",
  "chú ý",
  "bẫy",
  "sai thường gặp",
  "dịch tự nhiên",
 ],
 "grammar.summary": ["chốt", "tổng kết", "kết luận"],
};

function normalizeHeading(value: string) {
 return value
  .normalize("NFC")
  .trim()
  .toLocaleLowerCase("vi-VN")
  .replace(/^(?:[\divx]+|[a-z]|[一二三四五六七八九十]+)\s*[.)．、\\.]?\s*/iu, "")
  .replace(/\s+/g, " ");
}

function escapeRegExp(value: string) {
 return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function flattenSections(sections: LearningSection[]): LearningSection[] {
 return sections.flatMap((section) => [
  section,
  ...flattenSections(section.children),
 ]);
}

function sectionInScope(section: LearningSection, scope: SmartImportScope) {
 return !scope.scoped || scope.sectionIds.has(section.id);
}

function childSectionsOfRoots(
 doc: LearningDoc,
 root: RootDetection,
 scope: SmartImportScope,
) {
 return flattenSections(doc.sections).filter((section) => {
  if (!sectionInScope(section, scope)) return false;

  const parent = findParentSection(doc.sections, section.id);
  return (
   parent?.level === root.level &&
   sectionInScope(parent, scope) &&
   section.level > root.level
  );
 });
}

function findParentSection(
 sections: LearningSection[],
 sectionId: string,
 parent?: LearningSection,
): LearningSection | null {
 for (const section of sections) {
  if (section.id === sectionId) return parent ?? null;

  const match = findParentSection(section.children, sectionId, section);
  if (match) return match;
 }

 return null;
}

function sectionAndDescendantIds(section: LearningSection) {
 return new Set([section.id, ...flattenSections(section.children).map((item) => item.id)]);
}

function isGrammarScopeHeading(title: string) {
 const normalized = normalizeHeading(title);
 return (
  normalized === "语法" ||
  normalized.includes("ngữ pháp") ||
  normalized.includes("grammar")
 );
}

function isScopeEndHeading(title: string) {
 const normalized = normalizeHeading(title);
 return (
  normalized.includes("练习") ||
  normalized.includes("bài tập") ||
  normalized.includes("课文") ||
  normalized.includes("生词") ||
  normalized.includes("专名") ||
  normalized.includes("阅读") ||
  normalized.includes("写汉字")
 );
}

function isExcludedRootHeading(title: string) {
 const normalized = normalizeHeading(title);
 return (
  isGrammarScopeHeading(title) ||
  isScopeEndHeading(title) ||
  normalized.includes("注释") ||
  normalized.includes("生词") ||
  normalized.includes("专名") ||
  normalized.includes("课文") ||
  normalized.includes("练习") ||
  normalized.includes("阅读") ||
  normalized.includes("写汉字") ||
  normalized.includes("tổng kết") ||
  normalized.includes("tổng phần")
 );
}

function detectImportScope(doc: LearningDoc): SmartImportScope {
 const allSections = flattenSections(doc.sections);
 const grammarHeading = allSections.find((section) =>
  isGrammarScopeHeading(section.title),
 );

 if (!grammarHeading) {
  return {
   label: "Toàn bộ markdown",
   sectionIds: new Set(allSections.map((section) => section.id)),
   scoped: false,
  };
 }

 const sectionIds = sectionAndDescendantIds(grammarHeading);
 const grammarIndex = allSections.findIndex(
  (section) => section.id === grammarHeading.id,
 );

 for (let index = grammarIndex + 1; index < allSections.length; index += 1) {
  const section = allSections[index];
  if (!section) continue;

  if (
   section.level <= grammarHeading.level &&
   isScopeEndHeading(section.title)
  ) {
   break;
  }

  sectionIds.add(section.id);
 }

 return {
  label: grammarHeading.title,
  sectionIds,
  scoped: true,
 };
}

function detectRoot(doc: LearningDoc, scope: SmartImportScope): RootDetection | null {
 const sections = flattenSections(doc.sections).filter((section) =>
  sectionInScope(section, scope),
 );
 const sectionGroups = [2, 3, 1, 4, 5, 6].map((level) => {
  const roots = sections.filter((section) => {
   if (section.level !== level) return false;
   if (isExcludedRootHeading(section.title)) return false;

   return section.children.length > 0 || section.blocks.length > 0;
  });
  const numbered = roots.filter((section) => /^\s*\d+[.)．、\\.]?\s+/u.test(section.title));
  const phan = roots.filter((section) => /^PHẦN\s+[IVX]+\s*:/iu.test(section.title));

  return {
   level: level as RootDetection["level"],
   roots,
   numbered,
   phan,
  };
 });

 const numberedGroup = sectionGroups.find((group) => group.numbered.length >= 2);
 if (numberedGroup) {
  return {
   level: numberedGroup.level,
   pattern: "numbered",
   label: `H${numberedGroup.level} đánh số`,
   confidence: Math.min(0.95, 0.72 + numberedGroup.numbered.length / 100),
  };
 }

 const phanGroup = sectionGroups.find((group) => group.phan.length >= 1);
 if (phanGroup) {
  return {
   level: phanGroup.level,
   pattern: "phan",
   label: `H${phanGroup.level} PHẦN`,
   confidence: 0.82,
  };
 }

 const plainGroup = sectionGroups.find((group) => group.roots.length >= 2);
 if (!plainGroup) return null;

 return {
  level: plainGroup.level,
  pattern: "plain",
  label: `H${plainGroup.level} nhiều mục`,
  confidence: 0.58,
 };
}

function learnedAliases() {
 const custom = loadCustomImportProfiles();
 const aliases: Partial<Record<LearningFieldName, string[]>> = {};

 custom.profiles
  .filter((profile) => profile.id.startsWith(smartProfilePrefix))
  .forEach((profile) => {
   profile.fieldRules.forEach((rule) => {
    aliases[rule.field] = [
     ...(aliases[rule.field] ?? []),
     ...(rule.match.headingTexts ?? []),
    ];
   });
  });

 return aliases;
}

function suggestFieldForHeading(title: string): SmartFieldValue {
 const normalized = normalizeHeading(title);
 const learned = learnedAliases();

 if (/动词\s*\+|v\s*\+/iu.test(normalized)) {
  return "grammar.structures";
 }

 for (const [field, aliases] of Object.entries(learned)) {
  if (
   aliases?.some(
    (alias) =>
     normalizeHeading(alias) === normalized ||
     normalized.includes(normalizeHeading(alias)),
   )
  ) {
   return field as LearningFieldName;
  }
 }

 for (const [field, aliases] of Object.entries(baseFieldAliases)) {
  if (
   aliases.some((alias) => {
    const normalizedAlias = normalizeHeading(alias);
    return (
     normalized === normalizedAlias ||
     normalized.includes(normalizedAlias) ||
     normalizedAlias.includes(normalized)
    );
   })
  ) {
   return field as LearningFieldName;
  }
 }

 return "ignore";
}

function buildMappingRows(
 doc: LearningDoc,
 root: RootDetection,
 scope: SmartImportScope,
): SmartMappingRow[] {
 const childSections = childSectionsOfRoots(doc, root, scope).filter(
  (section) => section.level === root.level + 1,
 );
 const rowsByHeading = new Map<string, SmartMappingRow>();

 childSections.forEach((section) => {
  const normalizedHeading = normalizeHeading(section.title);
  const existing = rowsByHeading.get(normalizedHeading);

  if (existing) {
   rowsByHeading.set(normalizedHeading, {
    ...existing,
    count: existing.count + 1,
   });
   return;
  }

  rowsByHeading.set(normalizedHeading, {
   key: normalizedHeading,
   heading: section.title,
   normalizedHeading,
   level: section.level,
   count: 1,
   field: suggestFieldForHeading(section.title),
  });
 });

 return Array.from(rowsByHeading.values());
}

function rootRegex(root: RootDetection) {
 if (root.pattern === "numbered") return "^\\s*\\d+[.)．、\\\\.]?\\s+";
 if (root.pattern === "phan") return "^PHẦN\\s+[IVX]+\\s*:";

 return undefined;
}

function fieldRuleFromMapping(row: SmartMappingRow, index: number): FieldRule | null {
 if (row.field === "ignore") return null;

 const exactHeading = row.heading.trim();
 const normalizedHeading = row.normalizedHeading.trim();
 const aliases = Array.from(new Set([exactHeading, normalizedHeading])).filter(Boolean);

 return {
  id: `smart-field-${index + 1}-${row.field}`,
  field: row.field,
  match: {
   headingLevel: [row.level],
   headingTexts: aliases,
   headingRegex: [`^\\s*(?:\\d+[.)．、\\\\.]?\\s*)?${escapeRegExp(normalizedHeading)}\\s*$`],
   labels: aliases,
   directive: row.field,
  },
  valueFrom: "wholeSection",
  multiple: row.field !== "grammar.core" && row.field !== "grammar.summary",
 };
}

function buildSmartProfile({
 root,
 mappings,
}: {
 root: RootDetection;
 mappings: SmartMappingRow[];
}): ParseProfile {
 const itemRootRule: SectionRoleRule = {
  id: "smart-grammar-root",
  role: "grammarItem",
  match: {
   headingLevel: [root.level],
   headingRegex: rootRegex(root),
  },
  titleFrom: "headingText",
 };
 const fieldRules = mappings
  .map(fieldRuleFromMapping)
  .filter((rule): rule is FieldRule => Boolean(rule));

 return {
  id: `${smartProfilePrefix}-${root.pattern}-h${root.level}`,
  name: `Smart grammar - ${root.label}`,
  target: "grammar",
  documentTitleRule: {
   id: "smart-document-title",
   role: "documentTitle",
   match: { headingLevel: [1] },
   titleFrom: "headingText",
  },
  itemRootRules: [itemRootRule],
  specialSectionRules: [
   {
    id: "smart-summary",
    role: "lessonSummary",
    match: {
     headingLevel: [1, 2],
     headingRegex: "^(Chốt|Tổng kết|Summary)",
    },
    titleFrom: "headingText",
   },
  ],
  fieldRules,
  unknownSectionBehavior: "ignore",
 };
}

function mergeSmartProfile(profile: ParseProfile) {
 const custom = loadCustomImportProfiles();
 const nextProfiles = [
  ...custom.profiles.filter((item) => item.id !== profile.id),
  profile,
 ];

 saveCustomImportProfiles(nextProfiles);
}

function fieldLabel(value: SmartFieldValue) {
 return fieldOptions.find((option) => option.value === value)?.label ?? value;
}

function itemPreviewText(item: AppliedParseResult["items"][number], field: LearningFieldName) {
 return (item.fields[field] ?? [])
  .map((value) => learningFieldValueToPreview(value))
  .filter(Boolean)
  .join("\n\n")
  .trim();
}

function scopeAppliedResult(
 result: AppliedParseResult,
 scope: SmartImportScope,
): AppliedParseResult {
 if (!scope.scoped) return result;

 return {
  ...result,
  items: result.items.filter((item) => scope.sectionIds.has(item.sourceSectionId)),
  specialSections: result.specialSections.filter((section) =>
   scope.sectionIds.has(section.sourceSectionId),
  ),
  unmappedSections: result.unmappedSections.filter((section) =>
   scope.sectionIds.has(section.id),
  ),
 };
}

function findSectionById(
 sections: LearningSection[],
 sectionId: string,
): LearningSection | null {
 for (const section of sections) {
  if (section.id === sectionId) return section;

  const child = findSectionById(section.children, sectionId);
  if (child) return child;
 }

 return null;
}

function fillDirectRootContent(
 result: AppliedParseResult,
 doc: LearningDoc,
 root: RootDetection | null,
): AppliedParseResult {
 if (!root) return result;

 return {
  ...result,
  items: result.items.map((item) => {
   if (Object.keys(item.fields).length > 0) return item;

   const section = findSectionById(doc.sections, item.sourceSectionId);
   const directText = section ? sectionToPlainText(section) : "";

   if (!directText) return item;

   return {
    ...item,
    fields: {
     ...item.fields,
     "grammar.core": [{ kind: "text", value: directText }],
    },
   };
  }),
 };
}

function LearningFieldValuePreview({ value }: { value: LearningFieldValue }) {
 if (value.kind === "table") {
  const rows = value.value.rows.filter((row) => row.length > 0);

  return (
   <div className="overflow-x-auto rounded-xl border border-border-default bg-bg-primary">
    <table className="min-w-full border-collapse text-sm">
     {value.value.headers.length > 0 && (
      <thead className="bg-bg-subtle">
       <tr>
        {value.value.headers.map((header, index) => (
         <th
          key={`${header}-${index}`}
          className="border-b border-border-default px-3 py-2 text-left font-black text-text-primary"
         >
          {header}
         </th>
        ))}
       </tr>
      </thead>
     )}
     <tbody>
      {rows.map((row, rowIndex) => (
       <tr key={rowIndex} className="border-t border-border-default first:border-t-0">
        {row.map((cell, cellIndex) => (
         <td
          key={`${rowIndex}-${cellIndex}`}
          className="px-3 py-2 align-top font-semibold text-text-primary"
         >
          {cell}
         </td>
        ))}
       </tr>
      ))}
     </tbody>
    </table>
   </div>
  );
 }

 if (value.kind === "list") {
  return (
   <ul className="grid gap-1 text-sm font-semibold leading-relaxed text-text-primary">
    {value.value.map((item, index) => (
     <li key={`${item}-${index}`} className="flex gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{item}</span>
     </li>
    ))}
   </ul>
  );
 }

 return <TextWithTablePreview text={value.value} />;
}

function isTableLikeLine(line: string) {
 return line
  .split("|")
  .map((cell) => cell.trim())
  .filter(Boolean).length >= 2;
}

function tableCells(line: string) {
 return line
  .split("|")
  .map((cell) => cell.trim())
  .filter(Boolean);
}

function renderTableFromLines(lines: string[], key: string) {
 const [headerLine, ...rowLines] = lines;
 const headers = headerLine ? tableCells(headerLine) : [];
 const rows = rowLines.map(tableCells).filter((row) => row.length > 0);

 return (
  <div key={key} className="overflow-x-auto rounded-xl border border-border-default bg-bg-primary">
   <table className="min-w-full border-collapse text-sm">
    <thead className="bg-bg-subtle">
     <tr>
      {headers.map((header, index) => (
       <th
        key={`${header}-${index}`}
        className="border-b border-border-default px-3 py-2 text-left font-black text-text-primary"
       >
        {header}
       </th>
      ))}
     </tr>
    </thead>
    <tbody>
     {rows.map((row, rowIndex) => (
      <tr key={rowIndex} className="border-t border-border-default first:border-t-0">
       {row.map((cell, cellIndex) => (
        <td
         key={`${rowIndex}-${cellIndex}`}
         className="px-3 py-2 align-top font-semibold text-text-primary"
        >
         {cell}
        </td>
       ))}
      </tr>
     ))}
    </tbody>
   </table>
  </div>
 );
}

function TextWithTablePreview({ text }: { text: string }) {
 const parts: Array<
  | {
     type: "text";
     lines: string[];
    }
  | {
     type: "table";
     lines: string[];
    }
 > = [];

 text.split("\n").forEach((line) => {
  const lineType = isTableLikeLine(line) ? "table" : "text";
  const current = parts[parts.length - 1];

  if (current?.type === lineType) {
   current.lines.push(line);
   return;
  }

  parts.push({
   type: lineType,
   lines: [line],
  });
 });

 return (
  <div className="grid gap-3">
   {parts.flatMap((part, index) => {
    const content = part.lines.join("\n").trim();
    if (!content) return [];

    if (part.type === "table" && part.lines.length >= 2) {
     return [renderTableFromLines(part.lines, `table-${index}`)];
    }

    return [
     <div
      key={`text-${index}`}
      className="whitespace-pre-wrap text-sm font-semibold leading-relaxed text-text-primary"
     >
      {content}
     </div>,
    ];
   })}
  </div>
 );
}

function FieldValuesPreview({
 item,
 field,
}: {
 item: AppliedParseResult["items"][number];
 field: LearningFieldName;
}) {
 const values = item.fields[field] ?? [];

 if (values.length === 0) return null;

 return (
  <div className="grid gap-3">
   {values.map((value, index) => (
    <LearningFieldValuePreview key={index} value={value} />
   ))}
  </div>
 );
}

function getDraftNotes(draft: LessonDraft) {
 const parsed = lessonDraftNotesSchema.safeParse(draft.content.lesson.notes);

 return parsed.success ? parsed.data : createEmptyLessonDraftNotes();
}

function appendMarkdown(current: string, incoming: string) {
 const parts = [current.trim(), incoming.trim()].filter(Boolean);

 return parts.join("\n\n---\n\n");
}

export function SmartMarkdownImport({ draft, kind }: SmartMarkdownImportProps) {
 const [markdown, setMarkdown] = useState("");
 const [applyMode, setApplyMode] = useState<ApplyImportMode>("replace");
 const [mappingOverrides, setMappingOverrides] = useState<
  Record<string, SmartFieldValue>
 >({});
 const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
 const [selectedLessonSectionId, setSelectedLessonSectionId] = useState<
  string | null
 >(null);
 const updateDraftMutation = useUpdateLessonDraftMutation();
 const normalizedMarkdown = useMemo(
  () => normalizeLessonOverviewMarkdown(markdown),
  [markdown],
 );
 const isGrammarImport = kind === "grammar";

 const doc = useMemo(() => {
  if (!markdown.trim()) return null;
  return markdownToLearningDoc(normalizedMarkdown);
 }, [markdown, normalizedMarkdown]);

 const scope = useMemo(() => (doc ? detectImportScope(doc) : null), [doc]);
 const root = useMemo(
  () => (doc && scope ? detectRoot(doc, scope) : null),
  [doc, scope],
 );
 const baseMappings = useMemo(
  () => (doc && root && scope ? buildMappingRows(doc, root, scope) : []),
  [doc, root, scope],
 );
 const mappings = useMemo(
  () =>
   baseMappings.map((row) => ({
    ...row,
    field: mappingOverrides[row.key] ?? row.field,
   })),
  [baseMappings, mappingOverrides],
 );
 const profile = useMemo(
  () => (root ? buildSmartProfile({ root, mappings }) : null),
  [mappings, root],
 );
 const result = useMemo(
  () =>
   doc && profile && scope
    ? fillDirectRootContent(
       scopeAppliedResult(applyParseProfile(doc, profile), scope),
       doc,
       root,
      )
    : null,
  [doc, profile, root, scope],
 );
 const selectedItem = useMemo(() => {
  if (!result) return null;
  return (
   result.items.find((item) => item.id === selectedItemId) ??
   result.items[0] ??
   null
  );
 }, [result, selectedItemId]);
 const mappedFieldCount = mappings.filter((row) => row.field !== "ignore").length;
 const confidence = root
  ? Math.round(
     Math.min(
      0.98,
      root.confidence + Math.min(0.16, mappedFieldCount / 100),
     ) * 100,
   )
  : 0;
 const headingCount = doc ? flattenSections(doc.sections).length : 0;
 const lessonSections = useMemo(
  () => parseLessonOverviewMarkdownSections(normalizedMarkdown),
  [normalizedMarkdown],
 );
 const selectedLessonSection =
  lessonSections.find((section) => section.id === selectedLessonSectionId) ??
  lessonSections[0] ??
  null;
 const activeApplyModeOptions = isGrammarImport
  ? applyModeOptions
  : lessonApplyModeOptions;
 const canApply = isGrammarImport ? Boolean(result) : Boolean(normalizedMarkdown);
 const labels = isGrammarImport
  ? {
     eyebrow: "Import ngữ pháp",
     title: "Paste markdown ngữ pháp, kiểm tra preview, rồi apply",
     description:
      "App đọc cấu trúc heading, tự map field và học lại mapping sau mỗi lần apply.",
     button: "Apply ngữ pháp",
     placeholder:
      "# BÀI 1: ...\n\n## 1. 说实话 – nói thật...\n\n### 1. Cốt lõi nghĩa\n...",
     emptyApply: "Chưa có nội dung ngữ pháp hợp lệ.",
     success: "Đã import ngữ pháp vào bài nháp.",
    }
  : {
     eyebrow: "Import bài học",
     title: "Paste markdown bài học để lưu vào Tổng quan",
     description:
      "Nội dung này render ở tab Tổng quan. Ghi chú riêng của bài vẫn được giữ nguyên.",
     button: "Apply bài học",
     placeholder:
      "# BÀI 1: ...\n\n## 一、课文\n...\n\n## 二、生词\n...",
     emptyApply: "Chưa có markdown bài học để import.",
     success: "Đã import bài học vào Tổng quan.",
    };

 const updateMapping = (key: string, field: SmartFieldValue) => {
  setMappingOverrides((current) => ({
   ...current,
   [key]: field,
 }));
 };

 const handleApply = async () => {
  if (!isGrammarImport) {
   if (!normalizedMarkdown) {
    toast.error(labels.emptyApply);
    return;
   }

   const currentNotes = getDraftNotes(draft);
   const overviewMarkdown =
    applyMode === "append"
     ? appendMarkdown(currentNotes.overviewMarkdown, normalizedMarkdown)
     : normalizedMarkdown;

   await updateDraftMutation.mutateAsync({
    draftId: draft.id,
    input: {
     content: {
      ...draft.content,
      lesson: {
       ...draft.content.lesson,
       notes: {
        ...currentNotes,
        overviewMarkdown,
       },
      },
     },
    },
   });

   toast.success(labels.success);
   return;
  }

  if (!result || !profile) {
   toast.error(labels.emptyApply);
   return;
  }

  if (result.items.length === 0) {
   toast.error("Import ngữ pháp chưa nhận được điểm ngữ pháp nào.");
   return;
  }

  const nextContent = applyParsedResultToDraft({
   draftContent: draft.content,
   parsedResult: result,
   target: "grammar" satisfies ApplyImportTarget,
   mode: applyMode,
  });

  await updateDraftMutation.mutateAsync({
   draftId: draft.id,
   input: { content: nextContent },
  });

  mergeSmartProfile(profile);
  toast.success(labels.success);
 };

 return (
  <div className="grid gap-4">
   <Card padding="md" className="rounded-xl">
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
     <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div>
        <p className="text-xs font-black uppercase tracking-wide text-text-muted">
         {labels.eyebrow}
        </p>
        <h2 className="text-xl font-black text-text-primary">
         {labels.title}
        </h2>
        <p className="text-sm font-semibold text-text-muted">
         {labels.description}
        </p>
       </div>

       <Button
        type="button"
        disabled={!canApply || updateDraftMutation.isPending}
        isLoading={updateDraftMutation.isPending}
        onClick={() => void handleApply()}
       >
        <WandSparkles className="h-4 w-4" />
        {labels.button}
       </Button>
      </div>

      <Textarea
       value={markdown}
       onChange={(event) => setMarkdown(event.target.value)}
       placeholder={labels.placeholder}
       className="min-h-72 font-mono text-sm leading-relaxed"
      />
     </div>

     <div className="grid content-start gap-3">
      <label className="grid gap-1.5">
       <span className="text-xs font-black uppercase tracking-wide text-text-muted">
        Chế độ apply
       </span>
       <Select
        value={applyMode}
        onValueChange={(value) => setApplyMode(value as ApplyImportMode)}
       >
        <SelectTrigger>
         <SelectValue placeholder="Chọn chế độ" />
        </SelectTrigger>
        <SelectContent>
         {activeApplyModeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
           {option.label}
          </SelectItem>
         ))}
        </SelectContent>
       </Select>
      </label>

      <div className="rounded-xl border border-border-default bg-bg-subtle p-3">
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Nhận diện
       </p>
       <p className="mt-1 text-lg font-black text-text-primary">
        {isGrammarImport
         ? root
           ? root.label
           : "Chưa có format"
         : normalizedMarkdown
           ? "Markdown bài học"
           : "Chưa có nội dung"}
       </p>
       <p className="text-sm font-bold text-text-muted">
        {isGrammarImport
         ? result
           ? `${result.items.length} điểm · ${mappedFieldCount} field · ${confidence}% · ${scope?.label ?? "toàn bộ"}`
           : "Paste markdown để xem preview."
         : normalizedMarkdown
           ? `${lessonSections.length || headingCount} đề mục · render ở Tổng quan`
           : "Paste markdown để xem preview."}
       </p>
      </div>
     </div>
    </div>
   </Card>

   {isGrammarImport && root && mappings.length > 0 && (
    <Card padding="md" className="rounded-xl">
     <div className="grid gap-3">
      <div>
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">
        Mapping theo heading
       </p>
       <h3 className="text-lg font-black text-text-primary">
        Chỉnh một lần, lần sau app nhớ format này
       </h3>
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
       {mappings.map((row) => (
        <div
         key={row.key}
         className="grid gap-2 rounded-xl border border-border-default bg-bg-primary p-3"
        >
         <div className="min-w-0">
          <p className="truncate text-sm font-black text-text-primary">
           {row.heading}
          </p>
          <p className="text-xs font-bold text-text-muted">
           H{row.level} · {row.count} lần
          </p>
         </div>

         <Select
          value={row.field}
          onValueChange={(value) => updateMapping(row.key, value as SmartFieldValue)}
         >
          <SelectTrigger className="h-9">
           <SelectValue placeholder="Map vào field" />
          </SelectTrigger>
          <SelectContent>
           {fieldOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
             {option.label}
            </SelectItem>
           ))}
          </SelectContent>
         </Select>
        </div>
       ))}
      </div>
     </div>
    </Card>
   )}

   {!isGrammarImport && selectedLessonSection && (
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-4">
      <div>
       <div className="flex w-fit items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Preview Tổng quan
       </div>
       <h3 className="mt-2 text-2xl font-black text-text-primary">
        Nội dung bài học
       </h3>
       <p className="text-sm font-semibold text-text-muted">
        Sau khi apply, phần này sẽ hiển thị trong tab Tổng quan phía trên card
        ghi chú riêng.
       </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
       <div className="grid max-h-[32rem] content-start gap-2 overflow-y-auto pr-1">
        {lessonSections.map((section, index) => (
         <button
          key={section.id}
          type="button"
          onClick={() => setSelectedLessonSectionId(section.id)}
          className={cn(
           "rounded-xl border p-3 text-left transition-colors",
           selectedLessonSection.id === section.id
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border-default bg-bg-primary hover:bg-bg-subtle",
          )}
         >
          <span className="line-clamp-2 text-sm font-black">
           {index + 1}. {section.title}
          </span>
          <span
           className={cn(
            "mt-1 block text-xs font-bold",
            selectedLessonSection.id === section.id
             ? "text-primary-foreground/80"
             : "text-text-muted",
           )}
          >
           H{section.level}
          </span>
         </button>
        ))}
       </div>

       <div className="rounded-xl border border-border-default bg-bg-subtle p-4">
        <h4 className="mb-3 text-lg font-black text-text-primary">
         {selectedLessonSection.title}
        </h4>
        <div className="max-h-[32rem] overflow-y-auto pr-2">
         <MarkdownContent
          content={selectedLessonSection.content || selectedLessonSection.title}
         />
        </div>
       </div>
      </div>
     </div>
    </Card>
   )}

   {isGrammarImport && result && (
    <div className="grid gap-4 lg:grid-cols-[22rem_minmax(0,1fr)]">
     <Card padding="md" className="rounded-xl">
      <div className="grid gap-3">
       <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-text-primary">Điểm ngữ pháp</h3>
        <span className="rounded-full border border-border-default px-3 py-1 text-xs font-black text-text-muted">
         {result.items.length} mục
        </span>
       </div>

       {result.items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-default p-4 text-sm font-bold text-text-muted">
         Chưa nhận ra item nào. Kiểm tra lại H2/H3 hoặc đổi mapping.
        </p>
       ) : (
        <div className="grid max-h-[36rem] gap-2 overflow-y-auto pr-1">
         {result.items.map((item, index) => (
          <button
           key={item.id}
           type="button"
           onClick={() => setSelectedItemId(item.id)}
           className={cn(
            "grid rounded-xl border p-3 text-left transition-colors",
            selectedItem?.id === item.id
             ? "border-primary bg-primary text-primary-foreground"
             : "border-border-default bg-bg-primary hover:bg-bg-subtle",
           )}
          >
           <span className="line-clamp-2 text-sm font-black">
            {index + 1}. {item.title}
           </span>
           <span
            className={cn(
             "mt-1 text-xs font-bold",
             selectedItem?.id === item.id
              ? "text-primary-foreground/80"
              : "text-text-muted",
            )}
           >
            {Object.keys(item.fields).length} field
           </span>
          </button>
         ))}
        </div>
       )}
      </div>
     </Card>

     <Card padding="lg" className="rounded-xl">
      {selectedItem ? (
       <div className="grid gap-4">
        <div>
         <div className="flex w-fit items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Preview sạch
         </div>
         <h3 className="mt-2 text-2xl font-black text-text-primary">
          {selectedItem.title}
         </h3>
        </div>

        <div className="grid gap-3">
         {fieldOptions
         .filter((option) => option.value !== "ignore")
          .flatMap((option) => {
           const text = itemPreviewText(
            selectedItem,
            option.value as LearningFieldName,
           );

           if (!text) return [];

           return [
            <section
             key={option.value}
             className="rounded-xl border border-border-default bg-bg-subtle p-4"
            >
             <div className="mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
             <h4 className="font-black text-text-primary">
               {fieldLabel(option.value)}
              </h4>
             </div>
             <FieldValuesPreview
              item={selectedItem}
              field={option.value as LearningFieldName}
             />
            </section>,
           ];
          })}
        </div>
       </div>
      ) : (
       <p className="text-sm font-semibold text-text-muted">
        Chọn một điểm ngữ pháp để xem preview.
       </p>
      )}
     </Card>
    </div>
   )}
  </div>
 );
}

export function SmartGrammarImport({ draft }: { draft: LessonDraft }) {
 return <SmartMarkdownImport draft={draft} kind="grammar" />;
}

export function SmartLessonImport({ draft }: { draft: LessonDraft }) {
 return <SmartMarkdownImport draft={draft} kind="lesson" />;
}
