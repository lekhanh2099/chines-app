"use client";

import { useEffect, useRef, useState } from "react";
import { Popover } from "@base-ui/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { containsChinese } from "@/lib/chinese-utils";
import { createClient } from "@/lib/supabase/client";
import { saveVocabToSrs } from "@/services/vocab.service";
import { useInspectorStore } from "@/stores/inspector-store";
import type { AiDefinition, VocabData } from "@/types/database";
import {
 BookmarkPlus,
 CheckCircle,
 ChevronDown,
 ChevronUp,
 ExternalLink,
 Loader2,
 Volume2,
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
 return { openInspector, closeInspector, isOpen };
};

export function VocabInspectorProvider({
 children,
}: {
 children: React.ReactNode;
}) {
 const { isOpen, openInspector, closeInspector } = useInspectorStore();
 const selectionAnchorRef = useRef<SelectionAnchor | null>(null);
 const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

 const handleClose = () => {
  selectionAnchorRef.current = null;
  setAnchorRect(null);
  closeInspector();
 };

 useEffect(() => {
  const handleMouseUp = (event: MouseEvent) => {
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
 }, [openInspector]);

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
       className="w-85 overflow-hidden rounded-[28px] border border-border-default bg-bg-card shadow-theme-lg"
      >
       <InspectorCard onClose={handleClose} />
      </Popover.Popup>
     </Popover.Positioner>
    </Popover.Portal>
   </Popover.Root>
  </>
 );
}

