import { describe, expect, it } from "vitest";

import {
 buildCanonicalSeedPackage,
 buildDictationSeedPackage,
 buildDailyReadingSeedPackage,
 buildHskGrammarSeedPackage,
 buildHskSeedPackage,
 buildHumanitiesSeedPackage,
 buildReaderSeedPackage,
 buildPersonalLearningSeedPackage,
} from "./hanzihome-studio-import";
import {
 hskReadingSchema,
 grammarDatasetSchema,
 dictationCourseSchema,
 dailyReadingSchema,
 personalCurriculumSchema,
 exerciseBankSchema,
 humanitiesItemSchema,
 studioInventoryBaseline,
 readingCourseSchema,
 type StudioInventory,
} from "./hanzihome-studio-inventory";

describe("Hanzi Studio canonical seed package", () => {
 it("creates stable HanziHome lesson, section, and vocabulary IDs", () => {
  const course = readingCourseSchema.parse({
   units: [
    {
     id: "unit-1",
     number: 1,
     code: "U1",
     titleZh: "第一单元",
     titleVi: "Đơn nguyên một",
     displayTitleVi: "Đơn nguyên 1",
     focusVi: "Trọng tâm",
     shortVi: "Đơn nguyên một",
    },
   ],
   coreLessons: [
    {
     id: "core-1",
     slug: "core-1",
     unitId: "unit-1",
     titleZh: "核心课",
     titleVi: "Bài cốt lõi",
     paragraphs: [
      {
       id: "paragraph-1",
       order: 1,
       zh: "你好",
       pinyin: "Nǐ hǎo",
       vi: "Xin chào",
       roleVi: "Mở bài",
      },
     ],
     vocabulary: [
      {
       id: "vocab-1",
       order: 1,
       hanzi: "你好",
       pinyin: "nǐ hǎo",
       meaningVi: "Xin chào",
       meaningInContextVi: "Lời chào",
       category: "phrase",
       categoryVi: "Cụm từ",
       level: "HSK1",
      },
     ],
     exerciseGroups: [],
    },
   ],
   mockLessons: [],
   reinforcementLessons: [],
  });

  const first = buildCanonicalSeedPackage(course, "reading-course.json");
  const second = buildCanonicalSeedPackage(course, "reading-course.json");

  expect(first.courses).toHaveLength(1);
  expect(first.books).toHaveLength(1);
  expect(first.lessons.map((lesson) => lesson.id)).toEqual(
   second.lessons.map((lesson) => lesson.id),
  );
  expect(first.lessonSections.map((section) => section.id)).toEqual(
   second.lessonSections.map((section) => section.id),
  );
  expect(first.vocabItems[0]?.id).toBe("hanzihome-studio-reading:core-1:vocab:vocab-1");
  expect(first.lessonSections).toHaveLength(2);
  expect(first.lessonTexts).toHaveLength(1);
 });

 it("keeps canonical Reader references and licensed assets in the seed package", () => {
  const course = readingCourseSchema.parse({
   units: [
    {
     id: "unit-1",
     number: 1,
     code: "U1",
     titleZh: "第一单元",
     titleVi: "Đơn nguyên một",
     displayTitleVi: "Đơn nguyên 1",
     focusVi: "Trọng tâm",
     shortVi: "Đơn nguyên một",
    },
   ],
   coreLessons: [
    {
     id: "core-1",
     slug: "core-1",
     unitId: "unit-1",
     titleZh: "核心课",
     titleVi: "Bài cốt lõi",
     paragraphs: [
      {
       id: "paragraph-1",
       order: 1,
       zh: "你好",
       pinyin: "Nǐ hǎo",
       vi: "Xin chào",
       roleVi: "Mở bài",
      },
     ],
     vocabulary: [
      {
       id: "vocab-1",
       order: 1,
       hanzi: "你好",
       pinyin: "nǐ hǎo",
       meaningVi: "Xin chào",
       meaningInContextVi: "Lời chào",
       category: "phrase",
       categoryVi: "Cụm từ",
       level: "HSK1",
      },
     ],
     exerciseGroups: [],
    },
   ],
   mockLessons: [],
   reinforcementLessons: [],
  });
  const canonical = buildCanonicalSeedPackage(course, "reading-course.json");
  const inventory: StudioInventory = {
   root: "/tmp/hanzi-studio",
   ...studioInventoryBaseline,
   assets: [
    {
     path: "public/resources/book.pdf",
     sha256: "a".repeat(64),
     bytes: 10,
    },
   ],
   previewAssets: [
    {
     path: "public/resources/book-1.webp",
     sha256: "b".repeat(64),
     bytes: 20,
    },
   ],
  };
  const reader = buildReaderSeedPackage(course, canonical, inventory);

  expect(reader.documents).toHaveLength(1);
  expect(reader.paragraphs).toHaveLength(1);
  expect(reader.vocabularyLinks).toEqual([
   expect.objectContaining({
    document_id: "hanzihome-studio-reading:core-1",
    vocab_item_id: "hanzihome-studio-reading:core-1:vocab:vocab-1",
   }),
  ]);
  expect(reader.assets).toEqual([
   expect.objectContaining({
    asset_type: "pdf",
    external_url: "/resources/book.pdf",
    redistribution_allowed: true,
   }),
   expect.objectContaining({
    asset_type: "image",
    external_url: "/resources/book-1.webp",
   }),
  ]);
 });

 it("imports HSK passages as typed Reader documents with canonical lesson references", () => {
  const hsk = hskReadingSchema.parse({
   importedAt: "2026-08-01T20:13:00+07:00",
   schemaVersion: "1.1.0",
   titleVi: "Đọc HSK",
   titleZh: "HSK 阅读",
   sources: [
    {
     fileName: "hsk-reading-passages.json",
     id: "hsk-source",
     passageCount: 1,
     pinyinReviewStatus: "context-reviewed",
     sha256: "a".repeat(64),
    },
   ],
   passages: [
    {
     id: "hsk3-independent-passages-lesson-1-text-1",
     lessonNumber: 1,
     lessonTitleVi: "Bài một",
     lessonTitleZh: "第一课",
     level: 3,
     paragraphs: [
      {
       id: "paragraph-1",
       order: 1,
       pinyin: "Nǐ hǎo",
       roleVi: "Mở đầu",
       vi: "Xin chào",
       zh: "你好",
      },
     ],
     pinyinReviewStatus: "context-reviewed",
     slug: "hsk-lesson-1-text-1",
     sourceId: "hsk-source-passage-1",
     textNumber: 1,
     titleVi: "Đoạn một",
     titleZh: "第一段",
     volumeId: "hsk3-independent-passages",
     volumeLabelVi: "HSK 3",
     volumeLabelZh: "HSK 3 独立短文",
    },
   ],
  });
  const seed = buildHskSeedPackage(hsk);

  expect(seed.canonical.books).toHaveLength(1);
  expect(seed.canonical.lessons).toHaveLength(1);
  expect(seed.canonical.lessonSections).toHaveLength(1);
  expect(seed.reader.documents).toEqual([
   expect.objectContaining({
    kind: "hsk",
    lesson_id: "hanzihome-studio-reading:hsk:hsk3-independent-passages-lesson-1-text-1",
   }),
  ]);
  expect(seed.reader.paragraphs).toEqual([
   expect.objectContaining({ role_vi: "Mở đầu", paragraph_order: 1 }),
  ]);
 });

 it("imports HSK grammar into canonical points, examples, and detail sections", () => {
  const dataset = grammarDatasetSchema.parse({
   schema_version: "hsk_grammar_v1.0.0",
   dataset_id: "grammar-hsk1",
   level: "HSK1",
   language: "zh-CN",
   ui_language: "vi-VN",
   item_count: 1,
   items: [
    {
     id: "hsk1-g001",
     type: "grammar_point",
     order: 1,
     source_no: 1,
     title: "否定",
     title_vi: "Phủ định",
     focus: ["不"],
     level: "HSK1",
     categories: ["negation"],
     core: "Dùng 不 để phủ định thói quen.",
     structures: ["S + 不 + V"],
     usage_notes: ["Dùng cho hiện tại và tương lai."],
     constraints: [],
     contrasts: [],
     common_errors: [],
     examples: {
      basic: [
       {
        zh: "我不喝茶。",
        pinyin: "wǒ bù hē chá.",
        vi: "Tôi không uống trà.",
        note_vi: "Ví dụ cơ bản.",
        origin: "editorial",
       },
      ],
     },
     source_ref: { primary: "Grammar source", pdf_page: 1, grammar_no: 1 },
     verification: {
      status: "editorially_reviewed",
      source_preserved: true,
      source_examples_normalized: true,
      notes: "Đã kiểm tra.",
     },
    },
   ],
  });
  const seed = buildHskGrammarSeedPackage([dataset], "2026-08-01T00:00:00.000Z");

  expect(seed.canonical.courses).toHaveLength(1);
  expect(seed.canonical.books).toHaveLength(1);
  expect(seed.canonical.lessons).toHaveLength(1);
  expect(seed.canonical.grammarPoints).toEqual([
   expect.objectContaining({ id: "hanzihome-studio-grammar:hsk1-g001", point_order: 1 }),
  ]);
  expect(seed.canonical.grammarExamples).toEqual([
   expect.objectContaining({ id: "hanzihome-studio-grammar:hsk1-g001:example:basic:1" }),
  ]);
  expect(seed.canonical.grammarDetailSections).toEqual([
   expect.objectContaining({ section_key: "focus" }),
   expect.objectContaining({ section_key: "categories" }),
   expect.objectContaining({ section_key: "source" }),
   expect.objectContaining({ section_key: "verification" }),
  ]);
 });

 it("imports dictation segments into canonical listening items", () => {
  const dictation = dictationCourseSchema.parse({
   importedAt: "2026-08-01",
   schemaVersion: "1.0.0",
   sources: [{ id: "dictation-source" }],
   books: [
    {
     id: "hsk5",
     level: 5,
     titleVi: "HSK 5",
     titleZh: "HSK 5",
     volumes: [
      {
       id: "hsk5-volume-1",
       titleVi: "Quyển một",
       titleZh: "第一册",
       volume: 1,
       lessons: [
        {
         id: "hsk5-lesson-01",
         number: 1,
         passageTranslationVi: null,
         sourceId: "dictation-passage-01",
         titleVi: "Bài một",
         titleZh: "第一课",
         translationScope: "sentence",
         segments: [
          {
           id: "segment-01",
           order: 1,
           pinyin: "Nǐ hǎo",
           vi: "Xin chào",
           zh: "你好",
          },
         ],
        },
       ],
      },
     ],
    },
   ],
  });
  const seed = buildDictationSeedPackage(dictation, "2026-08-01T00:00:00.000Z");

  expect(seed.canonical.books).toHaveLength(1);
  expect(seed.canonical.lessons).toHaveLength(1);
  expect(seed.canonical.lessonTexts).toHaveLength(1);
  expect(seed.canonical.lessonSections).toEqual([
   expect.objectContaining({ section_type: "listening", section_key: "studio-dictation" }),
  ]);
  expect(seed.canonical.listeningItems).toEqual([
   expect.objectContaining({
    id: "hanzihome-studio-dictation:hsk5-lesson-01:segment:segment-01",
    item_type: "dictation",
    category: "extra_practice",
    transcript_zh: "你好",
    section_id: expect.any(String),
    transcript: expect.objectContaining({ full: { zh: "你好", pinyin: "Nǐ hǎo", vi: "Xin chào" } }),
    answer: { type: "text", accepted: ["你好"] },
   }),
  ]);
 });

 it("imports daily reading paragraphs, vocabulary, grammar, and questions", () => {
  const daily = dailyReadingSchema.parse({
   schemaVersion: "1.0.0",
   id: "daily-1",
   publishedDate: "2026-07-22",
   createdAt: "2026-07-22T03:00:00.000Z",
   origin: "seed",
   releaseKind: "seed",
   titleZh: "每日阅读",
   titlePinyin: "",
   titleVi: "Đọc mỗi ngày",
   whyWorthReadingVi: "Luyện đọc",
   adaptationNoticeVi: "Bản học tập",
   topic: "culture",
   level: "HSK5",
   estimatedMinutes: 9,
   paragraphs: [
    { id: "p1", order: 1, zh: "你好", pinyin: "Nǐ hǎo", vi: "Xin chào", roleVi: "Mở đầu" },
   ],
   vocabulary: [
    {
     id: "v1",
     order: 1,
     hanzi: "你好",
     pinyin: "nǐ hǎo",
     meaningVi: "Xin chào",
     meaningInContextVi: "Lời chào",
     categoryVi: "Cụm từ",
    },
   ],
   grammarPoints: [
    {
     id: "g1",
     patternZh: "不再",
     explanationVi: "Không còn",
     evidenceSentenceZh: "他们不再急。",
    },
   ],
   questions: [
    {
     id: "q1",
     type: "main_idea",
     promptZh: "主要内容？",
     promptVi: "Nội dung chính?",
     answerZh: "你好。",
     answerVi: "Xin chào.",
     evidenceParagraphIds: ["p1"],
    },
   ],
  });
  const seed = buildDailyReadingSeedPackage(daily, "2026-07-22T03:00:00.000Z");

  expect(seed.reader.documents).toEqual([expect.objectContaining({ kind: "daily" })]);
  expect(seed.reader.paragraphs).toHaveLength(1);
  expect(seed.reader.vocabularyLinks).toHaveLength(1);
  expect(seed.reader.exerciseGroups).toHaveLength(1);
  expect(seed.reader.exerciseItems).toHaveLength(1);
  expect(seed.canonical.vocabItems).toHaveLength(1);
  expect(seed.canonical.grammarPoints).toHaveLength(1);
  expect(seed.canonical.grammarExamples).toHaveLength(1);
 });

 it("imports personal-learning lessons and exercises into Reader-owned records", () => {
  const curriculum = personalCurriculumSchema.parse({
   schemaVersion: 1,
   lessons: [
    {
     id: "de-01",
     knowledgeNodeId: "de",
     order: 1,
     titleVi: "Trợ từ de",
     titleZh: "的",
     levelVi: "HSK3",
     estimatedMinutes: 12,
     reviewStatus: "reviewed",
     confidence: "high",
     essentialQuestionVi: "Dùng 的 thế nào?",
     learningObjectivesVi: ["Nhận diện 的"],
     keyIdeaVi: "的 nối định ngữ với danh từ.",
     originNote: "seed",
     decisionTreeVi: [],
     concepts: [],
     masteryChecklistVi: ["Đặt câu đúng"],
     sourceIds: ["source-de"],
     parts: [
      {
       id: "part-de",
       formZh: "的",
       coreMeaningVi: "Nối định ngữ với danh từ.",
       examples: [{ zh: "我买的书", vi: "cuốn sách tôi mua" }],
      },
     ],
     formulaFlows: [],
    },
   ],
  });
  const exerciseBank = exerciseBankSchema.parse({
   schemaVersion: 1,
   knowledgeNodeId: "de",
   exercises: [
    {
     id: "de-ex-01",
     knowledgeNodeId: "de",
     lessonId: "de-01",
     exerciseType: "multiple-choice",
     difficulty: 1,
     order: 1,
     promptVi: "Chọn đáp án đúng",
     contextVi: "",
     stimulusZh: "我的书",
     options: [
      { id: "a", text: "我的书" },
      { id: "b", text: "我书的" },
     ],
     correctOptionIds: ["a"],
     acceptedAnswersZh: [],
     explanationVi: "的 đứng sau định ngữ.",
     distractorNotesVi: [],
     tags: ["de"],
     sourceIds: ["source-de"],
     reviewStatus: "reviewed",
     confidence: 1,
     origin: "seed",
     createdAt: "2026-08-01T00:00:00+07:00",
     updatedAt: "2026-08-01T00:00:00+07:00",
    },
    {
     id: "de-ex-02",
     knowledgeNodeId: "de",
     lessonId: "de-01",
     exerciseType: "sentence-transformation",
     difficulty: 1,
     order: 2,
     promptVi: "Viết lại câu theo cấu trúc mục tiêu",
     contextVi: "Giữ nguyên nghĩa.",
     stimulusZh: "我买书。",
     options: [],
     correctOptionIds: [],
     acceptedAnswersZh: ["我买的书。"],
     explanationVi: "Câu trả lời cần dùng 的 để nối định ngữ.",
     distractorNotesVi: [],
     tags: ["de"],
     sourceIds: ["source-de"],
     reviewStatus: "reviewed",
     confidence: 1,
     origin: "seed",
     createdAt: "2026-08-01T00:00:00+07:00",
     updatedAt: "2026-08-01T00:00:00+07:00",
    },
   ],
  });
  const seed = buildPersonalLearningSeedPackage(
   curriculum,
   [exerciseBank],
   "2026-08-01T00:00:00.000Z",
  );

  expect(seed.canonical.lessons).toEqual([
   expect.objectContaining({ id: "hanzihome-studio-personal-learning:de-01" }),
  ]);
  expect(seed.reader.documents).toEqual([
   expect.objectContaining({
    kind: "personal",
    lesson_id: "hanzihome-studio-personal-learning:de-01",
   }),
  ]);
  expect(seed.reader.exerciseGroups).toEqual([
   expect.objectContaining({
    id: "hanzihome-studio-personal-learning:de-01:exercises",
    exercise_type: "short_answer",
   }),
  ]);
  expect(seed.reader.exerciseItems).toEqual([
   expect.objectContaining({
    id: "hanzihome-studio-personal-learning:de-01:exercises:de-ex-01",
    item_type: "multiple_choice",
   }),
   expect.objectContaining({
    id: "hanzihome-studio-personal-learning:de-01:exercises:de-ex-02",
    item_type: "short_answer",
    payload: expect.objectContaining({
     answerZh: "我买的书。",
     scoring: "manual",
     answerVi: "Câu trả lời cần dùng 的 để nối định ngữ.",
    }),
   }),
  ]);
  expect(seed.reader.paragraphs).toEqual([
   expect.objectContaining({ zh: "的", paragraph_order: 1 }),
   expect.objectContaining({ zh: "我买的书", paragraph_order: 2 }),
  ]);
 });

 it("imports humanities source segments and review exercises as Reader lessons", () => {
  const item = humanitiesItemSchema.parse({
   id: "translation-01",
   slug: "meeting-change",
   version: "1.0.0",
   kind: "translation",
   status: "published",
   titleZh: "会议改期",
   titleVi: "Cuộc họp đổi lịch",
   subtitleVi: "Trung → Việt",
   difficulty: "intermediate-low",
   estimatedMinutes: 10,
   tags: ["biên dịch"],
   source: {},
   rights: { redistributionAllowed: true },
   review: {},
   text: {
    script: "mixed",
    originalText: "会议改期。",
    normalizedText: "会议改期。",
    segments: [
     {
      id: "s1",
      order: 1,
      textZh: "会议改期。",
      pinyin: null,
      lexicalGlossVi: null,
      literalTranslationVi: "Cuộc họp đổi lịch.",
      naturalTranslationVi: "Cuộc họp đổi lịch.",
      alignmentStatus: "verified",
     },
    ],
    variants: [],
   },
   glossary: [],
   annotations: [],
   claims: [],
   exercises: [
    {
     id: "exercise-1",
     type: "self-translation",
     promptVi: "Dịch câu này.",
     evidenceIds: [],
     sampleAnswers: ["Cuộc họp đổi lịch."],
    },
   ],
   translation: {
    direction: "zh-vi",
    informationUnits: [
     {
      id: "unit-1",
      type: "action",
      canonicalMeaningVi: "đổi lịch",
      required: true,
      weight: 1,
      acceptedRealizations: ["đổi lịch"],
     },
    ],
    rubric: {
     dimensions: [{ id: "meaning", labelVi: "Đúng nghĩa", weight: 100, deterministic: true }],
    },
    references: [{ id: "ref-1", text: "Cuộc họp đổi lịch." }],
   },
  });
  const seed = buildHumanitiesSeedPackage([item], "2026-08-01T00:00:00.000Z");

  expect(seed.canonical.courses).toEqual([
   expect.objectContaining({ id: "hanzihome-studio-humanities", type: "humanities" }),
  ]);
  expect(seed.reader.documents).toEqual([
   expect.objectContaining({ kind: "humanities", slug: "meeting-change" }),
  ]);
  expect(seed.reader.paragraphs).toEqual([
   expect.objectContaining({ zh: "会议改期。", vi: "Cuộc họp đổi lịch." }),
  ]);
  expect(seed.reader.exerciseItems).toEqual([
   expect.objectContaining({
    item_type: "answer_review",
    payload: expect.objectContaining({
     evaluation: expect.objectContaining({ mode: "translation", direction: "zh-vi" }),
    }),
   }),
  ]);
 });
});
