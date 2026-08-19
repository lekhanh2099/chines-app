"use client";

import { Typography } from "@/components/ui/typography";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "@tanstack/react-store";
import { usePathname } from "next/navigation";
import {
 BasePopover as Popover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/base-popover";
import { Button } from "@/components/ui/button";
import { VocabDetailDrawer } from "@/features/dictionary/components/VocabDetailDrawer";
import { containsChinese } from "@/lib/chinese-utils";
import { useInspectorLookup } from "@/features/dictionary/hooks/useInspectorLookup";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { getPrimaryMeaning, saveVocabToSrs } from "@/services/vocab.service";
import { vocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import { inspectorStore } from "@/stores/inspector-store";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { useTTS } from "@/hooks/useTTS";
import type { VocabData } from "@/types/database";
import {
 BookmarkPlus,
 ChevronRight,
 CheckCircle,
 Loader2,
 Volume2,
 VolumeOff,
 X,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type InspectorCardProps = {
 onClose: () => void;
};

function preserveSelection(event: React.SyntheticEvent) {
 event.preventDefault();
 event.stopPropagation();
}

function getSinoVietnamese(vocabData: z.infer<z.ZodNullable<z.ZodType<VocabData>>>) {
 return (
  vocabData?.sino_vietnamese ||
  vocabData?.ai_analysis?.sino_vietnamese ||
  vocabData?.ai_analysis?.han_viet ||
  ""
 );
}

export function VocabInspectorProvider({ children }: { children: React.ReactNode }) {
 const isOpen = useSelector(inspectorStore, (state) => state.isOpen);
 const anchorRect = useSelector(inspectorStore, (state) => state.anchorRect);
 const selectedText = useSelector(inspectorStore, (state) => state.selectedText);
 const { openInspector, closeInspector } = inspectorStore.actions;
 const pathname = usePathname();
 const overrides = useSelector(dictionaryLookupStore, (state) => state.overrides);
 const lookupEnabled = dictionaryLookupStore.actions.isEnabled(pathname);
 const { hydrate: hydrateLookupSettings } = dictionaryLookupStore.actions;

 const handleClose = () => {
  closeInspector();
 };

 const getAnchor = useCallback(
  () => ({
   getBoundingClientRect: () =>
    anchorRect || new DOMRect(Math.max(8, window.innerWidth / 2), 72, 0, 0),
   contextElement: document.body,
  }),
  [anchorRect],
 );

 useEffect(() => {
  hydrateLookupSettings();
 }, [hydrateLookupSettings]);

 useEffect(() => {
  const handleMouseUp = (event: MouseEvent) => {
   if (!lookupEnabled) return;
   if (event.target instanceof Element && event.target.closest("[data-no-inspector]")) return;

   window.setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
     return;
    }

    const selectionElement =
     selection.anchorNode instanceof Element
      ? selection.anchorNode
      : selection.anchorNode?.parentElement;
    if (selectionElement?.closest("[data-no-inspector]")) return;

    const text = selection.toString().trim();
    if (!text || !containsChinese(text)) return;

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    openInspector(text, { anchorRect: rect });
   }, 10);
  };

  document.addEventListener("mouseup", handleMouseUp);
  return () => document.removeEventListener("mouseup", handleMouseUp);
 }, [openInspector, lookupEnabled, overrides]);

 return (
  <>
   {children}

   <Popover.Root
    open={isOpen}
    onOpenChange={(open) => {
     if (!open) {
      handleClose();
     }
    }}
    modal={false}
   >
    <Popover.Portal>
     <BasePopoverPositioner
      anchor={getAnchor}
      side="top"
      align="center"
      sideOffset={12}
      collisionPadding={12}
      positionMethod="fixed"
     >
      <BasePopoverPopup
       variant="lookup"
       initialFocus={false}
       finalFocus={false}
       onMouseDown={preserveSelection}
       data-no-inspector
      >
       <InspectorCard key={selectedText} onClose={handleClose} />
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </Popover.Portal>
   </Popover.Root>

   <VocabDetailDrawer />
  </>
 );
}

