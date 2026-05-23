"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Popover } from "@base-ui/react";
import { Button } from "@/components/ui/button";
import { VocabDetailDrawer } from "@/components/vocabulary/VocabDetailDrawer";
import { containsChinese } from "@/lib/chinese-utils";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { getPrimaryMeaning, saveVocabToSrs } from "@/services/vocab.service";
import { useVocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import { useInspectorStore } from "@/stores/inspector-store";
import { useDictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { useTTS } from "@/hooks/useTTS";
import type { AiDefinition, VocabData } from "@/types/database";
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

type SelectionAnchor = {
 getBoundingClientRect: () => DOMRect;
 contextElement?: Element | null;
};

type InspectorCardProps = {
 onClose: () => void;
};

function preserveSelection(event: React.SyntheticEvent) {
 event.preventDefault();
 event.stopPropagation();
}

function getDefinitionText(definition: AiDefinition) {
 return definition.meaning || definition.text || "";
}

function getSinoVietnamese(vocabData: VocabData | null) {
 return (
  vocabData?.sino_vietnamese ||
  vocabData?.ai_analysis?.sino_vietnamese ||
  vocabData?.ai_analysis?.han_viet ||
  ""
 );
}

export const useVocabInspector = () => {
 const openInspector = useInspectorStore((state) => state.openInspector);
 const closeInspector = useInspectorStore((state) => state.closeInspector);
 const isOpen = useInspectorStore((state) => state.isOpen);
 const openDetailDrawer = useVocabDetailDrawerStore(
  (state) => state.openDetailDrawer,
 );
 return { openInspector, closeInspector, isOpen, openDetailDrawer };
};

export function VocabInspectorProvider({
 children,
}: {
 children: React.ReactNode;
}) {
 const { isOpen, openInspector, closeInspector } = useInspectorStore();
 const selectionAnchorRef = useRef<SelectionAnchor | null>(null);
 const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
 const pathname = usePathname();
 const lookupEnabled = useDictionaryLookupStore((s) => s.isEnabled(pathname));

 const handleClose = () => {
  selectionAnchorRef.current = null;
  setAnchorRect(null);
  closeInspector();
 };

 useEffect(() => {
  const handleMouseUp = (event: MouseEvent) => {
   if (!lookupEnabled) return;
   const target = event.target as HTMLElement | null;
   if (target?.closest("[data-no-inspector]")) return;

   window.setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
     return;
    }

    const text = selection.toString().trim();
    if (!text || !containsChinese(text)) return;

    const rect = selection.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    selectionAnchorRef.current = {
     getBoundingClientRect: () => rect,
     contextElement: document.body,
    };
    setAnchorRect(rect);
    openInspector(text);
   }, 10);
  };

  document.addEventListener("mouseup", handleMouseUp);
  return () => document.removeEventListener("mouseup", handleMouseUp);
 }, [openInspector, lookupEnabled]);

 const getAnchor = () =>
  selectionAnchorRef.current as unknown as Element | null;

 return (
  <>
   {children}

   <Popover.Root
    open={isOpen && !!anchorRect}
    onOpenChange={(open) => {
     if (!open) {
      handleClose();
     }
    }}
    modal={false}
   >
    <Popover.Portal>
     <Popover.Positioner
      anchor={getAnchor}
      side="top"
      align="center"
      sideOffset={12}
      collisionPadding={12}
      positionMethod="fixed"
      style={{ zIndex: 9999 }}
     >
      <Popover.Popup
       initialFocus={false}
       finalFocus={false}
       onMouseDown={preserveSelection}
       data-no-inspector
       style={{ maxWidth: "calc(100vw - 1rem)" }}
       className="w-85 overflow-hidden rounded-2xl -[28px] border border-border-default bg-bg-card shadow-theme-lg"
      >
       <InspectorCard onClose={handleClose} />
      </Popover.Popup>
     </Popover.Positioner>
    </Popover.Portal>
   </Popover.Root>

   <VocabDetailDrawer />
  </>
 );
}

