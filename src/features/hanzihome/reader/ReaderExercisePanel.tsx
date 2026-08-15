"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";

import type { ReaderDocumentResource } from "./reader-content-api";
import type { ReaderAnswerState } from "./reader.schemas";
import type { ReaderSessionState } from "./reader-session";

type ReaderExerciseItem = ReaderDocumentResource["exerciseItems"][number];

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
 const [drafts, setDrafts] = useState<Record<string, string>>({});

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
  <Card variant="section" padding="md" className="grid gap-4">
   <div className="grid gap-1">
    <Typography as="h3" variant="sectionTitle" weight="black">
     Bài luyện tập
    </Typography>
    <Typography variant="caption" tone="muted">
     Câu trả lời được lưu cùng tiến độ tài liệu HanziHome.
    </Typography>
   </div>
   {resource.exerciseGroups.map((group) => {
    const items = resource.exerciseItems.filter((item) => item.group_id === group.id);
    return (
     <section key={group.id} className="grid gap-3 border-t border-border-default pt-3">
      <div className="flex flex-wrap items-center gap-2">
       <Badge variant="purple">{group.exercise_type}</Badge>
       <Typography as="h4" variant="cardTitle" weight="bold">
        {group.title_vi || group.title_zh || "Bài tập"}
       </Typography>
      </div>
      {items.map((item, index) => {
       const saved = answers[item.id];
       const draft = drafts[item.id] ?? saved?.answer ?? "";
       const isAuto = item.payload.scoring === "auto";
       return (
        <div
         key={item.id}
         className="grid gap-2 rounded-lg border border-border-default bg-bg-subtle p-3"
        >
         <div className="flex flex-wrap items-start justify-between gap-2">
          <Typography as="p" variant="bodySmall" weight="bold">
           {index + 1}. {item.payload.promptVi || item.payload.promptZh}
          </Typography>
          {saved?.completed ? (
           <Badge
            variant={saved.score === 1 ? "success" : saved.score === 0 ? "danger" : "warning"}
           >
            {saved.score === 1 ? "Đúng" : saved.score === 0 ? "Chưa đúng" : "Đã trả lời"}
           </Badge>
          ) : null}
         </div>
         {item.payload.promptZh ? (
          <Typography as="p" variant="bodySmall" lang="zh-CN">
           {item.payload.promptZh}
          </Typography>
         ) : null}
         {item.item_type === "multiple_choice" ? (
          <div className="flex flex-wrap gap-2">
           {item.payload.options.map((option) => (
            <Button
             key={option.key}
             type="button"
             size="sm"
             variant={saved?.answer === option.key ? "active" : "outline"}
             aria-pressed={saved?.answer === option.key}
             onClick={() => submitAnswer(item, option.key)}
            >
             {option.key}. {option.textVi || option.textZh}
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
             onClick={() => submitAnswer(item, value)}
            >
             {value === "True" ? "Đúng" : "Sai"}
            </Button>
           ))}
          </div>
         ) : item.item_type === "note" || item.item_type === "answer_review" ? (
          <Typography variant="bodySmall" tone="muted">
           {item.payload.explanationVi || item.payload.answerVi || "Xem lại ghi chú của bài học."}
          </Typography>
         ) : (
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
           {item.item_type === "discussion" ? (
            <Textarea
             value={draft}
             onChange={(event) => setDraft(item.id, event.target.value)}
             placeholder="Viết câu trả lời của bạn…"
             rows={3}
            />
           ) : (
            <Input
             value={draft}
             onChange={(event) => setDraft(item.id, event.target.value)}
             placeholder={item.item_type === "fill_blank" ? "Điền chữ Hán…" : "Câu trả lời…"}
            />
           )}
           <Button
            type="button"
            size="sm"
            disabled={!draft.trim()}
            onClick={() => submitAnswer(item, draft)}
           >
            {isAuto ? "Kiểm tra" : "Lưu câu trả lời"}
           </Button>
          </div>
         )}
         {saved?.completed && saved.score !== 1 && item.payload.answerVi ? (
          <Typography variant="caption" tone="muted">
           Đáp án tham chiếu:{" "}
           {item.payload.answerVi || item.payload.answerZh || item.payload.answer}
          </Typography>
         ) : null}
        </div>
       );
      })}
     </section>
    );
   })}
  </Card>
 );
}
