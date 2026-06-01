import q2Manifest from "../../../../data/hanzihome/q2/manifest.json";
import q3Manifest from "../../../../data/hanzihome/q3/manifest.json";

type HeaderLessonNavItem = {
 id: string;
 lessonNumber: number;
 titleZh: string;
 titleVi?: string;
};

type HeaderCourseNavItem = {
 id: string;
 title: string;
 lessons: HeaderLessonNavItem[];
};

type Q2Manifest = typeof q2Manifest;
type Q3Manifest = typeof q3Manifest;

function getQ2Course(manifest: Q2Manifest): HeaderCourseNavItem {
 return {
  id: manifest.course.id,
  title: manifest.course.title,
  lessons: manifest.lessons.map((lesson) => ({
   id: lesson.id,
   lessonNumber: lesson.lessonNumber,
   titleZh: lesson.titleZh,
   titleVi: lesson.titleVi,
  })),
 };
}

function getQ3Course(manifest: Q3Manifest): HeaderCourseNavItem {
 return {
  id: manifest.course.id,
  title: manifest.course.title,
  lessons: manifest.lessons.map((lesson) => ({
   id: lesson.id,
   lessonNumber: lesson.lessonNumber,
   titleZh: lesson.titleZh,
   titleVi: lesson.titleVi,
  })),
 };
}

export const hanzihomeHeaderNavigation = [
 getQ2Course(q2Manifest),
 getQ3Course(q3Manifest),
] satisfies HeaderCourseNavItem[];
