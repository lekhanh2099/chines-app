"use client";

import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { AmbientPipDictationCardProps } from "./AmbientPipDictationCard";
import type { AmbientPipDictationSession } from "./useAmbientPipDictationSession";

/** Window title, progress badge and mode / rate / shuffle / auto-speak / close controls. */
export function AmbientPipDictationHeader({
 session,
 lessonTitle,
 onClose,
 extraHeaderActions,
}: {
 session: AmbientPipDictationSession;
 lessonTitle: string;
 onClose: AmbientPipDictationCardProps["onClose"];
 extraHeaderActions: AmbientPipDictationCardProps["extraHeaderActions"];
}) {
 const {
  isCompleted,
  currentIndex,
  totalCount,
  isRetryingMistakes,
  dictationMode,
  handleToggleDictationMode,
  handleCycleRate,
  speechRate,
  isShuffled,
  handleToggleShuffle,
  handleToggleAutoSpeak,
  isAutoSpeak,
 } = session;
 return (
  <div className="border-b border-border-default/40 bg-surface-muted/30 px-3 py-1.5">
   <div className="flex items-center justify-between gap-2">
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
     <Badge variant="accent" size="sm" casing="natural" className="shrink-0">
      {isCompleted ? "Xong" : `${currentIndex + 1}/${totalCount}`}
     </Badge>
     <StudyInstructionText tone="secondary" weight="bold" clamp="one">
      {isRetryingMistakes
       ? `${lessonTitle} (${dictationMode === "vi-to-zh" ? "Việt ➔ Hán" : "Trung ➔ Hán"}, Luyện từ sai)`
       : `${lessonTitle} (${dictationMode === "vi-to-zh" ? "Việt ➔ Hán" : "Trung ➔ Hán"})`}
     </StudyInstructionText>
    </div>

    <div className="flex shrink-0 items-center gap-1">
     {extraHeaderActions}

     <Button
      type="button"
      variant={dictationMode === "vi-to-zh" ? "active" : "ghost"}
      size="compact"
      onClick={handleToggleDictationMode}
      title={
       dictationMode === "vi-to-zh"
        ? "Đang chế độ: Nghe nghĩa tiếng Việt ➔ Chép chữ Hán (Bấm để đổi sang Nghe tiếng Trung)"
        : "Đang chế độ: Nghe tiếng Trung ➔ Chép chữ Hán (Bấm để đổi sang Nghe tiếng Việt)"
      }
      aria-label={`Chế độ nghe chép: ${dictationMode === "vi-to-zh" ? "Việt sang Hán" : "Trung sang Hán"}`}
     >
      <span className="text-xs font-semibold">
       {dictationMode === "vi-to-zh" ? "🇻🇳 Việt ➔ Hán" : "🇨🇳 Trung ➔ Hán"}
      </span>
     </Button>

     <Button
      type="button"
      variant="ghost"
      size="compact"
      onClick={handleCycleRate}
      title={`Tốc độ đọc: ${speechRate}x (Bấm để đổi 0.8x / 1.0x / 1.2x)`}
      aria-label={`Tốc độ đọc ${speechRate}x`}
     >
      <span>{`${speechRate}x`}</span>
     </Button>

     <Button
      type="button"
      variant={isShuffled ? "active" : "ghost"}
      size="toolbar"
      onClick={handleToggleShuffle}
      title={isShuffled ? "Đang xáo trộn (Bấm để theo thứ tự sách)" : "Xáo trộn từ vựng (Shuffle)"}
      aria-label={isShuffled ? "Tắt xáo trộn từ" : "Bật xáo trộn từ"}
     >
      <Shuffle className="size-3.5" />
     </Button>

     <Button
      type="button"
      variant="ghost"
      size="toolbar"
      onClick={handleToggleAutoSpeak}
      aria-label={isAutoSpeak ? "Tắt tự động đọc từ" : "Bật tự động đọc từ"}
     >
      {isAutoSpeak ? (
       <Volume2 className="size-3.5 text-primary" />
      ) : (
       <VolumeX className="size-3.5" />
      )}
     </Button>

     {onClose ? (
      <Button
       type="button"
       variant="ghost"
       size="toolbar"
       onClick={onClose}
       aria-label="Đóng cửa sổ nổi"
      >
       <X className="size-3.5" />
      </Button>
     ) : null}
    </div>
   </div>
  </div>
 );
}

/** Previous / check-or-edit / next navigation and the progress counter. */
export function AmbientPipDictationFooter({ session }: { session: AmbientPipDictationSession }) {
 const {
  currentIndex,
  isCompleted,
  handlePrev,
  isChecked,
  handleEditAgain,
  answer,
  handleCheck,
  handleNext,
  totalCount,
 } = session;
 return (
  <div className="flex items-center justify-between border-t border-border-default/40 bg-surface-muted/20 px-3 py-1.5 text-xs">
   <div className="flex items-center gap-1">
    <Button
     type="button"
     variant="ghost"
     size="compact"
     disabled={currentIndex === 0 && !isCompleted}
     onClick={handlePrev}
     aria-label="Từ trước đó"
    >
     <ChevronLeft className="size-3.5" />
     <span className="hidden sm:inline">Trước</span>
    </Button>

    {!isCompleted ? (
     isChecked ? (
      <Button
       type="button"
       variant="outline"
       size="compact"
       onClick={handleEditAgain}
       aria-label="Sửa lại từ này"
      >
       <RotateCcw className="size-3" />
       <span>Sửa lại (Esc)</span>
      </Button>
     ) : (
      <Button
       type="button"
       variant="default"
       size="compact"
       disabled={!answer.trim()}
       onClick={handleCheck}
       aria-label="Kiểm tra kết quả"
      >
       <span>Kiểm tra (↵)</span>
      </Button>
     )
    ) : null}

    <Button
     type="button"
     variant="ghost"
     size="compact"
     disabled={isCompleted}
     onClick={handleNext}
     aria-label="Từ tiếp theo"
    >
     <span className="hidden sm:inline">Tiếp</span>
     <ChevronRight className="size-3.5" />
    </Button>
   </div>

   <div className="flex items-center gap-1">
    <StudyInstructionText variant="caption" tone="muted">
     {isCompleted ? "Đã xong:" : "Phần:"}
    </StudyInstructionText>
    <StudyInstructionText variant="caption" tone="secondary" weight="bold">
     {isCompleted ? `${totalCount}/${totalCount}` : `${currentIndex + 1}/${totalCount}`}
    </StudyInstructionText>
   </div>
  </div>
 );
}
