import { beforeEach, describe, expect, it, vi } from "vitest";
import {
 deleteContentCache,
 hasContentCache,
 writeContentCache,
} from "../local/content-cache-store";
import {
 fetchHanziHomeCourseLessons,
 fetchHanziHomeLessonDetail,
 fetchHanziHomeLessonVocabulary,
} from "../repositories/hanzihome-content-api-client";
import type { HanziHomeLesson } from "@/features/hanzihome/types";
import {
 downloadCourseOfflinePack,
 evictCourseOfflinePack,
 getCourseOfflineStatus,
 type CourseOfflinePackProgress,
} from "./course-offline-pack.service";

vi.mock("@/lib/storage/storage-persistence", () => ({
 requestStoragePersistence: vi.fn().mockResolvedValue({ supported: true, persisted: true }),
}));

vi.mock("../local/content-cache-store", () => ({
 hasContentCache: vi.fn(),
 getContentCacheGeneration: vi.fn().mockResolvedValue(0),
 pinContentCache: vi.fn().mockResolvedValue(true),
 writeContentCache: vi.fn().mockResolvedValue({ written: true, generation: 1 }),
 deleteContentCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../repositories/hanzihome-content-api-client", () => ({
 fetchHanziHomeCourseLessons: vi.fn(),
 fetchHanziHomeLessonDetail: vi.fn(),
 fetchHanziHomeLessonVocabulary: vi.fn(),
}));

type LessonDetail = NonNullable<Awaited<ReturnType<typeof fetchHanziHomeLessonDetail>>>;
type LessonVocab = NonNullable<Awaited<ReturnType<typeof fetchHanziHomeLessonVocabulary>>>;

const createMockDetail = (id: string): LessonDetail => ({
 id,
 lessonNumber: 1,
 titleZh: "第一课",
 title: "Lesson 1",
 vocabIds: [],
 grammarPointIds: [],
 vocab: [],
 grammar: [],
});

const createMockVocab = (lessonId: string): LessonVocab => ({
 lessonId,
 items: [],
 total: 0,
});

const createMockCourseLesson = (id: string, courseId: string): HanziHomeLesson => ({
 id,
 courseId,
 lessonNumber: 1,
 title: "Lesson",
 titleZh: "第一课",
 vocabIds: [],
 grammarPointIds: [],
 vocab: [],
 grammar: [],
});

