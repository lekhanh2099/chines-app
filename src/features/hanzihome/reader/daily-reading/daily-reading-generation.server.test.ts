import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserApiKeyCredential } from "@/services/user-api-keys.service";

import type {
 DailyReadingGenerationStage,
 DailyReadingSourceCandidate,
} from "./daily-reading.schemas";

const { requestDailyReadingProvider, requestDailyReadingSystemGemini } = vi.hoisted(() => ({
 requestDailyReadingProvider: vi.fn(),
 requestDailyReadingSystemGemini: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("./daily-reading-provider.server", () => ({
 requestDailyReadingProvider,
 requestDailyReadingSystemGemini,
}));

import { generateValidatedDailyReading } from "./daily-reading-generation.server";

const credential: UserApiKeyCredential = {
 id: "00000000-0000-4000-8000-000000000001",
 userId: "00000000-0000-4000-8000-000000000002",
 provider: "openai",
 label: "Test OpenAI",
 maskedKey: "sk-••••test",
 isActive: true,
 priority: 0,
 defaultModel: "gpt-4.1-mini",
 lastValidatedAt: "2026-08-18T02:00:00.000Z",
 createdAt: "2026-08-18T02:00:00.000Z",
 updatedAt: "2026-08-18T02:00:00.000Z",
 apiKey: "test-key",
};

const backupCredential: UserApiKeyCredential = {
 ...credential,
 id: "00000000-0000-4000-8000-000000000003",
 provider: "gemini",
 label: "Backup Gemini",
 priority: 1,
 defaultModel: "models/gemini-2.5-flash",
 apiKey: "backup-test-key",
};

const source: DailyReadingSourceCandidate = {
 titleZh: "博物馆推出传统文化暑期新展览",
 publisher: "中国新闻网",
 url: "https://www.chinanews.com.cn/cul/2026/08-18/123.shtml",
 publishedAt: "2026-08-18T02:00:00.000Z",
 topic: "culture",
 extractedTextZh:
  "城市博物馆推出暑期传统文化展览，馆方通过文物图片和互动活动介绍历史生活。学生可以观察展品、比较不同地区的文化特点，并在阅读资料后完成记录。工作人员希望参观者主动提问、查找资料和讨论文化保护，让一次参观变成更完整的学习过程。".repeat(
   5,
  ),
};

const sentenceA =
 "城市博物馆推出暑期传统文化展览，馆方通过文物图片和互动活动介绍历史生活，学生在参观过程中可以观察展品、阅读说明、提出问题，并把看到的细节记录下来，从而更具体地理解传统文化与日常生活之间的联系。";
const sentenceB =
 "为了避免学习只停留在记住年代和名称，讲解员会鼓励学生比较不同地区的器物特点，再根据展厅里的文字和图片说明寻找答案，这种过程让参观者能够主动整理信息并形成自己的判断。";
const sentenceC =
 "馆方还设计了体验活动，让参与者观察材料和制作方法，并讨论传统手艺为什么会随着生活方式发生变化，活动中的问题都可以根据展览提供的信息继续查找和验证。";
const sentenceD =
 "工作人员表示，博物馆希望参观者不仅获得知识，也能够主动提问、查找资料和与同伴交流，因此一次普通参观可以逐渐变成包含观察、阅读、讨论和总结的学习过程。";
const sentenceE =
 "未来馆方会根据学生和教师的反馈调整讲解内容，并继续与学校合作开发适合不同年龄学习者的公共教育活动，使博物馆里的文化资源能够更自然地进入日常学习。";
const expansion =
 "这些安排把展厅里的信息变成可以观察、比较、讨论和总结的学习材料，也让学生能够根据已经看到的证据继续提出更具体的问题。";

const validCore = {
 titleZh: "从博物馆展览开始主动学习",
 titleVi: "Bắt đầu học chủ động từ một triển lãm bảo tàng",
 whyWorthReadingVi:
  "Bài đọc luyện cách trình bày hoạt động văn hóa, mục đích giáo dục và quan hệ nguyên nhân – kết quả.",
 topic: "culture",
 level: "HSK5",
 estimatedMinutes: 8,
 paragraphs: [sentenceA, sentenceB, sentenceC, sentenceD, sentenceE].map((zh, index) => ({
  zh: `${zh}${expansion}`,
  vi: `Bản dịch tiếng Việt sát nghĩa của đoạn ${index + 1}, giữ nguyên quan hệ thông tin trong câu tiếng Trung.`,
  roleVi: index === 0 ? "mở vấn đề" : index === 4 ? "kết luận" : "thân bài",
 })),
};

const validLearning = {
 vocabulary: [
  "博物馆",
  "传统文化",
  "展览",
  "观察",
  "展品",
  "讲解员",
  "参与者",
  "生活方式",
  "查找资料",
  "公共教育",
 ].map((hanzi, index) => ({
  hanzi,
  meaningVi: `nghĩa ${index + 1}`,
  meaningInContextVi: `nghĩa trong bài ${index + 1}`,
  categoryVi: "từ/cụm từ",
 })),
 grammarPoints: [
  { patternZh: "不仅……也……", explanationVi: "Nối hai ý tăng tiến.", evidenceSentenceZh: sentenceD },
  { patternZh: "为了……", explanationVi: "Nêu mục đích.", evidenceSentenceZh: sentenceB },
  { patternZh: "根据……", explanationVi: "Nêu căn cứ.", evidenceSentenceZh: sentenceE },
 ],
 questions: [
  {
   type: "main_idea",
   promptZh: "这篇文章主要说明什么？",
   promptVi: "Bài chủ yếu nói về điều gì?",
   answerZh: "博物馆可以通过展览和活动促进主动学习。",
   answerVi: "Bảo tàng có thể thúc đẩy học chủ động qua triển lãm và hoạt động.",
   evidenceParagraphNumbers: [1, 4],
  },
  {
   type: "detail",
   promptZh: "学生在展厅里可以做什么？",
   promptVi: "Học sinh có thể làm gì trong phòng trưng bày?",
   answerZh: "他们可以观察展品、阅读说明、提出问题并记录细节。",
   answerVi: "Có thể quan sát hiện vật, đọc chú thích, đặt câu hỏi và ghi lại chi tiết.",
   evidenceParagraphNumbers: [1],
  },
  {
   type: "detail",
   promptZh: "讲解员为什么让学生比较器物特点？",
   promptVi: "Vì sao hướng dẫn viên cho học sinh so sánh đặc điểm hiện vật?",
   answerZh: "为了让学习不只停留在记住年代和名称。",
   answerVi: "Để việc học không chỉ dừng ở ghi nhớ niên đại và tên gọi.",
   evidenceParagraphNumbers: [2],
  },
  {
   type: "inference",
   promptZh: "从活动设计可以看出馆方重视哪种学习方式？",
   promptVi: "Có thể suy ra bảo tàng coi trọng cách học nào?",
   answerZh: "馆方重视通过观察、提问、查找和验证来主动学习。",
   answerVi: "Bảo tàng coi trọng học chủ động qua quan sát, đặt câu hỏi, tìm và kiểm chứng.",
   evidenceParagraphNumbers: [2, 3],
  },
  {
   type: "summary",
   promptZh: "请概括博物馆如何把参观变成学习过程。",
   promptVi: "Hãy khái quát cách bảo tàng biến tham quan thành quá trình học.",
   answerZh: "它通过展览、讲解、体验和讨论，让参观者观察信息、提出问题并总结理解。",
   answerVi: "Qua triển lãm, thuyết minh, trải nghiệm và thảo luận, người xem quan sát, đặt câu hỏi và tổng kết.",
   evidenceParagraphNumbers: [1, 3, 4],
  },
 ],
 sourcePhrasesZh: ["传统文化展览", "主动提问"],
 verificationSummaryVi:
  "Bản học tập chỉ sử dụng các ý được nguồn cung cấp và phần câu hỏi bám vào văn bản đã khóa.",
};

function providerResult(data: object, model = "gpt-4.1-mini") {
 return { content: JSON.stringify(data), error: null, model };
}

describe("validated Daily Reading generation", () => {
 beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-18T04:00:00.000Z"));
  vi.clearAllMocks();
  requestDailyReadingSystemGemini.mockResolvedValue({
   content: null,
   error: "system Gemini unavailable in test",
   model: "models/gemini-3.1-flash-lite",
  });
 });

 afterEach(() => {
  vi.useRealTimers();
 });

 it("builds pinyin and source-grounded learning data from two validated AI stages", async () => {
  requestDailyReadingProvider
   .mockResolvedValueOnce(providerResult(validCore))
   .mockResolvedValueOnce(providerResult(validLearning));
  const progress: DailyReadingGenerationStage[] = [];

  const reading = await generateValidatedDailyReading({
   source,
   preferredLevel: "HSK5",
   mode: "manual",
   credentials: [credential],
   onProgress: (stage) => progress.push(stage),
  });

  expect(reading.publishedDate).toBe("2026-08-18");
  expect(reading.titlePinyin.length).toBeGreaterThan(0);
  expect(reading.paragraphs.every((paragraph) => paragraph.pinyin.length > 0)).toBe(true);
  expect(reading.vocabulary.every((item) => item.pinyin.length > 0)).toBe(true);
  expect(reading.vocabulary.every((item) => reading.paragraphs.some((p) => p.zh.includes(item.hanzi)))).toBe(
   true,
  );
  expect(reading.pinyinReviewStatus).toBe("auto-generated");
  expect(progress).toEqual(["drafting", "enriching", "validating", "finalizing"]);
  expect(requestDailyReadingProvider).toHaveBeenCalledTimes(2);
  expect(requestDailyReadingSystemGemini).not.toHaveBeenCalled();
 });

 it("repairs a structurally valid but too-short core before generating learning material", async () => {
  const tooShortCore = {
   ...validCore,
   paragraphs: validCore.paragraphs.map((paragraph) => ({ ...paragraph, zh: "博物馆介绍传统文化。" })),
  };
  requestDailyReadingProvider
   .mockResolvedValueOnce(providerResult(tooShortCore))
   .mockResolvedValueOnce(providerResult(validCore))
   .mockResolvedValueOnce(providerResult(validLearning));
  const progress: DailyReadingGenerationStage[] = [];

  const reading = await generateValidatedDailyReading({
   source,
   preferredLevel: "HSK5",
   mode: "scheduled",
   credentials: [credential],
   onProgress: (stage) => progress.push(stage),
  });

  expect(reading.releaseKind).toBe("scheduled");
  expect(progress).toContain("repairing_core");
  expect(requestDailyReadingProvider).toHaveBeenCalledTimes(3);
 });

 it("tries the next active BYOK credential before falling back to system Gemini", async () => {
  requestDailyReadingProvider
   .mockResolvedValueOnce({ content: null, error: "primary provider unavailable", model: "gpt-4.1-mini" })
   .mockResolvedValueOnce(providerResult(validCore, "models/gemini-2.5-flash"))
   .mockResolvedValueOnce({ content: null, error: "primary provider unavailable", model: "gpt-4.1-mini" })
   .mockResolvedValueOnce(providerResult(validLearning, "models/gemini-2.5-flash"));

  const reading = await generateValidatedDailyReading({
   source,
   preferredLevel: "HSK5",
   mode: "manual",
   credentials: [credential, backupCredential],
  });

  expect(reading.generatedByProvider).toBe("gemini");
  expect(reading.generatedByModel).toBe("models/gemini-2.5-flash");
  expect(requestDailyReadingProvider).toHaveBeenCalledTimes(4);
  expect(requestDailyReadingProvider.mock.calls[0]?.[0].credential.id).toBe(credential.id);
  expect(requestDailyReadingProvider.mock.calls[1]?.[0].credential.id).toBe(backupCredential.id);
  expect(requestDailyReadingSystemGemini).not.toHaveBeenCalled();
 });

 it("falls back to system Gemini only after all personal providers fail", async () => {
  requestDailyReadingProvider.mockResolvedValue({
   content: null,
   error: "personal provider unavailable",
   model: "gpt-4.1-mini",
  });
  requestDailyReadingSystemGemini
   .mockResolvedValueOnce(providerResult(validCore, "models/gemini-3.1-flash-lite"))
   .mockResolvedValueOnce(providerResult(validLearning, "models/gemini-3.1-flash-lite"));

  const reading = await generateValidatedDailyReading({
   source,
   preferredLevel: "HSK5",
   mode: "manual",
   credentials: [credential],
  });

  expect(reading.generatedByProvider).toBe("Google Gemini");
  expect(reading.generatedByModel).toBe("models/gemini-3.1-flash-lite");
  expect(requestDailyReadingSystemGemini).toHaveBeenCalledTimes(2);
 });
});