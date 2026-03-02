"use client";

import { useEffect, useRef, useState, forwardRef } from "react";
import { createPortal } from "react-dom";
import { containsChinese } from "@/lib/chinese-utils";
import { useInspectorStore, type VocabData } from "@/stores/inspector-store";
import { createClient } from "@/lib/supabase/client";
import {
 X,
 Volume2,
 BookmarkPlus,
 CheckCircle,
 Loader2,
 ChevronDown,
 ChevronUp,
 Pen,
 ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export const useVocabInspector = () => {
 const openInspector = useInspectorStore((s) => s.openInspector);
 const closeInspector = useInspectorStore((s) => s.closeInspector);
 const isOpen = useInspectorStore((s) => s.isOpen);
 return { openInspector, closeInspector, isOpen };
};

export function VocabInspectorProvider({
 children,
}: {
 children: React.ReactNode;
}) {
 const { isOpen, openInspector, closeInspector } = useInspectorStore();
 const panelRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const handleMouseUp = (e: MouseEvent) => {
   if (panelRef.current?.contains(e.target as Node)) return;

   setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (!text || !containsChinese(text)) return;

    openInspector(text);
   }, 10);
  };

  document.addEventListener("mouseup", handleMouseUp);
  return () => document.removeEventListener("mouseup", handleMouseUp);
 }, [openInspector]);

 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if (e.key === "Escape") closeInspector();
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
 }, [closeInspector]);

 return (
  <>
   {children}
   {isOpen && <InspectorDrawer ref={panelRef} onClose={closeInspector} />}
  </>
 );
}

type DrawerProps = {
 onClose: () => void;
};

