"use client";

import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/display/badge";
import { Textarea } from "@/components/ui/forms/textarea";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { InteractionComponentProps } from "../universal-exercise.types";

export function OpenInteractionView({
 item,
 value,
 isSubmitted,
 onChange,
 onSubmit,
}: InteractionComponentProps) {
 const textareaRef = useRef<HTMLTextAreaElement>(null);

 useEffect(() => {
  if (!isSubmitted) {
   textareaRef.current?.focus();
  }
 }, [isSubmitted, item.id]);

 if (item.interaction.type !== "open") {
  return null;
 }

 const { suggestedAnswer } = item.interaction;

 return (
  <div className="grid gap-3">
   <Textarea
    ref={textareaRef}
    density="compact"
    surface="field"
    rows={3}
    value={value}
    disabled={isSubmitted}
    onChange={(e) => onChange(e.target.value)}
    onKeyDown={(e) => {
     if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
     }
    }}
    placeholder="Nhập câu trả lời hoặc dịch của bạn... (Ctrl + Enter để kiểm tra)"
    aria-label="Câu trả lời tự luận"
   />

   {isSubmitted ? (
    <div className="grid gap-1.5 rounded-lg border border-border-default/50 bg-bg-subtle p-3">
     <div className="flex items-center gap-2">
      <Badge variant="accent" size="sm" casing="natural">
       Gợi ý đáp án tham khảo
      </Badge>
     </div>
     <StudyInstructionText tone="default" weight="bold">
      {suggestedAnswer}
     </StudyInstructionText>
    </div>
   ) : null}
  </div>
 );
}
