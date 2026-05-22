import type {
 GrammarLessonWithStats,
 GrammarPointWithProgress,
} from "@/types/database";

export function getPointSubtitle(point: GrammarPointWithProgress) {
 return (
  point.vietnamese_title ||
  point.content.quick_example?.vi ||
  point.category ||
  "Ngữ pháp"
 );
}

export function pointHasMissingData(point: GrammarPointWithProgress) {
 return (
  !point.content.explanation ||
  !point.content.structures?.length ||
  !point.content.quick_example?.zh ||
  !point.exercises.length
 );
}

export function matchesPoint(point: GrammarPointWithProgress, query: string) {
 const normalized = query.trim().toLowerCase();
 if (!normalized) return true;
 return (
  point.title.toLowerCase().includes(normalized) ||
  point.hanzi?.toLowerCase().includes(normalized) ||
  point.pinyin?.toLowerCase().includes(normalized) ||
  point.vietnamese_title?.toLowerCase().includes(normalized) ||
  point.category?.toLowerCase().includes(normalized) ||
  point.tags.some((tag) => tag.toLowerCase().includes(normalized))
 );
}

export function lessonNumberForPoint(
 point: GrammarPointWithProgress,
 lessonById: Map<string, GrammarLessonWithStats>,
) {
 return point.lesson_id
  ? lessonById.get(point.lesson_id)?.lesson_number ||
     point.content.source_metadata?.lesson_number ||
     0
  : point.content.source_metadata?.lesson_number || 0;
}

export function pointCoachScore(point: GrammarPointWithProgress) {
 if (point.status === "mastered") return 2;
 if (point.status === "learning") return 1;
 return 0;
}

export function stablePointHash(value: string) {
 let hash = 0;
 for (let index = 0; index < value.length; index += 1)
  hash = (hash * 31 + value.charCodeAt(index)) % 9973;
 return hash;
}

export function getCoachCore(point: GrammarPointWithProgress) {
 return (
  point.content.core ||
  point.content.explanation ||
  point.vietnamese_title ||
  getPointSubtitle(point)
 );
}
