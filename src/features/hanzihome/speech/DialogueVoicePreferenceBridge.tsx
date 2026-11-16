"use client";

import { useEffect } from "react";

import { useLearningSettings } from "@/features/hanzihome/hooks/useLearningState";
import {
 DEFAULT_DIALOGUE_VOICE_A,
 DEFAULT_DIALOGUE_VOICE_B,
 dialogueVoiceStore,
} from "@/stores/speech/dialogue-voice-store";

/** Mirrors the saved A/B dialogue voices into the speech runtime used by every Reader. */
export function DialogueVoicePreferenceBridge() {
 const dialogueVoices = useLearningSettings().dialogueVoices;
 const voiceA = dialogueVoices?.a ?? DEFAULT_DIALOGUE_VOICE_A;
 const voiceB = dialogueVoices?.b ?? DEFAULT_DIALOGUE_VOICE_B;

 useEffect(() => {
  dialogueVoiceStore.actions.setVoices({ voiceA, voiceB });
 }, [voiceA, voiceB]);

 return null;
}
