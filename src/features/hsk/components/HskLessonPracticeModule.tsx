"use client";

import { useEffect, useMemo, useState } from "react";
import {
 BookOpen,
 Brain,
 CheckCircle2,
 ClipboardCheck,
 Layers,
 RotateCcw,
 Search,
 Sparkles,
 Text,
 Volume2,
 XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CharacterWriterCard } from "@/features/dictionary/components/CharacterWriterCard";
import { cn } from "@/lib/utils";
import {
 hsk4Bai1Lesson,
 type HskGrammarItem,
 type HskPhraseItem,
 type HskQuizItem,
 type HskTextItem,
 type HskVocabItem,
} from "../data/hsk4-bai1";

type PracticeTab = "vocab" | "phrases" | "flash" | "grammar" | "text" | "quiz";

const tabs: Array<{
 id: PracticeTab;
 label: string;
 icon: typeof BookOpen;
}> = [
 { id: "vocab", label: "Từ vựng", icon: BookOpen },
 { id: "phrases", label: "Cụm", icon: Sparkles },
 { id: "flash", label: "Flashcard", icon: Layers },
 { id: "grammar", label: "Ngữ pháp", icon: Brain },
 { id: "text", label: "Bài khóa", icon: Text },
 { id: "quiz", label: "Bài tập", icon: ClipboardCheck },
];

type HskLessonPracticeModuleProps = {
 initialTab?: PracticeTab;
 visibleTabs?: PracticeTab[];
 titlePrefix?: string;
};

function normalizeAnswer(value: string) {
 return value.replace(/[。？！?!，,\s]/g, "").trim();
}

function getHanziCharacters(text: string) {
 return Array.from(text).filter((char) => /[\u3400-\u9fff]/.test(char));
}

