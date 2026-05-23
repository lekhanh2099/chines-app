"use client";

import { useEffect, useRef, useState } from "react";
import {
 BookmarkPlus,
 Check,
 Loader2,
 Save,
 Volume2,
 VolumeOff,
 X,
} from "lucide-react";
import { toast } from "sonner";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { useTTS } from "@/hooks/useTTS";
import { extractChinese } from "@/lib/chinese-utils";
import {
 getNormalizedAntonyms,
 getNormalizedDefinitions,
 getNormalizedRelatedCompounds,
 getNormalizedRadicals,
 getNormalizedSynonyms,
} from "@/services/vocab.service";
import { useVocabDetailDrawerStore } from "@/stores/vocab-detail-drawer-store";
import type { AiAnalysis, SmartSelectionMode } from "@/types/database";

const HANZI_CHAR_REGEX = /[\u4e00-\u9fff]/;

type HanziWriterInstance = {
 animateCharacter?: () => Promise<unknown>;
 hideCharacter?: (options?: { duration?: number }) => Promise<unknown>;
};

function getDisplayMeaning(
 mode: SmartSelectionMode,
 data: ReturnType<typeof useSmartSelectionInsights>["data"],
) {
 if (!data) return "";
 if (mode === "sentence") {
  return data.translation || data.entry.meaning || "";
 }

 return (
  data.meaning_summary ||
  data.definitions[0]?.meaning ||
  data.definitions[0]?.text ||
  data.entry.meaning ||
  ""
 );
}

function getUniqueCharacters(text: string) {
 return Array.from(
  new Set(
   Array.from(extractChinese(text)).filter((char) =>
    HANZI_CHAR_REGEX.test(char),
   ),
  ),
 );
}

export function VocabDetailDrawer() {
 const {
  isOpen,
  text,
  contextSentence,
  mode,
  closeDetailDrawer,
  openDetailDrawer,
 } = useVocabDetailDrawerStore();
 const detailQuery = useSmartSelectionInsights(text, contextSentence, {
  enabled: isOpen && !!text,
  mode,
 });
 const smartData = detailQuery.data;
 const displayMeaning = getDisplayMeaning(mode, smartData);
 const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();

 const handleSpeak = () => {
  const speechText =
   mode === "sentence" ? text : smartData?.entry.hanzi || text;
  if (!speechText) return;
  if (isSpeaking) {
   stop();
   return;
  }
  void speak(speechText);
 };

 const handleSave = async (noteDraft: string) => {
  if (!smartData) return;

  try {
   await detailQuery.saveSelection({
    personalNote: noteDraft,
    personalNoteMode: "important",
   });
   toast.success(
    mode === "sentence"
     ? "Đã lưu câu mẫu vào kho ôn tập"
     : `Đã lưu \"${smartData.entry.hanzi}\" vào kho ôn tập`,
   );
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : "Không thể lưu từ vựng",
   );
  }
 };

 if (!isOpen) {
  return null;
 }

 return (
  <div className="fixed inset-0 z-10000 pointer-events-none">
   <button
    type="button"
    aria-label="Đóng chi tiết từ vựng"
    className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] pointer-events-auto"
    onClick={closeDetailDrawer}
   />
   <aside className="absolute right-0 top-0 h-full w-full max-w-176 border-l border-border-default bg-bg-primary shadow-2xl pointer-events-auto">
    <div className="flex h-full flex-col">
     <div className="sticky top-0 z-10 border-b border-border-default bg-bg-card/95 backdrop-blur px-5 py-4">
      <div className="flex items-start justify-between gap-3">
       <div className="min-w-0">
        <div className="flex items-center gap-2">
         <h2 className="text-2xl font-black leading-none text-text-primary">
          {smartData?.entry.hanzi || text}
         </h2>
         <button
          type="button"
          onClick={handleSpeak}
          disabled={isTTSLoading}
          className="rounded-full p-1.5 text-text-muted transition-colors hover:bg-bg-primary hover:  disabled:opacity-50"
          title={isSpeaking ? "Dừng phát âm" : "Nghe phát âm"}
         >
          {isTTSLoading ? (
           <Loader2 className="h-4 w-4 animate-spin  " />
          ) : isSpeaking ? (
           <VolumeOff className="h-4 w-4  " />
          ) : (
           <Volume2 className="h-4 w-4" />
          )}
         </button>
        </div>
        {smartData?.entry.pinyin && (
         <p className="mt-1 text-sm font-semibold  ">
          {smartData.entry.pinyin}
         </p>
        )}
       </div>

       <div className="flex items-center gap-2">
        <div className="rounded-2xl border border-border-default bg-bg-primary px-3 py-2 text-right">
         <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
          SRS
         </p>
         <p className="text-xs font-semibold text-text-primary">
          {smartData?.isSaved ? "Đã lưu" : "Chưa lưu"}
         </p>
        </div>
        <button
         type="button"
         onClick={closeDetailDrawer}
         className="rounded-full p-2 text-text-muted transition-colors hover:bg-bg-primary hover:text-text-primary"
         title="Đóng"
        >
         <X className="h-4 w-4" />
        </button>
       </div>
      </div>
     </div>

     <div className="flex-1 overflow-y-auto px-5 py-4">
      {detailQuery.isLoading ? (
       <div className="flex h-40 items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin  " />
        Đang tải chi tiết từ vựng...
       </div>
      ) : detailQuery.isError ? (
       <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {detailQuery.error instanceof Error
         ? detailQuery.error.message
         : "Không thể tải dữ liệu chi tiết"}
       </div>
      ) : !smartData ? (
       <div className="rounded-2xl border border-border-default bg-bg-card px-4 py-6 text-sm text-text-muted">
        Không có dữ liệu để hiển thị.
       </div>
      ) : mode === "sentence" ? (
       <SentenceDetailPanel
        key={`${smartData.selection}-sentence`}
        text={text}
        smartData={smartData}
        onCharacterSelect={(character) =>
         openDetailDrawer({
          text: character,
          contextSentence: text,
          mode: "word",
         })
        }
        onSave={handleSave}
        isSaving={detailQuery.isSaving}
       />
      ) : (
       <WordDetailPanel
        key={`${smartData.selection}-word`}
        smartData={smartData}
        onDrillCharacter={(character) =>
         openDetailDrawer({
          text: character,
          contextSentence: text,
          mode: "word",
         })
        }
        onSave={handleSave}
        isSaving={detailQuery.isSaving}
        displayMeaning={displayMeaning}
       />
      )}
     </div>
    </div>
   </aside>
  </div>
 );
}

