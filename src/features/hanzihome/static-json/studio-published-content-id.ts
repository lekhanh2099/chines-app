const studioContentIdPrefix = "hanzihome-studio-";
const studioDictationLessonIdPrefix = "hanzihome-studio-dictation:";
const studioGrammarCourseId = "hanzihome-studio-grammar";

export function isPublishedStudioContentId(contentId: string): boolean {
 return contentId.startsWith(studioContentIdPrefix);
}

export function isPublishedStudioDictationLessonId(lessonId: string): boolean {
 return lessonId.startsWith(studioDictationLessonIdPrefix);
}

export function isPublishedStudioGrammarCourseId(courseId: string): boolean {
 return courseId === studioGrammarCourseId;
}
