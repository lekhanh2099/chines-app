/**
 * Lightweight sound effects using browser Web Audio API.
 * Zero external audio assets, works 100% offline, zero network overhead.
 */

declare global {
 interface Window {
  webkitAudioContext?: typeof AudioContext;
 }
}

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
 if (typeof window === "undefined") return null;
 try {
  if (!audioCtx) {
   const AudioContextClass = window.AudioContext || window.webkitAudioContext;
   if (AudioContextClass) {
    audioCtx = new AudioContextClass();
   }
  }
  if (audioCtx?.state === "suspended") {
   void audioCtx.resume();
  }
  return audioCtx;
 } catch {
  return null;
 }
}

/**
 * Play a subtle calligraphy brush stroke sound (soft swoosh)
 */
export function playStrokeSuccessSound() {
 const ctx = getAudioContext();
 if (!ctx) return;

 try {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Subtle sine wave starting at 520Hz and gliding down to 420Hz in 90ms
  osc.type = "sine";
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);

  // Soft envelope to prevent clicks
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.09);
 } catch {
  // Graceful degradation if audio is blocked by user policy
 }
}

/**
 * Play a gentle low thud when a stroke is misplaced
 */
export function playStrokeMistakeSound() {
 const ctx = getAudioContext();
 if (!ctx) return;

 try {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.06, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.08);
 } catch {
  // Non-intrusive
 }
}

/**
 * Play a cheerful two-tone chime upon completing an entire character
 */
export function playCharacterCompleteSound() {
 const ctx = getAudioContext();
 if (!ctx) return;

 try {
  const now = ctx.currentTime;

  // Tone 1: E5 (659Hz)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(659, now);
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(0.1, now + 0.02);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 0.25);

  // Tone 2: A5 (880Hz)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(880, now + 0.12);
  gain2.gain.setValueAtTime(0.001, now + 0.12);
  gain2.gain.linearRampToValueAtTime(0.12, now + 0.14);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.12);
  osc2.stop(now + 0.45);
 } catch {
  // Non-intrusive
 }
}

/**
 * Subtle device vibration if supported by mobile platform
 */
export function triggerHaptic(type: "stroke" | "mistake" | "success" = "stroke") {
 if (typeof window === "undefined" || !("vibrate" in navigator)) return;
 try {
  if (type === "stroke") {
   navigator.vibrate(12);
  } else if (type === "mistake") {
   navigator.vibrate([25, 30, 25]);
  } else if (type === "success") {
   navigator.vibrate([30, 40, 60]);
  }
 } catch {
  // Ignore permission or browser restrictions
 }
}
