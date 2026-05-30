import {
 buildParseMeta,
 cleanDisplayTitle,
 normalizeSmartHeading,
 textToLearningFieldValue,
} from "@/features/hanzihome/importer/smart-markdown-parser-v2";
import {
 learningFieldNameSchema,
 type AppliedParseResult,
 type FieldRule,
 type LearningBlock,
 type LearningFieldName,
 type LearningFieldValue,
 type LearningListItem,
 type LearningSection,
 type MappedSpecialSection,
 type MappedImportItem,
 type ParseProfile,
 type ParserWarning,
 type SectionRoleRule,
} from "@/features/hanzihome/importer/importer.types";

type ApplyContext = {
 warnings: ParserWarning[];
};

type LabelMatch = {
 field: LearningFieldName;
 value: LearningFieldValue;
 ruleId: string;
};

function normalizeText(value: string) {
 return normalizeSmartHeading(value);
}

function addFieldValue(
 item: MappedImportItem,
 field: LearningFieldName,
 value: LearningFieldValue,
 multiple: boolean,
) {
 const currentValues = item.fields[field] ?? [];
 item.fields[field] = multiple ? [...currentValues, value] : [value];
}

function listItemToLines(item: LearningListItem, depth = 0): string[] {
 const prefix = "  ".repeat(depth);
 const ownText = item.blocks
  .flatMap((block) => blockToTextLines(block, depth))
  .join(" ")
  .trim();
 const lines = ownText ? [`${prefix}- ${ownText}`] : [];

 item.children.forEach((child) => {
  lines.push(...listItemToLines(child, depth + 1));
 });

 return lines;
}

function blockToTextLines(block: LearningBlock, depth = 0): string[] {
 if (block.type === "paragraph") return [block.text];
 if (block.type === "code") {
  const fence = block.lang ? `\`\`\`${block.lang}` : "```";
  return [fence, block.value, "```"];
 }
 if (block.type === "quote") {
  return block.blocks
   .flatMap((child) => blockToTextLines(child, depth))
   .map((line) => `> ${line}`);
 }
 if (block.type === "table") {
  const rows = [block.table.headers, ...block.table.rows].filter(
   (row) => row.length > 0,
  );
  return rows.map((row) => row.join(" | "));
 }
 if (block.type === "thematicBreak") return ["---"];

 return block.items.flatMap((item) => listItemToLines(item, depth));
}

export function sectionToPlainText(section: LearningSection) {
 return section.blocks
  .flatMap((block) => blockToTextLines(block))
  .join("\n")
  .trim();
}

function blocksToPlainText(blocks: LearningBlock[]) {
 return blocks.flatMap((block) => blockToTextLines(block)).join("\n").trim();
}

function firstParagraph(blocks: LearningBlock[]) {
 return blocks.find((block) => block.type === "paragraph")?.text.trim() ?? "";
}

function listItems(blocks: LearningBlock[]) {
 return blocks
  .filter((block) => block.type === "list")
  .flatMap((block) => block.items.flatMap((item) => listItemToLines(item)))
  .map((line) => line.replace(/^\s*-\s*/, "").trim())
  .filter(Boolean);
}

function firstTable(blocks: LearningBlock[]) {
 return blocks.find((block) => block.type === "table")?.table ?? null;
}

function valueFromSection(
 section: LearningSection,
 rule: FieldRule,
 context: ApplyContext,
): LearningFieldValue | null {
 if (rule.valueFrom === "sectionTitle") {
  return { kind: "text", value: section.title };
 }

 if (rule.valueFrom === "firstParagraph") {
  const value = firstParagraph(section.blocks);
  return value ? { kind: "text", value } : null;
 }

 if (rule.valueFrom === "listItems") {
  const value = listItems(section.blocks);
  return value.length > 0 ? { kind: "list", value } : null;
 }

 if (rule.valueFrom === "table") {
  const value = firstTable(section.blocks);
  return value ? { kind: "table", value } : null;
 }

 const text = sectionToPlainText(section);

 if (!text) {
  context.warnings.push({
   severity: "info",
   sectionId: section.id,
   message: `Section "${section.title}" matched ${rule.field} but has no content.`,
  });
  return null;
 }

 return textToLearningFieldValue(rule.field, text);
}

function valueFromLabel(labelValue: string): LearningFieldValue {
 return {
  kind: "text",
  value: labelValue.trim(),
 };
}

function getDirectiveField(section: LearningSection): LearningFieldName | null {
 const directive = section.directives.find((item) => item.type === "field");
 const parsed = learningFieldNameSchema.safeParse(directive?.value);

 return parsed.success ? parsed.data : null;
}

function getDirectiveValues(section: LearningSection) {
 return section.directives.map((directive) => directive.value);
}

function ruleMatchesDirective(section: LearningSection, rule: FieldRule) {
 const directiveField = getDirectiveField(section);
 return Boolean(directiveField && directiveField === rule.field);
}

function headingLevelMatches(
 section: LearningSection,
 levels?: Array<1 | 2 | 3 | 4 | 5 | 6>,
) {
 return !levels || levels.length === 0 || levels.includes(section.level);
}