export default function HskLessonPracticeModule({
 initialTab = "vocab",
 visibleTabs,
 titlePrefix,
}: HskLessonPracticeModuleProps) {
 const availableTabs = useMemo(
  () => tabs.filter((tab) => !visibleTabs || visibleTabs.includes(tab.id)),
  [visibleTabs],
 );
 const safeInitialTab = availableTabs.some((tab) => tab.id === initialTab)
  ? initialTab
  : availableTabs[0]?.id || "vocab";
 const [activeTab, setActiveTab] = useState<PracticeTab>(safeInitialTab);
 const [query, setQuery] = useState("");
 const [cardIndex, setCardIndex] = useState(0);
 const [showBack, setShowBack] = useState(false);
 const [answers, setAnswers] = useState<Record<number, string>>({});
 const [checked, setChecked] = useState(false);

 const filteredVocab = useMemo(() => {
  const q = query.trim().toLowerCase();
  if (!q) return hsk4Bai1Lesson.vocab;
  return hsk4Bai1Lesson.vocab.filter((item) =>
   [item.hanzi, item.pinyin, item.vi, item.type, item.example]
    .join(" ")
    .toLowerCase()
    .includes(q),
  );
 }, [query]);

 const score = useMemo(() => {
  return hsk4Bai1Lesson.quiz.reduce((sum, item, index) => {
   const user = answers[index] ?? "";
   if (!user) return sum;
   return normalizeAnswer(user) === normalizeAnswer(item.answer)
    ? sum + 1
    : sum;
  }, 0);
 }, [answers]);

 const currentCard =
  hsk4Bai1Lesson.vocab[cardIndex % hsk4Bai1Lesson.vocab.length];

 const selectTab = (tab: PracticeTab) => {
  setActiveTab(tab);
  setShowBack(false);
 };

 const nextCard = () => {
  setCardIndex((index) => (index + 1) % hsk4Bai1Lesson.vocab.length);
  setShowBack(false);
 };

 const previousCard = () => {
  setCardIndex(
   (index) =>
    (index - 1 + hsk4Bai1Lesson.vocab.length) % hsk4Bai1Lesson.vocab.length,
  );
  setShowBack(false);
 };

 const speak = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.85;
  window.speechSynthesis.speak(utterance);
 };

 return (
  <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-0 py-0 pb-2 sm:px-0">
   <section className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-md sm:p-5 lg:p-7">
    <div className="grid gap-5 xl:grid-cols-[1fr_360px] xl:items-end">
     <div>
      <div className="flex flex-wrap items-center gap-2">
       <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-red-500">
        {hsk4Bai1Lesson.hskLevel}
       </span>
       <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-orange-600">
        Bài {hsk4Bai1Lesson.lessonNumber}
       </span>
      </div>
      <h1 className="mt-3 text-4xl font-black tracking-normal text-stone-950 md:text-5xl">
       {titlePrefix ? `${titlePrefix} · ` : ""}
       {hsk4Bai1Lesson.title}
      </h1>
      <p className="mt-2 max-w-3xl text-base font-bold leading-7 text-stone-500 md:text-lg">
       {hsk4Bai1Lesson.description}
      </p>
     </div>

     <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <LessonStat label="Từ" value={hsk4Bai1Lesson.vocab.length} tone="red" />
      <LessonStat
       label="Cụm"
       value={hsk4Bai1Lesson.phrases.length}
       tone="orange"
      />
      <LessonStat
       label="Quiz"
       value={hsk4Bai1Lesson.quiz.length}
       tone="green"
      />
     </div>
    </div>

    <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
     {availableTabs.map(({ id, label, icon: Icon }) => (
      <button
       key={id}
       type="button"
       onClick={() => selectTab(id)}
       className={cn(
        "inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-4 text-sm font-black transition",
        activeTab === id
         ? "bg-red-500 text-white shadow-theme-md"
         : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900",
       )}
      >
       <Icon className="h-4 w-4" />
       {label}
      </button>
     ))}
    </div>
   </section>

   {activeTab === "vocab" && (
    <VocabSection items={filteredVocab} query={query} setQuery={setQuery} />
   )}
   {activeTab === "phrases" && <PhraseSection items={hsk4Bai1Lesson.phrases} />}
   {activeTab === "flash" && (
    <FlashcardSection
     card={currentCard}
     current={cardIndex + 1}
     total={hsk4Bai1Lesson.vocab.length}
     showBack={showBack}
     onFlip={() => setShowBack((value) => !value)}
     onNext={nextCard}
     onPrevious={previousCard}
     onSpeak={() => speak(currentCard.hanzi)}
    />
   )}
   {activeTab === "grammar" && (
    <GrammarSection items={hsk4Bai1Lesson.grammar} />
   )}
   {activeTab === "text" && <TextSection items={hsk4Bai1Lesson.texts} />}
   {activeTab === "quiz" && (
    <QuizSection
     items={hsk4Bai1Lesson.quiz}
     answers={answers}
     checked={checked}
     score={score}
     onAnswer={(index, value) =>
      setAnswers((current) => ({ ...current, [index]: value }))
     }
     onCheck={() => setChecked(true)}
     onReset={() => {
      setAnswers({});
      setChecked(false);
     }}
    />
   )}
  </div>
 );
}

function LessonStat({
 label,
 value,
 tone,
}: {
 label: string;
 value: number;
 tone: "red" | "orange" | "green";
}) {
 const toneClass = {
  red: "border-red-200 bg-red-50 text-red-600",
  orange: "border-orange-200 bg-orange-50 text-orange-600",
  green: "border-emerald-200 bg-emerald-50 text-emerald-700",
 }[tone];

 return (
  <div className={cn("rounded-2xl border-2 p-3 shadow-theme-sm", toneClass)}>
   <div className="text-2xl font-black">{value}</div>
   <div className="text-xs font-black uppercase tracking-[0.12em]">{label}</div>
  </div>
 );
}

