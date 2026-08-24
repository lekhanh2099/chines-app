"use client";

import { Square, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { cn } from "@/lib/utils";

import { useSharedMandarinTts } from "./MandarinTtsProvider";

export function MandarinSpeakButton({
 text,
 className,
 actionLabel,
 touchTarget = false,
 segments,
 activeOverride,
 disabled = false,
 onStart,
 onStop,
 onFinish,
}: {
 text: string;
 className?: string;
 actionLabel?: string;
 touchTarget?: boolean;
 segments?: readonly string[];
 activeOverride?: boolean;
 disabled?: boolean;
 onStart?: () => void;
 onStop?: () => void;
 onFinish?: () => void;
}) {
 const tts = useSharedMandarinTts();
 const isCoarsePointer = useCoarsePointer();
 const normalizedText = text.trim();
 const normalizedSegments = (segments ?? [normalizedText])
  .map((segment) => segment.trim())
  .filter(Boolean);
 const requestText = normalizedSegments.join("\n");
 const requestActive = (tts.isSpeaking || tts.isLoading) && tts.speakingRequestText === requestText;
 const active = activeOverride ?? requestActive;
 const unavailable = !requestText;
 const accessibleLabel = active ? "Dừng đọc" : actionLabel || `Đọc tiếng Trung: ${normalizedText}`;

 return (
  <Button
   type="button"
   variant={active ? "active" : actionLabel ? "outline" : "ghost"}
   size={actionLabel ? "toolbar" : touchTarget || isCoarsePointer ? "icon" : "icon-xs"}
   className={cn("shrink-0", className)}
   disabled={disabled || (!active && unavailable)}
   title={
    disabled
     ? "Tạm khóa trong chế độ đọc"
     : unavailable
       ? (tts.error ?? "Chưa có nội dung để đọc")
       : accessibleLabel
   }
   aria-label={accessibleLabel}
   aria-pressed={active}
   onClick={() => {
    if (active) {
     tts.stop();
     onStop?.();
     return;
    }

    onStart?.();
    tts.speakSequence(normalizedSegments, onFinish);
   }}
  >
   {active ? <Square /> : <Volume2 />}
   {actionLabel ? <span className="hidden sm:inline">{active ? "Dừng" : actionLabel}</span> : null}
  </Button>
 );
}
