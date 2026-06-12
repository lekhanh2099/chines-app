import {
 DEFAULT_HANYU_COURSE_ID,
 HANYU_Q3_COURSE_ID,
 hanzihomeCourses,
} from "@/features/hanzihome/courses/course-catalog";
import {
 requireHanziHomeDbJson,
} from "@/features/hanzihome/static-json/hanzihome-db-static-json";
import type {
 DbDatasetManifest,
 HanziHomeDbDataset,
} from "@/features/hanzihome/static-json/hanzihome-db.types";

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

function datasetToCourseId(dataset: HanziHomeDbDataset) {
 return dataset === "q3" ? HANYU_Q3_COURSE_ID : DEFAULT_HANYU_COURSE_ID;
}

function getCourse(dataset: HanziHomeDbDataset): HeaderCourseNavItem {
 const manifest = requireHanziHomeDbJson<DbDatasetManifest>(
  `${dataset}/manifest.json`,
 );
 const courseId = datasetToCourseId(dataset);

 return {
  id: courseId,
  title:
   hanzihomeCourses.find((course) => course.id === courseId)?.title ??
   manifest.dataset,
  lessons: manifest.lessons.map((lesson) => ({
   id: lesson.id,
   lessonNumber: lesson.lessonIndex,
   titleZh: lesson.title.zh,
   titleVi: lesson.title.vi,
  })),
 };
}

export const hanzihomeHeaderNavigation = [
 getCourse("q2"),
 getCourse("q3"),
] satisfies HeaderCourseNavItem[];
