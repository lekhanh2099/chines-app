import { createStore } from "@tanstack/react-store";

type DialogueVoiceStoreState = {
 /** Voice for the first, third, … speaker of a dialogue. */
 voiceA: string;
 /** Voice for the second, fourth, … speaker of a dialogue. */
 voiceB: string;
};

export const DEFAULT_DIALOGUE_VOICE_A = "zh-CN-XiaoxiaoNeural";
export const DEFAULT_DIALOGUE_VOICE_B = "zh-CN-YunxiNeural";

/** Runtime mirror of the learner's dialogue voice preference, read when speech starts. */
export const dialogueVoiceStore = createStore<
 DialogueVoiceStoreState,
 { setVoices: (voices: DialogueVoiceStoreState) => void }
>({ voiceA: DEFAULT_DIALOGUE_VOICE_A, voiceB: DEFAULT_DIALOGUE_VOICE_B }, ({ setState }) => ({
 setVoices: (voices) => setState(() => voices),
}));

/** Voice for a dialogue speaker position (0 = first speaker). */
export function dialogueVoiceForSpeaker(speakerIndex: number): string {
 const { voiceA, voiceB } = dialogueVoiceStore.state;
 return speakerIndex % 2 === 0 ? voiceA : voiceB;
}
