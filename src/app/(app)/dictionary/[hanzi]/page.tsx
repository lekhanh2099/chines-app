"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
 ArrowLeft,
 BookmarkPlus,
 CheckCircle,
 Loader2,
 PenTool,
 Play,
 Save,
 Sparkles,
 StickyNote,
 Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useVocabDetail } from "@/features/vocabulary/hooks/useVocabDetail";
import { useSmartSelectionInsights } from "@/hooks/useSmartSelectionInsights";
import { extractChinese } from "@/lib/chinese-utils";
import {
 getNormalizedDefinitions,
 getNormalizedRelatedCompounds,
 getNormalizedRadicals,
} from "@/services/vocab.service";
import type { AiAnalysis, AiRelatedCompound } from "@/types/database";

const HANZI_CHAR_REGEX = /[\u4e00-\u9fff]/;

type ExampleItem = {
 zh: string;
 pinyin: string;
 vi: string;
};

type MeaningItem = {
 meaning: string;
 pos?: string;
 examples: ExampleItem[];
};

type StructureComponent = {
 part?: string;
 name?: string;
 meaning?: string;
};

type HanziWriterInstance = {
 animateCharacter?: () => Promise<unknown>;
 hideCharacter?: (options?: { duration?: number }) => Promise<unknown>;
 quiz?: (options?: { onComplete?: () => void }) => Promise<unknown>;
 cancelQuiz?: () => void;
};

function getUniqueChineseCharacters(text: string): string[] {
 return Array.from(
  new Set(
   Array.from(extractChinese(text)).filter((char) =>
    HANZI_CHAR_REGEX.test(char),
   ),
  ),
 );
}

function isSentenceLikeQuery(text: string): boolean {
 const normalized = text.trim();
 const chineseOnly = extractChinese(normalized);
 return (
  /[\s\n，。！？；：、,.!?;:]/.test(normalized) || chineseOnly.length >= 6
 );
}

function normalizeExample(example: {
 cn?: string;
 zh?: string;
 pinyin?: string;
 py?: string;
 vi?: string;
}): ExampleItem {
 return {
  zh: example.zh || example.cn || "",
  pinyin: example.pinyin || example.py || "",
  vi: example.vi || "",
 };
}

function getExampleKey(example: ExampleItem): string {
 return `${example.zh}|${example.pinyin}|${example.vi}`;
}

function getToneLabel(pinyin: string | null | undefined): string {
 if (!pinyin) return "Chưa rõ";

 const toneMap: Record<string, string> = {
  ā: "1",
  ē: "1",
  ī: "1",
  ō: "1",
  ū: "1",
  ǖ: "1",
  á: "2",
  é: "2",
  í: "2",
  ó: "2",
  ú: "2",
  ǘ: "2",
  ǎ: "3",
  ě: "3",
  ǐ: "3",
  ǒ: "3",
  ǔ: "3",
  ǚ: "3",
  à: "4",
  è: "4",
  ì: "4",
  ò: "4",
  ù: "4",
  ǜ: "4",
 };

 const tones = Array.from(
  new Set(
   Array.from(pinyin)
    .map((char) => toneMap[char])
    .filter((tone): tone is string => Boolean(tone)),
  ),
 );

 if (!tones.length) return "Thanh nhẹ";
 if (tones.length === 1) return `Thanh ${tones[0]}`;
 return `Thanh ${tones.join(", ")}`;
}

