import { z } from "zod";

export const learningBlockTypeSchema = z.enum([
 "paragraph",
 "list",
 "code",
 "quote",
 "table",
 "thematicBreak",
]);

export type LearningBlockType = z.infer<typeof learningBlockTypeSchema>;

export type LearningListItem = {
 id: string;
 blocks: LearningBlock[];
 children: LearningListItem[];
};

export type LearningTable = {
 headers: string[];
 rows: string[][];
};

export type LearningBlock =
 | {
    id: string;
    type: "paragraph";
    text: string;
   }
 | {
    id: string;
    type: "list";
    ordered: boolean;
    items: LearningListItem[];
   }
 | {
    id: string;
    type: "code";
    lang?: string;
    value: string;
   }
 | {
    id: string;
    type: "quote";
    blocks: LearningBlock[];
   }
 | {
    id: string;
    type: "table";
    table: LearningTable;
   }
 | {
    id: string;
    type: "thematicBreak";
   };

export type LearningDirective = {
 type: "field" | "item";
 value: string;
};

export type LearningSection = {
 id: string;
 level: 1 | 2 | 3 | 4 | 5 | 6;
 title: string;
 directives: LearningDirective[];
 blocks: LearningBlock[];
 children: LearningSection[];
};

export type LearningDoc = {
 title: string;
 sections: LearningSection[];
 rawMarkdown: string;
 parseVersion: "hanzihome-md-import-v1";
};

export type ParseProfileTarget =
 | "vocab"
 | "grammar"
 | "exercise"
 | "lessonText"
 | "mixed";

export type UnknownSectionBehavior = "keepUnmapped" | "keepAsNotes" | "ignore";

export type SectionRole =
 | "documentTitle"
 | "grammarItem"
 | "vocabItem"
 | "exerciseSet"
 | "readingText"
 | "lessonSummary"
 | "ignore";

export type LearningFieldName =
 | "vocab.meaning"
 | "vocab.pinyin"
 | "vocab.hanViet"
 | "vocab.pos"
 | "vocab.examples"
 | "vocab.comparisons"
 | "vocab.collocations"
 | "vocab.notes"
 | "grammar.opening"
 | "grammar.core"
 | "grammar.structures"
 | "grammar.blindSpots"
 | "grammar.comparisons"
 | "grammar.traps"
 | "grammar.examples"
 | "grammar.summary"
 | "grammar.notes"
 | "grammar.exercises"
 | "exercise.prompt"
 | "exercise.answer"
 | "exercise.explanation"
 | "exercise.tags"
 | "lessonText.body"
 | "notes";

export type FieldMatchRule = {
 headingLevel?: Array<1 | 2 | 3 | 4 | 5 | 6>;
 headingTexts?: string[];
 headingRegex?: string[];
 labels?: string[];
 directive?: LearningFieldName;
};

export type FieldValueSource =
 | "sectionBlocksText"
 | "wholeSection"
 | "sectionTitle"
 | "firstParagraph"
 | "listItems"
 | "table";

export type FieldRule = {
 id: string;
 field: LearningFieldName;
 match: FieldMatchRule;
 valueFrom: FieldValueSource;
 multiple: boolean;
};

export type SectionRoleRule = {
 id: string;
 role: SectionRole;
 match: {
  headingLevel?: Array<1 | 2 | 3 | 4 | 5 | 6>;
  headingTexts?: string[];
  headingRegex?: string;
  directive?: string;
 };
 titleFrom?: "headingText";
};

export type ParseProfile = {
 id: string;
 name: string;
 target: ParseProfileTarget;
 documentTitleRule?: SectionRoleRule;
 itemRootRules: SectionRoleRule[];
 specialSectionRules: SectionRoleRule[];
 fieldRules: FieldRule[];
 unknownSectionBehavior: UnknownSectionBehavior;
};

export type LearningFieldValue =
 | {
    kind: "text";
    value: string;
   }
 | {
    kind: "list";
    value: string[];
   }
 | {
    kind: "table";
    value: LearningTable;
   };

export type MappedImportItem = {
 id: string;
 target: ParseProfileTarget;
 role: SectionRole;
 title: string;
 sourceSectionId: string;
 fields: Partial<Record<LearningFieldName, LearningFieldValue[]>>;
};

export type MappedSpecialSection = {
 id: string;
 role: Extract<SectionRole, "readingText" | "lessonSummary">;
 title: string;
 sourceSectionId: string;
 content: string;
};

export type ParserWarning = {
 message: string;
 sectionId?: string;
 severity: "info" | "warning";
};

export type AppliedParseResult = {
 doc: LearningDoc;
 profile: ParseProfile;
 documentTitle?: string;
 items: MappedImportItem[];
 specialSections: MappedSpecialSection[];
 unmappedSections: LearningSection[];
 notes: string[];
 warnings: ParserWarning[];
};

export const learningFieldNameSchema = z.enum([
 "vocab.meaning",
 "vocab.pinyin",
 "vocab.hanViet",
 "vocab.pos",
 "vocab.examples",
 "vocab.comparisons",
 "vocab.collocations",
 "vocab.notes",
 "grammar.opening",
 "grammar.core",
 "grammar.structures",
 "grammar.blindSpots",
 "grammar.comparisons",
 "grammar.traps",
 "grammar.examples",
 "grammar.summary",
 "grammar.notes",
 "grammar.exercises",
 "exercise.prompt",
 "exercise.answer",
 "exercise.explanation",
 "exercise.tags",
 "lessonText.body",
 "notes",
]);

const headingLevelSchema = z.union([
 z.literal(1),
 z.literal(2),
 z.literal(3),
 z.literal(4),
 z.literal(5),
 z.literal(6),
]);

const sectionRoleRuleSchema: z.ZodType<SectionRoleRule> = z.object({
 id: z.string().min(1),
 role: z.enum([
  "documentTitle",
  "grammarItem",
  "vocabItem",
  "exerciseSet",
  "readingText",
  "lessonSummary",
  "ignore",
 ]),
 match: z.object({
  headingLevel: z.array(headingLevelSchema).optional(),
  headingTexts: z.array(z.string()).optional(),
  headingRegex: z.string().optional(),
  directive: z.string().optional(),
 }),
 titleFrom: z.literal("headingText").optional(),
});

export const parseProfileSchema: z.ZodType<ParseProfile> = z.object({
 id: z.string().min(1),
 name: z.string().min(1),
 target: z.enum(["vocab", "grammar", "exercise", "lessonText", "mixed"]),
 documentTitleRule: sectionRoleRuleSchema.optional(),
 itemRootRules: z.array(sectionRoleRuleSchema),
 specialSectionRules: z.array(sectionRoleRuleSchema),
 fieldRules: z.array(
  z.object({
   id: z.string().min(1),
   field: learningFieldNameSchema,
   match: z.object({
    headingLevel: z.array(headingLevelSchema).optional(),
    headingTexts: z.array(z.string()).optional(),
    headingRegex: z.array(z.string()).optional(),
    labels: z.array(z.string()).optional(),
    directive: learningFieldNameSchema.optional(),
   }),
   valueFrom: z.enum([
    "sectionBlocksText",
    "wholeSection",
    "sectionTitle",
    "firstParagraph",
    "listItems",
    "table",
   ]),
   multiple: z.boolean(),
  }),
 ),
 unknownSectionBehavior: z.enum(["keepUnmapped", "keepAsNotes", "ignore"]),
});