const InspectorDrawer = forwardRef<HTMLDivElement, DrawerProps>(
 function InspectorDrawer({ onClose }, ref) {
  const vocabData = useInspectorStore((s) => s.vocabData);
  const isLoading = useInspectorStore((s) => s.isLoading);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const hanziContainerRef = useRef<HTMLDivElement>(null);
  const writerInstanceRef = useRef<ReturnType<typeof Object> | null>(null);

  useEffect(() => {
   requestAnimationFrame(() => setIsAnimating(true));
  }, []);

  useEffect(() => {
   if (
    !vocabData?.hanzi ||
    !hanziContainerRef.current ||
    typeof window === "undefined"
   )
    return;

   const container = hanziContainerRef.current;
   container.innerHTML = "";

   const chars = vocabData.hanzi.split("");

   import("hanzi-writer").then((HanziWriterModule) => {
    const HanziWriter = HanziWriterModule.default;
    chars.forEach((char) => {
     if (/[\u4e00-\u9fff]/.test(char)) {
      const charDiv = document.createElement("div");
      charDiv.style.display = "inline-block";
      container.appendChild(charDiv);

      try {
       const writer = HanziWriter.create(charDiv, char, {
        width: 120,
        height: 120,
        padding: 8,
        strokeAnimationSpeed: 1,
        delayBetweenStrokes: 200,
        strokeColor: "var(--text-primary)",
        radicalColor: "var(--accent)",
        outlineColor: "var(--border)",
        drawingColor: "var(--accent)",
        showOutline: true,
        showCharacter: false,
       });
       writer.animateCharacter();
       writerInstanceRef.current = writer;
      } catch {
       charDiv.textContent = char;
       charDiv.style.fontSize = "80px";
       charDiv.style.fontWeight = "bold";
      }
     }
    });
   });

   return () => {
    container.innerHTML = "";
   };
  }, [vocabData?.hanzi]);

  const handleSaveToVocab = async () => {
   if (!vocabData || isSaving) return;
   setIsSaving(true);

   try {
    const {
     data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: vocab, error: vocabError } = await supabase
     .from("vocabularies")
     .upsert(
      {
       hanzi: vocabData.hanzi,
       pinyin: vocabData.pinyin,
       meaning: vocabData.meaning || "",
      },
      { onConflict: "hanzi" },
     )
     .select("id")
     .single();

    if (vocabError) throw vocabError;

    if (vocab?.id) {
     await supabase.from("user_vocab_progress").upsert(
      {
       user_id: user.id,
       vocab_id: vocab.id,
       is_favorited: true,
      },
      { onConflict: "user_id,vocab_id" },
     );
    }

    setIsSaved(true);
    toast.success(`Đã thêm "${vocabData.hanzi}" vào kho ôn tập SRS!`);
    setTimeout(() => setIsSaved(false), 3000);
   } catch (error) {
    console.error("Save vocab failed:", error);
    toast.error("Không thể lưu từ vựng");
   } finally {
    setIsSaving(false);
   }
  };

  const handleSpeak = () => {
   if (!vocabData) return;
   const utterance = new SpeechSynthesisUtterance(vocabData.hanzi);
   utterance.lang = "zh-CN";
   utterance.rate = 0.8;
   speechSynthesis.speak(utterance);
  };

  const handleReplayAnimation = () => {
   if (
    writerInstanceRef.current &&
    typeof (writerInstanceRef.current as Record<string, unknown>)
     .animateCharacter === "function"
   ) {
    (
     writerInstanceRef.current as { animateCharacter: () => void }
    ).animateCharacter();
   }
  };

  const hasDeepData =
   vocabData?.ai_analysis &&
   (vocabData.ai_analysis.etymology ||
    (vocabData.ai_analysis.usage_logic &&
     vocabData.ai_analysis.usage_logic.length > 0) ||
    (vocabData.ai_analysis.examples &&
     vocabData.ai_analysis.examples.length > 0));

  return createPortal(
   <>
    <div
     className={`fixed inset-0 z-9998 bg-overlay transition-opacity duration-300 ${isAnimating ? "opacity-100" : "opacity-0"}`}
     onClick={onClose}
    />

    <div
     ref={ref}
     className={`fixed top-0 right-0 h-full w-105 max-w-[90vw] bg-bg-card border-l border-border-default shadow-theme-lg z-9999 flex flex-col transition-transform duration-300 ease-out ${isAnimating ? "translate-x-0" : "translate-x-full"}`}
    >
     <div className="flex items-center justify-between px-6 h-16 border-b border-border-default shrink-0">
      <div className="flex items-center gap-3">
       <span className="text-[10px] font-bold tracking-wider text-accent uppercase">
        Vocabulary Inspector
       </span>
       {vocabData?.ai_analysis?.word_type && (
        <span className="text-[10px] font-medium text-text-secondary border border-border-default rounded-full px-2.5 py-0.5">
         {vocabData.ai_analysis.word_type}
        </span>
       )}
      </div>
      <div className="flex items-center gap-1">
       <button
        onClick={handleReplayAnimation}
        className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
       >
        <Pen className="w-4 h-4" />
       </button>
       {vocabData && (
        <Link
         href={`/dictionary/${encodeURIComponent(vocabData.hanzi)}`}
         onClick={onClose}
         className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
         title="Xem chi tiết toàn trang"
        >
         <ExternalLink className="w-4 h-4" />
        </Link>
       )}
       <button
        onClick={onClose}
        className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-card-hover rounded-lg transition-colors"
       >
        <X className="w-4 h-4" />
       </button>
      </div>
     </div>

     <div className="flex-1 overflow-y-auto">
      {isLoading ? (
       <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <span className="text-sm text-text-muted">Đang tra cứu...</span>
       </div>
      ) : vocabData ? (
       <div className="flex flex-col">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 border-b border-border-default">
         <div
          ref={hanziContainerRef}
          className="flex items-center justify-center min-h-30 mb-4"
         />

         <div className="flex items-center gap-3 mb-1">
          <h2 className="text-4xl font-bold text-text-primary tracking-wide">
           {vocabData.hanzi}
          </h2>
          <button
           onClick={handleSpeak}
           className="p-2 text-text-muted hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
          >
           <Volume2 className="w-5 h-5" />
          </button>
         </div>

         <p className="text-xl font-medium text-accent mb-4">
          {vocabData.pinyin}
         </p>

         <div className="grid grid-cols-2 gap-3 w-full max-w-sm">
          {vocabData.meaning && (
           <div className="bg-bg-primary rounded-xl p-3.5 text-center border border-border-default">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
             Nghĩa
            </span>
            <span className="text-sm font-semibold text-text-primary">
             {vocabData.meaning}
            </span>
           </div>
          )}
          {vocabData.ai_analysis?.han_viet && (
           <div className="bg-bg-primary rounded-xl p-3.5 text-center border border-border-default">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-1">
             Hán-Việt
            </span>
            <span className="text-sm font-semibold text-text-primary">
             {vocabData.ai_analysis.han_viet}
            </span>
           </div>
          )}
         </div>
        </div>

        <DeepDiveSection
         vocabData={vocabData}
         hasDeepData={!!hasDeepData}
         showDeepDive={showDeepDive}
         setShowDeepDive={setShowDeepDive}
        />
       </div>
      ) : (
       <div className="flex items-center justify-center h-full">
        <p className="text-sm text-text-muted">
         Không tìm thấy dữ liệu từ vựng
        </p>
       </div>
      )}
     </div>

     {vocabData && (
      <div className="px-6 py-4 border-t border-border-default shrink-0 bg-bg-card">
       <div className="flex items-center gap-3">
        <button
         onClick={handleSaveToVocab}
         disabled={isSaving || isSaved}
         className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-border-default text-sm font-bold text-text-primary hover:border-accent hover:bg-accent/5 transition-all disabled:opacity-60"
        >
         {isSaved ? (
          <>
           <CheckCircle className="w-4 h-4 text-success" />
           Đã lưu vào SRS
          </>
         ) : isSaving ? (
          <>
           <Loader2 className="w-4 h-4 animate-spin" />
           Đang lưu...
          </>
         ) : (
          <>
           <BookmarkPlus className="w-4 h-4" />
           Lưu từ vựng
          </>
         )}
        </button>
       </div>
       <p className="text-[11px] text-text-muted text-center mt-3">
        Từ vựng sẽ được đồng bộ vào hệ thống ôn tập SRS tự động
       </p>
      </div>
     )}
    </div>
   </>,
   document.body,
  );
 },
);

