"use client";

import { useLearningState } from "@/features/hanzihome/hooks/useLearningState";
import {
 DEFAULT_DIALOGUE_VOICE_A,
 DEFAULT_DIALOGUE_VOICE_B,
} from "@/stores/speech/dialogue-voice-store";

/** The saved A/B dialogue voices and setters that persist them in the learning state. */
export function useDialogueVoicePreference() {
 const learning = useLearningState();
 const voiceA = learning.state.settings.dialogueVoices?.a ?? DEFAULT_DIALOGUE_VOICE_A;
 const voiceB = learning.state.settings.dialogueVoices?.b ?? DEFAULT_DIALOGUE_VOICE_B;
 return {
  voiceA,
  voiceB,
  setVoiceA: (voice: string) =>
   learning.updateSettings({ dialogueVoices: { a: voice, b: voiceB } }),
  setVoiceB: (voice: string) =>
   learning.updateSettings({ dialogueVoices: { a: voiceA, b: voice } }),
 };
}
