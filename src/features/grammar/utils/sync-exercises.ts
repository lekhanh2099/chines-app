import {
 buildExerciseAnswer,
 buildExerciseContent,
 type ExerciseDraft,
} from "@/features/grammar/utils/exercise";
import type { DbGrammarExercise } from "@/types/database";

export async function syncExercises(
 pointId: string,
 courseId: string,
 lessonId: string | null,
 existing: DbGrammarExercise[],
 drafts: ExerciseDraft[],
) {
 const keepIds = new Set(drafts.map((draft) => draft.id).filter(Boolean));
 await Promise.all(
  existing
   .filter((exercise) => !keepIds.has(exercise.id))
   .map((exercise) =>
    fetch(`/api/grammar/exercises/${exercise.id}`, { method: "DELETE" }),
   ),
 );
 await Promise.all(
  drafts
   .filter((draft) => draft.prompt.trim())
   .map((draft, index) => {
    const body = {
     course_id: courseId,
     lesson_id: lessonId,
     point_id: pointId,
     exercise_type: draft.exercise_type,
     prompt: draft.prompt,
     content: buildExerciseContent(draft),
     answer: buildExerciseAnswer(draft),
     explanation: draft.explanation,
     exercise_order: index + 1,
    };
    return fetch(
     draft.id ? `/api/grammar/exercises/${draft.id}` : "/api/grammar/exercises",
     {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
     },
    );
   }),
 );
}
