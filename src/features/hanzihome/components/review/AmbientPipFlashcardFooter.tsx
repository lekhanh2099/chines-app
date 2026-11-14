"use client";

import { BookmarkPlus, Check, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

/** Previous / flip / next navigation, the private-vault toggle and the interval cycler. */
export function AmbientPipFlashcardFooter({
 handlePrev,
 handleToggleFlip,
 handleNext,
 isCurrentInVault,
 handleToggleCurrentVault,
 handleCycleInterval,
 intervalSeconds,
}: {
 handlePrev: () => void;
 handleToggleFlip: () => void;
 handleNext: () => void;
 isCurrentInVault: boolean;
 handleToggleCurrentVault: () => void;
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
     aria-label="Từ trước đó"
    >
     <ChevronLeft className="size-3.5" />
     <span className="hidden sm:inline">Trước</span>
    </Button>

    <Button
     type="button"
     variant="outline"
     size="compact"
     onClick={handleToggleFlip}
     aria-label="Lật thẻ"
    >
     <RotateCw className="size-3" />
     <span>Lật thẻ</span>
    </Button>

    <Button
     type="button"
     variant="ghost"
     size="compact"
     onClick={handleNext}
     aria-label="Từ tiếp theo"
    >
     <span className="hidden sm:inline">Tiếp</span>
     <ChevronRight className="size-3.5" />
    </Button>
   </div>

   <div className="flex items-center gap-1">
    <Button
     type="button"
     variant={isCurrentInVault ? "active" : "ghost"}
     size="compact"
     onClick={handleToggleCurrentVault}
     title={
      isCurrentInVault ? "Đã lưu trong Kho riêng (nhấn để gỡ)" : "Thêm từ này vào Kho từ vựng riêng"
     }
     aria-label={isCurrentInVault ? "Đã lưu trong Kho riêng" : "Thêm vào Kho riêng"}
    >
     {isCurrentInVault ? <Check className="size-3.5" /> : <BookmarkPlus className="size-3.5" />}
     <span className="hidden sm:inline">{isCurrentInVault ? "Trong kho" : "Kho riêng"}</span>
    </Button>
    <StudyInstructionText variant="caption" tone="muted">
     Chu kỳ:
    </StudyInstructionText>
    <Button
     type="button"
     variant="ghost"
     size="compact"
     onClick={handleCycleInterval}
     aria-label={`Chu kỳ đổi từ: ${intervalSeconds} giây`}
    >
     {`${intervalSeconds}s`}
    </Button>
   </div>
  </div>
 );
}