function InspectorCard({ onClose }: InspectorCardProps) {
 const vocabData = useInspectorStore((state) => state.vocabData);
 const isLoading = useInspectorStore((state) => state.isLoading);
 const supabaseRef = useRef(createClient());
 const supabase = supabaseRef.current;

 const [isSaving, setIsSaving] = useState(false);
 const [isSaved, setIsSaved] = useState(false);
 const [showDeepDive, setShowDeepDive] = useState(false);

 useEffect(() => {
  setShowDeepDive(false);
  setIsSaved(false);
 }, [vocabData?.hanzi]);

 const handleSaveToVocab = async () => {
  if (!vocabData || isSaving) return;

  setIsSaving(true);

  try {
   const {
    data: { user },
   } = await supabase.auth.getUser();
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

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(vocabData.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
 };

 const hasDeepData =
  !!vocabData?.ai_analysis &&
  !!(
   vocabData.ai_analysis.components?.length ||
   vocabData.ai_analysis.etymology ||
   vocabData.ai_analysis.mnemonic_story ||
   vocabData.ai_analysis.usage_logic?.length ||
   vocabData.ai_analysis.examples?.length ||
   vocabData.ai_analysis.collocations?.length ||
   vocabData.ai_analysis.related_words?.length ||
   vocabData.ai_analysis.vn_trap ||
   vocabData.ai_analysis.common_mistakes ||
   vocabData.ai_analysis.confusion ||
   vocabData.ai_analysis.confusion_warning
  );

 const sinoVietnamese = getSinoVietnamese(vocabData);

 return (
  <div className="flex max-h-[min(80vh,42rem)] flex-col bg-bg-card text-text-primary">
   <div className="sticky top-0 z-10 border-b border-border-default bg-bg-card/95 backdrop-blur supports-backdrop-filter:bg-bg-card/80">
    <div className="flex items-center justify-between gap-3 px-4 py-3">
     <div className="min-w-0">
      <p className="truncate text-5xl font-bold leading-none tracking-tight text-text-primary">
       {vocabData?.hanzi || "词"}
      </p>
     </div>

     <div className="flex items-center gap-1">
      <Button
       variant="ghost"
       size="icon-sm"
       className="rounded-full"
       onMouseDown={preserveSelection}
       onClick={handleSpeak}
       disabled={!vocabData}
       aria-label="Nghe phát âm"
       title="Nghe phát âm"
      >
       <Volume2 className="h-4 w-4" />
      </Button>
      <Button
       variant="ghost"
       size="sm"
       className="min-w-0 rounded-full px-3"
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
       className="rounded-full"
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
     <div className="flex h-40 flex-col items-center justify-center gap-3 text-text-muted">
      <Loader2 className="h-7 w-7 animate-spin text-accent" />
      <span className="text-sm font-medium">Đang tra cứu...</span>
     </div>
    ) : !vocabData ? (
     <div className="flex h-32 items-center justify-center text-center text-sm text-text-muted">
      Không tìm thấy dữ liệu từ vựng
     </div>
    ) : (
     <div className="space-y-5">
      <section className="space-y-3 text-center">
       <p className="text-2xl font-semibold tracking-tight text-accent">
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

      <MeaningChips vocabData={vocabData} />
      <DefinitionExamples vocabData={vocabData} />

      <div className="border-t border-border-default pt-3">
       <button
        type="button"
        onMouseDown={preserveSelection}
        onClick={() => setShowDeepDive((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
       >
        <span>{showDeepDive ? "Thu gọn" : "Deep Dive"}</span>
        {showDeepDive ? (
         <ChevronUp className="h-4 w-4" />
        ) : (
         <ChevronDown className="h-4 w-4" />
        )}
       </button>

       {showDeepDive && (
        <DeepDiveSection vocabData={vocabData} hasDeepData={hasDeepData} />
       )}
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border-default bg-bg-primary px-3 py-2 text-xs text-text-muted">
       <span>Mở rộng sang trang từ điển đầy đủ</span>
       <Link
        href={`/dictionary/${encodeURIComponent(vocabData.hanzi)}`}
        onMouseDown={preserveSelection}
        onClick={onClose}
        className="inline-flex items-center gap-1 font-semibold text-accent transition-colors hover:text-accent-hover"
       >
        Chi tiết
        <ExternalLink className="h-3.5 w-3.5" />
       </Link>
      </div>
     </div>
    )}
   </div>
  </div>
 );
}

function MeaningChips({ vocabData }: { vocabData: VocabData }) {
 const definitions = vocabData.ai_analysis?.definitions || [];
 const summary =
  vocabData.ai_analysis?.meaning_summary || vocabData.meaning || undefined;
 const components = vocabData.ai_analysis?.components || [];
 const radicals = vocabData.ai_analysis?.radicals || [];

 const structureItems =
  components.length > 0
   ? components.map((component, index) => ({
      id: `${component.part || component.name || "component"}-${index}`,
      label: component.part || component.name || "?",
      detail: component.name || component.meaning || "",
     }))
   : radicals.map((radical, index) => ({
      id: `${radical.char || radical.meaning || "radical"}-${index}`,
      label: radical.char || radical.pinyin || "?",
      detail: radical.pinyin || radical.meaning || "",
     }));

 return (
  <section className="overflow-hidden rounded-3xl border border-border-default bg-bg-primary shadow-theme-sm">
   <div className="grid grid-cols-2 divide-x divide-border-default">
    <div className="px-3 py-4 text-center">
     <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
      Bộ thủ
     </p>

     {structureItems.length > 0 ? (
      <div className="mt-3 flex flex-wrap justify-center gap-2">
       {structureItems.map((item) => (
        <div
         key={item.id}
         className="inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-2xl border border-border-default bg-bg-card px-2.5 py-2 text-xs text-text-secondary"
        >
         <span className="font-semibold text-text-primary">{item.label}</span>
         {item.detail && <span className="truncate">{item.detail}</span>}
        </div>
       ))}
      </div>
     ) : (
      <p className="mt-3 text-xs leading-5 text-text-muted">
       Chưa có dữ liệu bộ thủ
      </p>
     )}
    </div>

    <div className="px-3 py-4 text-center">
     <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
      Nghĩa
     </p>

     {definitions.length > 0 ? (
      <div className="mt-3 flex flex-col items-center gap-2">
       {definitions.map((definition, index) => {
        const text = getDefinitionText(definition);
        if (!text) return null;

        return (
         <div
          key={`${text}-${index}`}
          className="inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-full border border-accent/20 bg-accent/8 px-3 py-1.5 text-center text-xs font-medium text-text-primary"
         >
          {definition.pos && (
           <span className="text-[10px] font-bold uppercase tracking-wide text-accent/80">
            ({definition.pos})
           </span>
          )}
          <span className="wrap-break-word">{text}</span>
         </div>
        );
       })}
      </div>
     ) : summary ? (
      <div className="mt-3 rounded-2xl border border-border-default bg-bg-card px-3 py-3 text-center text-sm leading-6 text-text-secondary">
       {summary}
      </div>
     ) : (
      <p className="mt-3 text-xs leading-5 text-text-muted">
       Chưa có nghĩa chính
      </p>
     )}
    </div>
   </div>
  </section>
 );
}

function DefinitionExamples({ vocabData }: { vocabData: VocabData }) {
 const definitionsWithExamples = (
  vocabData.ai_analysis?.definitions || []
 ).filter(
  (definition) => definition.examples && definition.examples.length > 0,
 );
 const examples = vocabData.ai_analysis?.examples || [];

 if (definitionsWithExamples.length === 0 && examples.length === 0) {
  return null;
 }

 return (
  <section className="space-y-3">
   <p className="text-center text-sm font-semibold uppercase tracking-[0.22em] text-text-muted">
    Ý nghĩa & ví dụ
   </p>

   {definitionsWithExamples.length > 0
    ? definitionsWithExamples.map((definition, index) => {
       const meaning = getDefinitionText(definition);
       const example = definition.examples?.[0];
       if (!example) return null;

       return (
        <article
         key={`${meaning || "definition"}-${index}`}
         className="rounded-3xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
        >
         <div className="flex flex-wrap items-center gap-2">
          {definition.pos && (
           <span className="rounded-md border border-accent/25 bg-accent/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent">
            {definition.pos}
           </span>
          )}
          {meaning && (
           <h3 className="text-base font-bold text-text-primary">{meaning}</h3>
          )}
         </div>

         {example.vi && (
          <p className="mt-3 text-sm italic leading-6 text-text-secondary">
           “{example.vi}”
          </p>
         )}

         {(example.cn || example.pinyin || example.py) && (
          <div className="mt-3 text-sm leading-6 text-text-muted">
           {example.cn && (
            <p className="font-medium text-text-primary">{example.cn}</p>
           )}
           {(example.pinyin || example.py) && (
            <p>{example.pinyin || example.py}</p>
           )}
          </div>
         )}
        </article>
       );
      })
    : examples.map((example, index) => (
       <article
        key={`${example.zh}-${index}`}
        className="rounded-3xl border border-border-default bg-bg-primary p-4 shadow-theme-sm"
       >
        <p className="text-base font-bold text-text-primary">{example.zh}</p>
        <p className="mt-1 text-sm text-accent">{example.pinyin}</p>
        <p className="mt-2 text-sm italic leading-6 text-text-secondary">
         {example.vi}
        </p>
       </article>
      ))}
  </section>
 );
}

function DeepDiveSection({
 vocabData,
 hasDeepData,
}: {
 vocabData: VocabData;
 hasDeepData: boolean;
}) {
 if (!hasDeepData) {
  return (
   <div className="mt-3 rounded-3xl border border-border-default bg-bg-primary p-4 text-center text-sm text-text-muted">
    Chưa có dữ liệu phân tích sâu cho mục này.
   </div>
  );
 }

 const etymologyText =
  typeof vocabData.ai_analysis?.etymology === "object"
   ? vocabData.ai_analysis.etymology.explanation
   : vocabData.ai_analysis?.etymology;

 return (
  <div className="mt-3 space-y-3 rounded-3xl border border-border-default bg-bg-primary p-3">
   {vocabData.ai_analysis?.components &&
    vocabData.ai_analysis.components.length > 0 && (
     <section className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
       Chiết tự
      </h4>
      <div className="flex flex-wrap gap-2">
       {vocabData.ai_analysis.components.map((component, index) => (
        <div
         key={`${component.part || component.name || "component"}-${index}`}
         className="inline-flex max-w-full items-center gap-2 rounded-full border border-border-default bg-bg-card px-3 py-1.5 text-xs text-text-secondary"
        >
         {component.part && (
          <span className="font-bold text-text-primary">{component.part}</span>
         )}
         {component.name && (
          <span className="font-semibold uppercase tracking-wide text-accent">
           {component.name}
          </span>
         )}
         {component.meaning && <span>{component.meaning}</span>}
        </div>
       ))}
      </div>
     </section>
    )}

   {etymologyText && (
    <section className="space-y-2">
     <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
      Nguồn gốc
     </h4>
     <div className="rounded-[20px] border border-border-default bg-bg-card px-4 py-3 text-sm italic leading-6 text-text-secondary">
      {etymologyText}
     </div>
    </section>
   )}

   {vocabData.ai_analysis?.mnemonic_story && (
    <section className="space-y-2">
     <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
      Câu chuyện gợi nhớ
     </h4>
     <div className="rounded-[20px] border border-amber-300/50 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-950 dark:border-amber-700/30 dark:bg-amber-950/20 dark:text-amber-100">
      {vocabData.ai_analysis.mnemonic_story}
     </div>
    </section>
   )}

   {vocabData.ai_analysis?.usage_logic &&
    vocabData.ai_analysis.usage_logic.length > 0 && (
     <section className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
       Tư duy dùng từ
      </h4>
      <div className="space-y-2">
       {vocabData.ai_analysis.usage_logic.map((item, index) => (
        <div
         key={`${item}-${index}`}
         className="rounded-[20px] border border-border-default bg-bg-card px-4 py-3 text-sm leading-6 text-text-secondary"
        >
         {item}
        </div>
       ))}
      </div>
     </section>
    )}

   {vocabData.ai_analysis?.vn_trap && (
    <section className="space-y-2">
     <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-danger">
      Bẫy tiếng Việt
     </h4>
     <div className="rounded-[20px] border border-danger/20 bg-danger-subtle px-4 py-3 text-sm leading-6 text-danger-text">
      {vocabData.ai_analysis.vn_trap}
     </div>
    </section>
   )}

   {vocabData.ai_analysis?.confusion_warning && (
    <section className="space-y-2">
     <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-danger">
      Cảnh báo nhầm lẫn
     </h4>
     <div className="rounded-[20px] border border-danger/20 bg-danger-subtle px-4 py-3 text-sm leading-6 text-danger-text">
      {vocabData.ai_analysis.confusion_warning}
     </div>
    </section>
   )}

   {vocabData.ai_analysis?.confusion && (
    <section className="space-y-2">
     <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
      Từ dễ nhầm
     </h4>
     <div className="rounded-[20px] border border-border-default bg-bg-card px-4 py-3 text-sm leading-6 text-text-secondary">
      {vocabData.ai_analysis.confusion}
     </div>
    </section>
   )}

   {vocabData.ai_analysis?.common_mistakes && (
    <section className="space-y-2">
     <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
      Lỗi thường gặp
     </h4>
     <div className="rounded-[20px] border border-border-default bg-bg-card px-4 py-3 text-sm leading-6 text-text-secondary">
      {vocabData.ai_analysis.common_mistakes}
     </div>
    </section>
   )}

   {vocabData.ai_analysis?.collocations &&
    vocabData.ai_analysis.collocations.length > 0 && (
     <section className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
       Từ ghép thường gặp
      </h4>
      <div className="flex flex-wrap gap-2">
       {vocabData.ai_analysis.collocations.map((item, index) => (
        <span
         key={`${item}-${index}`}
         className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
        >
         {item}
        </span>
       ))}
      </div>
     </section>
    )}

   {vocabData.ai_analysis?.related_words &&
    vocabData.ai_analysis.related_words.length > 0 && (
     <section className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
       Từ liên quan
      </h4>
      <div className="flex flex-wrap gap-2">
       {vocabData.ai_analysis.related_words.map((item, index) => (
        <span
         key={`${item}-${index}`}
         className="rounded-full border border-border-default bg-bg-card px-3 py-1.5 text-xs font-medium text-text-secondary"
        >
         {item}
        </span>
       ))}
      </div>
     </section>
    )}

   {vocabData.ai_analysis?.examples &&
    vocabData.ai_analysis.examples.length > 0 && (
     <section className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
       Ví dụ thêm
      </h4>
      <div className="space-y-2">
       {vocabData.ai_analysis.examples.map((example, index) => (
        <div
         key={`${example.zh}-${index}`}
         className="rounded-[20px] border border-border-default bg-bg-card px-4 py-3"
        >
         <p className="text-sm font-medium text-text-primary">{example.zh}</p>
         <p className="mt-1 text-xs text-accent">{example.pinyin}</p>
         <p className="mt-1 text-xs italic text-text-muted">{example.vi}</p>
        </div>
       ))}
      </div>
     </section>
    )}
  </div>
 );
}