export default function DictionaryPage() {
 const params = useParams();
 const rawText = decodeURIComponent(params.hanzi as string);
 const chineseCharacters = getUniqueChineseCharacters(rawText);
 const isSentenceView = isSentenceLikeQuery(rawText);

 const {
  vocabData,
  srsLevel,
  isSaved,
  isLoading,
  triggerAi,
  isAiLoading,
  saveToSrs,
  isSaving,
  hasDeepAiData,
  personalNote: savedPersonalNote,
  personalNoteMode,
 } = useVocabDetail(rawText, { enabled: !isSentenceView });

 const sentenceQuery = useSmartSelectionInsights(rawText, rawText, {
  enabled: isSentenceView,
  mode: "sentence",
 });

 const [activeCharacter, setActiveCharacter] = useState(
  chineseCharacters[0] || rawText[0] || "",
 );

 useEffect(() => {
  if (
   !isSentenceView &&
   !isLoading &&
   !isAiLoading &&
   vocabData &&
   !hasDeepAiData()
  ) {
   triggerAi(undefined, {
    onSuccess: () => toast.success("Đã phân tích xong!"),
    onError: () => toast.error("Không thể phân tích từ này. Thử lại sau."),
   });
  }
 }, [
  hasDeepAiData,
  isAiLoading,
  isLoading,
  isSentenceView,
  triggerAi,
  vocabData,
 ]);

 if (isSentenceView) {
  return (
   <SentenceDictionaryView
    text={rawText}
    characters={chineseCharacters}
    isLoading={sentenceQuery.isLoading}
    translation={
     sentenceQuery.data?.translation || sentenceQuery.data?.entry.meaning || ""
    }
    pinyin={sentenceQuery.data?.entry.pinyin || ""}
    error={
     sentenceQuery.error instanceof Error ? sentenceQuery.error.message : null
    }
   />
  );
 }

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
 const etymologyText =
  typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;

 const definitions = getNormalizedDefinitions(ai, vocabData.meaning || "");
 const radicals = getNormalizedRadicals(ai);
 const meaningSummary =
  ai?.meaning_summary || definitions[0]?.meaning || vocabData.meaning || "";
 const examples = (
  ai?.examples ??
  definitions
   .flatMap((definition) => definition.examples || [])
   .filter((example) => example.cn || example.vi)
 ).map((example) => normalizeExample(example));
 const relatedCompounds = getNormalizedRelatedCompounds(ai).slice(0, 8);
 const selectedCharacter = chineseCharacters.includes(activeCharacter)
  ? activeCharacter
  : chineseCharacters[0] || vocabData.hanzi;
 const normalizedMeanings = definitions
  .map((definition) => ({
   meaning: definition.meaning || definition.text || "",
   pos: definition.pos || ai?.word_type || undefined,
   examples: (definition.examples || [])
    .filter((example) => example.cn || example.vi)
    .map((example) => normalizeExample(example)),
  }))
  .filter((definition) => definition.meaning || definition.examples.length > 0);
 const meaningItems: MeaningItem[] = normalizedMeanings.length
  ? normalizedMeanings
  : meaningSummary || vocabData.meaning
    ? [
       {
        meaning: meaningSummary || vocabData.meaning,
        pos: ai?.word_type || undefined,
        examples: [],
       },
      ]
    : [];
 const usedExampleKeys = new Set(
  normalizedMeanings.flatMap((definition) =>
   definition.examples.map((example) => getExampleKey(example)),
  ),
 );
 const extraExamples = examples.filter(
  (example) => !usedExampleKeys.has(getExampleKey(example)),
 );
 const hasLearningInsights =
  !!ai?.mnemonic_story ||
  !!ai?.usage_logic?.length ||
  !!ai?.vn_trap ||
  !!ai?.common_mistakes ||
  !!ai?.confusion;
 const hasContent =
  meaningItems.length > 0 ||
  !!meaningSummary ||
  examples.length > 0 ||
  radicals.length > 0 ||
  !!ai?.components?.length ||
  !!etymologyText ||
  !!ai?.mnemonic_story ||
  !!ai?.usage_logic?.length ||
  relatedCompounds.length > 0 ||
  !!ai?.vn_trap ||
  !!ai?.common_mistakes;
 const canRenderDashboard = hasContent || chineseCharacters.length > 0;
 const srsStatusLabel =
  srsLevel === null
   ? "Chưa vào SRS"
   : srsLevel === 0
     ? "Mới"
     : srsLevel <= 2
       ? "Ôn tập"
       : srsLevel <= 4
         ? "Tốt"
         : "Thuần thục";

 const handleSpeak = () => {
  const utterance = new SpeechSynthesisUtterance(vocabData.hanzi);
  utterance.lang = "zh-CN";
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
 };

 const handleSave = () => {
  if (isSaving) return;
  saveToSrs(vocabData, {
   onSuccess: () => toast.success(`Đã lưu "${vocabData.hanzi}" vào SRS!`),
   onError: () => toast.error("Không thể lưu từ vựng"),
  });
 };

 const handleSavePersonalNote = (note: string) => {
  if (isSaving) return;

  saveToSrs(
   {
    vocabData,
    options: {
     personalNote: note,
     personalNoteMode: personalNoteMode || "normal",
    },
   },
   {
    onSuccess: () => toast.success("Đã lưu ghi chú cá nhân"),
    onError: (error) =>
     toast.error(
      error instanceof Error ? error.message : "Không thể lưu ghi chú cá nhân",
     ),
   },
  );
 };

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

    <div className="grid grid-cols-12 gap-5">
     <div className="col-span-12 space-y-5 lg:col-span-8">
      <section className="rounded-3xl border border-border-default bg-bg-card p-5 shadow-theme-sm">
       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
         <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-black tracking-tight text-text-primary sm:text-5xl">
           {vocabData.hanzi}
          </h1>
          <button
           onClick={handleSpeak}
           className="rounded-full border border-border-default bg-bg-primary p-2 text-text-muted transition-colors hover:border-accent hover:text-accent"
           title="Đọc từ"
          >
           <Volume2 className="h-4 w-4" />
          </button>
          {(ai?.han_viet || vocabData.sino_vietnamese) && (
           <span className="inline-flex items-center rounded-full border border-border-default bg-bg-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-text-primary">
            {ai?.han_viet || vocabData.sino_vietnamese}
           </span>
          )}
         </div>

         <div className="mt-3 flex flex-wrap items-center gap-2.5">
          {vocabData.pinyin && (
           <p className="text-lg font-semibold text-accent sm:text-xl">
            {vocabData.pinyin}
           </p>
          )}
          {ai?.word_type && <InfoChip label={ai.word_type} />}
          <InfoChip
           label={srsLevel !== null ? `Level ${srsLevel}/5` : "Chưa vào SRS"}
          />
          <InfoChip label={srsStatusLabel} />
         </div>

         {meaningSummary && (
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary sm:text-base">
           {meaningSummary}
          </p>
         )}
        </div>

        <button
         onClick={handleSave}
         disabled={isSaving || isSaved === true}
         className="inline-flex items-center justify-center gap-2 rounded-full border border-border-default bg-bg-primary px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
         {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
         ) : isSaved === true ? (
          <CheckCircle className="h-4 w-4 text-success" />
         ) : (
          <BookmarkPlus className="h-4 w-4" />
         )}
         {isSaved === true ? "Đã lưu" : "Lưu vào SRS"}
        </button>
       </div>
      </section>

      <section className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-theme-sm sm:p-5">
       {isAiLoading ? (
        <AiLoadingSkeleton />
       ) : canRenderDashboard ? (
        <div className="space-y-4">
         <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
           <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            Định nghĩa & ví dụ
           </p>
           <p className="mt-1 text-sm text-text-muted">
            Học nghĩa trước, nhìn ví dụ ngay bên dưới từng nghĩa.
           </p>
          </div>
          {meaningItems.length > 0 && (
           <span className="inline-flex items-center rounded-full border border-border-default bg-bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
            {meaningItems.length} nghĩa
           </span>
          )}
         </div>

         {meaningItems.length > 0 ? (
          <div className="space-y-3">
           {meaningItems.map((meaning, index) => (
            <div
             key={`${meaning.meaning}-${index}`}
             className="rounded-2xl border border-border-default bg-bg-primary p-4"
            >
             <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-2 text-[10px] font-bold text-white">
               {index + 1}
              </span>
              {meaning.pos && (
               <span className="rounded-full border border-border-default bg-bg-card px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">
                {meaning.pos}
               </span>
              )}
             </div>

             <p className="mt-3 text-sm font-semibold leading-relaxed text-text-primary sm:text-base">
              {meaning.meaning}
             </p>

             {meaning.examples.length > 0 && (
              <div className="mt-3 space-y-2 border-l-2 border-accent/20 pl-3">
               {meaning.examples.map((example, exampleIndex) => (
                <ExampleRow
                 key={`${getExampleKey(example)}-${exampleIndex}`}
                 example={example}
                />
               ))}
              </div>
             )}
            </div>
           ))}
          </div>
         ) : (
          <div className="rounded-2xl border border-border-default bg-bg-primary px-4 py-6 text-sm text-text-muted">
           Chưa có dữ liệu nghĩa để hiển thị.
          </div>
         )}

         {extraExamples.length > 0 && (
          <div className="space-y-2">
           <SectionTitle title="Ví dụ mở rộng" />
           <div className="grid gap-2 md:grid-cols-2">
            {extraExamples.slice(0, 6).map((example, index) => (
             <ExampleCard
              key={`${getExampleKey(example)}-extra-${index}`}
              example={example}
             />
            ))}
           </div>
          </div>
         )}
        </div>
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
      </section>

      <section className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-theme-sm sm:p-5">
       <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
         <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          Từ ghép liên quan
         </p>
         <p className="mt-1 text-sm text-text-muted">
          Mở rộng vốn từ ngay sau khi nắm nghĩa chính.
         </p>
        </div>
        {relatedCompounds.length > 0 && (
         <span className="inline-flex items-center rounded-full border border-border-default bg-bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
          {relatedCompounds.length} từ
         </span>
        )}
       </div>

       {relatedCompounds.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
         {relatedCompounds.map((compound, index) => (
          <CompoundPreviewCard
           key={`${compound.word || "compound"}-${index}`}
           compound={compound}
          />
         ))}
        </div>
       ) : (
        <div className="mt-4 rounded-2xl border border-border-default bg-bg-primary px-4 py-6 text-sm text-text-muted">
         Chưa có từ ghép liên quan.
        </div>
       )}
      </section>

      {hasLearningInsights && (
       <section className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-theme-sm sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
         Gợi nhớ & lưu ý
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
         {ai?.mnemonic_story && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
           <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            Mẹo nhớ
           </p>
           <p className="mt-2 text-sm leading-relaxed text-amber-900">
            {ai.mnemonic_story}
           </p>
          </div>
         )}

         {(ai?.vn_trap || ai?.common_mistakes || ai?.confusion) && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4">
           <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-700">
            Dễ nhầm
           </p>
           <p className="mt-2 text-sm leading-relaxed text-rose-800">
            {ai?.confusion || ai?.vn_trap || ai?.common_mistakes}
           </p>
          </div>
         )}
        </div>

        {ai?.usage_logic && ai.usage_logic.length > 0 && (
         <div className="mt-4 rounded-2xl border border-border-default bg-bg-primary p-4">
          <SectionTitle title="Tư duy cốt lõi" />
          <div className="space-y-2">
           {ai.usage_logic.map((item, index) => (
            <div
             key={`${item}-${index}`}
             className="flex items-start gap-2 rounded-xl border border-border-default bg-bg-card px-3 py-2.5"
            >
             <span className="mt-0.5 text-xs text-accent">●</span>
             <span className="text-sm leading-relaxed text-text-secondary">
              {item}
             </span>
            </div>
           ))}
          </div>
         </div>
        )}
       </section>
      )}

      <PersonalNoteSection
       key={`${vocabData.hanzi}:${savedPersonalNote}`}
       initialValue={savedPersonalNote}
       isSaving={isSaving}
       onSave={handleSavePersonalNote}
      />
     </div>

     <div className="col-span-12 self-start space-y-5 lg:sticky lg:top-5 lg:col-span-4">
      <CharacterAnatomySidebar
       characters={chineseCharacters}
       selectedCharacter={selectedCharacter}
       onSelectCharacter={setActiveCharacter}
       parentText={vocabData.hanzi}
      />
     </div>
    </div>
   </div>
  </div>
 );
}

