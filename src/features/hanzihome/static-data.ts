import bundle from "../../../data/hanzihome/hanzihome_bundle_clean.json";
import { buildGrammarViewModel } from "@/features/hanzihome/utils/grammar-view-model";
import { buildVocabViewModel } from "@/features/hanzihome/utils/vocab-view-model";
import type {
 HanziHomeData,
 HanziHomeLesson,
 StaticRadicalData,
} from "@/features/hanzihome/types";

function getLessonRadicals(radicals: StaticRadicalData[], lessonNumber: number) {
 const start = (lessonNumber - 1) * 10;
 return radicals.slice(start, start + 10);
}

export function getHanziHomeData(): HanziHomeData {
 const radicals = [...bundle.radicals].sort((a, b) => a.index - b.index);

 const lessons: HanziHomeLesson[] = bundle.lessons.map((lesson) => {
  const vocab = bundle.vocab
   .filter((entry) => entry.lessonId === lesson.id)
   .map((entry) => buildVocabViewModel(entry, lesson));
  const grammar = bundle.grammarPoints
   .filter((point) => point.lessonId === lesson.id)
   .map(buildGrammarViewModel);

  return {
   ...lesson,
   title: `Bài ${lesson.lessonNumber}: ${lesson.titleZh}`,
   vocab,
   grammar,
   radicals: getLessonRadicals(radicals, lesson.lessonNumber),
  };
 });

 return {
  lessons,
  radicals,
  meta: bundle.meta,
 };
}
