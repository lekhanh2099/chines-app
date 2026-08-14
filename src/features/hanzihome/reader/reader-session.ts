import { z } from "zod";

export const readerSessionStateSchema = z.strictObject({
 activeParagraphIndex: z.number().int().nonnegative(),
 showPinyin: z.boolean(),
 showMeaning: z.boolean(),
 autoAdvance: z.boolean(),
 loopCurrent: z.boolean(),
 focusMode: z.boolean(),
 shadowing: z.boolean(),
 completed: z.boolean(),
 summaryText: z.string(),
 answers: z.record(z.string().min(1), z.string()),
});

export type ReaderSessionState = z.output<typeof readerSessionStateSchema>;

export const emptyReaderSessionState: ReaderSessionState = {
 activeParagraphIndex: 0,
 showPinyin: false,
 showMeaning: false,
 autoAdvance: false,
 loopCurrent: false,
 focusMode: false,
 shadowing: false,
 completed: false,
 summaryText: "",
 answers: {},
};

export function moveReaderParagraph(
 state: ReaderSessionState,
 nextIndex: number,
 paragraphCount: number,
): ReaderSessionState {
 if (paragraphCount <= 0) return { ...state, activeParagraphIndex: 0 };
 return {
  ...state,
  activeParagraphIndex: Math.min(paragraphCount - 1, Math.max(0, nextIndex)),
 };
}

export function toggleReaderAutoAdvance(state: ReaderSessionState): ReaderSessionState {
 const autoAdvance = !state.autoAdvance;
 return { ...state, autoAdvance, loopCurrent: autoAdvance ? false : state.loopCurrent };
}

export function toggleReaderLoop(state: ReaderSessionState): ReaderSessionState {
 const loopCurrent = !state.loopCurrent;
 return { ...state, loopCurrent, autoAdvance: loopCurrent ? false : state.autoAdvance };
}

export function resolveReaderPlaybackEnd(
 state: ReaderSessionState,
 paragraphCount: number,
): ReaderSessionState {
 if (state.loopCurrent || paragraphCount <= 0) return state;
 if (state.autoAdvance && state.activeParagraphIndex < paragraphCount - 1) {
  return moveReaderParagraph(state, state.activeParagraphIndex + 1, paragraphCount);
 }
 return { ...state, completed: true };
}

export function setReaderAnswer(
 state: ReaderSessionState,
 answerId: string,
 answer: string,
): ReaderSessionState {
 return { ...state, answers: { ...state.answers, [answerId]: answer } };
}