function DeepDiveSection({
 vocabData,
 hasDeepData,
 showDeepDive,
 setShowDeepDive,
}: {
 vocabData: VocabData;
 hasDeepData: boolean;
 showDeepDive: boolean;
 setShowDeepDive: (v: boolean) => void;
}) {
 if (hasDeepData) {
  return (
   <div className="px-6 py-4">
    <button
     onClick={() => setShowDeepDive(!showDeepDive)}
     className="flex items-center justify-between w-full py-2 text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
    >
     <span>{showDeepDive ? "Thu gọn" : "Xem chi tiết phân tích"}</span>
     {showDeepDive ? (
      <ChevronUp className="w-4 h-4" />
     ) : (
      <ChevronDown className="w-4 h-4" />
     )}
    </button>

    {showDeepDive && (
     <div className="flex flex-col gap-5 pt-3">
      {vocabData.ai_analysis?.etymology && (
       <section>
        <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
         📖 Chiết tự & Nguồn gốc
        </h4>
        <div className="bg-bg-primary rounded-xl p-4 border border-border-default">
         <p className="text-sm text-text-secondary leading-relaxed">
          {vocabData.ai_analysis.etymology}
         </p>
        </div>
       </section>
      )}

      {vocabData.ai_analysis?.usage_logic &&
       vocabData.ai_analysis.usage_logic.length > 0 && (
        <section>
         <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
          💡 Tư duy cốt lõi
         </h4>
         <ul className="space-y-2">
          {vocabData.ai_analysis.usage_logic.map((item, i) => (
           <li
            key={i}
            className="text-sm text-text-secondary flex items-start gap-2.5 bg-bg-primary rounded-xl p-3 border border-border-default"
           >
            <span className="text-accent mt-1 text-[8px]">●</span>
            <span className="flex-1">{item}</span>
           </li>
          ))}
         </ul>
        </section>
       )}

      {vocabData.ai_analysis?.vn_trap && (
       <section>
        <h4 className="text-xs font-bold text-danger mb-2 flex items-center gap-1.5">
         ⚠️ Bẫy tiếng Việt
        </h4>
        <div className="bg-danger-subtle rounded-xl p-4 border border-danger/20">
         <p className="text-sm text-danger-text leading-relaxed">
          {vocabData.ai_analysis.vn_trap}
         </p>
        </div>
       </section>
      )}

      {vocabData.ai_analysis?.examples &&
       vocabData.ai_analysis.examples.length > 0 && (
        <section>
         <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
          📝 Ví dụ thực tế
         </h4>
         <div className="space-y-2">
          {vocabData.ai_analysis.examples.map((ex, i) => (
           <div
            key={i}
            className="bg-bg-primary rounded-xl p-4 border border-border-default"
           >
            <p className="text-sm font-medium text-text-primary mb-1">
             {ex.zh}
            </p>
            <p className="text-xs text-accent font-medium">{ex.pinyin}</p>
            <p className="text-xs text-text-muted italic mt-0.5">{ex.vi}</p>
           </div>
          ))}
         </div>
        </section>
       )}

      {vocabData.ai_analysis?.collocations &&
       vocabData.ai_analysis.collocations.length > 0 && (
        <section>
         <h4 className="text-xs font-bold text-text-primary mb-2 flex items-center gap-1.5">
          🔗 Từ ghép thường gặp
         </h4>
         <div className="flex flex-wrap gap-2">
          {vocabData.ai_analysis.collocations.map((col, i) => (
           <span
            key={i}
            className="text-sm font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-lg"
           >
            {col}
           </span>
          ))}
         </div>
        </section>
       )}
     </div>
    )}
   </div>
  );
 }

 return (
  <div className="px-6 py-4">
   <div className="bg-bg-primary rounded-xl p-4 border border-border-default text-center">
    <p className="text-sm text-text-muted mb-2">
     Chưa có dữ liệu phân tích chi tiết
    </p>
    <button
     onClick={() => {
      toast.info("Tính năng phân tích AI sẽ sớm được cập nhật!");
     }}
     className="text-sm font-semibold text-accent hover:text-accent-hover transition-colors"
    >
     Yêu cầu phân tích sâu (AI)
    </button>
   </div>
  </div>
 );
}
