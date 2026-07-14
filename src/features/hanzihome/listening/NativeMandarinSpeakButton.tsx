"use client";

import { Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useSharedNativeMandarinTts } from "./NativeMandarinTtsProvider";

export function NativeMandarinSpeakButton({
 text,
 className,
 actionLabel,
}: {
 text: string;
 className?: string;
 actionLabel?: string;
}) {
 const tts = useSharedNativeMandarinTts();
 const normalizedText = text.trim();
 const active = tts.isSpeaking && tts.speakingText === normalizedText;
 const unavailable = !normalizedText || !tts.selectedVoice;
 const accessibleLabel = active ? "Dừng đọc" : actionLabel || `Đọc tiếng Trung: ${normalizedText}`;

 return (
  <Button
   type="button"
   variant={active ? "active" : actionLabel ? "outline" : "ghost"}
   size={actionLabel ? "sm" : "icon-xs"}
   className={cn("shrink-0", className)}
   disabled={unavailable}
   title={unavailable ? (tts.error ?? "Chưa có giọng Mandarin zh-CN") : accessibleLabel}
   aria-label={accessibleLabel}
   aria-pressed={active}
   onClick={() => (active ? tts.stop() : tts.speak(normalizedText))}
  >
   {active ? <Square /> : <Volume2 />}
   {actionLabel ? <span className="hidden sm:inline">{active ? "Dừng" : actionLabel}</span> : null}
  </Button>
 );
}