function InspectorCard({ onClose }: InspectorCardProps) {
 const vocabData = useInspectorStore((state) => state.vocabData);
 const isLoading = useInspectorStore((state) => state.isLoading);
 const deepError = useInspectorStore((state) => state.deepError);
 const selectedText = useInspectorStore((state) => state.selectedText);
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 const [isSaving, setIsSaving] = useState(false);
 const [isSaved, setIsSaved] = useState(false);
 const openDetailDrawer = useVocabDetailDrawerStore(
  (state) => state.openDetailDrawer,
 );
 const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();

 useEffect(() => {
  setIsSaved(false);
 }, [selectedText]);

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
   console.error("Save vocab failed:", error);
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
  (vocabData && getPrimaryMeaning(vocabData.ai_analysis, vocabData.meaning)) ||
  vocabData?.meaning ||
  "Chưa có nghĩa phù hợp";
 const secondaryMeaning = vocabData?.ai_analysis?.definitions?.[1]
  ? getDefinitionText(vocabData.ai_analysis.definitions[1])
  : "";

 return (
  <div className="flex max-h-[min(80vh,42rem)] flex-col bg-bg-card text-text-primary">
   <div className="sticky top-0 z-10 border-b border-border-default bg-bg-card/95 backdrop-blur supports-backdrop-filter:bg-bg-card/80">
    <div className="flex items-center justify-between gap-3 px-4 py-3">
     <div className="min-w-0">
      <p className="truncate text-5xl font-bold leading-none tracking-tight text-text-primary">
       {vocabData?.hanzi || selectedText || "词"}
      </p>
     </div>

     <div className="flex items-center gap-1">
      <Button
       variant="ghost"
       size="icon-sm"
       className="rounded-2xl -full"
       onMouseDown={preserveSelection}
       onClick={handleSpeak}
       disabled={!vocabData || isTTSLoading}
       aria-label={isSpeaking ? "Dừng phát âm" : "Nghe phát âm"}
       title={isSpeaking ? "Dừng phát âm" : "Nghe phát âm"}
      >
       {isTTSLoading ? (
        <Loader2 className="h-4 w-4 animate-spin  " />
       ) : isSpeaking ? (
        <VolumeOff className="h-4 w-4  " />
       ) : (
        <Volume2 className="h-4 w-4" />
       )}
      </Button>
      <Button
       variant="ghost"
       size="sm"
       className="min-w-0 rounded-2xl -full px-3"
       onMouseDown={preserveSelection}
       onClick={handleSaveToVocab}
       disabled={!vocabData || isSaving || isSaved}
       aria-label="Lưu vào SRS"
       title="Lưu vào SRS"
      >
       {isSaving ? (
        <Loader2 className="h-4 w-4 animate-spin" />
       ) : isSaved ? (
        <CheckCircle className="h-4 w-4 text-success" />
       ) : (
        <BookmarkPlus className="h-4 w-4" />
       )}
       <span className="text-xs font-semibold">
        {isSaved ? "Đã lưu" : isSaving ? "Đang lưu" : "Lưu"}
       </span>
      </Button>
      <Button
       variant="ghost"
       size="icon-sm"
       className="rounded-2xl -full"
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

   <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
    {isLoading ? (
     <InspectorLoadingSkeleton />
    ) : !vocabData ? (
     <div className="flex h-32 items-center justify-center text-center text-sm text-text-muted">
      Không tìm thấy dữ liệu từ vựng
     </div>
    ) : (
     <div className="space-y-4">
      <section className="space-y-3 rounded-2xl  border border-border-default bg-bg-primary px-4 py-4 text-center shadow-theme-sm">
       <p className="text-2xl font-semibold tracking-tight  ">
        {vocabData.pinyin}
       </p>

       {sinoVietnamese && (
        <div className="flex justify-center">
         <span className="inline-flex items-center gap-2 rounded-2xl border border-border-default bg-bg-primary px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary shadow-theme-sm">
          <span className="text-text-muted">Hán Việt</span>
          <span className="text-text-primary">{sinoVietnamese}</span>
         </span>
        </div>
       )}
      </section>

      <section className="rounded-2xl  border border-border-default bg-bg-primary px-4 py-4 shadow-theme-sm">
       <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
        Nghĩa chính
       </p>
       <p className="mt-2 text-base font-semibold leading-relaxed text-text-primary">
        {primaryMeaning}
       </p>
       {secondaryMeaning && secondaryMeaning !== primaryMeaning && (
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
         {secondaryMeaning}
        </p>
       )}
       {deepError && <p className="mt-3 text-xs text-amber-700">{deepError}</p>}
      </section>

      <div className="flex items-center gap-2 rounded-2xl -full border border-border-default bg-bg-primary p-1 shadow-theme-sm">
       <Button
        variant="ghost"
        size="sm"
        className="h-10 flex-1 rounded-2xl -full"
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
        className="h-10 flex-1 rounded-2xl -full"
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
  <div className="space-y-5 animate-pulse">
   <section className="space-y-3 text-center">
    <div className="mx-auto h-8 w-36 rounded-2xl -full bg-accent/12" />
    <div className="mx-auto h-10 w-32 rounded-2xl border border-border-default bg-bg-primary" />
   </section>

   <section className="overflow-hidden rounded-2xl  border border-border-default bg-bg-primary shadow-theme-sm">
    <div className="grid grid-cols-2 divide-x divide-border-default">
     <div className="space-y-3 px-3 py-4">
      <div className="mx-auto h-3 w-14 rounded-2xl -full bg-text-muted/20" />
      <div className="flex flex-wrap justify-center gap-2">
       <div className="h-10 w-20 rounded-2xlbg-bg-card" />
       <div className="h-10 w-16 rounded-2xlbg-bg-card" />
      </div>
     </div>

     <div className="space-y-3 px-3 py-4">
      <div className="mx-auto h-3 w-14 rounded-2xl -full bg-text-muted/20" />
      <div className="flex flex-col items-center gap-2">
       <div className="h-8 w-28 rounded-2xl -full bg-accent/10" />
       <div className="h-8 w-24 rounded-2xl -full bg-accent/8" />
       <div className="h-8 w-32 rounded-2xl -full bg-accent/10" />
      </div>
     </div>
    </div>
   </section>

   <section className="space-y-3">
    <div className="mx-auto h-3 w-28 rounded-2xl -full bg-text-muted/20" />
    <div className="rounded-2xl  border border-border-default bg-bg-primary p-4 shadow-theme-sm">
     <div className="h-4 w-16 rounded-2xl -full bg-accent/12" />
     <div className="mt-3 h-5 w-40 rounded-2xl -full bg-text-primary/10" />
     <div className="mt-4 space-y-2">
      <div className="h-4 w-full rounded-2xl -full bg-text-muted/15" />
      <div className="h-4 w-5/6 rounded-2xl -full bg-text-muted/15" />
      <div className="h-4 w-2/3 rounded-2xl -full bg-text-muted/15" />
     </div>
    </div>
   </section>
  </div>
 );
}
