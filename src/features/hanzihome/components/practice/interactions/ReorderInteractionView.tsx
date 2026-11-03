"use client";

import { useState } from "react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { RotateCcw } from "lucide-react";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { InteractionComponentProps } from "../universal-exercise.types";

export function ReorderInteractionView({
 item,
 isSubmitted,
 isCorrect,
 onChange,
}: InteractionComponentProps) {
 const interaction = item.interaction.type === "reorder" ? item.interaction : null;
 const tokens = interaction?.tokens ?? [];
 const correctOrder = interaction?.correctOrder ?? [];

 // Reset selected indices when item.id changes without useEffect
 const [prevItemId, setPrevItemId] = useState(item.id);
 const [selectedIndices, setSelectedIndices] = useState<readonly number[]>([]);

 if (item.id !== prevItemId) {
  setPrevItemId(item.id);
  setSelectedIndices([]);
 }

 const handleToggleToken = (index: number) => {
  if (isSubmitted) return;

  if (selectedIndices.includes(index)) {
   const next = selectedIndices.filter((i) => i !== index);
   setSelectedIndices(next);
   const serialized = next.map((i) => tokens[i] ?? "").join(" ");
   onChange(serialized);
  } else {
   const next = [...selectedIndices, index];
   setSelectedIndices(next);
   const serialized = next.map((i) => tokens[i] ?? "").join(" ");
   onChange(serialized);
  }
 };

 const handleReset = () => {
  if (isSubmitted) return;
  setSelectedIndices([]);
  onChange("");
 };

 if (!interaction) {
  return null;
 }

 return (
  <div className="grid gap-3">
   {/* Assembled sentence drop area */}
   <div className="min-h-14 rounded-lg border border-dashed border-border-default/80 bg-surface-muted/20 p-2.5">
    {selectedIndices.length === 0 ? (
     <div className="flex h-9 items-center justify-center text-xs text-muted-foreground sm:text-sm">
      Chạm vào các từ bên dưới để ghép câu
     </div>
    ) : (
     <div className="flex flex-wrap items-center gap-1.5">
      {selectedIndices.map((tokenIndex) => {
       const tokenText = tokens[tokenIndex];
       return (
        <Button
         key={`selected-${tokenIndex}`}
         type="button"
         variant="default"
         size="compact"
         disabled={isSubmitted}
         onClick={() => handleToggleToken(tokenIndex)}
        >
         {tokenText}
        </Button>
       );
      })}
     </div>
    )}
   </div>

   {/* Available tokens pool */}
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex flex-wrap items-center gap-1.5">
     {tokens.map((token, index) => {
      const isUsed = selectedIndices.includes(index);
      return (
       <Button
        key={`pool-${token}-${index}`}
        type="button"
        variant="outline"
        size="compact"
        disabled={isSubmitted || isUsed}
        onClick={() => handleToggleToken(index)}
       >
        {token}
       </Button>
      );
     })}
    </div>

    {!isSubmitted && selectedIndices.length > 0 ? (
     <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={handleReset}
      aria-label="Đặt lại câu ghép"
     >
      <RotateCcw className="size-3.5" />
     </Button>
    ) : null}
   </div>

   {isSubmitted ? (
    <div className="flex flex-wrap items-center gap-2 pt-1">
     {isCorrect ? (
      <Badge variant="success" size="md" casing="natural">
       Chính xác!
      </Badge>
     ) : (
      <div className="grid gap-1">
       <Badge variant="warning" size="md" casing="natural">
        Chưa chính xác
       </Badge>
       <StudyInstructionText tone="default" weight="bold">
        Thứ tự đúng: <span className="text-primary">{correctOrder.join(" ")}</span>
       </StudyInstructionText>
      </div>
     )}
    </div>
   ) : null}
  </div>
 );
}
