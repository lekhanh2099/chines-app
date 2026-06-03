import type { HanyuLesson } from "./schemas/hanyuLesson.schema";

export function getHanyuLessonMeta(lessonDocument: HanyuLesson) {
 const lessonMeta = lessonDocument.lesson.metadata;
 const source = lessonDocument.source;
 const lessonNumber = lessonMeta?.lesson_index ?? source?.lesson_index ?? 0;

 return {
  legacyId: lessonMeta?.legacy_id || "",
  book: lessonMeta?.book || source?.book || "",
  volume: lessonMeta?.volume || source?.volume || "",
  volumeVi: lessonMeta?.volume_vi || source?.volume_vi || "",
  lessonIndex: lessonNumber,
  lessonNumberCn: lessonMeta?.lesson_number_cn || source?.lesson_number_cn || "",
  titleZh:
   lessonDocument.lesson.title.zh ||
   lessonMeta?.lesson_title_cn ||
   source?.lesson_title_cn ||
   `Bài ${lessonNumber}`,
  titlePinyin:
   lessonDocument.lesson.title.pinyin ||
   lessonMeta?.lesson_title_pinyin ||
   source?.lesson_title_pinyin ||
   "",
  titleVi:
   lessonDocument.lesson.title.vi ||
   lessonMeta?.lesson_title_vi ||
   source?.lesson_title_vi ||
   "",
  titleEn:
   lessonDocument.lesson.title.en ||
   lessonMeta?.lesson_title_en ||
   source?.lesson_title_en ||
   "",
  sourceFiles: lessonMeta?.source_files ?? source?.source_files ?? [],
 };
}

export function getHanyuLessonIndex(lessonDocument: HanyuLesson) {
 return getHanyuLessonMeta(lessonDocument).lessonIndex;
}
