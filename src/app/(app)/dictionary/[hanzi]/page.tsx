"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
 ArrowLeft,
 Volume2,
 BookmarkPlus,
 CheckCircle,
 Loader2,
 Play,
 PenTool,
 Sparkles,
 BarChart3,
 StickyNote,
} from "lucide-react";
import { Tabs } from "@base-ui/react";
import { toast } from "sonner";
import { useVocabDetail } from "@/features/vocabulary/hooks/useVocabDetail";
import type { AiAnalysis } from "@/types/database";

/* ──────── Tab styling ──────── */
const tabClass =
 "px-3.5 py-1.5 rounded text-xs font-bold text-text-muted transition-colors hover:bg-bg-card-hover data-selected:bg-accent data-selected:text-white data-selected:shadow-sm cursor-pointer outline-none";

export default function DictionaryPage() {
 const params = useParams();
 const hanzi = decodeURIComponent(params.hanzi as string);

 // All data fetching via useVocabDetail hook (TanStack Query)
 const {
  vocabData,
  srsLevel,
  isSaved,
  isLoading,
  triggerAi,
  isAiLoading,
  saveToSrs,
  isSaving,
  hasAiData,
 } = useVocabDetail(hanzi);

 const [personalNote, setPersonalNote] = useState("");
 const [quizMode, setQuizMode] = useState(false);

 const hanziContainerRef = useRef<HTMLDivElement>(null);
 const writerRef = useRef<ReturnType<typeof Object> | null>(null);

 /* ──────── Auto-trigger AI if no data ──────── */
 useEffect(() => {
  if (!isLoading && vocabData && !hasAiData()) {
   triggerAi(undefined, {
    onSuccess: () => toast.success("Đã phân tích xong!"),
    onError: () => toast.error("Không thể phân tích từ này. Thử lại sau."),
   });
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [isLoading, vocabData?.hanzi]);

 /* ──────── Draw background grid (田字格) ──────── */
 const drawGrid = (container: HTMLDivElement) => {
  const existing = container.querySelector(".hanzi-grid-bg");
  if (existing) return;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "hanzi-grid-bg");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "120");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.zIndex = "0";
  svg.style.pointerEvents = "none";
  svg.style.opacity = "0.15";
  svg.innerHTML = `
   <rect width="120" height="120" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
   <line x1="60" y1="0" x2="60" y2="120" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4,3"/>
   <line x1="0" y1="60" x2="120" y2="60" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4,3"/>
   <line x1="0" y1="0" x2="120" y2="120" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="4,3"/>
   <line x1="120" y1="0" x2="0" y2="120" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="4,3"/>
  `;
  container.style.position = "relative";
  container.insertBefore(svg, container.firstChild);
 };

 /* ──────── Hanzi Writer ──────── */
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
     charDiv.style.width = "120px";
     charDiv.style.height = "120px";
     charDiv.style.position = "relative";
     container.appendChild(charDiv);

     try {
      const writer = HanziWriter.create(charDiv, char, {
       width: 120,
       height: 120,
       padding: 6,
       strokeAnimationSpeed: 1,
       delayBetweenStrokes: 200,
       strokeColor: "#1e293b",
       radicalColor: "#6366f1",
       outlineColor: "#cbd5e1",
       drawingColor: "var(--accent)",
       showOutline: true,
       showCharacter: true,
      });
      writerRef.current = writer;
      drawGrid(charDiv);
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

 /* ──────── Handlers ──────── */
 const handleSpeak = () => {
  if (!vocabData) return;
  const u = new SpeechSynthesisUtterance(vocabData.hanzi);
  u.lang = "zh-CN";
  u.rate = 0.8;
  speechSynthesis.speak(u);
 };

 const handlePlayAnimation = () => {
  const w = writerRef.current as { animateCharacter?: () => void } | null;
  if (w?.animateCharacter) w.animateCharacter();
 };

 const handleQuizMode = () => {
  const w = writerRef.current as { quiz?: (opts: object) => void } | null;
  if (w?.quiz) {
   setQuizMode(true);
   w.quiz({
    onComplete: () => {
     toast.success("Viết đúng rồi! 🎉");
     setQuizMode(false);
    },
   });
  }
 };

 const handleSave = () => {
  if (!vocabData || isSaving) return;
  saveToSrs(vocabData, {
   onSuccess: () => toast.success(`Đã lưu "${vocabData.hanzi}" vào SRS!`),
   onError: () => toast.error("Không thể lưu từ vựng"),
  });
 };

 /* ──────── Loading ──────── */
 if (isLoading) {
  return (
   <div className="flex flex-col items-center justify-center h-full gap-4">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
    <p className="text-sm text-text-muted animate-pulse">
     Đang tải dữ liệu từ điển...
    </p>
   </div>
  );
 }

 if (!vocabData) {
  return (
   <div className="flex flex-col items-center justify-center h-full gap-4">
    <p className="text-text-muted">Không tìm thấy từ vựng</p>
    <Link
     href="/vocabulary"
     className="text-accent hover:text-accent-hover font-medium text-sm"
    >
     Quay về kho từ vựng
    </Link>
   </div>
  );
 }

 const ai: AiAnalysis | undefined = vocabData.ai_analysis;

 // Normalize etymology
 const etymologyType =
  typeof ai?.etymology === "object" ? ai.etymology.type : undefined;
 const etymologyText =
  typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;

 // Resolve meanings
 const meanings = ai?.meanings ?? [];
 const examples =
  ai?.examples ??
  meanings
   .filter((m) => m.example?.cn)
   .map((m) => ({
    zh: m.example!.cn!,
    pinyin: m.example!.pinyin || "",
    vi: m.example!.vi || "",
   }));

 const relatedWords = ai?.related_words ?? ai?.collocations ?? [];
 const hasContent =
  meanings.length > 0 ||
  examples.length > 0 ||
  etymologyText ||
  relatedWords.length > 0 ||
  ai?.vn_trap ||
  ai?.common_mistakes;

 return (
  <div className="w-full h-full overflow-y-auto">
   <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6">
    <Link
     href="/vocabulary"
     className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors mb-4"
    >
     <ArrowLeft className="w-3.5 h-3.5" />
     Kho từ vựng
    </Link>

    {/* 2-Column Grid: 8/4 */}
    <div className="grid grid-cols-12 gap-5">
     {/* LEFT COL (8) */}
     <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
      {/* HANZI HEADER */}
      <div className="bg-bg-card rounded border border-border-default shadow-theme-sm p-5">
       <div className="flex gap-5">
        <div className="shrink-0 flex flex-col items-center gap-2">
         <div
          ref={hanziContainerRef}
          className="rounded border border-border-default bg-white dark:bg-slate-900"
          style={{ width: 120, height: 120, position: "relative" }}
         />
         <div className="flex items-center gap-1">
          <button
           onClick={handlePlayAnimation}
           className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"
           title="Xem nét viết"
          >
           <Play className="w-3 h-3" />
           Nét viết
          </button>
          <button
           onClick={handleQuizMode}
           disabled={quizMode}
           className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold text-text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-40"
           title="Tập viết"
          >
           <PenTool className="w-3 h-3" />
           Tập viết
          </button>
         </div>
        </div>

        <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-black text-text-primary leading-none tracking-tight">
           {vocabData.hanzi}
          </h1>
          {isSaved === true ? (
           <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded">
            <CheckCircle className="w-3 h-3" />
            Đã lưu
           </span>
          ) : isSaved === false ? (
           <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-accent bg-accent/10 hover:bg-accent/20 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
           >
            {isSaving ? (
             <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
             <BookmarkPlus className="w-3 h-3" />
            )}
            Lưu SRS
           </button>
          ) : null}
         </div>

         {/* Metadata rows */}
         <div className="flex flex-col gap-1.5 text-sm">
          <MetaRow label="Pinyin">
           <span className="font-semibold text-accent">{vocabData.pinyin}</span>
           <button
            onClick={handleSpeak}
            className="p-0.5 text-text-muted hover:text-accent transition-colors"
           >
            <Volume2 className="w-3.5 h-3.5" />
           </button>
          </MetaRow>

          {ai?.han_viet && (
           <MetaRow label="Hán Việt">
            <span className="font-bold text-text-primary uppercase text-xs bg-bg-elevated border border-border-default px-2 py-0.5 rounded">
             {ai.han_viet}
            </span>
           </MetaRow>
          )}

          {ai?.radical && (
           <MetaRow label="Bộ thủ">
            <span className="font-semibold text-text-primary">
             {ai.radical}
            </span>
           </MetaRow>
          )}

          {ai?.stroke_count && (
           <MetaRow label="Số nét">
            <span className="font-semibold text-text-primary">
             {ai.stroke_count}
            </span>
           </MetaRow>
          )}

          {etymologyType && (
           <MetaRow label="Lục thư">
            <span className="font-semibold text-xs bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300">
             {etymologyType}
            </span>
           </MetaRow>
          )}

          {ai?.word_type && (
           <MetaRow label="Loại từ">
            <span className="font-semibold text-text-primary">
             {ai.word_type}
            </span>
           </MetaRow>
          )}
         </div>
        </div>
       </div>
      </div>

      {/* KNOWLEDGE TABS */}
      {isAiLoading ? (
       <AiLoadingSkeleton />
      ) : hasContent ? (
       <Tabs.Root defaultValue="meaning" className="flex flex-col gap-0">
        <Tabs.List className="flex items-center gap-1 bg-bg-card rounded border border-border-default p-1 shadow-theme-sm">
         <Tabs.Tab value="meaning" className={tabClass}>
          📖 Ngữ nghĩa & Ví dụ
         </Tabs.Tab>
         <Tabs.Tab value="deep" className={tabClass}>
          🔬 Phân tích sâu
         </Tabs.Tab>
         <Tabs.Tab value="collocations" className={tabClass}>
          🔗 Từ ghép
         </Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: Meanings */}
        <Tabs.Panel
         value="meaning"
         className="mt-3 bg-bg-card rounded border border-border-default shadow-theme-sm p-4"
        >
         {meanings.length > 0 ? (
          <div className="flex flex-col gap-3">
           {meanings.map((m, i) => (
            <div
             key={i}
             className="bg-bg-primary rounded border border-border-default p-3"
            >
             <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-bold text-white bg-accent rounded px-1.5 py-0.5">
               {i + 1}
              </span>
              {m.part_of_speech && (
               <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded px-1.5 py-0.5">
                {m.part_of_speech}
               </span>
              )}
             </div>
             <p className="text-sm font-semibold text-text-primary mb-2">
              {m.definition}
             </p>
             {m.example?.cn && (
              <div className="pl-3 border-l-2 border-accent/30">
               <p className="text-sm text-text-primary">{m.example.cn}</p>
               <p className="text-xs text-accent font-medium">
                {m.example.pinyin}
               </p>
               <p className="text-xs text-text-muted italic">{m.example.vi}</p>
              </div>
             )}
            </div>
           ))}
          </div>
         ) : vocabData.meaning ? (
          <div className="bg-bg-primary rounded border border-border-default p-3">
           <p className="text-sm font-semibold text-text-primary">
            {vocabData.meaning}
           </p>
          </div>
         ) : (
          <EmptyTabContent label="Chưa có dữ liệu nghĩa" />
         )}

         {examples.length > 0 && meanings.length === 0 && (
          <div className="mt-3 flex flex-col gap-2">
           <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
            Ví dụ
           </h4>
           {examples.map((ex, i) => (
            <div
             key={i}
             className="bg-bg-primary rounded border border-border-default p-3"
            >
             <p className="text-sm font-medium text-text-primary">{ex.zh}</p>
             <p className="text-xs text-accent font-medium">{ex.pinyin}</p>
             <p className="text-xs text-text-muted italic">{ex.vi}</p>
            </div>
           ))}
          </div>
         )}
        </Tabs.Panel>

        {/* Tab 2: Deep Dive */}
        <Tabs.Panel
         value="deep"
         className="mt-3 bg-bg-card rounded border border-border-default shadow-theme-sm p-4"
        >
         {etymologyText ? (
          <div className="mb-4">
           <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
            Chiết tự & Nguồn gốc
           </h4>
           <div className="bg-bg-primary rounded border border-border-default p-3">
            {etymologyType && (
             <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 rounded px-1.5 py-0.5 inline-block mb-2">
              {etymologyType}
             </span>
            )}
            <p className="text-sm text-text-secondary leading-relaxed">
             {etymologyText}
            </p>
           </div>
          </div>
         ) : null}

         {ai?.usage_logic && ai.usage_logic.length > 0 && (
          <div>
           <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
            Tư duy cốt lõi
           </h4>
           <ul className="flex flex-col gap-1.5">
            {ai.usage_logic.map((item, i) => (
             <li
              key={i}
              className="text-sm text-text-secondary flex items-start gap-2 bg-bg-primary rounded p-2.5 border border-border-default"
             >
              <span className="text-accent text-xs mt-0.5">●</span>
              <span className="flex-1 leading-relaxed">{item}</span>
             </li>
            ))}
           </ul>
          </div>
         )}

         {(ai?.vn_trap || ai?.common_mistakes) && (
          <div className="mt-4 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-200 dark:border-amber-800/40 p-3">
           <h4 className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1.5">
            ⚠️ Lưu ý cho người Việt
           </h4>
           <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            {ai?.vn_trap || ai?.common_mistakes}
           </p>
          </div>
         )}

         {!etymologyText &&
          !ai?.usage_logic?.length &&
          !ai?.vn_trap &&
          !ai?.common_mistakes && (
           <EmptyTabContent label="Chưa có dữ liệu phân tích sâu" />
          )}
        </Tabs.Panel>

        {/* Tab 3: Collocations */}
        <Tabs.Panel
         value="collocations"
         className="mt-3 bg-bg-card rounded border border-border-default shadow-theme-sm p-4"
        >
         {relatedWords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
           {relatedWords.map((word, i) => (
            <Link
             key={i}
             href={`/dictionary/${encodeURIComponent(word)}`}
             className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent bg-accent/8 hover:bg-accent/15 px-3 py-1.5 rounded border border-accent/20 transition-colors"
            >
             {word}
             <span className="text-[10px] text-accent/60">→</span>
            </Link>
           ))}
          </div>
         ) : (
          <EmptyTabContent label="Chưa có từ ghép liên quan" />
         )}
        </Tabs.Panel>
       </Tabs.Root>
      ) : (
       <NoDataPlaceholder
        onRequest={() =>
         triggerAi(undefined, {
          onSuccess: () => toast.success("Đã phân tích xong!"),
          onError: () =>
           toast.error("Không thể phân tích từ này. Thử lại sau."),
         })
        }
        loading={isAiLoading}
       />
      )}
     </div>

     {/* RIGHT COL (4) — Compact sidebar */}
     <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
      <div className="bg-bg-card rounded border border-border-default shadow-theme-sm p-4">
       <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <StickyNote className="w-3 h-3" />
        Ghi chú
       </h3>
       <textarea
        value={personalNote}
        onChange={(e) => setPersonalNote(e.target.value)}
        placeholder="Mẹo nhớ, ngữ cảnh..."
        className="w-full min-h-24 max-h-40 bg-bg-primary border border-border-default rounded p-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-ring transition-all resize-y leading-relaxed"
       />
      </div>

      <div className="bg-bg-card rounded border border-border-default shadow-theme-sm p-4">
       <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <BarChart3 className="w-3 h-3" />
        SRS
       </h3>
       {srsLevel !== null ? (
        <div>
         <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-text-primary">
           Level {srsLevel}/5
          </span>
          <span className="text-[10px] text-text-muted">
           {srsLevel === 0
            ? "Mới"
            : srsLevel <= 2
              ? "Ôn tập"
              : srsLevel <= 4
                ? "Tốt"
                : "Thuần thục"}
          </span>
         </div>
         <div className="w-full bg-bg-subtle rounded-full h-2 overflow-hidden">
          <div
           className="bg-accent rounded-full h-2 transition-all duration-500"
           style={{ width: `${(srsLevel / 5) * 100}%` }}
          />
         </div>
        </div>
       ) : (
        <div className="text-center py-2">
         <p className="text-[10px] text-text-muted mb-1.5">Chưa trong SRS</p>
         <button
          onClick={handleSave}
          disabled={isSaving || !!isSaved}
          className="text-[10px] font-bold text-accent hover:underline disabled:opacity-50"
         >
          {isSaving ? "Đang lưu..." : "+ Thêm SRS"}
         </button>
        </div>
       )}
      </div>

      {relatedWords.length > 0 && (
       <div className="bg-bg-card rounded border border-border-default shadow-theme-sm p-4">
        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
         Từ liên quan
        </h3>
        <div className="flex flex-col gap-1">
         {relatedWords.slice(0, 6).map((w, i) => (
          <Link
           key={i}
           href={`/dictionary/${encodeURIComponent(w)}`}
           className="flex items-center justify-between px-2 py-1.5 rounded text-xs font-semibold text-text-primary hover:bg-bg-card-hover hover:text-accent transition-colors"
          >
           <span>{w}</span>
           <span className="text-[10px] text-text-muted">→</span>
          </Link>
         ))}
        </div>
       </div>
      )}
     </div>
    </div>
   </div>
  </div>
 );
}

