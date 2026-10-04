import { createRoot } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../../../messages/vi/listening.json";
import { DEFAULT_LESSON_DISPLAY_MODE } from "../components/lesson-overview/types";
import { ListeningExerciseItems } from "./ListeningExerciseItems";
import type { ListeningRuntimeItem } from "./listening.types";

// The fixture pins Study mode; production UI and grading utilities remain real.
export function useHanziHomeEditMode() {
 return false;
}
export function useHanziHomeFeatureActions() {
 return { openEditableNode: () => {} };
}
const blank: ListeningRuntimeItem = {
 id: "blank",
 sectionId: "fixture",
 order: 1,
 type: "fill_blank",
 options: [],
 metadata: { promptParts: ["我喜欢", "。"], acceptedAnswers: ["学习"] },
};
const matching: ListeningRuntimeItem = {
 id: "matching",
 sectionId: "fixture",
 order: 2,
 type: "matching",
 options: [],
 metadata: {
  left: [{ id: "left", textZh: "水", textVi: "Nước" }],
  right: [{ id: "right", textZh: "河", textVi: "Sông" }],
 },
 answer: { type: "matching", pairs: [{ left: "left", right: "right" }] },
};
const common = {
 showPinyin: false,
 showMeaning: false,
 showScript: false,
 hideScriptBeforeCheck: true,
 showTranslationAfterCheck: true,
 displayMode: DEFAULT_LESSON_DISPLAY_MODE,
 onSpeak: () => {},
 onSpeakSequence: () => {},
 lessonId: "fixture",
};
const container = document.createElement("main");
document.body.append(container);
createRoot(container).render(
 <NextIntlClientProvider locale="vi" messages={{ Listening: messages }} timeZone="Asia/Ho_Chi_Minh">
  <section aria-label="Fill answer fixture">
   <ListeningExerciseItems {...common} exerciseType="fill_blank" items={[blank]} />
  </section>
  <section aria-label="Matching fixture">
   <ListeningExerciseItems {...common} exerciseType="matching" items={[matching]} />
  </section>
 </NextIntlClientProvider>,
);
