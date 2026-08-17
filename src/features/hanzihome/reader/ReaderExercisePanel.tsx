"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

import type { ReaderDocumentResource } from "./reader-content-api";
import type { ReaderAnswerState } from "./reader.schemas";
import type { ReaderSessionState } from "./reader-session";

type ReaderExerciseItem = ReaderDocumentResource["exerciseItems"][number];
type ReaderExerciseGroupType = ReaderDocumentResource["exerciseGroups"][number]["exercise_type"];

function normalizedAnswer(value: string) {
 return value.normalize("NFC").trim().replace(/\s+/gu, "");
}

function expectedAnswer(item: ReaderExerciseItem) {
 if (item.item_type === "fill_blank" || item.item_type === "short_answer") {
  return item.payload.answerZh;
 }
 return item.payload.answer;
}

export function ReaderExercisePanel({
 resource,
 answers,
 onAnswer,
}: {
 resource: ReaderDocumentResource;
 answers: ReaderSessionState["answers"];
 onAnswer: (itemId: string, answer: ReaderAnswerState) => void;
}) {
 const t = useTranslations("Reader.study.exercise");
 const [drafts, setDrafts] = useState<Record<string, string>>({});
 const exerciseGroupLabel: Record<ReaderExerciseGroupType, string> = {
  notes: t("groupLabels.notes"),
  vocabulary_review: t("groupLabels.vocabulary_review"),
  true_false: t("groupLabels.true_false"),
  multiple_choice: t("groupLabels.multiple_choice"),
  short_answer: t("groupLabels.short_answer"),
  fill_blank: t("groupLabels.fill_blank"),
  discussion: t("groupLabels.discussion"),
  mock_questions: t("groupLabels.mock_questions"),
 };

 const submitAnswer = (item: ReaderExerciseItem, answer: string, completed = true) => {
  const expected = expectedAnswer(item);
  const canScore = item.payload.scoring === "auto" && expected.length > 0;
  const score = canScore ? (normalizedAnswer(answer) === normalizedAnswer(expected) ? 1 : 0) : null;
  onAnswer(item.id, {
   answer,
   score,
   completed,
   responseMs: null,
  });
 };

 const setDraft = (itemId: string, value: string) => {
  setDrafts((current) => ({ ...current, [itemId]: value }));
 };

 if (resource.exerciseGroups.length === 0) return null;

 return (
  <div className="grid gap-5">
   <div className="grid gap-1">
    <Typography as="h3" variant="sectionTitle" weight="black">
     {t("title")}
    </Typography>
    <Typography variant="caption" tone="muted">
     {t("description")}
    </Typography>
   </div>

   {resource.exerciseGroups.map((group) => {
    const items = resource.exerciseItems.filter((item) => item.group_id === group.id);
    return (
     <Card key={group.id} variant="section" padding="none" className="overflow-hidden">
      <div className="grid gap-1 px-4 py-3 sm:px-5">
       <div className="flex flex-wrap items-center gap-2">
        <Badge variant="accent" casing="natural">
         {exerciseGroupLabel[group.exercise_type]}
        </Badge>
        <Typography as="h4" variant="cardTitle" weight="black">
         {group.title_zh || group.title_vi || t("fallbackTitle")}
        </Typography>
       </div>
       {group.title_vi && group.title_vi !== group.title_zh ? (
        <Typography variant="bodySmall" tone="muted">
         {group.title_vi}
        </Typography>
       ) : null}
      </div>
      <Separator />

      <div>
       {items.map((item, index) => {
        const saved = answers[item.id];
        const draft = drafts[item.id] ?? saved?.answer ?? "";
        const isAuto = item.payload.scoring === "auto";
        return (
         <div key={item.id}>
          <article className="grid gap-4 px-4 py-4 sm:px-5 sm:py-5">
           <header className="grid gap-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
             <Typography as="p" variant="body" weight="bold">
              {index + 1}. {item.payload.promptZh || item.payload.promptVi}
             </Typography>
             {saved?.completed ? (
              <Badge
               variant={saved.score === 1 ? "success" : saved.score === 0 ? "danger" : "warning"}
               casing="natural"
              >
               {saved.score === 1
                ? t("status.correct")
                : saved.score === 0
                  ? t("status.incorrect")
                  : t("status.answered")}
              </Badge>
             ) : null}
            </div>
            {item.payload.promptVi && item.payload.promptVi !== item.payload.promptZh ? (
             <Typography as="p" variant="bodySmall" tone="muted">
              {item.payload.promptVi}
             </Typography>
            ) : null}
           </header>

           {item.item_type === "multiple_choice" ? (
            <div className="grid gap-2">
             {item.payload.options.map((option) => (
              <Button
               key={option.key}
               type="button"
               size="menu"
               align="start"
               variant={saved?.answer === option.key ? "active" : "outline"}
               aria-pressed={saved?.answer === option.key}
               onClick={() => submitAnswer(item, option.key)}
              >
               <span>
                <strong>{option.key}.</strong> {option.textZh}
                {option.textVi ? ` · ${option.textVi}` : ""}
               </span>
              </Button>
             ))}
            </div>
           ) : item.item_type === "true_false" ? (
            <div className="flex flex-wrap gap-2">
             {["True", "False"].map((value) => (
              <Button
               key={value}
               type="button"
               size="sm"
               variant={saved?.answer === value ? "active" : "outline"}
               aria-pressed={saved?.answer === value}
               onClick={() => submitAnswer(item, value)}
              >
               {value === "True" ? t("true") : t("false")}
              </Button>
             ))}
            </div>
           ) : item.item_type === "note" || item.item_type === "answer_review" ? (
            <Typography variant="bodySmall" tone="muted">
             {item.payload.explanationVi || item.payload.answerVi || t("reviewNote")}
            </Typography>
           ) : (
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
             {item.item_type === "discussion" ? (
              <Textarea
               value={draft}
               onChange={(event) => setDraft(item.id, event.target.value)}
               placeholder={t("discussionPlaceholder")}
               rows={3}
              />
             ) : (
              <Input
               value={draft}
               onChange={(event) => setDraft(item.id, event.target.value)}
               placeholder={
                item.item_type === "fill_blank" ? t("fillBlankPlaceholder") : t("answerPlaceholder")
               }
              />
             )}
             <Button
              type="button"
              size="sm"
              disabled={!draft.trim()}
              onClick={() => submitAnswer(item, draft)}
             >
              {isAuto ? t("check") : t("saveAnswer")}
             </Button>
            </div>
           )}

           {saved?.completed && saved.score !== 1 && item.payload.answerVi ? (
            <Typography variant="caption" tone="muted">
             {t("referenceAnswer")}{" "}
             {item.payload.answerVi || item.payload.answerZh || item.payload.answer}
            </Typography>
           ) : null}
          </article>
          {index < items.length - 1 ? <Separator /> : null}
         </div>
        );
       })}
      </div>
     </Card>
    );
   })}
  </div>
 );
}