function VocabSection({
 items,
 query,
 setQuery,
}: {
 items: HskVocabItem[];
 query: string;
 setQuery: (query: string) => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-md sm:p-5">
   <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
    <div>
     <p className="text-sm font-black uppercase tracking-[0.14em] text-red-500">
      Từ vựng chuẩn
     </p>
     <h2 className="text-3xl font-black text-stone-950">
      Danh sách từ HSK4 Bài 1
     </h2>
    </div>
    <div className="relative">
     <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
     <Input
      value={query}
      onChange={(event) => setQuery(event.target.value)}
      placeholder="Tìm Hán tự, pinyin, nghĩa, ví dụ..."
      className="h-13 min-w-0 rounded-2xl border-2 border-stone-200 bg-white pl-11 text-base font-bold shadow-theme-sm lg:w-[380px]"
     />
    </div>
   </div>

   <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {items.map((item) => (
     <VocabCard key={item.hanzi} item={item} />
    ))}
   </div>
  </section>
 );
}

function VocabCard({ item }: { item: HskVocabItem }) {
 return (
  <article className="rounded-3xl border-2 border-stone-200 bg-white p-4 shadow-theme-sm">
   <div className="flex items-start justify-between gap-3">
    <div className="min-w-0">
     <div className="text-4xl font-black text-stone-950">{item.hanzi}</div>
     <div className="mt-1 text-sm font-black text-red-500">{item.pinyin}</div>
    </div>
    <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
     {item.type}
    </span>
   </div>
   <p className="mt-3 text-lg font-black text-stone-900">{item.vi}</p>
   <p className="mt-3 rounded-2xl bg-stone-50 p-3 text-base font-bold leading-7 text-stone-700">
    {item.example}
   </p>
  </article>
 );
}

function PhraseSection({ items }: { items: HskPhraseItem[] }) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-md sm:p-5">
   <div className="mb-4">
    <p className="text-sm font-black uppercase tracking-[0.14em] text-orange-500">
     Cụm cố định
    </p>
    <h2 className="text-3xl font-black text-stone-950">
     Cụm/câu mẫu tách riêng
    </h2>
   </div>
   <div className="grid gap-3 md:grid-cols-2">
    {items.map((item) => (
     <article
      key={item.hanzi}
      className="rounded-3xl border-2 border-stone-200 bg-white p-4 shadow-theme-sm"
     >
      <div className="text-2xl font-black text-stone-950">{item.hanzi}</div>
      <div className="mt-1 text-sm font-black text-red-500">{item.pinyin}</div>
      <p className="mt-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-sm font-black text-orange-700">
       {item.vi}
      </p>
      <p className="mt-3 rounded-2xl bg-stone-50 p-3 text-base font-bold leading-7 text-stone-700">
       {item.example}
      </p>
     </article>
    ))}
   </div>
  </section>
 );
}

