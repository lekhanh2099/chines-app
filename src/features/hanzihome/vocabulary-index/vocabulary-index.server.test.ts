import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
 getAggregateItems: vi.fn(),
 getAggregateVocabRevision: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/features/hanzihome/repositories/hanzihome-content-repository", () => ({
 hanzihomeContentRepository: repository,
}));

import { getVocabularyEntries, getVocabularyPage } from "./vocabulary-index.server";

const courseWord = (meaning: string) => ({
 id: "lesson-1__vocab-1",
 wordId: "word-1",
 courseId: "course-1",
 bookId: "book-1",
 lessonId: "lesson-1",
 lessonNumber: 1,
 lessonOrder: 1,
 lessonTitle: "第一课",
 word: "仅课程词",
 pinyin: "jǐn kèchéng cí",
 hanViet: "",
 meaning,
 category: "Từ vựng",
 level: null,
 pos: { vi: null, zh: null },
});

describe("vocabulary store course cache", () => {
 beforeEach(() => {
  repository.getAggregateItems.mockReset();
  repository.getAggregateVocabRevision.mockReset();
 });

 it("reads course vocabulary once per content revision", async () => {
  repository.getAggregateVocabRevision.mockResolvedValue("revision-1");
  repository.getAggregateItems.mockResolvedValue([courseWord("nghĩa cũ")]);
  await getVocabularyPage({ ownerId: "owner-1", query: "", page: 1 });
  await getVocabularyPage({ ownerId: "owner-1", query: "", page: 2 });
  const [cached] = await getVocabularyEntries({ ownerId: "owner-1", hanzi: "仅课程词" });
  expect(repository.getAggregateItems).toHaveBeenCalledTimes(1);
  expect(cached?.occurrences[0]?.meaning).toBe("nghĩa cũ");

  repository.getAggregateVocabRevision.mockResolvedValue("revision-2");
  repository.getAggregateItems.mockResolvedValue([courseWord("nghĩa mới")]);
  const [edited] = await getVocabularyEntries({ ownerId: "owner-1", hanzi: "仅课程词" });
  expect(repository.getAggregateItems).toHaveBeenCalledTimes(2);
  expect(edited?.occurrences[0]?.meaning).toBe("nghĩa mới");
 });

 it("does not read course vocabulary for a signed-out visitor", async () => {
  await getVocabularyPage({ ownerId: "", query: "", page: 1 });
  expect(repository.getAggregateVocabRevision).not.toHaveBeenCalled();
  expect(repository.getAggregateItems).not.toHaveBeenCalled();
 });
});
