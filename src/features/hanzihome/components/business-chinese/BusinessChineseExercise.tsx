"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import { Badge } from "@/components/ui/display/badge";
import { Input } from "@/components/ui/forms/input";
import { Card } from "@/components/ui/layout/card";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import type { TextbookLesson } from "@/features/hanzihome/static-json/business-chinese-static-content";
import { BusinessChineseText, SpeakableBusinessChineseText } from "./BusinessChineseText";
import {
 evaluatePracticeAnswer,
 parsePracticeExerciseItem,
 splitBusinessChineseExercise,
 type PracticeAnswerEvaluation,
} from "./business-chinese-study-utils";

export function BusinessChineseExercise({
 block,
 displayMode,
 pairedAnswer = "",
}: {
 block: TextbookLesson["sections"][number]["blocks"][number];
 displayMode: LessonDisplayMode;
 pairedAnswer?: string;
}) {
 const t = useTranslations("BusinessChinese");
 const [revealed, setRevealed] = useState(false);
 const { prompt, answer } = pairedAnswer
  ? { prompt: block.text, answer: pairedAnswer }
  : splitBusinessChineseExercise(block.text);
 const parsed = parsePracticeExerciseItem(prompt, answer);
 const [draft, setDraft] = useState("");
 const [selectedTokenIndexes, setSelectedTokenIndexes] = useState<readonly number[]>([]);
 const [selectedChoice, setSelectedChoice] = useState("");
 const [evaluation, setEvaluation] = useState<PracticeAnswerEvaluation>(() =>
  evaluatePracticeAnswer("", parsed),
 );
 const answerVisible = displayMode.showAnswers || revealed;
 const handleCheck = () => setEvaluation(evaluatePracticeAnswer(draft, parsed));
 const handleReset = () => {
  setDraft("");
  setSelectedTokenIndexes([]);
  setEvaluation(evaluatePracticeAnswer("", parsed));
 };
 const toggleToken = (index: number) => {
  const nextTokenIndexes = selectedTokenIndexes.includes(index)
   ? selectedTokenIndexes.filter((selectedIndex) => selectedIndex !== index)
   : [...selectedTokenIndexes, index];
  setSelectedTokenIndexes(nextTokenIndexes);
  setDraft(nextTokenIndexes.map((selectedIndex) => parsed.reorderTokens[selectedIndex]).join(""));
  setEvaluation(evaluatePracticeAnswer("", parsed));
 };

 return (
  <Card
   id={block.id}
   data-textbook-block={block.id}
   variant="default"
   padding="md"
   className="h-full scroll-mt-24"
  >
   <div className="grid min-w-0 gap-4">
    <SpeakableBusinessChineseText
     pronunciationId={`${block.id}:prompt`}
     text={parsed.displayPrompt}
     displayMode={displayMode}
     compactHanzi
     learnerContent
     variant="body"
    />
    {parsed.keywordHint ? (
     <Badge variant="accent" size="md" casing="natural">
      {t("practice.keywordHint", { keyword: parsed.keywordHint })}
     </Badge>
    ) : null}
    {parsed.choices.length > 0 ? (
     <div className="grid min-w-0 gap-2">
      {parsed.choices.map((choice) => (
       <div
        key={choice.key}
        className="flex min-w-0 items-start gap-2 rounded-lg border border-border-default bg-surface-muted/40 p-2"
       >
        <Button
         type="button"
         size="compact"
         variant={
          selectedChoice === choice.key
           ? choice.key === parsed.correctChoice
            ? "success"
            : "destructive"
           : "outline"
         }
         aria-pressed={selectedChoice === choice.key}
         onClick={() => setSelectedChoice(choice.key)}
        >{`${choice.key}.`}</Button>
        <div className="min-w-0 flex-1">
         <BusinessChineseText
          pronunciationId={`${block.id}:choice:${choice.key}`}
          text={choice.text}
          displayMode={displayMode}
          learnerContent
          variant="body"
         />
        </div>
       </div>
      ))}
      {selectedChoice ? (
       <Badge
        variant={selectedChoice === parsed.correctChoice ? "success" : "warning"}
        size="md"
        casing="natural"
        role="status"
       >
        {t(
         selectedChoice === parsed.correctChoice
          ? "practice.feedback.correct"
          : "practice.feedback.incorrect",
        )}
       </Badge>
      ) : null}
     </div>
    ) : parsed.hasBlank || parsed.reorderTokens.length > 0 || Boolean(parsed.keywordHint) ? (
     <div className="grid min-w-0 gap-2">
      {parsed.reorderTokens.length > 0 ? (
       <div className="flex flex-wrap gap-2">
        {parsed.reorderTokens.map((token, index) => (
         <Button
          key={`${index}:${token}`}
          type="button"
          size="compact"
          variant={selectedTokenIndexes.includes(index) ? "secondary" : "outline"}
          aria-pressed={selectedTokenIndexes.includes(index)}
          onClick={() => toggleToken(index)}
         >
          {token}
         </Button>
        ))}
       </div>
      ) : null}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
       <Input
        density="compact"
        surface="card"
        className="min-w-0 flex-1"
        value={draft}
        onChange={(event) => {
         setDraft(event.target.value);
         if (!event.target.value) setSelectedTokenIndexes([]);
         setEvaluation(evaluatePracticeAnswer("", parsed));
        }}
        onKeyDown={(event) => {
         if (event.key === "Enter" && !event.nativeEvent.isComposing && draft.trim()) {
          event.preventDefault();
          handleCheck();
         }
        }}
        placeholder={t("practice.inputPlaceholder")}
        aria-label={t("practice.inputPlaceholder")}
       />
       <Button
        type="button"
        size="compact"
        variant="secondary"
        disabled={!draft.trim()}
        onClick={handleCheck}
       >
        {t("practice.checkAnswer")}
       </Button>
       {draft || evaluation.isAnswered ? (
        <Button type="button" size="compact" variant="ghost" onClick={handleReset}>
         {t("practice.resetAnswer")}
        </Button>
       ) : null}
      </div>
      {evaluation.isAnswered ? (
       <Badge
        variant={
         evaluation.isExactMatch ? "success" : evaluation.isKeywordMatch ? "info" : "warning"
        }
        size="md"
        casing="natural"
        role="status"
       >
        {t(
         evaluation.isExactMatch
          ? "practice.feedback.correct"
          : evaluation.isKeywordMatch
            ? "practice.feedback.keywordMatch"
            : "practice.feedback.incorrect",
        )}
       </Badge>
      ) : null}
     </div>
    ) : null}
    {!displayMode.showAnswers ? (
     <Button
      type="button"
      variant="outline"
      size="compact"
      className="justify-self-start"
      aria-expanded={revealed}
      onClick={() => setRevealed((current) => !current)}
     >
      {revealed ? t("actions.hideAnswer") : t("actions.showAnswer")}
     </Button>
    ) : null}
    {answerVisible ? (
     <div className="border-t border-border-default pt-2">
      <SpeakableBusinessChineseText
       pronunciationId={`${block.id}:answer`}
       text={answer}
       displayMode={displayMode}
       compactHanzi
       learnerContent
       variant="body"
      />
     </div>
    ) : null}
   </div>
  </Card>
 );
}
