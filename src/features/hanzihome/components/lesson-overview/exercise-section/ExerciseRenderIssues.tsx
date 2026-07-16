import type { Exercise } from "@/features/hanzihome/schemas/hanyu-lesson.types";

import { isReadingClozeExercise } from "./exercise-utils";

export function ExerciseRenderIssues({
 item,
 passage,
 answers,
}: {
 item: Exercise;
 passage: unknown;
 answers: unknown[];
}) {
 const issueMeta = isReadingClozeExercise(item, passage, answers);
 if (!issueMeta) return null;

 const { answerCount, markerCount, readingReference, renderer, variant } = issueMeta;
 const issues: string[] = [];

 if (!passage) {
  issues.push(
   readingReference
    ? `Chỉ có tham chiếu bài đọc "${readingReference}", chưa có passage được resolve để render.`
    : "Thiếu passage/text/paragraphs cho bài đọc điền chỗ trống.",
  );
 }

 if (answerCount === 0) {
  issues.push(
   "Không tìm thấy đáp án trong blanks, answers, answer_key, cloze_answers, suggested_answers hoặc questions[].answer.",
  );
 }

 if (passage && answerCount > 0 && markerCount === 0) {
  issues.push("Bài đọc có đáp án nhưng passage chưa có marker/chỗ trống để gắn đáp án.");
 }

 if (markerCount > 0 && answerCount > 0 && markerCount !== answerCount) {
  issues.push(`Số chỗ trống (${markerCount}) không khớp số đáp án (${answerCount}).`);
 }

 if (issues.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-danger/35 bg-danger-subtle p-3 text-sm">
   <p className="font-black text-danger">Không thể render đầy đủ bài tập</p>
   <p className="font-semibold text-text-secondary">
    type: {item.type}
    {variant && ` · variant: ${variant}`}
    {renderer && ` · renderer: ${renderer}`}
   </p>
   <ul className="grid list-disc gap-1 pl-5 font-semibold text-danger">
    {issues.map((issue) => (
     <li key={issue}>{issue}</li>
    ))}
   </ul>
  </div>
 );
}