function FlashcardSection({
 card,
 current,
 total,
 showBack,
 onFlip,
 onNext,
 onPrevious,
 onSpeak,
}: {
 card: HskVocabItem;
 current: number;
 total: number;
 showBack: boolean;
 onFlip: () => void;
 onNext: () => void;
 onPrevious: () => void;
 onSpeak: () => void;
}) {
 const characters = useMemo(() => getHanziCharacters(card.hanzi), [card.hanzi]);
 const [selectedCharacter, setSelectedCharacter] = useState(
  characters[0] || card.hanzi[0] || "",
 );

 return (
  <section className="grid gap-4 xl:grid-cols-[1fr_320px]">
   <div className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-md sm:p-5">
    <button
     type="button"
     //  onClick={onFlip}
     className="flex min-h-[420px] w-full flex-col items-center justify-center rounded-[28px] border-2 border-stone-100 bg-stone-50 p-6 text-center transition hover:border-red-200 hover:bg-red-50/40 md:min-h-[520px]"
    >
     {!showBack ? (
      <>
       <div className="mt-10 text-7xl font-black text-red-500 md:text-8xl">
        {card.hanzi}
       </div>
       {characters.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2">
         {characters.map((character) => (
          <button
           key={character}
           type="button"
           onClick={() => setSelectedCharacter(character)}
           className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border-2 text-lg font-black transition",
            selectedCharacter === character
             ? "border-red-500 bg-red-500 text-white"
             : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
           )}
          >
           {character}
          </button>
         ))}
        </div>
       )}

       <div className="mt-4 flex justify-center">
        {selectedCharacter ? (
         <CharacterWriterCard character={selectedCharacter} />
        ) : (
         <div className="rounded-2xl bg-stone-50 p-4 text-sm font-bold text-stone-500">
          Từ này không có Hán tự để luyện viết.
         </div>
        )}
       </div>
      </>
     ) : (
      <div className="w-full max-w-3xl">
       <div className="text-6xl font-black text-red-500 md:text-7xl">
        {card.hanzi}
       </div>
       <p className="mt-5 text-2xl font-black text-stone-950">
        {card.pinyin} · {card.vi}
       </p>
       <p className="mx-auto mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-black text-stone-600 shadow-theme-sm">
        {card.type}
       </p>
       <div className="mt-8 rounded-3xl bg-white p-5 text-left shadow-theme-sm">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-red-500">
         Ví dụ
        </p>
        <p className="mt-3 text-2xl font-black leading-10 text-stone-950">
         {card.example}
        </p>
       </div>
      </div>
     )}
    </button>

    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
     <Button
      variant="outline"
      className="h-13 rounded-2xl border-2 border-stone-200 shadow-theme-sm"
      onClick={onPrevious}
     >
      Trước
     </Button>

     <Button
      variant="outline"
      className="h-13 rounded-2xl border-2 border-stone-200 shadow-theme-sm"
      onClick={onFlip}
     >
      Lật thẻ
     </Button>
     <Button
      className="h-13 rounded-2xl bg-red-500 text-white shadow-theme-md hover:bg-red-600"
      onClick={onNext}
     >
      Tiếp
     </Button>
    </div>
   </div>
  </section>
 );
}

function GrammarSection({ items }: { items: HskGrammarItem[] }) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-md sm:p-5">
   <div className="mb-4">
    <p className="text-sm font-black uppercase tracking-[0.14em] text-purple-500">
     Ngữ pháp trọng tâm
    </p>
    <h2 className="text-3xl font-black text-stone-950">8 điểm cần nắm</h2>
   </div>
   <div className="grid gap-3 lg:grid-cols-2">
    {items.map((item) => (
     <article
      key={item.title}
      className="rounded-3xl border-2 border-stone-200 bg-white p-5 shadow-theme-sm"
     >
      <h3 className="text-2xl font-black text-stone-950">{item.title}</h3>
      <div className="mt-3 rounded-2xl border-2 border-red-100 bg-red-50 p-3 text-base font-black text-red-700">
       {item.formula}
      </div>
      <p className="mt-3 text-base font-bold leading-7 text-stone-600">
       {item.note}
      </p>
      <p className="mt-3 rounded-2xl bg-stone-50 p-3 text-lg font-black leading-8 text-stone-900">
       {item.example}
      </p>
     </article>
    ))}
   </div>
  </section>
 );
}

function TextSection({ items }: { items: HskTextItem[] }) {
 return (
  <section className="space-y-4">
   {items.map((item) => (
    <article
     key={item.title}
     className="rounded-[28px] border-2 border-stone-200 bg-white p-5 shadow-theme-md"
    >
     <h2 className="text-2xl font-black text-stone-950">{item.title}</h2>
     <p className="mt-4 whitespace-pre-line text-lg font-bold leading-10 text-stone-700">
      {item.body}
     </p>
    </article>
   ))}
  </section>
 );
}

