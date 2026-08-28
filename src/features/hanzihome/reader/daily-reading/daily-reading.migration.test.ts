import { describe, expect, it } from "vitest";

import {
 legacyDailyReadingRunSchema,
 legacyDailyReadingSchema,
} from "./daily-reading-legacy.schemas";
import {
 createDailyReadingFingerprint,
 migrateLegacyDailyReadingItem,
 migrateLegacyDailyReadingLedger,
 migrateDailyReadingPreviousLedger,
} from "./daily-reading.migration";
import { dailyReadingPreviousLedgerSchema } from "./daily-reading.schemas";

const legacyReading = legacyDailyReadingSchema.parse({
 schemaVersion: "1.0.0",
 id: "daily-2026-08-19-legacy",
 publishedDate: "2026-08-19",
 createdAt: "2026-08-19T03:10:00.000Z",
 releaseKind: "manual",
 titleZh: "年轻人重新走进博物馆",
 titlePinyin: "nián qīng rén",
 titleVi: "Người trẻ quay lại bảo tàng",
 whyWorthReadingVi: "Bài viết nói về một thay đổi văn hóa đáng chú ý.",
 adaptationNoticeVi: "Bản học tập cũ được biên soạn từ nguồn báo chí.",
 topic: "culture",
 level: "HSK5",
 estimatedMinutes: 8,
 paragraphs: [
  {
   id: "p1",
   order: 1,
   zh: "近年来，越来越多年轻人把参观博物馆当成周末生活的一部分。",
   pinyin: "jìn nián lái",
   vi: "Những năm gần đây, ngày càng nhiều người trẻ xem việc tham quan bảo tàng là một phần của cuối tuần.",
   roleVi: "Mở bài",
  },
  {
   id: "p2",
   order: 2,
   zh: "一些博物馆通过夜间开放和专题展览，让传统文化以更轻松的方式进入日常生活。",
   pinyin: "yī xiē bó wù guǎn",
   vi: "Một số bảo tàng mở cửa ban đêm và tổ chức triển lãm chuyên đề để đưa văn hóa truyền thống vào đời sống theo cách nhẹ nhàng hơn.",
   roleVi: "Phát triển",
  },
  {
   id: "p3",
   order: 3,
   zh: "社交平台上的分享也让参观体验从个人活动变成可以交流的话题。",
   pinyin: "shè jiāo píng tái",
   vi: "Việc chia sẻ trên mạng xã hội cũng biến trải nghiệm tham quan từ hoạt động cá nhân thành chủ đề có thể trao đổi.",
   roleVi: "Phát triển",
  },
  {
   id: "p4",
   order: 4,
   zh: "对很多年轻人来说，博物馆不只是保存文物的地方，也是理解城市和历史的一种入口。",
   pinyin: "duì hěn duō",
   vi: "Với nhiều người trẻ, bảo tàng không chỉ là nơi lưu giữ hiện vật mà còn là một lối vào để hiểu thành phố và lịch sử.",
   roleVi: "Kết",
  },
 ],
 vocabulary: Array.from({ length: 8 }, (_value, index) => ({
  id: `v${index + 1}`,
  order: index + 1,
  hanzi: index === 0 ? "博物馆" : `词语${index + 1}`,
  pinyin: index === 0 ? "bó wù guǎn" : "cí yǔ",
  meaningVi: `Nghĩa ${index + 1}`,
  meaningInContextVi: `Nghĩa trong bài ${index + 1}`,
  categoryVi: "Danh từ",
 })),
 grammarPoints: Array.from({ length: 3 }, (_value, index) => ({
  id: `g${index + 1}`,
  patternZh: `结构${index + 1}`,
  explanationVi: `Giải thích ${index + 1}`,
  evidenceSentenceZh:
   "对很多年轻人来说，博物馆不只是保存文物的地方，也是理解城市和历史的一种入口。",
 })),
 questions: [
  {
   id: "q1",
   type: "main_idea",
   promptZh: "文章主要讲什么？",
   promptVi: "Bài chủ yếu nói về điều gì?",
   answerZh: "年轻人与博物馆的新关系。",
   answerVi: "Mối quan hệ mới giữa người trẻ và bảo tàng.",
   evidenceParagraphIds: ["p1", "p4"],
  },
  {
   id: "q2",
   type: "detail",
   promptZh: "博物馆做了什么？",
   promptVi: "Bảo tàng đã làm gì?",
   answerZh: "夜间开放并举办专题展览。",
   answerVi: "Mở cửa ban đêm và tổ chức triển lãm chuyên đề.",
   evidenceParagraphIds: ["p2"],
  },
  {
   id: "q3",
   type: "detail",
   promptZh: "社交平台有什么作用？",
   promptVi: "Mạng xã hội có vai trò gì?",
   answerZh: "让参观体验成为交流话题。",
   answerVi: "Biến trải nghiệm tham quan thành chủ đề trao đổi.",
   evidenceParagraphIds: ["p3"],
  },
  {
   id: "q4",
   type: "inference",
   promptZh: "为什么年轻人更愿意去博物馆？",
   promptVi: "Vì sao người trẻ sẵn lòng đến bảo tàng hơn?",
   answerZh: "参观方式更贴近日常生活。",
   answerVi: "Cách tham quan gần gũi với đời sống hơn.",
   evidenceParagraphIds: ["p2", "p3"],
  },
  {
   id: "q5",
   type: "summary",
   promptZh: "请总结文章。",
   promptVi: "Hãy tóm tắt bài.",
   answerZh: "博物馆正在成为年轻人理解文化和城市的新空间。",
   answerVi: "Bảo tàng đang trở thành không gian mới để người trẻ hiểu văn hóa và thành phố.",
   evidenceParagraphIds: ["p1", "p4"],
  },
 ],
 sourcePhrasesZh: ["夜间开放", "专题展览"],
 verificationSummaryVi: "Dữ liệu học tập của bản cũ đã được kiểm tra theo schema V1.",
 source: {
  titleZh: "年轻人为何爱上博物馆",
  publisher: "中国新闻网",
  url: "https://www.chinanews.com.cn/cul/2026/08-19/1234567.shtml",
  publishedAt: "2026-08-19T01:00:00.000Z",
  capturedAt: "2026-08-19T03:00:00.000Z",
 },
 generatedByProvider: "Groq",
 generatedByModel: "example-model",
 pinyinReviewStatus: "auto-generated",
});