function SentenceDictionaryView({
 text,
 characters,
 isLoading,
 translation,
 pinyin,
 error,
}: {
 text: string;
 characters: string[];
 isLoading: boolean;
 translation: string;
 pinyin: string;
 error: string | null;
}) {
 return (
  <div className="w-full h-full overflow-y-auto">
   <div className="max-w-4xl mx-auto px-4 py-5 sm:px-6 flex flex-col gap-4">
    <Link
     href="/vocabulary"
     className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
    >
     <ArrowLeft className="w-3.5 h-3.5" />
     Kho từ vựng
    </Link>

    <div className="bg-bg-card rounded border border-border-default shadow-theme-sm p-5">
     <div className="flex flex-col gap-4">
      <div>
       <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
        Dịch câu
       </p>
       <h1 className="text-3xl font-black text-text-primary leading-snug wrap-break-word">
        {text}
       </h1>
      </div>

      {pinyin && (
       <div className="rounded border border-border-default bg-bg-primary px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
         Pinyin
        </p>
        <p className="text-sm font-semibold text-accent wrap-break-word">
         {pinyin}
        </p>
       </div>
      )}

      <div className="rounded border border-border-default bg-bg-primary px-3 py-3">
       <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">
        Bản dịch
       </p>
       {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-text-muted">
         <Loader2 className="w-4 h-4 animate-spin text-accent" />
         Đang dịch câu...
        </div>
       ) : translation ? (
        <p className="text-sm text-text-primary leading-relaxed wrap-break-word">
         {translation}
        </p>
       ) : (
        <p className="text-sm text-text-muted">
         {error || "Chưa có bản dịch cho câu này."}
        </p>
       )}
      </div>

      {characters.length > 0 && (
       <div className="rounded border border-border-default bg-bg-primary px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">
         Bấm từng hán tự để tra riêng
        </p>
        <div className="flex flex-wrap gap-2">
         {Array.from(text).map((char, index) =>
          HANZI_CHAR_REGEX.test(char) ? (
           <Link
            key={`${char}-${index}`}
            href={`/dictionary/${encodeURIComponent(char)}`}
            className="inline-flex items-center justify-center min-w-9 h-9 rounded-md border border-border-default bg-white text-base font-bold text-text-primary hover:border-accent hover:text-accent transition-colors"
           >
            {char}
           </Link>
          ) : (
           <span
            key={`${char}-${index}`}
            className="inline-flex items-center justify-center min-w-9 h-9 rounded-md bg-bg-subtle text-sm text-text-muted"
           >
            {char}
           </span>
          ),
         )}
        </div>
       </div>
      )}
     </div>
    </div>
   </div>
  </div>
 );
}