function ruleMatchesHeading(
 section: LearningSection,
 rule: FieldRule,
 context: ApplyContext,
) {
 if (!headingLevelMatches(section, rule.match.headingLevel)) return false;

 const normalizedTitle = normalizeText(section.title);
 const headingTextMatch = rule.match.headingTexts?.some(
  (headingText) => normalizeText(headingText) === normalizedTitle,
 );

 if (headingTextMatch) return true;

 return Boolean(
  rule.match.headingRegex?.some((pattern) => {
   try {
    return new RegExp(pattern, "iu").test(section.title);
   } catch {
    context.warnings.push({
     severity: "warning",
     message: `Profile rule "${rule.id}" has an invalid headingRegex: ${pattern}`,
    });
    return false;
   }
  }),
 );
}

function matchRuleForSection(
 section: LearningSection,
 rules: FieldRule[],
 context: ApplyContext,
) {
 const directiveMatch = rules.find((rule) => ruleMatchesDirective(section, rule));
 if (directiveMatch) return directiveMatch;

 return (
  rules.find((rule) => ruleMatchesHeading(section, rule, context)) ?? null
 );
}

function roleRuleMatchesSection(
 section: LearningSection,
 rule: SectionRoleRule,
 context: ApplyContext,
) {
 if (!headingLevelMatches(section, rule.match.headingLevel)) return false;

 if (
  rule.match.directive &&
  !getDirectiveValues(section).includes(rule.match.directive)
 ) {
  return false;
 }

 const normalizedTitle = normalizeText(section.title);
 const headingTextMatch = rule.match.headingTexts?.some(
  (headingText) => normalizeText(headingText) === normalizedTitle,
 );

 if (headingTextMatch) return true;

 if (!rule.match.headingRegex) {
  return Boolean(
   rule.match.headingLevel?.includes(section.level) || rule.match.directive,
  );
 }

 try {
  return new RegExp(rule.match.headingRegex, "iu").test(section.title);
 } catch {
  context.warnings.push({
   severity: "warning",
   sectionId: section.id,
   message: `Profile role rule "${rule.id}" has an invalid headingRegex: ${rule.match.headingRegex}`,
  });
  return false;
 }
}

function matchRoleRule(
 section: LearningSection,
 rules: SectionRoleRule[],
 context: ApplyContext,
) {
 return rules.find((rule) => roleRuleMatchesSection(section, rule, context)) ?? null;
}

function parseLabelLine(line: string) {
 const separatorIndex = line.search(/[:：]/);

 if (separatorIndex <= 0) return null;

 return {
  label: line.slice(0, separatorIndex).trim(),
  value: line.slice(separatorIndex + 1).trim(),
 };
}

function collectLabelMatches(
 section: LearningSection,
 rules: FieldRule[],
): LabelMatch[] {
 const lines = section.blocks
  .filter((block) => block.type === "paragraph")
  .flatMap((block) => block.text.split(/\n+/));

 return lines.flatMap((line) => {
  const parsedLine = parseLabelLine(line);
  if (!parsedLine?.value) return [];

  const rule = rules.find((candidate) =>
   candidate.match.labels?.some(
    (label) => normalizeText(label) === normalizeText(parsedLine.label),
   ),
  );

  if (!rule) return [];

  return [
   {
    field: rule.field,
    value: valueFromLabel(parsedLine.value),
    ruleId: rule.id,
   },
  ];
 });
}

function flattenSections(sections: LearningSection[]): LearningSection[] {
 return sections.flatMap((section) => [
  section,
  ...flattenSections(section.children),
 ]);
}

function descendantSections(section: LearningSection): LearningSection[] {
 return section.children.flatMap((child) => [
  child,
  ...descendantSections(child),
 ]);
}

function sectionWithDescendants(section: LearningSection): LearningSection[] {
 return [section, ...descendantSections(section)];
}

function mapRootSection(
 section: LearningSection,
 roleRule: SectionRoleRule,
 profile: ParseProfile,
 context: ApplyContext,
) {
 const item: MappedImportItem = {
  id: section.id,
  target: profile.target,
  role: roleRule.role,
  title: cleanDisplayTitle(section.title),
  sourceSectionId: section.id,
  fields: {},
 };
 const unmappedSections: LearningSection[] = [];
 const notes: string[] = [];

 collectLabelMatches(section, profile.fieldRules).forEach((match) => {
  const rule = profile.fieldRules.find((candidate) => candidate.id === match.ruleId);
  addFieldValue(item, match.field, match.value, rule?.multiple ?? true);
 });

 descendantSections(section).forEach((childSection) => {
  const specialRule = matchRoleRule(
   childSection,
   profile.specialSectionRules,
   context,
  );

  if (specialRule) return;

  const rule = matchRuleForSection(childSection, profile.fieldRules, context);

  if (!rule) {
   if (profile.unknownSectionBehavior === "keepUnmapped") {
    unmappedSections.push(childSection);
    context.warnings.push({
     severity: "warning",
     sectionId: childSection.id,
     message: `No field rule matched child section "${childSection.title}".`,
    });
   }

   if (profile.unknownSectionBehavior === "keepAsNotes") {
    const text = sectionToPlainText(childSection);
    if (text) notes.push(`## ${childSection.title}\n\n${text}`);
   }

   return;
  }

  const value = valueFromSection(childSection, rule, context);
  if (value) addFieldValue(item, rule.field, value, rule.multiple);
 });

 return {
  item,
  unmappedSections,
  notes,
 };
}

