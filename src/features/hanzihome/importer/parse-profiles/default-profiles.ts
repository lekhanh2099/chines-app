import {
 parseProfileSchema,
 type FieldRule,
 type LearningFieldName,
 type ParseProfile,
 type SectionRole,
 type SectionRoleRule,
} from "@/features/hanzihome/importer/importer.types";

function roleRule(
 id: string,
 role: SectionRole,
 options: SectionRoleRule["match"] & {
  titleFrom?: SectionRoleRule["titleFrom"];
 },
): SectionRoleRule {
 return {
  id,
  role,
  match: {
   headingLevel: options.headingLevel,
   headingTexts: options.headingTexts,
   headingRegex: options.headingRegex,
   directive: options.directive,
  },
  titleFrom: options.titleFrom,
 };
}

function textRule(
 id: string,
 field: LearningFieldName,
 options: {
  headingLevel?: FieldRule["match"]["headingLevel"];
  headingTexts?: string[];
  headingRegex?: string[];
  labels?: string[];
  valueFrom?: FieldRule["valueFrom"];
  multiple?: boolean;
 },
): FieldRule {
 return {
  id,
  field,
  match: {
   headingLevel: options.headingLevel,
   headingTexts: options.headingTexts,
   headingRegex: options.headingRegex,
   labels: options.labels ?? options.headingTexts,
   directive: field,
  },
  valueFrom: options.valueFrom ?? "wholeSection",
  multiple: options.multiple ?? true,
 };
}

const vocabSevenPartProfile: ParseProfile = {
 id: "builtin-vocab-7-part",
 name: "Vocab 7-part",
 target: "vocab",
 documentTitleRule: roleRule("vocab-document-title", "documentTitle", {
  headingLevel: [1],
 }),
 itemRootRules: [
  roleRule("vocab-h2-item", "vocabItem", {
   headingLevel: [2],
   titleFrom: "headingText",
  }),
 ],
 specialSectionRules: [],
 unknownSectionBehavior: "keepUnmapped",
 fieldRules: [
  textRule("vocab-meaning", "vocab.meaning", {
   headingTexts: ["Nghĩa", "Ý nghĩa", "Meaning"],
  }),
  textRule("vocab-pinyin", "vocab.pinyin", {
   headingTexts: ["Pinyin", "Phiên âm"],
   multiple: false,
  }),
  textRule("vocab-han-viet", "vocab.hanViet", {
   headingTexts: ["Hán Việt"],
   multiple: false,
  }),
  textRule("vocab-pos", "vocab.pos", {
   headingTexts: ["Từ loại", "POS"],
   multiple: false,
  }),
  textRule("vocab-examples", "vocab.examples", {
   headingTexts: ["Ví dụ", "Examples", "Câu ví dụ"],
  }),
  textRule("vocab-comparisons", "vocab.comparisons", {
   headingTexts: ["So sánh", "Dễ nhầm"],
  }),
  textRule("vocab-collocations", "vocab.collocations", {
   headingTexts: ["Kết hợp", "Collocations"],
  }),
  textRule("vocab-notes", "vocab.notes", {
   headingTexts: ["Lưu ý", "Cảnh báo", "Sai thường gặp"],
  }),
 ],
};

const grammarLessonProfile: ParseProfile = {
 id: "grammar-lesson-profile",
 name: "Grammar lesson - PHẦN/H3",
 target: "grammar",
 documentTitleRule: roleRule("grammar-document-title", "documentTitle", {
  headingLevel: [1],
 }),
 itemRootRules: [
  roleRule("grammar-phan-item", "grammarItem", {
   headingLevel: [2],
   headingRegex: "^PHẦN\\s+[IVX]+\\s*:",
   titleFrom: "headingText",
  }),
 ],
 specialSectionRules: [
  roleRule("grammar-reading", "readingText", {
   headingLevel: [2],
   headingRegex: "^BÀI ĐỌC",
  }),
  roleRule("grammar-summary", "lessonSummary", {
   headingLevel: [2],
   headingRegex: "^TỔNG KẾT",
  }),
 ],
 unknownSectionBehavior: "keepUnmapped",
 fieldRules: [
  textRule("grammar-opening", "grammar.opening", {
   headingLevel: [3],
   headingRegex: ["Câu mở khóa"],
   multiple: false,
  }),
  textRule("grammar-core", "grammar.core", {
   headingLevel: [3],
   headingRegex: ["Bản chất|Công thức"],
   multiple: false,
  }),
  textRule("grammar-blind-spots", "grammar.blindSpots", {
   headingLevel: [3],
   headingRegex: ["Điểm mù|quy tắc ẩn"],
   multiple: false,
  }),
  textRule("grammar-comparisons", "grammar.comparisons", {
   headingLevel: [3],
   headingRegex: ["So sánh|dễ nhầm"],
  }),
  textRule("grammar-traps", "grammar.traps", {
   headingLevel: [3],
   headingRegex: ["Bẫy tư duy"],
  }),
  textRule("grammar-examples", "grammar.examples", {
   headingLevel: [3],
   headingRegex: ["Ví dụ"],
  }),
  textRule("grammar-summary-field", "grammar.summary", {
   headingLevel: [3],
   headingRegex: ["Chốt bản chất"],
   multiple: false,
  }),
  textRule("grammar-structures", "grammar.structures", {
   headingLevel: [3],
   headingTexts: ["Cấu trúc", "Công thức"],
  }),
  textRule("grammar-notes", "grammar.notes", {
   headingLevel: [3],
   headingTexts: ["Lưu ý", "Sai thường gặp"],
  }),
  textRule("grammar-exercises", "grammar.exercises", {
   headingLevel: [3],
   headingTexts: ["Bài tập"],
  }),
 ],
};

const exerciseProfile: ParseProfile = {
 id: "builtin-exercise",
 name: "Exercise set",
 target: "exercise",
 documentTitleRule: roleRule("exercise-document-title", "documentTitle", {
  headingLevel: [1],
 }),
 itemRootRules: [
  roleRule("exercise-h2-set", "exerciseSet", {
   headingLevel: [2],
   titleFrom: "headingText",
  }),
 ],
 specialSectionRules: [],
 unknownSectionBehavior: "keepUnmapped",
 fieldRules: [
  textRule("exercise-prompt", "exercise.prompt", {
   headingTexts: ["Câu hỏi", "Prompt"],
  }),
  textRule("exercise-answer", "exercise.answer", {
   headingTexts: ["Đáp án", "Answer"],
  }),
  textRule("exercise-explanation", "exercise.explanation", {
   headingTexts: ["Giải thích", "Explanation"],
  }),
  textRule("exercise-tags", "exercise.tags", {
   headingTexts: ["Tags", "Ngữ pháp", "Từ vựng"],
   valueFrom: "listItems",
  }),
 ],
};

export const defaultImportProfiles: ParseProfile[] = [
 grammarLessonProfile,
 vocabSevenPartProfile,
 exerciseProfile,
].map((profile) => parseProfileSchema.parse(profile));

export function getDefaultImportProfile(profileId: string) {
 return defaultImportProfiles.find((profile) => profile.id === profileId) ?? null;
}