function QuizSection({
 items,
 answers,
 checked,
 score,
 onAnswer,
 onCheck,
 onReset,
}: {
 items: HskQuizItem[];
 answers: Record<number, string>;
 checked: boolean;
 score: number;
 onAnswer: (index: number, value: string) => void;
 onCheck: () => void;
 onReset: () => void;
}) {
 return (
  <section className="rounded-[28px] border-2 border-stone-200 bg-white p-4 shadow-theme-md sm:p-5">
   <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
    <div>
     <p className="text-sm font-black uppercase tracking-[0.14em] text-red-500">
      Bài tập
     </p>
     <h2 className="text-3xl font-black text-stone-950">
      Ôn nhanh không lộ đáp án
     </h2>
     <p className="mt-1 text-base font-bold text-stone-500">
      Trắc nghiệm, điền từ và sắp xếp câu. Chỉ hiện đáp án sau khi kiểm tra.
     </p>
    </div>
    <div className="flex gap-2">
     <Button
      variant="outline"
      className="h-12 rounded-2xl border-2 border-stone-200 shadow-theme-sm"
      onClick={onReset}
     >
      <RotateCcw className="h-4 w-4" />
      Làm lại
     </Button>
     <Button
      className="h-12 rounded-2xl bg-red-500 text-white shadow-theme-md hover:bg-red-600"
      onClick={onCheck}
     >
      Kiểm tra
     </Button>
    </div>
   </div>

   {checked && (
    <div className="mb-4 rounded-3xl border-2 border-emerald-200 bg-emerald-50 p-4 text-2xl font-black text-emerald-700">
     Điểm: {score}/{items.length}
    </div>
   )}

   <div className="space-y-4">
    {items.map((item, index) => {
     const user = answers[index] ?? "";
     const correct = normalizeAnswer(user) === normalizeAnswer(item.answer);
     return (
      <article
       key={`${item.type}-${index}`}
       className="rounded-3xl border-2 border-stone-200 bg-white p-4 shadow-theme-sm"
      >
       <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-black text-stone-950">
         {index + 1}. {item.q}
        </h3>
        {checked && (
         <span
          className={cn(
           "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black",
           correct
            ? "bg-emerald-100 text-emerald-700"
            : "bg-red-100 text-red-600",
          )}
         >
          {correct ? (
           <CheckCircle2 className="h-4 w-4" />
          ) : (
           <XCircle className="h-4 w-4" />
          )}
          {correct ? "Đúng" : "Sai"}
         </span>
        )}
       </div>

       {item.type === "choice" && (
        <div className="grid gap-2 md:grid-cols-2">
         {item.options.map((option) => (
          <button
           key={option}
           type="button"
           onClick={() => onAnswer(index, option)}
           className={cn(
            "rounded-2xl border-2 p-3 text-left text-base font-bold transition",
            user === option
             ? "border-red-300 bg-red-50 text-red-700"
             : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
           )}
          >
           {option}
          </button>
         ))}
        </div>
       )}

       {item.type === "fill" && (
        <Input
         value={user}
         onChange={(event) => onAnswer(index, event.target.value)}
         placeholder={`Gợi ý: ${item.hint}`}
         className="h-13 rounded-2xl border-2 border-stone-200 text-base font-bold"
        />
       )}

       {item.type === "order" && (
        <div>
         <div className="mb-3 flex flex-wrap gap-2">
          {item.parts.map((part) => (
           <span
            key={part}
            className="rounded-full bg-stone-100 px-3 py-1 text-sm font-black text-stone-600"
           >
            {part}
           </span>
          ))}
         </div>
         <Input
          value={user}
          onChange={(event) => onAnswer(index, event.target.value)}
          placeholder="Gõ câu hoàn chỉnh"
          className="h-13 rounded-2xl border-2 border-stone-200 text-base font-bold"
         />
        </div>
       )}

       {checked && !correct && (
        <div className="mt-3 rounded-2xl bg-stone-50 p-3 text-base font-bold leading-7 text-stone-700">
         <div>
          <b>Đáp án:</b> {item.answer}
         </div>
         {"explain" in item && item.explain && (
          <div>
           <b>Giải thích:</b> {item.explain}
          </div>
         )}
        </div>
       )}
      </article>
     );
    })}
   </div>
  </section>
 );
}