function mapSpecialSection(
 section: LearningSection,
 roleRule: SectionRoleRule,
): MappedSpecialSection | null {
 if (roleRule.role !== "readingText" && roleRule.role !== "lessonSummary") {
  return null;
 }

 const nestedContent = descendantSections(section)
  .map((childSection) => {
   const childContent = sectionToPlainText(childSection);
   return childContent ? `## ${childSection.title}\n\n${childContent}` : "";
  })
  .filter(Boolean)
  .join("\n\n");
 const ownContent = sectionToPlainText(section);
 const content = [ownContent, nestedContent].filter(Boolean).join("\n\n");

 return {
  id: section.id,
  role: roleRule.role,
  title: section.title,
  sourceSectionId: section.id,
  content,
 };
}

export function applyParseProfile(
 doc: AppliedParseResult["doc"],
 profile: ParseProfile,
): AppliedParseResult {
 const warnings: ParserWarning[] = [];
 const context: ApplyContext = { warnings };
 const allSections = flattenSections(doc.sections);
 const documentTitleRule = profile.documentTitleRule;
 const documentTitleSection = documentTitleRule
  ? allSections.find((section) =>
     roleRuleMatchesSection(section, documentTitleRule, context),
    )
  : undefined;
 const itemRootPairs = allSections.flatMap((section) => {
  const roleRule = matchRoleRule(section, profile.itemRootRules, context);
  return roleRule ? [{ section, roleRule }] : [];
 });
 const specialSectionPairs = allSections.flatMap((section) => {
  const roleRule = matchRoleRule(section, profile.specialSectionRules, context);
  return roleRule ? [{ section, roleRule }] : [];
 });

 if (itemRootPairs.length === 0) {
  warnings.push({
   severity: "warning",
   message: "No item root sections matched this profile.",
  });
 }

 const mapped = itemRootPairs.map(({ section, roleRule }) =>
  mapRootSection(section, roleRule, profile, context),
 );
 const specialSections = specialSectionPairs.flatMap(({ section, roleRule }) => {
  const mappedSpecialSection = mapSpecialSection(section, roleRule);
  return mappedSpecialSection ? [mappedSpecialSection] : [];
 });
 const consumedSectionIds = new Set<string>();

 if (documentTitleSection) consumedSectionIds.add(documentTitleSection.id);
 itemRootPairs.forEach(({ section }) => {
  sectionWithDescendants(section).forEach((itemSection) =>
   consumedSectionIds.add(itemSection.id),
  );
 });
 specialSectionPairs.forEach(({ section }) => {
  sectionWithDescendants(section).forEach((specialSection) =>
   consumedSectionIds.add(specialSection.id),
  );
 });

 const notes = mapped.flatMap((result) => result.notes);
 const childUnmappedSections = mapped.flatMap((result) => result.unmappedSections);
 const topLevelUnmappedSections =
  profile.unknownSectionBehavior === "keepUnmapped"
   ? allSections.filter((section) => !consumedSectionIds.has(section.id))
   : [];
 const noteSections =
  profile.unknownSectionBehavior === "keepAsNotes"
   ? allSections.filter((section) => !consumedSectionIds.has(section.id))
   : [];

 noteSections.forEach((section) => {
  const text = sectionToPlainText(section);
  if (text) notes.push(`## ${section.title}\n\n${text}`);
 });

 const result: AppliedParseResult = {
  doc,
  profile,
  documentTitle: documentTitleSection
   ? cleanDisplayTitle(documentTitleSection.title)
   : undefined,
  items: mapped.map((result) => result.item),
  specialSections,
  unmappedSections: [...childUnmappedSections, ...topLevelUnmappedSections],
  notes,
  warnings,
 };

 return {
  ...result,
  parseMeta: buildParseMeta(result),
 };
}

export function learningFieldValueToPreview(value: LearningFieldValue) {
 if (value.kind === "text") return value.value;
 if (value.kind === "list") return value.value.join("\n");
 if (value.kind === "examples") {
  return value.value
   .map((example) =>
    [
     example.hanzi,
     example.pinyin ? `Pinyin: ${example.pinyin}` : "",
     example.translation ? `Nghĩa: ${example.translation}` : "",
     example.note ? `Ghi chú: ${example.note}` : "",
    ]
     .filter(Boolean)
     .join("\n"),
   )
   .join("\n\n");
 }

 const rows = [value.value.headers, ...value.value.rows].filter(
  (row) => row.length > 0,
 );
 return rows.map((row) => row.join(" | ")).join("\n");
}

export function sectionBlocksToPreview(section: LearningSection) {
 return blocksToPlainText(section.blocks);
}