describe("course-offline-pack.service", () => {
 const userId = "test-user-123";
 const courseId = "hsk-1";

 beforeEach(() => {
  vi.clearAllMocks();
 });

 describe("downloadCourseOfflinePack", () => {
  it("returns early when courseId or userId is missing", async () => {
   const result1 = await downloadCourseOfflinePack({ courseId: "", userId });
   expect(result1.success).toBe(false);

   const result2 = await downloadCourseOfflinePack({ courseId, userId: "" });
   expect(result2.success).toBe(false);
  });

  it("downloads all uncached lessons and updates progress", async () => {
   vi.mocked(hasContentCache).mockResolvedValue(false);

   vi.mocked(fetchHanziHomeLessonDetail).mockResolvedValue(createMockDetail("l1"));
   vi.mocked(fetchHanziHomeLessonVocabulary).mockResolvedValue(createMockVocab("l1"));

   const progressHistory: CourseOfflinePackProgress[] = [];

   const result = await downloadCourseOfflinePack({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
    onProgress: (p) => progressHistory.push({ ...p }),
   });

   expect(result.success).toBe(true);
   expect(result.downloadedCount).toBe(2);
   expect(result.skippedCount).toBe(0);
   expect(result.failedCount).toBe(0);
   expect(result.aborted).toBe(false);

   expect(writeContentCache).toHaveBeenCalledTimes(4); // 2 lessons * 2 resources

   expect(progressHistory.length).toBeGreaterThanOrEqual(2);
   const lastProgress = progressHistory[progressHistory.length - 1];
   expect(lastProgress.completedLessons).toBe(2);
   expect(lastProgress.totalLessons).toBe(2);
   expect(lastProgress.percent).toBe(100);
  });

  it("skips already cached lessons without re-fetching", async () => {
   vi.mocked(hasContentCache).mockResolvedValue(true);

   const result = await downloadCourseOfflinePack({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
   });

   expect(result.success).toBe(true);
   expect(result.downloadedCount).toBe(0);
   expect(result.skippedCount).toBe(2);
   expect(fetchHanziHomeLessonDetail).not.toHaveBeenCalled();
   expect(fetchHanziHomeLessonVocabulary).not.toHaveBeenCalled();
   expect(writeContentCache).not.toHaveBeenCalled();
  });

  it("fetches lessonIds automatically from course catalog if not provided", async () => {
   vi
    .mocked(fetchHanziHomeCourseLessons)
    .mockResolvedValue([createMockCourseLesson("auto-l1", courseId)]);
   vi.mocked(hasContentCache).mockResolvedValue(false);
   vi.mocked(fetchHanziHomeLessonDetail).mockResolvedValue(createMockDetail("auto-l1"));
   vi.mocked(fetchHanziHomeLessonVocabulary).mockResolvedValue(createMockVocab("auto-l1"));

   const result = await downloadCourseOfflinePack({
    courseId,
    userId,
   });

   expect(fetchHanziHomeCourseLessons).toHaveBeenCalledWith(courseId);
   expect(result.downloadedCount).toBe(1);
  });

  it("aborts when AbortSignal is triggered", async () => {
   const controller = new AbortController();
   controller.abort();

   const result = await downloadCourseOfflinePack({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
    signal: controller.signal,
   });

   expect(result.aborted).toBe(true);
   expect(writeContentCache).not.toHaveBeenCalled();
  });

  it("handles partial fetch failures and reports failedCount without throwing", async () => {
   vi.mocked(hasContentCache).mockResolvedValue(false);
   vi
    .mocked(fetchHanziHomeLessonDetail)
    .mockResolvedValueOnce(createMockDetail("l1"))
    .mockRejectedValueOnce(new Error("Network 500"));
   vi.mocked(fetchHanziHomeLessonVocabulary).mockResolvedValue(createMockVocab("l1"));

   const result = await downloadCourseOfflinePack({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
   });

   expect(result.success).toBe(false);
   expect(result.downloadedCount).toBe(1);
   expect(result.failedCount).toBe(1);
  });

  it("A7 Invariant: marks every downloaded resource as offline-pack pinned", async () => {
   vi.mocked(hasContentCache).mockResolvedValue(false);
   vi.mocked(fetchHanziHomeLessonDetail).mockImplementation(async (id) => createMockDetail(id));
   vi.mocked(fetchHanziHomeLessonVocabulary).mockImplementation(async (id) => createMockVocab(id));

   const thirtyLessonIds = Array.from({ length: 30 }, (_, i) => `lesson-${i + 1}`);

   const result = await downloadCourseOfflinePack({
    courseId,
    userId,
    lessonIds: thirtyLessonIds,
   });

   expect(result.success).toBe(true);
   expect(result.downloadedCount).toBe(30);

   // 30 lessons * 2 resources (detail + vocab) = 60 writes
   expect(writeContentCache).toHaveBeenCalledTimes(60);

   // Pinned resources are excluded from ordinary LRU eviction after download.
   expect(writeContentCache).toHaveBeenLastCalledWith(
    expect.objectContaining({
     ownerId: userId,
     pin: true,
    }),
   );

   const lastCallArgs = vi.mocked(writeContentCache).mock.calls[0]?.[0];
   expect(lastCallArgs?.pin).toBe(true);
  });
 });

 describe("getCourseOfflineStatus", () => {
  it("returns fully_cached when all lessons are cached", async () => {
   vi.mocked(hasContentCache).mockResolvedValue(true);

   const status = await getCourseOfflineStatus({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
   });

   expect(status.status).toBe("fully_cached");
   expect(status.cachedLessonsCount).toBe(2);
   expect(status.totalLessonsCount).toBe(2);
  });

  it("returns partially_cached when some lessons are cached", async () => {
   vi
    .mocked(hasContentCache)
    .mockResolvedValueOnce(true) // l1 detail
    .mockResolvedValueOnce(true) // l1 vocab
    .mockResolvedValueOnce(true) // l2 detail
    .mockResolvedValueOnce(false); // l2 vocab

   const status = await getCourseOfflineStatus({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
   });

   expect(status.status).toBe("partially_cached");
   expect(status.cachedLessonsCount).toBe(1);
   expect(status.totalLessonsCount).toBe(2);
  });

  it("returns not_cached when no lessons are cached", async () => {
   vi.mocked(hasContentCache).mockResolvedValue(false);

   const status = await getCourseOfflineStatus({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
   });

   expect(status.status).toBe("not_cached");
   expect(status.cachedLessonsCount).toBe(0);
   expect(status.totalLessonsCount).toBe(2);
  });
 });

 describe("evictCourseOfflinePack", () => {
  it("deletes cached lesson details and vocabularies for all lesson IDs", async () => {
   await evictCourseOfflinePack({
    courseId,
    userId,
    lessonIds: ["l1", "l2"],
   });

   expect(deleteContentCache).toHaveBeenCalledWith(userId, "lesson_detail", "l1");
   expect(deleteContentCache).toHaveBeenCalledWith(userId, "lesson_vocab", "l1");
   expect(deleteContentCache).toHaveBeenCalledWith(userId, "lesson_detail", "l2");
   expect(deleteContentCache).toHaveBeenCalledWith(userId, "lesson_vocab", "l2");
   expect(deleteContentCache).toHaveBeenCalledTimes(4);
  });
 });
});