function WordDetailPanel({
 smartData,
 onDrillCharacter,
 onSave,
 isSaving,
 displayMeaning,
}: {
 smartData: NonNullable<ReturnType<typeof useSmartSelectionInsights>["data"]>;
 onDrillCharacter: (character: string) => void;
 onSave: (noteDraft: string) => void;
 isSaving: boolean;
 displayMeaning: string;
}) {
 const ai = smartData.entry.ai_analysis as AiAnalysis | undefined;
 const radicals = getNormalizedRadicals(ai);
 const definitions = getNormalizedDefinitions(
  ai,
  smartData.entry.meaning || "",
 );
 const examples =
  ai?.examples?.filter((example) => example.zh || example.vi) ||
  definitions
   .flatMap((definition) => definition.examples || [])
   .filter((example) => example.cn || example.vi)
   .map((example) => ({
    zh: example.cn || "",
    pinyin: example.pinyin || example.py || "",
    vi: example.vi || "",
   }));
 const relatedCompounds = getNormalizedRelatedCompounds(ai);
 const synonyms = getNormalizedSynonyms(ai);
 const antonyms = getNormalizedAntonyms(ai);
 const characters = getUniqueCharacters(smartData.entry.hanzi);
 const [activeCharacter, setActiveCharacter] = useState(characters[0] || "");
 const visualCharacter =
  characters.includes(activeCharacter) && activeCharacter
   ? activeCharacter
   : characters[0] || smartData.entry.hanzi;
 const [noteDraft, setNoteDraft] = useState(smartData.personal_note || "");
 const etymologyType =
  typeof ai?.etymology === "object" ? ai.etymology.type : undefined;
 const etymologyText =
  typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;

 return (
  <div className="space-y-5">
   <div className="rounded-3xl border border-border-default bg-bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
     <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
       Header
      </p>
      <p className="mt-1 text-base font-semibold text-text-primary">
       {displayMeaning}
      </p>
     </div>
     <button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:  disabled:opacity-50"
     >
      {isSaving ? (
       <Loader2 className="h-4 w-4 animate-spin" />
      ) : smartData.isSaved ? (
       <Check className="h-4 w-4 text-success" />
      ) : (
       <BookmarkPlus className="h-4 w-4" />
      )}
      {smartData.isSaved ? "Đã lưu" : "Lưu"}
     </button>
    </div>
   </div>

   <section className="rounded-3xl border border-border-default bg-bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
     <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
       Giải phẫu
      </p>
      {characters.length > 1 && (
       <div className="mt-2 flex flex-wrap gap-2">
        {characters.map((character) => (
         <button
          key={character}
          type="button"
          onClick={() => setActiveCharacter(character)}
          className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm font-bold transition-colors ${
           visualCharacter === character
            ? "border-accent bg-accent text-white"
            : "border-border-default bg-bg-primary text-text-primary hover:border-accent hover: "
          }`}
         >
          {character}
         </button>
        ))}
       </div>
      )}
     </div>
     {visualCharacter && visualCharacter !== smartData.entry.hanzi && (
      <button
       type="button"
       onClick={() => onDrillCharacter(visualCharacter)}
       className="text-xs font-semibold   hover: -hover"
      >
       Tra riêng chữ này
      </button>
     )}
    </div>

    <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
     <CharacterWriterCard character={visualCharacter} />

     <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
       <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-2">
        Bộ thủ
       </p>
       {radicals.length > 0 ? (
        <div className="space-y-2">
         {radicals.slice(0, 4).map((radical, index) => (
          <div
           key={`${radical.char || radical.meaning || "radical"}-${index}`}
           className="rounded-xl border border-border-default bg-bg-card px-3 py-2"
          >
           <p className="text-base font-bold text-text-primary">
            {radical.char || "?"}
           </p>
           <p className="text-xs font-semibold  ">{radical.pinyin}</p>
           <p className="text-xs text-text-secondary">{radical.meaning}</p>
          </div>
         ))}
        </div>
       ) : (
        <p className="text-sm text-text-muted">Chưa có dữ liệu bộ thủ.</p>
       )}
      </div>

      <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
       <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-2">
        Lục thư
       </p>
       {etymologyType && (
        <span className="inline-flex rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-700">
         {etymologyType}
        </span>
       )}
       <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {etymologyText || "Chưa có phân tích nguồn gốc."}
       </p>
      </div>
     </div>
    </div>
   </section>
   {ai?.mnemonic_story && (
    <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 mb-1.5">
      AI gợi ý mẹo nhớ
     </p>
     <p className="text-sm leading-relaxed text-amber-900">
      {ai.mnemonic_story}
     </p>
    </div>
   )}

   <section className="rounded-3xl border border-border-default bg-bg-card p-4">
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
     Ngữ nghĩa & Ví dụ
    </p>
    <div className="space-y-4">
     {definitions.length > 0 ? (
      definitions.map((definition, index) => {
       const definitionExamples =
        definition.examples
         ?.filter((example) => example.cn || example.vi)
         .map((example) => ({
          zh: example.cn || "",
          pinyin: example.pinyin || example.py || "",
          vi: example.vi || "",
         })) || [];

       return (
        <div
         key={`${definition.text || definition.meaning || "definition"}-${index}`}
         className="rounded-2xl border border-border-default bg-bg-primary p-3"
        >
         <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-white">
           {index + 1}
          </span>
          {definition.pos && (
           <span className="rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-purple-700">
            {definition.pos}
           </span>
          )}
         </div>
         <p className="mt-2 text-sm font-semibold text-text-primary">
          {definition.meaning || definition.text}
         </p>
         {definitionExamples.length > 0 && (
          <div className="mt-3 space-y-2 border-l-2 border-accent/20 pl-3">
           {definitionExamples.map((example, exampleIndex) => (
            <ExampleCard
             key={`${example.zh}-${exampleIndex}`}
             example={example}
            />
           ))}
          </div>
         )}
        </div>
       );
      })
     ) : (
      <div className="rounded-2xl border border-border-default bg-bg-primary p-3 text-sm text-text-muted">
       {displayMeaning || "Chưa có dữ liệu nghĩa."}
      </div>
     )}

     {examples.length > 0 && (
      <div className="space-y-2">
       <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
        Ví dụ nổi bật
       </p>
       <div className="grid gap-2 md:grid-cols-2">
        {examples.slice(0, 4).map((example, index) => (
         <ExampleCard key={`${example.zh}-${index}`} example={example} />
        ))}
       </div>
      </div>
     )}

     <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
       Từ ghép liên quan
      </p>
      <div className="space-y-3">
       <RelationList
        title="Từ ghép"
        items={relatedCompounds}
        emptyText="Chưa có từ ghép liên quan."
        onSelect={onDrillCharacter}
       />
       <RelationList
        title="Đồng nghĩa"
        items={synonyms}
        emptyText="Chưa có từ đồng nghĩa cơ bản."
        onSelect={onDrillCharacter}
       />
       <RelationList
        title="Trái nghĩa"
        items={antonyms}
        emptyText="Chưa có từ trái nghĩa cơ bản."
        onSelect={onDrillCharacter}
       />
      </div>
     </div>
    </div>
   </section>

   <section className="rounded-3xl border border-border-default bg-bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
      Ghi chú cá nhân
     </p>
     <button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:  disabled:opacity-50"
     >
      {isSaving ? (
       <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
       <Save className="h-4 w-4" />
      )}
      Lưu note
     </button>
    </div>
    <textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder="Tự ghi cách nhớ, ngữ cảnh dùng, điểm dễ nhầm..."
     className="min-h-32 w-full resize-y rounded-2xl border border-border-default bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-ring"
    />
   </section>
  </div>
 );
}

function SentenceDetailPanel({
 text,
 smartData,
 onCharacterSelect,
 onSave,
 isSaving,
}: {
 text: string;
 smartData: NonNullable<ReturnType<typeof useSmartSelectionInsights>["data"]>;
 onCharacterSelect: (character: string) => void;
 onSave: (noteDraft: string) => void;
 isSaving: boolean;
}) {
 const [noteDraft, setNoteDraft] = useState(smartData.personal_note || "");

 return (
  <div className="space-y-5">
   <section className="rounded-3xl border border-border-default bg-bg-card p-4">
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted mb-2">
     Dịch nghĩa
    </p>
    <p className="text-sm leading-relaxed text-text-primary">
     {smartData.translation || smartData.entry.meaning || "Chưa có bản dịch."}
    </p>
   </section>

   {smartData.grammar_points.length > 0 && (
    <section className="rounded-3xl border border-border-default bg-bg-card p-4">
     <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
      Ghi chú ngữ pháp
     </p>
     <div className="space-y-2">
      {smartData.grammar_points.map((point, index) => (
       <div
        key={`${point.pattern || "grammar"}-${index}`}
        className="rounded-2xl border border-border-default bg-bg-primary p-3"
       >
        <p className="text-xs font-semibold uppercase tracking-wide  ">
         {point.pattern || `Điểm ${index + 1}`}
        </p>
        {point.explanation && (
         <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {point.explanation}
         </p>
        )}
       </div>
      ))}
     </div>
    </section>
   )}

   <section className="rounded-3xl border border-border-default bg-bg-card p-4">
    <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
     Bấm từng hán tự để học sâu
    </p>
    <div className="flex flex-wrap gap-2">
     {Array.from(text).map((char, index) =>
      HANZI_CHAR_REGEX.test(char) ? (
       <button
        key={`${char}-${index}`}
        type="button"
        onClick={() => onCharacterSelect(char)}
        className="inline-flex h-10 min-w-10 items-center justify-center rounded-md border border-border-default bg-bg-primary px-2 text-base font-bold text-text-primary transition-colors hover:border-accent hover: "
       >
        {char}
       </button>
      ) : (
       <span
        key={`${char}-${index}`}
        className="inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-bg-subtle px-2 text-sm text-text-muted"
       >
        {char}
       </span>
      ),
     )}
    </div>
   </section>

   <section className="rounded-3xl border border-border-default bg-bg-card p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
      Ghi chú cá nhân
     </p>
     <button
      type="button"
      onClick={() => onSave(noteDraft)}
      disabled={isSaving}
      className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-primary px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent hover:  disabled:opacity-50"
     >
      {isSaving ? (
       <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
       <Save className="h-4 w-4" />
      )}
      Lưu note
     </button>
    </div>
    <textarea
     value={noteDraft}
     onChange={(event) => setNoteDraft(event.target.value)}
     placeholder="Ghi chú cách hiểu câu, cấu trúc hoặc lỗi dễ mắc..."
     className="min-h-32 w-full resize-y rounded-2xl border border-border-default bg-bg-primary px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:ring-2 focus:ring-ring"
    />
   </section>
  </div>
 );
}

function ExampleCard({
 example,
}: {
 example: { zh: string; pinyin: string; vi: string };
}) {
 return (
  <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
   <p className="text-sm font-medium text-text-primary">{example.zh}</p>
   {example.pinyin && (
    <p className="text-xs font-semibold  ">{example.pinyin}</p>
   )}
   {example.vi && (
    <p className="text-xs text-text-secondary italic">{example.vi}</p>
   )}
  </div>
 );
}

function RelationList({
 title,
 items,
 emptyText,
 onSelect,
}: {
 title: string;
 items: Array<{ word?: string; pinyin?: string; meaning?: string }>;
 emptyText: string;
 onSelect: (word: string) => void;
}) {
 return (
  <div className="space-y-2">
   <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
    {title}
   </p>
   {items.length > 0 ? (
    <div className="space-y-2">
     {items.map((item, index) => {
      const word = item.word?.trim();
      if (!word) return null;

      return (
       <button
        key={`${title}-${word}-${index}`}
        type="button"
        onClick={() => onSelect(word)}
        className="flex w-full items-start justify-between gap-3 rounded-2xl border border-accent/20 bg-accent/8 px-3 py-2.5 text-left transition-colors hover:bg-accent/15"
       >
        <div className="min-w-0">
         <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-text-primary">{word}</span>
          {item.pinyin && (
           <span className="text-xs font-semibold  ">{item.pinyin}</span>
          )}
         </div>
         <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {item.meaning || "Chưa có nghĩa."}
         </p>
        </div>
       </button>
      );
     })}
    </div>
   ) : (
    <div className="rounded-2xl border border-border-default bg-bg-primary p-3 text-sm text-text-muted">
     {emptyText}
    </div>
   )}
  </div>
 );
}

function CharacterWriterCard({ character }: { character: string }) {
 const containerRef = useRef<HTMLDivElement>(null);
 const writerRef = useRef<HanziWriterInstance | null>(null);

 useEffect(() => {
  if (!containerRef.current || !character || typeof window === "undefined") {
   return;
  }

  const container = containerRef.current;
  let isActive = true;
  writerRef.current = null;
  container.innerHTML = "";

  const renderFallback = () => {
   container.innerHTML = "";
   container.style.display = "flex";
   container.style.alignItems = "center";
   container.style.justifyContent = "center";
   container.textContent = character;
   container.style.fontSize = "88px";
   container.style.fontWeight = "700";
   container.style.color = "#0f172a";
  };

  const drawGrid = () => {
   const existing = container.querySelector(".hanzi-grid-bg");
   if (existing) return;
   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   svg.setAttribute("class", "hanzi-grid-bg");
   svg.setAttribute("width", "160");
   svg.setAttribute("height", "160");
   svg.style.position = "absolute";
   svg.style.top = "0";
   svg.style.left = "0";
   svg.style.zIndex = "0";
   svg.style.pointerEvents = "none";
   svg.style.opacity = "0.15";
   svg.innerHTML = `
    <rect width="160" height="160" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
    <line x1="80" y1="0" x2="80" y2="160" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4,3"/>
    <line x1="0" y1="80" x2="160" y2="80" stroke="#94a3b8" stroke-width="0.8" stroke-dasharray="4,3"/>
    <line x1="0" y1="0" x2="160" y2="160" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="4,3"/>
    <line x1="160" y1="0" x2="0" y2="160" stroke="#94a3b8" stroke-width="0.5" stroke-dasharray="4,3"/>
   `;
   container.insertBefore(svg, container.firstChild);
  };

  void import("hanzi-writer")
   .then(async (module) => {
    if (!isActive) return;
    const HanziWriter = module.default;

    try {
     const charData = await HanziWriter.loadCharacterData(character);
     if (!isActive) return;
     drawGrid();
     const writer = HanziWriter.create(container, character, {
      width: 160,
      height: 160,
      padding: 10,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      strokeColor: "#1e293b",
      radicalColor: "#2563eb",
      outlineColor: "#cbd5e1",
      drawingColor: "#dc2626",
      showOutline: true,
      showCharacter: true,
      charDataLoader: () => charData,
     }) as HanziWriterInstance;
     writerRef.current = writer;
     requestAnimationFrame(() => {
      if (!isActive) return;
      void writer
       .hideCharacter?.({ duration: 0 })
       ?.then(() => writer.animateCharacter?.());
     });
    } catch {
     if (!isActive) return;
     renderFallback();
    }
   })
   .catch(() => {
    if (!isActive) return;
    renderFallback();
   });

  return () => {
   isActive = false;
   writerRef.current = null;
   container.innerHTML = "";
  };
 }, [character]);

 return (
  <div className="rounded-2xl border border-border-default bg-bg-primary p-3">
   <div
    ref={containerRef}
    className="mx-auto rounded-xl border border-border-default bg-white"
    style={{ width: 160, height: 160, position: "relative" }}
   />
  </div>
 );
}
