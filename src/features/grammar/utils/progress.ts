import type {
 GrammarCourseWithLessons,
 GrammarPointWithProgress,
} from "@/types/database";

export function statusFromLevel(
 level: number,
): GrammarPointWithProgress["status"] {
 if (level >= 4) return "mastered";
 if (level >= 2) return "learning";
 return "new";
}

export function applyProgress(
 course: GrammarCourseWithLessons,
 pointId: string,
 level: number,
): GrammarCourseWithLessons {
 const updatePoint = (
  point: GrammarPointWithProgress,
 ): GrammarPointWithProgress =>
  point.id === pointId
   ? { ...point, proficiency_level: level, status: statusFromLevel(level) }
   : point;
 const lessons = course.lessons.map((lesson) => {
  const points = lesson.points.map(updatePoint);
  const mastered = points.filter((point) => point.status === "mastered").length;
  const learning = points.filter((point) => point.status === "learning").length;
  const fresh = points.filter((point) => point.status === "new").length;
  return {
   ...lesson,
   points,
   mastered,
   learning,
   fresh,
   progress: points.length ? Math.round((mastered / points.length) * 100) : 0,
  };
 });
 return { ...course, lessons, points: course.points.map(updatePoint) };
}
