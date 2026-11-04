"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/forms/input";
import { Badge } from "@/components/ui/display/badge";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { InteractionComponentProps } from "../universal-exercise.types";

export function ClozeInteractionView({
 item,
 value,
 isSubmitted,
 isCorrect,
 onChange,
 onSubmit,
}: InteractionComponentProps) {
 const inputRef = useRef<HTMLInputElement>(null);

 useEffect(() => {
  if (!isSubmitted) {
   inputRef.current?.focus();
  }
 }, [isSubmitted, item.id]);

 if (item.interaction.type !== "cloze") {
  return null;
 }

 const { expectedAnswer, placeholder, preText, postText } = item.interaction;

 return (
  <div className="grid gap-3">
   <div className="flex flex-wrap items-center gap-2 text-base sm:text-lg">
    {preText ? <span className="font-medium text-foreground">{preText}</span> : null}

    <div className="min-w-28 max-w-xs flex-1">
     <Input
      ref={inputRef}
      density="compact"
      surface="card"
      value={value}
      disabled={isSubmitted}
      validation={isSubmitted ? (isCorrect ? "success" : "danger") : "none"}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
       if (e.key === "Enter" && !e.nativeEvent.isComposing && value.trim()) {
        e.preventDefault();
        onSubmit();
       }
      }}
      placeholder={placeholder ?? "Nhập từ..."}
      aria-label="Đáp án điền từ"
     />
    </div>

    {postText ? <span className="font-medium text-foreground">{postText}</span> : null}
   </div>

   {isSubmitted ? (
    <div className="flex flex-wrap items-center gap-2 pt-1">
     {isCorrect ? (
      <Badge variant="success" size="md" casing="natural">
       Chính xác!
      </Badge>
     ) : (
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant="warning" size="md" casing="natural">
        Chưa chính xác
       </Badge>
       <StudyInstructionText tone="default" weight="bold">
        Đáp án đúng: <span className="text-primary">{expectedAnswer}</span>
       </StudyInstructionText>
      </div>
     )}
    </div>
   ) : null}
  </div>
 );
}
