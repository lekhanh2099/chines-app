import type { HanziHomeModule } from "@/features/hanzihome/types";

type StudyModule = Exclude<HanziHomeModule, "radicals">;

const moduleValues = [
 "overview",
 "lessonText",
 "listening",
 "dictation",
 "script",
 "notes",
 "vocab",
 "grammar",
 "review",
 "practice",
 "radicals",
] as const satisfies readonly HanziHomeModule[];

const standardLessonModules = new Set<StudyModule>([
 "overview",
 "lessonText",
 "notes",
 "vocab",
 "grammar",
 "review",
 "practice",
]);
const listeningLessonModules = new Set<StudyModule>(["listening", "dictation"]);

export function parseHanziHomeModule(value: string | null | undefined): HanziHomeModule | null {
 return moduleValues.find((item) => item === value) ?? null;
}

export function resolveLessonModule({
 requestedModule,
 isListeningLesson,
}: {
 requestedModule: HanziHomeModule;
 isListeningLesson: boolean;
}): StudyModule {
 const candidate: StudyModule = requestedModule === "radicals" ? "overview" : requestedModule;
 const allowedModules = isListeningLesson ? listeningLessonModules : standardLessonModules;

 if (allowedModules.has(candidate)) return candidate;
 return isListeningLesson ? "listening" : "overview";
}
