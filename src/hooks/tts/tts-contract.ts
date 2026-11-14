import { z } from "zod";

export const TTSVoiceSchema = z.object({
 name: z.string(),
 shortName: z.string(),
 gender: z.string(),
 locale: z.string(),
});
export const TTSVoiceListSchema = z.array(TTSVoiceSchema);
export type TTSVoice = z.infer<typeof TTSVoiceSchema>;

export const DEFAULT_RATE = 1;
export const MAX_TTS_TEXT_LENGTH = 10_000;
export const TTS_AUTH_ERROR_MESSAGE =
 "Phiên đăng nhập không hợp lệ. Hãy đăng nhập lại để dùng giọng đọc.";
export const DEFAULT_MANDARIN_VOICE = "zh-CN-XiaoxiaoNeural";
export const MANDARIN_VOICE_STORAGE_KEY = "mandarin_voice_pref";

export const ttsPlaybackResultSchema = z.strictObject({
 completed: z.boolean(),
 cancelled: z.boolean(),
});
export type TTSPlaybackResult = z.output<typeof ttsPlaybackResultSchema>;
export type TTSPlaybackOptions = {
 onProgress?: (progress: number) => void;
 onSettled?: () => void;
 rate: number;
};
export type TTSPlaybackLifecycle = TTSPlaybackOptions & {
 resolve: (result: TTSPlaybackResult) => void;
 reject: (error: Error) => void;
};
export type TTSPreparedAudio = {
 key: string;
 controller: AbortController;
 promise: Promise<Blob>;
};

export type TTSState = z.infer<
 z.ZodObject<{
  isSpeaking: z.ZodBoolean;
  isPaused: z.ZodBoolean;
  isLoading: z.ZodBoolean;
  error: z.ZodNullable<z.ZodString>;
 }>
>;
