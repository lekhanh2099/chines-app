export interface OfflineSpeechOptions {
 rate?: number;
 pitch?: number;
 volume?: number;
 onStart?: () => void;
 onEnd?: () => void;
 onError?: (error: Error) => void;
}

export interface OfflineSpeechResult {
 completed: boolean;
 cancelled: boolean;
 usedFallback: boolean;
}

export function isOfflineSpeechSupported(): boolean {
 return (
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  "SpeechSynthesisUtterance" in window
 );
}

export function getPreferredChineseVoice(): SpeechSynthesisVoice | null {
 if (!isOfflineSpeechSupported()) {
  return null;
 }

 try {
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
   return null;
  }

  // 1. Prioritize exact zh-CN / cmn-Hans-CN
  const exactZhCn = voices.find(
   (v) => v.lang === "zh-CN" || v.lang === "cmn-Hans-CN" || v.lang.toLowerCase() === "zh_cn",
  );
  if (exactZhCn) return exactZhCn;

  // 2. Any zh / Chinese voice
  const anyZh = voices.find(
   (v) => v.lang.startsWith("zh") || v.lang.toLowerCase().includes("chinese"),
  );
  if (anyZh) return anyZh;

  return null;
 } catch {
  return null;
 }
}

export function stopOfflineSpeech(): void {
 if (!isOfflineSpeechSupported()) return;
 try {
  window.speechSynthesis.cancel();
 } catch {
  // Non-fatal
 }
}

export function speakChineseOffline(
 text: string,
 options?: OfflineSpeechOptions,
): Promise<OfflineSpeechResult> {
 const normalizedText = text.trim();
 if (!normalizedText) {
  return Promise.resolve({ completed: true, cancelled: false, usedFallback: false });
 }

 if (!isOfflineSpeechSupported()) {
  return Promise.resolve({ completed: false, cancelled: false, usedFallback: false });
 }

 return new Promise((resolve) => {
  try {
   window.speechSynthesis.cancel();

   const UtteranceConstructor = window.SpeechSynthesisUtterance;
   const utterance = new UtteranceConstructor(normalizedText);
   utterance.lang = "zh-CN";

   if (options?.rate !== undefined) {
    utterance.rate = Math.max(0.5, Math.min(2.0, options.rate));
   }
   if (options?.pitch !== undefined) {
    utterance.pitch = Math.max(0.5, Math.min(1.5, options.pitch));
   }
   if (options?.volume !== undefined) {
    utterance.volume = Math.max(0, Math.min(1.0, options.volume));
   }

   const voice = getPreferredChineseVoice();
   if (voice) {
    utterance.voice = voice;
   }

   let isResolved = false;

   utterance.onstart = () => {
    options?.onStart?.();
   };

   utterance.onend = () => {
    if (!isResolved) {
     isResolved = true;
     options?.onEnd?.();
     resolve({ completed: true, cancelled: false, usedFallback: true });
    }
   };

   utterance.onerror = (event) => {
    if (!isResolved) {
     isResolved = true;
     const isCancelled = event.error === "canceled" || event.error === "interrupted";
     if (!isCancelled) {
      options?.onError?.(new Error(`SpeechSynthesis error: ${event.error}`));
     }
     resolve({ completed: !isCancelled, cancelled: isCancelled, usedFallback: true });
    }
   };

   window.speechSynthesis.speak(utterance);
  } catch (err) {
   const error = err instanceof Error ? err : new Error("Offline speech failed");
   options?.onError?.(error);
   resolve({ completed: false, cancelled: false, usedFallback: false });
  }
 });
}