/* ──────── Sub-components ──────── */

function MetaRow({
 label,
 children,
}: {
 label: string;
 children: React.ReactNode;
}) {
 return (
  <div className="flex items-center gap-2">
   <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider w-16 shrink-0">
    {label}
   </span>
   <div className="flex items-center gap-1.5">{children}</div>
  </div>
 );
}

function EmptyTabContent({ label }: { label: string }) {
 return (
  <div className="text-center py-6">
   <p className="text-xs text-text-muted">{label}</p>
  </div>
 );
}

function AiLoadingSkeleton() {
 return (
  <div className="bg-bg-card rounded border border-border-default shadow-theme-sm p-5">
   <div className="flex items-center gap-2 mb-4">
    <Sparkles className="w-4 h-4 text-accent animate-pulse" />
    <span className="text-xs font-bold text-accent animate-pulse">
     Đang phân tích dữ liệu chuyên sâu...
    </span>
   </div>
   <div className="space-y-2.5">
    <div className="h-4 bg-bg-subtle rounded animate-pulse w-4/5" />
    <div className="h-3 bg-bg-subtle rounded animate-pulse w-full" />
    <div className="h-3 bg-bg-subtle rounded animate-pulse w-3/4" />
    <div className="h-3 bg-bg-subtle rounded animate-pulse w-5/6" />
    <div className="h-8 bg-bg-subtle rounded animate-pulse w-2/3 mt-3" />
    <div className="h-3 bg-bg-subtle rounded animate-pulse w-full" />
    <div className="h-3 bg-bg-subtle rounded animate-pulse w-1/2" />
   </div>
  </div>
 );
}

function NoDataPlaceholder({
 onRequest,
 loading,
}: {
 onRequest: () => void;
 loading: boolean;
}) {
 return (
  <div className="bg-bg-card rounded border border-border-default shadow-theme-sm p-6 text-center">
   <div className="space-y-2 mb-5 max-w-sm mx-auto">
    <div className="h-3 bg-bg-subtle rounded animate-pulse w-3/4 mx-auto" />
    <div className="h-2.5 bg-bg-subtle rounded animate-pulse w-full" />
    <div className="h-2.5 bg-bg-subtle rounded animate-pulse w-5/6 mx-auto" />
   </div>
   <button
    onClick={onRequest}
    disabled={loading}
    className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-hover transition-colors disabled:opacity-50"
   >
    {loading ? (
     <Loader2 className="w-3.5 h-3.5 animate-spin" />
    ) : (
     <Sparkles className="w-3.5 h-3.5" />
    )}
    {loading ? "Đang phân tích..." : "Phân tích bằng AI"}
   </button>
  </div>
 );
}
