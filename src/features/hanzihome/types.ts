import type {
 getHanziHomeGrammarCourse,
 getHanziHomeVocabCourse,
} from "./static-data";

export type HanziHomeVocabLesson = ReturnType<
 typeof getHanziHomeVocabCourse
>["lessons"][number];

export type HanziHomeGrammarLesson = ReturnType<
 typeof getHanziHomeGrammarCourse
>["lessons"][number];