const legacyRun = legacyDailyReadingRunSchema.parse({
 id: "run-legacy-1",
 date: "2026-08-19",
 kind: "manual",
 status: "succeeded",
 stage: "completed",
 attemptedAt: "2026-08-19T03:00:00.000Z",
 completedAt: "2026-08-19T03:10:00.000Z",
 errorCode: "",
 errorDetail: "",
 readingId: legacyReading.id,
});

describe("Daily Reading legacy migration", () => {
 it("preserves the readable legacy article while marking its provenance honestly", () => {
  const migrated = migrateLegacyDailyReadingItem(legacyReading);

  expect(migrated.schemaVersion).toBe("2.0.0");
  expect(migrated.provenance).toBe("legacy-adapted");
  expect(migrated.source).toEqual(legacyReading.source);
  expect(migrated.article.titleZh).toBe(legacyReading.titleZh);
  expect(migrated.article.paragraphs.map((paragraph) => paragraph.zh)).toEqual(
   legacyReading.paragraphs.map((paragraph) => paragraph.zh),
  );
  expect(migrated.classification.targetLevel).toBe("HSK5");
  expect(migrated.classification.estimatedLevel).toBeNull();
 });

 it("drops persisted pinyin while preserving translation and learning data", () => {
  const migrated = migrateLegacyDailyReadingItem(legacyReading);
  const serialized = JSON.stringify(migrated);

  expect(serialized).not.toMatch(/pinyin/iu);
  expect(migrated.enrichment.translation.status).toBe("ready");
  expect(migrated.enrichment.vocabulary.status).toBe("ready");
  expect(migrated.enrichment.grammar.status).toBe("ready");
  expect(migrated.enrichment.questions.status).toBe("ready");

  if (migrated.enrichment.translation.status !== "ready") {
   throw new Error("Expected migrated translation to be ready.");
  }
  if (migrated.enrichment.vocabulary.status !== "ready") {
   throw new Error("Expected migrated vocabulary to be ready.");
  }

  expect(migrated.enrichment.translation.data.paragraphs[0]?.vi).toBe(
   legacyReading.paragraphs[0]?.vi,
  );
  expect(migrated.enrichment.vocabulary.data.items[0]?.hanzi).toBe("博物馆");
 });

 it("creates a deterministic fingerprint from source identity and Chinese content", () => {
  const first = createDailyReadingFingerprint({
   sourceUrl: legacyReading.source.url,
   titleZh: legacyReading.titleZh,
   paragraphsZh: legacyReading.paragraphs.map((paragraph) => paragraph.zh),
  });
  const second = createDailyReadingFingerprint({
   sourceUrl: legacyReading.source.url,
   titleZh: legacyReading.titleZh,
   paragraphsZh: legacyReading.paragraphs.map((paragraph) => paragraph.zh),
  });
  const changed = createDailyReadingFingerprint({
   sourceUrl: legacyReading.source.url,
   titleZh: `${legacyReading.titleZh}新`,
   paragraphsZh: legacyReading.paragraphs.map((paragraph) => paragraph.zh),
  });

  expect(first).toMatch(/^[0-9a-f]{8}$/u);
  expect(second).toBe(first);
  expect(changed).not.toBe(first);
 });

 it("retains legacy run history separately from capture history", () => {
  const ledger = migrateLegacyDailyReadingLedger({ items: [legacyReading], runs: [legacyRun] });

  expect(ledger.items).toHaveLength(1);
  expect(ledger.captureRuns).toEqual([]);
  expect(ledger.enrichmentRuns).toEqual([]);
  expect(ledger.legacyRuns).toEqual([legacyRun]);
 });

 it("adds explicit start and reuse metadata when migrating the 2.1 browser ledger", () => {
  const article = migrateLegacyDailyReadingItem(legacyReading);
  const previous = dailyReadingPreviousLedgerSchema.parse({
   schemaVersion: "2.1.0",
   items: [article],
   captureRuns: [],
   enrichmentRuns: [
    {
     id: "11111111-1111-4111-8111-111111111111",
     runId: "22222222-2222-4222-8222-222222222222",
     articleId: article.id,
     articleFingerprint: article.article.fingerprint,
     module: "translation",
     status: "succeeded",
     attemptedAt: "2026-08-19T03:00:00.000Z",
     completedAt: "2026-08-19T03:10:00.000Z",
     errorCode: "",
     errorDetail: "",
     workflowRunId: "workflow-run-1",
     progressCompleted: 4,
     progressTotal: 4,
     receipt: null,
    },
   ],
   legacyRuns: [],
  });

  const migrated = migrateDailyReadingPreviousLedger(previous);

  expect(migrated.schemaVersion).toBe("2.2.0");
  expect(migrated.enrichmentRuns[0]).toMatchObject({
   startedAt: "2026-08-19T03:00:00.000Z",
   reused: false,
  });
 });
});
