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
import type { ReaderFeatureState } from "./reader-session";

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
 answers: ReaderFeatureState["answers"];
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
    const items = resource.exerciseItems.filter((item) => item.exercise_group_id === group.id);
    return (
     <Card key={group.id} variant="section" padding="md" className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant="info" casing="natural">
        {exerciseGroupLabel[group.exercise_type]}
       </Badge>
       {group.title_zh ? (
        <Typography as="h4" variant="cardTitle" lang="zh-CN" weight="black">
         {group.title_zh}
        </Typography>
       ) : null}
      </div>
      {group.title_vi ? (
       <Typography variant="bodySmall" tone="muted">
        {group.title_vi}
       </Typography>
      ) : null}
      {items.length > 0 ? <Separator /> : null}
      <div className="grid gap-4">
       {items.map((item, index) => {
        const saved = answers[item.id];
        const draft = drafts[item.id] ?? saved?.answer ?? "";
        const options = item.item_type === "multiple_choice" ? item.payload.options : [];
        return (
         <div key={item.id} className="grid gap-2">
          <Typography variant="bodySmall" weight="bold">
           {index + 1}. {item.payload.promptVi || item.payload.promptZh || item.item_type}
          </Typography>
          {item.payload.promptZh && item.payload.promptVi ? (
           <Typography variant="bodySmall" lang="zh-CN">
            {item.payload.promptZh}
           </Typography>
          ) : null}
          {item.item_type === "true_false" ? (
           <div className="flex flex-wrap gap-2">
            {["true", "false"].map((option) => (
             <Button
              key={option}
              type="button"
              size="sm"
              variant={saved?.answer === option ? "active" : "outline"}
              onClick={() => submitAnswer(item, option)}
             >
              {option === "true" ? "Đúng" : "Sai"}
             </Button>
            ))}
           </div>
          ) : null}
          {item.item_type === "multiple_choice" ? (
           <div className="grid gap-2">
            {options.map((option) => (
             <Button
              key={option}
              type="button"
              variant={saved?.answer === option ? "active" : "outline"}
              align="start"
              onClick={() => submitAnswer(item, option)}
             >
              {option}
             </Button>
            ))}
           </div>
          ) : null}
          {item.item_type === "fill_blank" ? (
           <div className="flex min-w-0 flex-wrap gap-2">
            <Input
             value={draft}
             onChange={(event) => setDraft(item.id, event.target.value)}
             aria-label={`Trả lời câu ${index + 1}`}
             className="min-w-56 flex-1"
            />
            <Button type="button" size="sm" disabled={!draft.trim()} onClick={() => submitAnswer(item, draft)}>
             Kiểm tra
            </Button>
           </div>
          ) : null}
          {item.item_type === "short_answer" || item.item_type === "discussion" ? (
           <div className="grid gap-2">
            <Textarea
             value={draft}
             onChange={(event) => setDraft(item.id, event.target.value)}
             aria-label={`Trả lời câu ${index + 1}`}
             rows={3}
            />
            <Button
             type="button"
             size="sm"
             className="justify-self-start"
             disabled={!draft.trim()}
             onClick={() => submitAnswer(item, draft)}
            >
             Lưu câu trả lời
            </Button>
           </div>
          ) : null}
          {saved?.completed ? (
           <Typography variant="caption" tone={saved.score === 0 ? "danger" : "success"}>
            {saved.score === null
             ? "Đã lưu câu trả lời."
             : saved.score === 1
               ? "Đúng."
               : "Chưa đúng, thử lại nhé."}
           </Typography>
          ) : null}
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
