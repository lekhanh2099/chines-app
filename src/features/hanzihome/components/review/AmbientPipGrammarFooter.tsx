"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

/** Previous / next grammar point navigation and the auto-advance interval cycler. */
export function AmbientPipGrammarFooter({
 handlePrev,
 handleNext,
 handleCycleInterval,
 intervalSeconds,
}: {
 handlePrev: () => void;
 handleNext: () => void;
 handleCycleInterval: () => void;
 intervalSeconds: number;
}) {
 return (
  <div className="flex items-center justify-between border-t border-border-default/40 bg-surface-muted/20 px-3 py-1.5 text-xs">
   <div className="flex items-center gap-1">
    <Button
     type="button"
     variant="ghost"
     size="compact"
     onClick={handlePrev}
     aria-label="Điểm ngữ pháp trước"
    >
     <ChevronLeft className="size-3.5" />
     <span className="hidden sm:inline">Trước</span>
    </Button>

    <Button
     type="button"
     variant="ghost"
     size="compact"
     onClick={handleNext}
     aria-label="Điểm ngữ pháp tiếp theo"
    >
     <span className="hidden sm:inline">Tiếp</span>
     <ChevronRight className="size-3.5" />
    </Button>
   </div>

   <div className="flex items-center gap-1">
    <StudyInstructionText variant="caption" tone="muted">
     Chu kỳ:
    </StudyInstructionText>
    <Button
     type="button"
     variant="ghost"
     size="compact"
     onClick={handleCycleInterval}
     aria-label={`Chu kỳ đổi ngữ pháp: ${intervalSeconds} giây`}
    >
     {`${intervalSeconds}s`}
    </Button>
   </div>
  </div>
 );
}