function CharacterAnatomySidebar({
 characters,
 selectedCharacter,
 onSelectCharacter,
 parentText,
}: {
 characters: string[];
 selectedCharacter: string;
 onSelectCharacter: (character: string) => void;
 parentText: string;
}) {
 const { vocabData, isLoading, isAiLoading, triggerAi, hasDeepAiData } =
  useVocabDetail(selectedCharacter);

 useEffect(() => {
  if (!isLoading && !isAiLoading && vocabData && !hasDeepAiData()) {
   triggerAi();
  }
 }, [hasDeepAiData, isAiLoading, isLoading, triggerAi, vocabData]);

 if (isLoading || !vocabData) {
  return (
   <section className="rounded-3xl border border-border-default bg-bg-card px-4 py-5 text-sm text-text-muted shadow-theme-sm">
    <div className="flex items-center gap-2">
     <Loader2 className="h-4 w-4 animate-spin text-accent" />
     Đang tải cấu tạo chữ...
    </div>
   </section>
  );
 }

 const ai = vocabData.ai_analysis;
 const radicals = getNormalizedRadicals(ai);
 const etymologyType =
  typeof ai?.etymology === "object" ? ai.etymology.type : undefined;
 const etymologyText =
  typeof ai?.etymology === "object" ? ai.etymology.explanation : ai?.etymology;
 const toneLabel = getToneLabel(vocabData.pinyin);

 return (
  <>
   <section className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-theme-sm">
    <div className="flex items-start justify-between gap-3">
     <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
       Chữ & nét viết
      </p>
      <p className="mt-1 text-xs text-text-muted">
       Theo dõi trực quan cách viết và thông số của chữ.
      </p>
     </div>
     {parentText !== selectedCharacter && (
      <Link
       href={`/dictionary/${encodeURIComponent(selectedCharacter)}`}
       className="text-xs font-semibold text-accent hover:text-accent-hover"
      >
       Tra riêng
      </Link>
     )}
    </div>

    {characters.length > 1 && (
     <div className="mt-4 flex flex-wrap gap-2">
      {characters.map((character) => (
       <button
        key={character}
        type="button"
        onClick={() => onSelectCharacter(character)}
        className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-bold transition-colors ${
         selectedCharacter === character
          ? "border-accent bg-accent text-white"
          : "border-border-default bg-bg-primary text-text-primary hover:border-accent hover:text-accent"
        }`}
       >
        {character}
       </button>
      ))}
     </div>
    )}

    <div className="mt-4 flex justify-center">
     <CharacterWriterCard character={selectedCharacter} />
    </div>

    {(etymologyType || etymologyText) && (
     <div className="mt-4 rounded-2xl border border-border-default bg-bg-primary p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
       Chiết tự
      </p>
      {etymologyType && (
       <span className="mt-2 inline-flex rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-700">
        {etymologyType}
       </span>
      )}
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
       {etymologyText}
      </p>
     </div>
    )}

    <div className="mt-4 grid grid-cols-2 gap-2">
     <MetricCard label="Pinyin" value={vocabData.pinyin || "Chưa rõ"} wide />
     <MetricCard
      label="Số nét"
      value={ai?.stroke_count ? String(ai.stroke_count) : "?"}
     />
     <MetricCard label="Thanh điệu" value={toneLabel} />
    </div>
   </section>

   <section className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-theme-sm">
    <div>
     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
      Giải phẫu chữ
     </p>
     <p className="mt-1 text-xs text-text-muted">
      Bộ thủ, cấu trúc ghép và các thành phần tạo nên chữ.
     </p>
    </div>
    <div className="mt-4">
     <AnatomyOverview
      character={selectedCharacter}
      radicals={radicals}
      components={ai?.components || []}
     />
    </div>
   </section>

   <section className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-theme-sm">
    <div>
     <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
      Nguồn gốc
     </p>
     <p className="mt-1 text-xs text-text-muted">
      Giải thích lịch sử hoặc logic hình thành của chữ.
     </p>
    </div>
    <div className="mt-4 rounded-2xl border border-border-default bg-bg-primary p-4">
     {etymologyType && (
      <span className="inline-flex rounded-full bg-purple-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-purple-700">
       {etymologyType}
      </span>
     )}
     <p className="mt-2 text-sm leading-relaxed text-text-secondary">
      {etymologyText || "Chưa có phân tích nguồn gốc."}
     </p>
    </div>
   </section>
  </>
 );
}

function AnatomyOverview({
 character,
 radicals,
 components,
}: {
 character: string;
 radicals: Array<{ char?: string; pinyin?: string; meaning?: string }>;
 components: StructureComponent[];
}) {
 const structureItems = (
  components.length > 0
   ? components.map((component) => ({
      symbol: component.part || "?",
      label: component.name || component.meaning || "",
     }))
   : radicals.slice(0, 3).map((radical) => ({
      symbol: radical.char || "?",
      label: radical.meaning || radical.pinyin || "",
     }))
 ).filter((item) => item.symbol || item.label);

 return (
  <div className="space-y-4">
   <div className="rounded-2xl border border-border-default bg-bg-primary p-4">
    <SectionTitle title="Sơ đồ cấu tạo" />
    {structureItems.length > 0 ? (
     <div className="flex flex-wrap items-center gap-2">
      {structureItems.map((item, index) => (
       <div
        key={`${item.symbol}-${item.label}-${index}`}
        className="flex items-center gap-2"
       >
        <div className="rounded-xl border border-border-default bg-bg-card px-3 py-2 text-center">
         <p className="text-lg font-black text-text-primary">{item.symbol}</p>
         {item.label && (
          <p className="text-[11px] leading-tight text-text-muted">
           {item.label}
          </p>
         )}
        </div>
        {index < structureItems.length - 1 && (
         <span className="text-sm font-bold text-text-muted">+</span>
        )}
       </div>
      ))}
      <span className="text-sm font-bold text-text-muted">=</span>
      <div className="rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-center">
       <p className="text-lg font-black text-accent">{character}</p>
       <p className="text-[11px] leading-tight text-accent/80">kết quả</p>
      </div>
     </div>
    ) : (
     <p className="text-sm text-text-muted">
      Chưa có dữ liệu cấu tạo chi tiết.
     </p>
    )}
   </div>

   {components.length > 0 && (
    <div className="rounded-2xl border border-border-default bg-bg-primary p-4">
     <SectionTitle title="Thành phần" />
     <div className="grid gap-2">
      {components.map((component, index) => (
       <div
        key={`${component.part || "component"}-${index}`}
        className="flex items-start gap-3 rounded-xl border border-border-default bg-bg-card px-3 py-2.5"
       >
        <span className="min-w-6 text-lg font-black text-text-primary">
         {component.part || "?"}
        </span>
        <div className="min-w-0">
         <p className="text-sm font-semibold text-text-primary">
          {component.name || component.meaning || "Thành phần phụ"}
         </p>
         {component.name && component.meaning && (
          <p className="text-xs text-text-muted">{component.meaning}</p>
         )}
        </div>
       </div>
      ))}
     </div>
    </div>
   )}

   {radicals.length > 0 && (
    <div className="rounded-2xl border border-border-default bg-bg-primary p-4">
     <SectionTitle title="Bộ thủ" />
     <RadicalsGrid radicals={radicals} compact />
    </div>
   )}
  </div>
 );
}

function CharacterWriterCard({ character }: { character: string }) {
 const containerRef = useRef<HTMLDivElement>(null);
 const writerRef = useRef<HanziWriterInstance | null>(null);
 const [quizMode, setQuizMode] = useState(false);

 useEffect(() => {
  if (!containerRef.current || typeof window === "undefined") {
   return;
  }

  const container = containerRef.current;
  let isActive = true;

  writerRef.current?.cancelQuiz?.();
  writerRef.current = null;
  setQuizMode(false);
  container.innerHTML = "";

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

  const renderStaticCharacter = () => {
   container.innerHTML = "";
   container.style.display = "flex";
   container.style.alignItems = "center";
   container.style.justifyContent = "center";
   container.textContent = character;
   container.style.fontSize = "108px";
   container.style.fontWeight = "700";
   container.style.color = "#0f172a";
  };

  void import("hanzi-writer")
   .then(async (HanziWriterModule) => {
    if (!isActive) return;

    const HanziWriter = HanziWriterModule.default;

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
     renderStaticCharacter();
    }
   })
   .catch(() => {
    if (!isActive) return;
    renderStaticCharacter();
   });

  return () => {
   isActive = false;
   writerRef.current?.cancelQuiz?.();
   writerRef.current = null;
   container.innerHTML = "";
  };
 }, [character]);

 const handlePlayAnimation = () => {
  void writerRef.current?.animateCharacter?.();
 };

 const handleQuizMode = () => {
  if (!writerRef.current?.quiz) {
   return;
  }

  setQuizMode(true);
  void writerRef.current.quiz({
   onComplete: () => {
    toast.success("Viết đúng rồi! 🎉");
    setQuizMode(false);
   },
  });
 };

 return (
  <div className="rounded-lg border border-border-default bg-white p-4 flex flex-col items-center gap-3">
   <div
    ref={containerRef}
    className="rounded border border-border-default bg-white"
    style={{ width: 160, height: 160, position: "relative" }}
   />
   <div className="flex items-center gap-2">
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
 );
}

function SectionTitle({ title }: { title: string }) {
 return (
  <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">
   {title}
  </h4>
 );
}

function InfoChip({ label }: { label: string }) {
 return (
  <span className="inline-flex items-center rounded-full border border-border-default bg-bg-primary px-2 py-1 text-[10px] font-bold text-text-secondary">
   {label}
  </span>
 );
}

function ExampleRow({ example }: { example: ExampleItem }) {
 return (
  <div className="space-y-1">
   <p className="text-sm font-medium text-text-primary">{example.zh}</p>
   {example.pinyin && (
    <p className="text-xs font-semibold text-accent">{example.pinyin}</p>
   )}
   {example.vi && (
    <p className="text-xs italic text-text-muted">{example.vi}</p>
   )}
  </div>
 );
}

function ExampleCard({ example }: { example: ExampleItem }) {
 return (
  <div className="rounded-2xl border border-border-default bg-bg-card px-4 py-3">
   <ExampleRow example={example} />
  </div>
 );
}

function PersonalNoteSection({
 initialValue,
 isSaving,
 onSave,
}: {
 initialValue: string;
 isSaving: boolean;
 onSave: (note: string) => void;
}) {
 const [note, setNote] = useState(initialValue);

 return (
  <section className="rounded-3xl border border-border-default bg-bg-card p-4 shadow-theme-sm sm:p-5">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div>
     <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
      <StickyNote className="h-3.5 w-3.5" />
      Ghi chú cá nhân
     </p>
     <p className="mt-1 text-sm text-text-muted">
      Tự ghi cách nhớ, ngữ cảnh dùng, điểm dễ nhầm riêng của anh.
     </p>
    </div>
    <button
     type="button"
     onClick={() => onSave(note)}
     disabled={isSaving}
     className="inline-flex items-center gap-2 rounded-full border border-border-default bg-bg-primary px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
    >
     {isSaving ? (
      <Loader2 className="h-4 w-4 animate-spin" />
     ) : (
      <Save className="h-4 w-4" />
     )}
     Lưu note
    </button>
   </div>

   <div className="mt-4">
    <textarea
     value={note}
     onChange={(event) => setNote(event.target.value)}
     placeholder="Tự ghi cách nhớ, ngữ cảnh dùng, điểm dễ nhầm..."
     className="min-h-40 w-full resize-y rounded-3xl border border-border-default bg-bg-primary px-6 py-5 text-sm leading-relaxed text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 focus:ring-ring"
    />
   </div>
  </section>
 );
}

function CompoundPreviewCard({ compound }: { compound: AiRelatedCompound }) {
 const word = compound.word?.trim();

 if (!word) {
  return null;
 }

 return (
  <Link
   href={`/dictionary/${encodeURIComponent(word)}`}
   className="rounded-2xl border border-border-default bg-bg-primary px-4 py-3 transition-colors hover:border-accent/30 hover:bg-bg-card-hover"
  >
   <div className="flex flex-wrap items-center gap-2">
    <p className="text-base font-bold text-text-primary">{word}</p>
    {compound.pinyin && (
     <p className="text-xs font-semibold text-accent">{compound.pinyin}</p>
    )}
   </div>
   <p className="mt-1 text-sm leading-relaxed text-text-secondary">
    {compound.meaning || "Chưa có nghĩa."}
   </p>
  </Link>
 );
}

function MetricCard({
 label,
 value,
 wide = false,
}: {
 label: string;
 value: string;
 wide?: boolean;
}) {
 return (
  <div
   className={`rounded-2xl border border-border-default bg-bg-primary px-3 py-3 ${wide ? "col-span-2" : ""}`}
  >
   <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-muted">
    {label}
   </p>
   <p className="mt-1 text-sm font-semibold leading-relaxed text-text-primary">
    {value}
   </p>
  </div>
 );
}

function RadicalsGrid({
 radicals,
 compact = false,
}: {
 radicals: Array<{ char?: string; pinyin?: string; meaning?: string }>;
 compact?: boolean;
}) {
 return (
  <div
   className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}
  >
   {radicals.map((radical, index) => (
    <div
     key={`${radical.char || radical.meaning || "radical"}-${index}`}
     className="rounded border border-border-default bg-bg-primary p-3 flex items-start gap-3"
    >
     <span className="text-2xl font-black text-text-primary shrink-0">
      {radical.char}
     </span>
     <div className="min-w-0">
      {radical.pinyin && (
       <p className="text-xs font-semibold text-accent">{radical.pinyin}</p>
      )}
      {radical.meaning && (
       <p className="text-sm text-text-primary leading-relaxed">
        {radical.meaning}
       </p>
      )}
     </div>
    </div>
   ))}
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
