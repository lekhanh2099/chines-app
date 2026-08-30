"use client";

import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import {
 HanziText,
 PinyinText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import type { BusinessChineseVocabularyItem } from "../_lib/business-chinese-data";
import { MandarinAudioButton } from "./mandarin-audio-button";

type VocabularyMode = "list" | "flashcard" | "meaning" | "hanzi";
type AnswerState = "idle" | "correct" | "incorrect";

const storedProgressSchema = z.strictObject({
 version: z.literal(1),
 known: z.array(z.string()),
});

function progressStorageKey(bookKey: string, lessonNumber: number) {
 return `hanzihome:business-chinese:v1:${bookKey}:${lessonNumber}`;
}

function boundedIndex(index: number, length: number) {
 if (length === 0) return 0;
 return (index + length) % length;
}

function answerOptions(vocabulary: BusinessChineseVocabularyItem[], currentIndex: number) {
 const current = vocabulary[currentIndex];
 if (current === undefined) return [];
 const distractors = vocabulary.filter((item) => item.hanzi !== current.hanzi).slice(0, 3);
 const options = [current, ...distractors];
 if (options.length < 2) return options;
 const rotation = currentIndex % options.length;
 return [...options.slice(rotation), ...options.slice(0, rotation)];
}

export function VocabularyPractice({
 bookKey,
 lessonNumber,
 vocabulary,
}: {
 bookKey: string;
 lessonNumber: number;
 vocabulary: BusinessChineseVocabularyItem[];
}) {
 const t = useTranslations("BusinessChinese");
 const [mode, setMode] = useState<VocabularyMode>("list");
 const [currentIndex, setCurrentIndex] = useState(0);
 const [revealed, setRevealed] = useState(false);
 const [answerState, setAnswerState] = useState<AnswerState>("idle");
 const [typedHanzi, setTypedHanzi] = useState("");
 const [known, setKnown] = useState<Set<string>>(() => new Set());
 const [loadedStorageKey, setLoadedStorageKey] = useState<string | null>(null);
 const storageKey = progressStorageKey(bookKey, lessonNumber);
 const current = vocabulary[currentIndex];
 const options = useMemo(
  () => answerOptions(vocabulary, currentIndex),
  [currentIndex, vocabulary],
 );

 useEffect(() => {
  const stored = localStorage.getItem(storageKey);
  if (stored === null) {
   setKnown(new Set());
   setLoadedStorageKey(storageKey);
   return;
  }
  try {
   const parsed = storedProgressSchema.safeParse(JSON.parse(stored));
   setKnown(new Set(parsed.success ? parsed.data.known : []));
  } catch {
   setKnown(new Set());
  }
  setLoadedStorageKey(storageKey);
 }, [storageKey]);

 useEffect(() => {
  if (loadedStorageKey !== storageKey) return;
  localStorage.setItem(
   storageKey,
   JSON.stringify({ version: 1, known: [...known] } satisfies z.input<typeof storedProgressSchema>),
  );
 }, [known, loadedStorageKey, storageKey]);

 function move(direction: number) {
  setCurrentIndex((index) => boundedIndex(index + direction, vocabulary.length));
  setRevealed(false);
  setAnswerState("idle");
  setTypedHanzi("");
 }

 function toggleKnown(hanzi: string) {
  setKnown((currentKnown) => {
   const next = new Set(currentKnown);
   if (next.has(hanzi)) next.delete(hanzi);
   else next.add(hanzi);
   return next;
  });
 }

 function checkTypedAnswer() {
  if (current === undefined) return;
  setAnswerState(typedHanzi.trim() === current.hanzi ? "correct" : "incorrect");
 }

 if (vocabulary.length === 0 || current === undefined) {
  return (
   <Card variant="subtle" padding="lg">
    <Typography tone="secondary">{t("vocabulary.empty")}</Typography>
   </Card>
  );
 }

 const modeItems = [
  { key: "list" as const, label: t("vocabulary.modes.list") },
  { key: "flashcard" as const, label: t("vocabulary.modes.flashcard") },
  { key: "meaning" as const, label: t("vocabulary.modes.meaning") },
  { key: "hanzi" as const, label: t("vocabulary.modes.hanzi") },
 ];

 return (
  <div className="grid gap-4">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div>
     <Typography variant="sectionTitle">{t("vocabulary.title")}</Typography>
     <Typography variant="bodySmall" tone="secondary">
      {t("vocabulary.progress", { known: known.size, total: vocabulary.length })}
     </Typography>
    </div>
    <Button
     variant="outline"
     size="toolbar"
     onClick={() => setKnown(new Set())}
     disabled={known.size === 0}
    >
     <RotateCcw data-icon="inline-start" aria-hidden="true" />
     {t("vocabulary.reset")}
    </Button>
   </div>

   <Tabs
    value={mode}
    items={modeItems}
    onValueChange={setMode}
    aria-label={t("vocabulary.modeLabel")}
   >
    <TabsContent value="list" className="pt-4">
     <div className="grid gap-2">
      {vocabulary.map((item, index) => (
       <Card key={`${item.hanzi}-${index}`} variant="section" padding="sm">
        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,1fr)_auto] sm:items-center">
         <div className="min-w-0">
          <div className="flex items-center gap-1">
           <HanziText as="span" size="inherit" variant="sectionTitle">
            {item.hanzi}
           </HanziText>
           <MandarinAudioButton text={item.hanzi} />
          </div>
          <PinyinText as="p">{item.pinyin}</PinyinText>
         </div>
         <div className="min-w-0">
          <Typography variant="bodySmall">{item.meaning}</Typography>
          <Typography variant="caption" tone="muted">
           {[item.pos, item.hanviet].filter((value) => value.length > 0).join(" · ")}
          </Typography>
         </div>
         <Button
          variant={known.has(item.hanzi) ? "success" : "outline"}
          size="toolbar"
          aria-pressed={known.has(item.hanzi)}
          onClick={() => toggleKnown(item.hanzi)}
         >
          {known.has(item.hanzi) ? <Check data-icon="inline-start" aria-hidden="true" /> : null}
          {known.has(item.hanzi) ? t("vocabulary.known") : t("vocabulary.markKnown")}
         </Button>
        </div>
       </Card>
      ))}
     </div>
    </TabsContent>

    <TabsContent value="flashcard" className="pt-4">
     <Card variant="elevated" padding="lg">
      <div className="grid min-h-72 place-items-center gap-5 text-center">
       <div className="grid gap-2">
        <HanziText as="h3" size="review" variant="pageTitle">
         {current.hanzi}
        </HanziText>
        <div className="flex items-center justify-center gap-1">
         <PinyinText variant="body">{current.pinyin}</PinyinText>
         <MandarinAudioButton text={current.hanzi} />
        </div>
       </div>

       {revealed ? (
        <div className="grid gap-1">
         <Typography variant="sectionTitle">{current.meaning}</Typography>
         <Typography variant="bodySmall" tone="secondary">
          {[current.pos, current.hanviet].filter((value) => value.length > 0).join(" · ")}
         </Typography>
        </div>
       ) : (
        <Button variant="outline" onClick={() => setRevealed(true)}>
         {t("vocabulary.reveal")}
        </Button>
       )}

       <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" size="icon" aria-label={t("navigation.previous")} onClick={() => move(-1)}>
         <ChevronLeft aria-hidden="true" />
        </Button>
        <Button
         variant={known.has(current.hanzi) ? "success" : "outline"}
         aria-pressed={known.has(current.hanzi)}
         onClick={() => toggleKnown(current.hanzi)}
        >
         {known.has(current.hanzi) ? t("vocabulary.known") : t("vocabulary.markKnown")}
        </Button>
        <Button variant="outline" size="icon" aria-label={t("navigation.next")} onClick={() => move(1)}>
         <ChevronRight aria-hidden="true" />
        </Button>
       </div>
      </div>
     </Card>
    </TabsContent>

    <TabsContent value="meaning" className="pt-4">
     <Card variant="section" padding="lg">
      <div className="grid gap-5">
       <div className="flex items-start justify-between gap-3">
        <div>
         <Typography variant="overline" tone="muted">
          {t("vocabulary.chooseMeaning")}
         </Typography>
         <HanziText as="h3" size="card" variant="pageTitle">
          {current.hanzi}
         </HanziText>
         <PinyinText as="p">{current.pinyin}</PinyinText>
        </div>
        <MandarinAudioButton text={current.hanzi} />
       </div>
       <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
         const isCorrect = option.hanzi === current.hanzi;
         const selectedState = answerState !== "idle" && isCorrect;
         return (
          <Button
           key={option.hanzi}
           variant={selectedState ? "success" : "outline"}
           size="touch"
           align="start"
           wrap="normal"
           disabled={answerState !== "idle"}
           onClick={() => setAnswerState(isCorrect ? "correct" : "incorrect")}
          >
           {option.meaning}
          </Button>
         );
        })}
       </div>
       {answerState !== "idle" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
         <Typography tone={answerState === "correct" ? "success" : "danger"} weight="bold">
          {answerState === "correct"
           ? t("vocabulary.correct")
           : t("vocabulary.incorrect", { answer: current.meaning })}
         </Typography>
         <Button variant="outline" size="toolbar" onClick={() => move(1)}>
          {t("vocabulary.nextQuestion")}
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
         </Button>
        </div>
       ) : null}
      </div>
     </Card>
    </TabsContent>

    <TabsContent value="hanzi" className="pt-4">
     <Card variant="section" padding="lg">
      <div className="grid gap-5">
       <div>
        <Typography variant="overline" tone="muted">
         {t("vocabulary.typeHanzi")}
        </Typography>
        <Typography variant="sectionTitle">{current.meaning}</Typography>
        <PinyinText as="p">{current.pinyin}</PinyinText>
       </div>
       <div className="flex flex-col gap-2 sm:flex-row">
        <Input
         value={typedHanzi}
         lang="zh-CN"
         autoComplete="off"
         placeholder={t("vocabulary.hanziPlaceholder")}
         aria-label={t("vocabulary.hanziInputLabel")}
         validation={
          answerState === "correct" ? "success" : answerState === "incorrect" ? "danger" : "none"
         }
         onChange={(event) => {
          setTypedHanzi(event.target.value);
          setAnswerState("idle");
         }}
         onKeyDown={(event) => {
          if (event.key === "Enter") checkTypedAnswer();
         }}
        />
        <Button onClick={checkTypedAnswer}>{t("vocabulary.check")}</Button>
       </div>
       {answerState !== "idle" ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
         <Typography tone={answerState === "correct" ? "success" : "danger"} weight="bold">
          {answerState === "correct"
           ? t("vocabulary.correct")
           : t("vocabulary.hanziIncorrect", { answer: current.hanzi })}
         </Typography>
         <Button variant="outline" size="toolbar" onClick={() => move(1)}>
          {t("vocabulary.nextQuestion")}
          <ChevronRight data-icon="inline-end" aria-hidden="true" />
         </Button>
        </div>
       ) : null}
      </div>
     </Card>
    </TabsContent>
   </Tabs>
  </div>
 );
}
