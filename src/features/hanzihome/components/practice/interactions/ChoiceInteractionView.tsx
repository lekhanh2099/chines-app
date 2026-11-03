"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { InteractionComponentProps } from "../universal-exercise.types";

export function ChoiceInteractionView({
 item,
 value,
 isSubmitted,
 isCorrect,
 onChange,
}: InteractionComponentProps) {
 const interaction = item.interaction.type === "choice" ? item.interaction : null;
 const options = useMemo(
  () => (item.interaction.type === "choice" ? item.interaction.options : []),
  [item.interaction],
 );
 const correctKey = interaction?.correctKey ?? "";

 useEffect(() => {
  if (isSubmitted || options.length === 0) return;

  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
   }

   const key = e.key.toUpperCase();
   // Check if 1, 2, 3, 4 pressed
   const numIndex = Number.parseInt(e.key, 10);
   if (!Number.isNaN(numIndex) && numIndex >= 1 && numIndex <= options.length) {
    const selected = options[numIndex - 1];
    if (selected) {
     e.preventDefault();
     onChange(selected.key);
    }
    return;
   }

   // Check if A, B, C, D pressed directly
   const matchedOption = options.find((opt) => opt.key.toUpperCase() === key);
   if (matchedOption) {
    e.preventDefault();
    onChange(matchedOption.key);
   }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isSubmitted, onChange, options]);

 if (!interaction) {
  return null;
 }

 return (
  <div className="grid gap-3">
   <div className="grid gap-2 sm:grid-cols-2">
    {options.map((option, index) => {
     const isSelected = value === option.key;
     const isThisCorrect = option.key === correctKey;

     let variant: "outline" | "active" | "success" | "destructive" = isSelected
      ? "active"
      : "outline";

     if (isSubmitted) {
      if (isThisCorrect) {
       variant = "success";
      } else if (isSelected && !isCorrect) {
       variant = "destructive";
      } else {
       variant = "outline";
      }
     }

     return (
      <Button
       key={option.key}
       type="button"
       role="radio"
       aria-checked={isSelected}
       variant={variant}
       size="touch"
       align="start"
       wrap="normal"
       disabled={isSubmitted}
       onClick={() => {
        onChange(option.key);
       }}
      >
       <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-border-default/60 bg-surface-muted/50 text-xs font-bold">
        {option.key}
       </span>
       <span className="flex-1 font-medium">{option.label}</span>
       <span className="hidden text-xs text-muted-foreground sm:inline">[{index + 1}]</span>
      </Button>
     );
    })}
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
        Đáp án đúng: <span className="text-primary">{correctKey}</span>
       </StudyInstructionText>
      </div>
     )}
    </div>
   ) : null}
  </div>
 );
}
