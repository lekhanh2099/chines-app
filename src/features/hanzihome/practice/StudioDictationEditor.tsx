"use client";

import { useEffect, useRef, useState, type KeyboardEventHandler } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import type { ListeningTranscriptEntry } from "@/features/hanzihome/listening/listening.view-model";
import {
 createListeningHotkeyHandlers,
 resolveListeningShortcut,
 runListeningShortcutAction,
} from "@/features/hanzihome/listening/useListeningHotkeys";

import { buildDictationDiff, summarizeDictationDiff } from "./dictation-comparison";
import { createDictationAttempt, type DictationAttempt } from "./dictation-session";

function expectedText(entry: ListeningTranscriptEntry) {
 const lines = entry.transcript.lines.map((line) => line.zh.trim()).filter(Boolean);
 return lines.length > 0 ? lines.join("\n") : entry.transcript.full.zh;
}

function tokenTone(kind: ReturnType<typeof buildDictationDiff>[number]["kind"]) {
 if (kind === "match") return "success" as const;
 if (kind === "missing") return "warning" as const;
 return "danger" as const;
}

export function StudioDictationEditor({
 entry,
 index,
 total,
 onAttempt,
 onNext,
 onPlayToggle,
 onPrevious,
 onRepeat,
 onStop,
 onToggleLoop,
}: {
 entry: ListeningTranscriptEntry;
 index: number;
 total: number;
 onAttempt: (attempt: DictationAttempt) => void;
 onNext: () => void;
 onPlayToggle: () => void;
 onPrevious: () => void;
 onRepeat: () => void;
 onStop: () => void;
 onToggleLoop: () => void;
}) {
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [attempts, setAttempts] = useState<Record<string, DictationAttempt[]>>({});
 const [checked, setChecked] = useState<Record<string, boolean>>({});
 const textareaRef = useRef<HTMLTextAreaElement>(null);
 const answer = answers[entry.id] ?? "";
 const history = attempts[entry.id] ?? [];
 const attempt = history.at(-1);
 const isChecked = checked[entry.id] === true && attempt !== undefined;
 const target = expectedText(entry);
 const diff = isChecked ? buildDictationDiff(target, answer) : [];
 const summary = isChecked ? summarizeDictationDiff(diff) : null;

 useEffect(() => {
  if (!isChecked) textareaRef.current?.focus();
 }, [entry.id, isChecked]);

 const checkCurrent = () => {
  if (!answer.trim()) return;
  const nextAttempt = createDictationAttempt(entry.id, target, answer, null);
  setAttempts((current) => ({
   ...current,
   [entry.id]: [...(current[entry.id] ?? []), nextAttempt],
  }));
  setChecked((current) => ({ ...current, [entry.id]: true }));
  onAttempt(nextAttempt);
 };

 const editAgain = () => {
  setChecked((current) => ({ ...current, [entry.id]: false }));
 };

 const confirmOrEdit = () => {
  if (isChecked) editAgain();
  else checkCurrent();
 };

 const onEditorKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
  if (event.defaultPrevented) return;
  if (event.nativeEvent.isComposing && !event.altKey) return;
  const action = resolveListeningShortcut(event.nativeEvent, true);
  if (action === null) return;
  const handled = runListeningShortcutAction(
   action,
   createListeningHotkeyHandlers({
    onConfirm: confirmOrEdit,
    onNext,
    onPlayToggle,
    onPrevious,
    onRepeat,
    onStop,
    onToggleLoop,
   }),
  );
  if (!handled) return;
  event.preventDefault();
  event.stopPropagation();
 };

 return (
  <div className="grid min-w-0 gap-4 border-t border-border-default pt-4">
   <div className="flex flex-wrap items-start justify-between gap-3">
    <div className="grid gap-1">
     <Typography as="h3" variant="cardTitle" weight="black">
      Phần {index + 1}/{total}
     </Typography>
     <Typography variant="caption" tone="muted">
      {Array.from(target).length} ký tự · điểm tốt nhất {Math.max(0, ...history.map((item) => item.score))}%
     </Typography>
    </div>
    {isChecked ? (
     <div className="flex items-center gap-2">
      <Badge
       variant={attempt.score === 100 ? "success" : attempt.score >= 70 ? "warning" : "danger"}
       casing="natural"
      >
       {attempt.score}%
      </Badge>
      <Button type="button" size="sm" variant="ghost" onClick={editAgain}>
       Sửa lại
      </Button>
     </div>
    ) : null}
   </div>

   {isChecked ? (
    <Card variant="subtle" padding="md" className="grid gap-3">
     <Typography as="div" variant="body" lang="zh-CN" wrapping="breakWords">
      {diff.map((token, tokenIndex) => (
       <Typography
        as="span"
        key={`${entry.id}:${tokenIndex}:${token.kind}:${token.value}`}
        variant="body"
        tone={tokenTone(token.kind)}
        className={token.kind === "missing" ? "line-through" : undefined}
        title={
         token.expected && token.actual && token.expected !== token.actual
          ? `Đúng: ${token.expected}`
          : undefined
        }
       >
        {token.kind === "missing" ? `(${token.expected})` : token.value}
       </Typography>
      ))}
     </Typography>
     {summary ? (
      <div className="flex flex-wrap gap-2">
       <Badge variant="success" casing="natural">
        Đúng {summary.correct}
       </Badge>
       {summary.replaced > 0 ? (
        <Badge variant="danger" casing="natural">
         Thay {summary.replaced}
        </Badge>
       ) : null}
       {summary.missing > 0 ? (
        <Badge variant="warning" casing="natural">
         Thiếu {summary.missing}
        </Badge>
       ) : null}
       {summary.extra > 0 ? (
        <Badge variant="danger" casing="natural">
         Thừa {summary.extra}
        </Badge>
       ) : null}
       {summary.transposed > 0 ? (
        <Badge variant="warning" casing="natural">
         Đảo {summary.transposed}
        </Badge>
       ) : null}
      </div>
     ) : null}
    </Card>
   ) : (
    <div className="grid gap-2">
     <div className="flex flex-wrap items-center justify-between gap-2">
      <Typography variant="bodySmall" weight="black">
       Bạn nghe được gì?
      </Typography>
      <Typography variant="caption" tone="accent" weight="black">
       6 hoặc Ctrl/⌘ + Enter để kiểm tra
      </Typography>
     </div>
     <Textarea
      ref={textareaRef}
      value={answer}
      density="comfortable"
      surface="field"
      rows={7}
      lang="zh-CN"
      aria-label={`Câu trả lời nghe chép phần ${index + 1}`}
      aria-keyshortcuts="1 2 3 4 5 6 Escape Control+Enter Meta+Enter"
      autoCapitalize="off"
      autoCorrect="off"
      spellCheck={false}
      placeholder="Nghe và chép lại bằng chữ Hán…"
      onKeyDown={onEditorKeyDown}
      onChange={(event) => {
       setAnswers((current) => ({ ...current, [entry.id]: event.target.value }));
       setChecked((current) => ({ ...current, [entry.id]: false }));
      }}
     />
    </div>
   )}

   {isChecked ? (
    <div className="grid gap-3 md:grid-cols-2">
     <Card variant="subtle" padding="md" className="grid content-start gap-2">
      <Typography variant="overline" tone="accent" weight="black">
       Đáp án
      </Typography>
      <Typography variant="body" lang="zh-CN" wrapping="preWrap">
       {target}
      </Typography>
      {entry.transcript.full.pinyin ? (
       <Typography variant="bodySmall" tone="accent" wrapping="preWrap">
        {entry.transcript.full.pinyin}
       </Typography>
      ) : null}
     </Card>
     <Card variant="subtle" padding="md" className="grid content-start gap-2">
      <Typography variant="overline" tone="success" weight="black">
       Nghĩa
      </Typography>
      <Typography variant="bodySmall" tone="muted" wrapping="preWrap">
       {entry.transcript.full.vi ?? "Chưa có bản dịch cho phần này."}
      </Typography>
     </Card>
    </div>
   ) : null}

   <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border-default pt-4 sm:flex-row sm:items-center">
    <Button type="button" disabled={!isChecked && !answer.trim()} onClick={confirmOrEdit}>
     {isChecked ? "Sửa lại" : "Kiểm tra"}
     <Badge size="sm" casing="natural">
      6 · Ctrl/⌘ ↵
     </Badge>
    </Button>
    {total > 1 ? (
     <div className="flex gap-2 sm:ms-auto">
      <Button type="button" variant="ghost" disabled={index === 0} onClick={onPrevious}>
       ← Phần trước
      </Button>
      <Button type="button" variant="ghost" disabled={index >= total - 1} onClick={onNext}>
       Phần sau →
      </Button>
     </div>
    ) : null}
   </div>
  </div>
 );
}