function InspectorCard({ onClose }: InspectorCardProps) {
 const selectedText = useSelector(inspectorStore, (state) => state.selectedText);
 const lessonId = useSelector(inspectorStore, (state) => state.lessonId);
 const isOpen = useSelector(inspectorStore, (state) => state.isOpen);
 const { vocabData, isLoading } = useInspectorLookup(selectedText, lessonId, isOpen);
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 const [isSaving, setIsSaving] = useState(false);
 const [isSaved, setIsSaved] = useState(false);
 const { openDetailDrawer } = vocabDetailDrawerStore.actions;
 const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();

 const handleSaveToVocab = async () => {
  if (!vocabData || isSaving) return;

  setIsSaving(true);

  try {
   const user = await getClientSessionUser(supabase);
   if (!user) return;

   const result = await saveVocabToSrs(supabase, user.id, vocabData);
   if (!result) {
    throw new Error("Save failed");
   }

   setIsSaved(true);
   toast.success(`Đã thêm "${vocabData.hanzi}" vào kho ôn tập SRS!`);
   window.setTimeout(() => setIsSaved(false), 3000);
  } catch (error) {
   logger.error("Save vocab failed:", error);
   toast.error("Không thể lưu từ vựng");
  } finally {
   setIsSaving(false);
  }
 };

 const handleSpeak = () => {
  if (!vocabData) return;
  if (isSpeaking) {
   stop();
   return;
  }
  void speak(vocabData.hanzi);
 };

 const sinoVietnamese = getSinoVietnamese(vocabData);
 const primaryMeaning =
  vocabData?.meaning?.trim() ||
  (vocabData && getPrimaryMeaning(vocabData.ai_analysis, "")) ||
  "Chưa có nghĩa phù hợp";

 return (
  <div className="flex max-h-[min(70vh,32rem)] flex-col bg-bg-card text-text-primary">
   <div className="border-b border-border-default bg-bg-card">
    <div className="flex items-center justify-between gap-2 px-3 py-2">
     <div className="min-w-0">
      <Typography
       as="p"
       lang="zh-CN"
       variant="pageTitle"
       tone="default"
       weight="bold"
       clamp="one"
       leading="tight"
      >
       {vocabData?.hanzi || selectedText || "词"}
      </Typography>
     </div>

     <div className="flex items-center gap-1">
      <Button
       variant="ghost"
       size="icon-sm"
       onMouseDown={preserveSelection}
       onClick={handleSpeak}
       disabled={!vocabData || isTTSLoading}
       aria-label={isSpeaking ? "Dừng phát âm" : "Nghe phát âm"}
       title={isSpeaking ? "Dừng phát âm" : "Nghe phát âm"}
      >
       {isTTSLoading ? (
        <Loader2 className="h-4 w-4 animate-spin " />
       ) : isSpeaking ? (
        <VolumeOff className="h-4 w-4 " />
       ) : (
        <Volume2 className="h-4 w-4" />
       )}
      </Button>
      <Button
       variant="ghost"
       size="icon-sm"
       onMouseDown={preserveSelection}
       onClick={onClose}
       aria-label="Đóng inspector"
       title="Đóng inspector"
      >
       <X className="h-4 w-4" />
      </Button>
     </div>
    </div>
   </div>

   <div className="flex-1 overflow-y-auto scrollbar-soft p-3">
    {isLoading ? (
     <InspectorLoadingSkeleton />
    ) : !vocabData ? (
     <div className="flex h-32 items-center justify-center text-center text-text-muted">
      Không tìm thấy dữ liệu từ vựng
     </div>
    ) : (
     <div className="grid gap-3">
      <dl className="grid gap-3">
       <div className="grid gap-0.5">
        <dt className="text-xs font-bold text-text-muted">Hán Việt</dt>
        <dd className="text-sm font-black text-accent-text">
         {sinoVietnamese || "Chưa có dữ liệu"}
        </dd>
       </div>
       <div className="grid gap-0.5">
        <dt className="text-xs font-bold text-text-muted">Nghĩa tiếng Việt</dt>
        <dd className="text-sm font-semibold leading-relaxed text-text-primary">
         {primaryMeaning}
        </dd>
       </div>
      </dl>

      <div className="grid grid-cols-2 gap-2 border-t border-border-default pt-2">
       <Button
        variant="ghost"
        size="sm"
        onMouseDown={preserveSelection}
        onClick={handleSaveToVocab}
        disabled={!vocabData || isSaving || isSaved}
       >
        {isSaving ? (
         <Loader2 className="h-4 w-4 animate-spin" />
        ) : isSaved ? (
         <CheckCircle className="h-4 w-4 text-success" />
        ) : (
         <BookmarkPlus className="h-4 w-4" />
        )}
        <span>{isSaved ? "Đã lưu" : isSaving ? "Đang lưu" : "Lưu (+)"}</span>
       </Button>
       <Button
        variant="ghost"
        size="sm"
        onMouseDown={preserveSelection}
        onClick={() => {
         openDetailDrawer({
          text: vocabData.hanzi,
          contextSentence: selectedText,
          mode: "word",
         });
         onClose();
        }}
       >
        <span>Chi tiết</span>
        <ChevronRight className="h-4 w-4" />
       </Button>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

function InspectorLoadingSkeleton() {
 return (
  <div className="grid min-h-24 animate-pulse content-center gap-3" aria-hidden="true">
   <div className="h-3 w-28 rounded bg-accent/15" />
   <div className="h-4 w-full rounded bg-text-muted/15" />
   <div className="h-4 w-3/4 rounded bg-text-muted/10" />
  </div>
 );
}
