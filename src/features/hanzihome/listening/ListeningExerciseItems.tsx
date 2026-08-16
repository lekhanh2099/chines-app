"use client";

import { useMemo, useState } from "react";
import { Pencil, Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { IconTile } from "@/components/ui/icon-tile";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
 StudyInstructionText,
 ReaderHanziText,
} from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import type { LessonDisplayMode } from "@/features/hanzihome/components/lesson-overview/types";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";
import { z } from "zod";

import { ListeningTranscriptBlock } from "./ListeningTranscriptBlock";
import type {
 ListeningExerciseType,
 ListeningRuntimeItem,
 ListeningTranscript,
} from "./listening.types";

type ListeningExerciseItemsProps = {
 exerciseType: ListeningExerciseType;
 items: ListeningRuntimeItem[];
 sharedTranscript?: ListeningTranscript;
 showPinyin: boolean;
 showMeaning: boolean;
 showScript: boolean;
 hideScriptBeforeCheck: boolean;
 showTranslationAfterCheck: boolean;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onSpeakSequence: (segments: string[]) => void;
 lessonId: string;
};

type ListeningItemEditHandler = (item: ListeningRuntimeItem) => void;
const AnswerExerciseTypeSchema = z.enum(["short_answer", "oral_response"]);
const BooleanExerciseTypeSchema = z.enum(["true_false", "same_different"]);

function ExerciseAudioButton({
 promptText,
 transcriptText,
 onSpeak,
}: {
 promptText?: string;
 transcriptText?: string;
 onSpeak: (text: string) => void;
}) {
 const text = [transcriptText?.trim(), promptText?.trim()].filter(Boolean).join("\n");
 if (!text) return null;

 return (
  <Button
   type="button"
   variant="surface"
   size="toolbar"
   className="justify-self-start shrink-0"
   title="Phát nội dung nghe trước, sau đó đọc câu hỏi"
   onClick={() => onSpeak(text)}
  >
   <Play data-icon="inline-start" />
   {transcriptText ? "Nghe câu" : "Đọc câu hỏi"}
  </Button>
 );
}

function typeLabel(type: ListeningExerciseType) {
 const labels: Record<ListeningExerciseType, string> = {
  single_choice: "Chọn đáp án",
  short_answer: "Trả lời câu hỏi",
  oral_response: "Tự nói / tự viết",
  true_false: "Đúng / sai",
  matching: "Nối",
  same_different: "Giống / khác",
  shadowing: "Đọc theo",
  stress_choice: "Trọng âm câu đáp",
  fill_blank: "Điền chỗ trống",
 };
 return labels[type];
}

function ItemHeader({
 index,
 type,
 onEdit,
}: {
 index: number;
 type: ListeningExerciseType;
 onEdit?: () => void;
}) {
 return (
  <div className="flex items-center gap-2">
   <IconTile size="sm">
    <Typography variant="caption" weight="black">
     {index + 1}
    </Typography>
   </IconTile>
   <span className="sr-only">Câu {index + 1}.</span>
   <StudyInstructionText
    variant="overline"
    tone="successStrong"
    weight="black"
    tracking="wide"
    transform="uppercase"
   >
    {typeLabel(type)}
   </StudyInstructionText>
   {onEdit ? (
    <Button
     type="button"
     variant="outline"
     size="icon-toolbar"
     className="ml-auto"
     aria-label="Sửa câu luyện nghe"
     title="Sửa câu luyện nghe"
     onClick={onEdit}
    >
     <Pencil />
    </Button>
   ) : null}
  </div>
 );
}

function StressText({ text, stress }: { text: string; stress?: string[] }) {
 if (!stress?.length) return text;
 const markers = stress.filter(Boolean).toSorted((left, right) => right.length - left.length);
 const pattern = new RegExp(
  `(${markers.map((item) => item.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("|")})`,
  "gu",
 );
 return text.split(pattern).map((part, index) =>
  markers.includes(part) ? (
   <mark
    key={`${part}:${index}`}
    className="rounded bg-warning-subtle px-0.5 text-inherit underline"
   >
    {part}
   </mark>
  ) : (
   part
  ),
 );
}

function ChoiceItems({
 items,
 exerciseType,
 selections,
 checked,
 onSelect,
 onCheck,
 showPinyin,
 showMeaning,
 showScript,
 hideScriptBeforeCheck,
 showTranslationAfterCheck,
 sharedTranscript,
 displayMode,
 onSpeak,
 onSpeakSequence,
 revealedScripts,
 onToggleScript,
 onEditItem,
}: ListeningExerciseItemsProps & {
 selections: Record<string, string>;
 checked: Record<string, boolean>;
 onSelect: (itemId: string, value: string) => void;
 onCheck: (itemId: string) => void;
 revealedScripts: Record<string, boolean>;
 onToggleScript: (itemId: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 return items.map((item, index) => {
  const selected = selections[item.id];
  const correct = item.answer?.type === "choice" ? item.answer.value : undefined;
  const isChecked = checked[item.id] ?? false;
  const isCorrect = isChecked && selected === correct;
  const transcriptText = item.transcript?.full.zh ?? sharedTranscript?.full.zh;
  const hasPlayableText = Boolean(transcriptText?.trim() || item.promptZh?.trim());
  const revealScript =
   showScript || revealedScripts[item.id] || !hideScriptBeforeCheck || isChecked;
  const revealMeaning = showMeaning && (!showTranslationAfterCheck || isChecked);

  return (
   <Card key={item.id} variant="section" padding="md" className="grid gap-3">
    <ItemHeader
     index={index}
     type={exerciseType}
     onEdit={onEditItem ? () => onEditItem(item) : undefined}
    />
    <div lang="zh-CN" className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
     <div className="grid gap-1">
      <ReaderHanziText displayMode={displayMode} tone="default" leading="relaxed">
       {item.promptZh ?? "Nghe và chọn đáp án đúng"}
      </ReaderHanziText>
      {revealMeaning && item.metadata.promptVi ? (
       <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
        {item.metadata.promptVi}
       </StudyInstructionText>
      ) : null}
     </div>
     <ExerciseAudioButton
      promptText={item.promptZh}
      transcriptText={transcriptText}
      onSpeak={onSpeak}
     />
    </div>
    <div role="radiogroup" aria-label={`Câu ${index + 1}`} className="grid gap-2 sm:grid-cols-2">
     {item.options.map((option) => {
      const isSelected = selected === option.key;
      const optionIsCorrect = isChecked && correct === option.key;
      const optionIsWrong = isChecked && isSelected && correct !== option.key;
      return (
       <Button
        key={option.key}
        type="button"
        role="radio"
        aria-checked={isSelected}
        variant={
         optionIsCorrect
          ? "success"
          : optionIsWrong
            ? "destructive"
            : isSelected
              ? "active"
              : "outline"
        }
        size="touch"
        align="start"
        wrap="normal"
        onClick={() => onSelect(item.id, option.key)}
       >
        <Typography
         as="span"
         variant="caption"
         weight="black"
         align="center"
         className="w-6 shrink-0"
        >
         {option.key}
        </Typography>
        <span className="grid min-w-0 gap-0.5">
         <ReaderHanziText displayMode={displayMode}>
          <StressText text={option.textZh} stress={option.stress} />
         </ReaderHanziText>
         {revealMeaning && option.textVi ? (
          <StudyInstructionText variant="caption" tone="muted" weight="medium">
           {option.textVi}
          </StudyInstructionText>
         ) : null}
        </span>
       </Button>
      );
     })}
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <Button
      type="button"
      size="toolbar"
      disabled={!selected || correct === undefined}
      onClick={() => onCheck(item.id)}
     >
      Kiểm tra
     </Button>
     {!hasPlayableText ? <Badge variant="warning">Chưa có nội dung nghe</Badge> : null}
     {correct === undefined ? <Badge variant="warning">Chưa có đáp án kiểm tra</Badge> : null}
     {item.transcript ? (
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       onClick={() => onToggleScript(item.id)}
      >
       {revealScript ? "Ẩn script" : "Hiện script"}
      </Button>
     ) : null}
     {isChecked ? (
      <StudyInstructionText
       as="span"
       variant="bodySmall"
       tone={isCorrect ? "successStrong" : "danger"}
       weight="bold"
      >
       {isCorrect ? "✓ Chính xác" : `✕ Chưa đúng · đáp án ${correct ?? "—"}`}
      </StudyInstructionText>
     ) : null}
    </div>
    {item.transcript && revealScript ? (
     <ListeningTranscriptBlock
      transcript={item.transcript}
      displayMode={{
       ...displayMode,
       showPinyin,
       showMeaning: revealMeaning,
      }}
      onSpeak={onSpeak}
      onSpeakSequence={onSpeakSequence}
     />
    ) : null}
   </Card>
  );
 });
}

function AnswerItems({
 items,
 exerciseType,
 answers,
 revealed,
 onAnswer,
 onReveal,
 showMeaning,
 transcriptText,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 items: ListeningRuntimeItem[];
 exerciseType: z.infer<typeof AnswerExerciseTypeSchema>;
 answers: Record<string, string>;
 revealed: Record<string, boolean>;
 onAnswer: (itemId: string, value: string) => void;
 onReveal: (itemId: string) => void;
 showMeaning: boolean;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 return items.map((item, index) => (
  <Card key={item.id} variant="section" padding="md" className="grid gap-3">
   <ItemHeader
    index={index}
    type={exerciseType}
    onEdit={onEditItem ? () => onEditItem(item) : undefined}
   />
   <div lang="zh-CN" className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
    <div className="grid gap-1">
     <ReaderHanziText displayMode={displayMode} tone="default" leading="relaxed">
      {item.promptZh}
     </ReaderHanziText>
     {showMeaning && item.metadata.promptVi ? (
      <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
       {item.metadata.promptVi}
      </StudyInstructionText>
     ) : null}
    </div>
    <ExerciseAudioButton
     promptText={item.promptZh}
     transcriptText={item.transcript?.full.zh ?? transcriptText}
     onSpeak={onSpeak}
    />
   </div>
   <Textarea
    value={answers[item.id] ?? ""}
    placeholder={
     exerciseType === AnswerExerciseTypeSchema.enum.oral_response
      ? "Soạn câu trả lời hoặc dàn ý để tự nói…"
      : "Nhập câu trả lời bằng tiếng Trung…"
    }
    onChange={(event) => onAnswer(item.id, event.target.value)}
   />
   {exerciseType === "oral_response" ? (
    <Badge variant="default" casing="natural" className="justify-self-start">
     Không chấm tự động; nội dung chỉ giữ trong phiên học này.
    </Badge>
   ) : (
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     className="justify-self-start"
     onClick={() => onReveal(item.id)}
    >
     {revealed[item.id] ? "Ẩn đáp án gợi ý" : "Xem đáp án gợi ý"}
    </Button>
   )}
   {revealed[item.id] && item.metadata.sampleAnswerZh ? (
    <Card variant="subtle" padding="sm">
     <StudyInstructionText
      variant="overline"
      tone="successStrong"
      weight="black"
      tracking="wide"
      transform="uppercase"
     >
      Đáp án gợi ý
     </StudyInstructionText>
     <ReaderHanziText displayMode={displayMode} tone="default">
      {item.metadata.sampleAnswerZh}
     </ReaderHanziText>
     {showMeaning && item.metadata.sampleAnswerVi ? (
      <StudyInstructionText variant="bodySmall" tone="muted">
       {item.metadata.sampleAnswerVi}
      </StudyInstructionText>
     ) : null}
    </Card>
   ) : null}
  </Card>
 ));
}

function BooleanItems({
 items,
 exerciseType,
 selections,
 checked,
 revealed,
 onSelect,
 onCheck,
 onReveal,
 showMeaning,
 transcriptText,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 items: ListeningRuntimeItem[];
 exerciseType: z.infer<typeof BooleanExerciseTypeSchema>;
 selections: Record<string, string>;
 checked: Record<string, boolean>;
 revealed: Record<string, boolean>;
 onSelect: (itemId: string, value: string) => void;
 onCheck: (itemId: string) => void;
 onReveal: (itemId: string) => void;
 showMeaning: boolean;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 return items.map((item, index) => {
  const selected = selections[item.id];
  const expected = item.answer?.type === "boolean" ? String(item.answer.value) : "";
  const isChecked = checked[item.id] ?? false;
  const isCorrect = isChecked && selected === expected;
  const sameDifferent = exerciseType === BooleanExerciseTypeSchema.enum.same_different;
  return (
   <Card key={item.id} variant="section" padding="md" className="grid gap-3">
    <ItemHeader
     index={index}
     type={exerciseType}
     onEdit={onEditItem ? () => onEditItem(item) : undefined}
    />
    <div className="grid items-start gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
     <ReaderHanziText displayMode={displayMode} tone="default" leading="relaxed">
      {sameDifferent ? item.metadata.printedPinyin : item.promptZh}
     </ReaderHanziText>
     <ExerciseAudioButton
      promptText={sameDifferent ? (item.metadata.heardZh ?? item.promptZh) : item.promptZh}
      transcriptText={item.transcript?.full.zh ?? transcriptText}
      onSpeak={onSpeak}
     />
    </div>
    <div className="flex flex-wrap items-center gap-2">
     <SegmentedControl<string>
      value={selected ?? ""}
      items={[
       { key: "true", label: sameDifferent ? "✓ Giống" : "✓ Đúng" },
       { key: "false", label: sameDifferent ? "✕ Khác" : "✕ Sai" },
      ]}
      onChange={(value) => onSelect(item.id, value)}
      density="toolbar"
      aria-label={`Chọn đáp án câu ${index + 1}`}
      className="justify-self-start"
     />
     <Button type="button" size="toolbar" disabled={!selected} onClick={() => onCheck(item.id)}>
      Kiểm tra
     </Button>
     {sameDifferent ? (
      <Button type="button" variant="outline" size="toolbar" onClick={() => onReveal(item.id)}>
       {revealed[item.id] ? "Ẩn script" : "Xem script"}
      </Button>
     ) : null}
     {isChecked ? (
      <StudyInstructionText
       as="span"
       variant="bodySmall"
       tone={isCorrect ? "successStrong" : "danger"}
       weight="bold"
      >
       {isCorrect ? "✓ Chính xác" : "✕ Chưa đúng"}
      </StudyInstructionText>
     ) : null}
    </div>
    {sameDifferent && revealed[item.id] ? (
     <Card variant="subtle" padding="sm">
      <ReaderHanziText displayMode={displayMode} tone="default">
       {item.metadata.heardZh}
      </ReaderHanziText>
      <StudyInstructionText variant="bodySmall" tone="accent" weight="semibold">
       {item.metadata.heardPinyin}
      </StudyInstructionText>
     </Card>
    ) : null}
    {isChecked && item.explanationVi && showMeaning ? (
     <StudyInstructionText variant="bodySmall" tone="muted" weight="medium">
      {item.explanationVi}
     </StudyInstructionText>
    ) : null}
   </Card>
  );
 });
}

function FillBlankItems({
 items,
 answers,
 checked,
 onAnswer,
 onCheck,
 transcriptText,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 items: ListeningRuntimeItem[];
 answers: Record<string, string>;
 checked: Record<string, boolean>;
 onAnswer: (itemId: string, value: string) => void;
 onCheck: (itemId: string) => void;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 return items.map((item, index) => {
  const value = (answers[item.id] ?? "").trim();
  const accepted = item.metadata.acceptedAnswers ?? [];
  const isChecked = checked[item.id] ?? false;
  const isCorrect = isChecked && accepted.includes(value);
  const parts = item.metadata.promptParts ?? [item.promptZh ?? "", ""];
  return (
   <Card key={item.id} variant="section" padding="md" className="grid gap-3">
    <ItemHeader
     index={index}
     type="fill_blank"
     onEdit={onEditItem ? () => onEditItem(item) : undefined}
    />
    <ReaderHanziText
     as="div"
     displayMode={displayMode}
     className="flex flex-wrap items-center gap-2"
    >
     <StudyInstructionText as="span" weight="black">
      {index + 1}.
     </StudyInstructionText>
     <StudyInstructionText as="span" weight="bold">
      {parts[0]}
     </StudyInstructionText>
     <Input
      value={answers[item.id] ?? ""}
      aria-label={`Đáp án câu ${index + 1}`}
      validation={isChecked ? (isCorrect ? "success" : "danger") : "none"}
      className="w-28"
      onChange={(event) => onAnswer(item.id, event.target.value)}
     />
     <StudyInstructionText as="span" weight="bold">
      {parts[1]}
     </StudyInstructionText>
    </ReaderHanziText>
    <ExerciseAudioButton
     promptText={item.promptZh}
     transcriptText={item.transcript?.full.zh ?? transcriptText}
     onSpeak={onSpeak}
    />
    <div className="flex items-center gap-2">
     <Button type="button" size="toolbar" onClick={() => onCheck(item.id)}>
      Kiểm tra
     </Button>
     {isChecked ? (
      <StudyInstructionText
       as="span"
       variant="bodySmall"
       tone={isCorrect ? "successStrong" : "danger"}
       weight="bold"
      >
       {isCorrect ? "✓ Chính xác" : `✕ ${item.metadata.answerDisplay ?? accepted[0] ?? ""}`}
      </StudyInstructionText>
     ) : null}
    </div>
   </Card>
  );
 });
}

function ShadowingItems({
 items,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 items: ListeningRuntimeItem[];
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 const [done, setDone] = useState<Record<string, boolean>>({});
 const groups = useMemo(() => {
  const grouped = new Map<string, ListeningRuntimeItem[]>();
  for (const item of items) {
   const key = item.metadata.groupId ?? "shadowing";
   grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return [...grouped.entries()];
 }, [items]);

 return groups.map(([groupId, groupItems]) => (
  <Card key={groupId} variant="section" padding="md" className="grid gap-2">
   <StudyInstructionText tone="default" weight="black">
    {groupItems[0]?.metadata.groupTitleZh} · {groupItems[0]?.metadata.groupTitleVi}
   </StudyInstructionText>
   {groupItems.map((item) => (
    <div
     key={item.id}
     className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2 border-b border-border-default py-2 last:border-b-0"
    >
     <Checkbox
      checked={done[item.id] ?? false}
      aria-label={`Đánh dấu đã luyện: ${item.promptZh ?? item.id}`}
      onCheckedChange={(checked) =>
       setDone((current) => ({ ...current, [item.id]: checked === true }))
      }
     />
     <span lang="zh-CN" className="min-w-0">
      <ReaderHanziText displayMode={displayMode} as="span" tone="default" className="block">
       {item.promptZh}
      </ReaderHanziText>
      <StudyInstructionText variant="bodySmall" tone="accent" weight="semibold" className="block">
       {item.metadata.pinyin}
      </StudyInstructionText>
      <StudyInstructionText variant="bodySmall" tone="muted" className="block">
       {item.metadata.translationVi}
      </StudyInstructionText>
     </span>
     <span className="flex items-center gap-1">
      {onEditItem ? (
       <Button
        type="button"
        variant="outline"
        size="icon-toolbar"
        aria-label="Sửa câu luyện nghe"
        title="Sửa câu luyện nghe"
        onClick={() => onEditItem(item)}
       >
        <Pencil />
       </Button>
      ) : null}
      <Button
       type="button"
       variant="outline"
       size="toolbar"
       onClick={() => onSpeak(item.promptZh ?? "")}
      >
       <Play data-icon="inline-start" />
       Đọc theo
      </Button>
     </span>
    </div>
   ))}
  </Card>
 ));
}

function MatchingItem({
 item,
 transcriptText,
 displayMode,
 onSpeak,
 onEditItem,
}: {
 item: ListeningRuntimeItem;
 transcriptText?: string;
 displayMode: LessonDisplayMode;
 onSpeak: (text: string) => void;
 onEditItem?: ListeningItemEditHandler;
}) {
 const left = item.metadata.left ?? [];
 const right = item.metadata.right ?? [];
 const [activeLeft, setActiveLeft] = useState(left[0]?.id ?? "");
 const [assignments, setAssignments] = useState<Record<string, string>>({});
 const [checked, setChecked] = useState(false);
 const expected =
  item.answer?.type === "matching"
   ? new Map(item.answer.pairs.map((pair) => [pair.right, pair.left]))
   : new Map<string, string>();
 const isCorrect =
  checked && right.every((rightItem) => assignments[rightItem.id] === expected.get(rightItem.id));

 return (
  <Card variant="section" padding="md" className="grid gap-3">
   <ItemHeader index={0} type="matching" onEdit={onEditItem ? () => onEditItem(item) : undefined} />
   <div className="grid gap-1">
    <ReaderHanziText displayMode={displayMode}>{item.promptZh}</ReaderHanziText>
    <ExerciseAudioButton
     promptText={item.promptZh}
     transcriptText={item.transcript?.full.zh ?? transcriptText}
     onSpeak={onSpeak}
    />
   </div>
   <div className="grid gap-2 lg:grid-cols-[14rem_minmax(0,1fr)]">
    <div className="grid content-start gap-2">
     {left.map((entry) => (
      <Button
       key={entry.id}
       type="button"
       variant={activeLeft === entry.id ? "active" : "outline"}
       aria-pressed={activeLeft === entry.id}
       align="start"
       wrap="normal"
       onClick={() => setActiveLeft(entry.id)}
      >
       <ReaderHanziText displayMode={displayMode}>{entry.textZh}</ReaderHanziText>
       {entry.textVi ? (
        <StudyInstructionText as="span" variant="caption" tone="muted">
         {entry.textVi}
        </StudyInstructionText>
       ) : null}
      </Button>
     ))}
    </div>
    <div className="grid content-start gap-2">
     {right.map((entry) => (
      <Button
       key={entry.id}
       type="button"
       variant="outline"
       align="start"
       wrap="normal"
       onClick={() => {
        setAssignments((current) => ({ ...current, [entry.id]: activeLeft }));
        setChecked(false);
       }}
      >
       <ReaderHanziText displayMode={displayMode}>
        {entry.textZh}
        {entry.textVi ? (
         <StudyInstructionText as="span" variant="caption" tone="muted" className="block">
          {entry.textVi}
         </StudyInstructionText>
        ) : null}
       </ReaderHanziText>
       <Badge variant="purple" casing="natural">
        {left.find((candidate) => candidate.id === assignments[entry.id])?.textVi ?? "Chưa nối"}
       </Badge>
      </Button>
     ))}
    </div>
   </div>
   <div className="flex items-center gap-2">
    <Button
     type="button"
     size="toolbar"
     disabled={right.some((entry) => !assignments[entry.id])}
     onClick={() => setChecked(true)}
    >
     Kiểm tra
    </Button>
    <Button type="button" variant="outline" size="toolbar" onClick={() => setAssignments({})}>
     Làm lại
    </Button>
    {checked ? (
     <StudyInstructionText
      as="span"
      variant="bodySmall"
      tone={isCorrect ? "successStrong" : "danger"}
      weight="bold"
     >
      {isCorrect ? "✓ Nối chính xác" : "✕ Còn cặp chưa đúng"}
     </StudyInstructionText>
    ) : null}
   </div>
  </Card>
 );
}

export function ListeningExerciseItems(props: ListeningExerciseItemsProps) {
 const editMode = useHanziHomeEditMode();
 const { openEditableNode } = useHanziHomeFeatureActions();
 const [selections, setSelections] = useState<Record<string, string>>({});
 const [checked, setChecked] = useState<Record<string, boolean>>({});
 const [answers, setAnswers] = useState<Record<string, string>>({});
 const [revealed, setRevealed] = useState<Record<string, boolean>>({});
 const [revealedScripts, setRevealedScripts] = useState<Record<string, boolean>>({});
 const [sharedScriptVisible, setSharedScriptVisible] = useState(false);
 const hasCheckedItem = Object.values(checked).some(Boolean);
 const revealSharedScript =
  props.showScript || sharedScriptVisible || !props.hideScriptBeforeCheck || hasCheckedItem;
 const revealSharedMeaning =
  props.showMeaning && (!props.showTranslationAfterCheck || hasCheckedItem);
 const updateSelection = (itemId: string, value: string) => {
  setSelections((current) => ({ ...current, [itemId]: value }));
  setChecked((current) => ({ ...current, [itemId]: false }));
 };
 const updateAnswer = (itemId: string, value: string) =>
  setAnswers((current) => ({ ...current, [itemId]: value }));
 const checkItem = (itemId: string) => setChecked((current) => ({ ...current, [itemId]: true }));
 const revealItem = (itemId: string) =>
  setRevealed((current) => ({ ...current, [itemId]: !current[itemId] }));
 const toggleItemScript = (itemId: string) =>
  setRevealedScripts((current) => ({ ...current, [itemId]: !current[itemId] }));
 const editItem = editMode
  ? (item: Parameters<ListeningItemEditHandler>[0]) => {
     if (!item.editMeta) return;
     openEditableNode({
      lessonId: props.lessonId,
      entityType: "listening_item",
      entityId: item.id,
      parentEntityType: "lesson",
      parentEntityId: props.lessonId,
      path: ["listening", "items", item.id],
      value: item,
      label: `Sửa câu nghe: ${item.promptZh ?? item.id}`,
     });
    }
  : undefined;

 return (
  <div className="grid gap-2.5">
   {props.sharedTranscript ? (
    <div className="grid gap-2">
     <Button
      type="button"
      variant="outline"
      size="toolbar"
      className="justify-self-start"
      onClick={() => setSharedScriptVisible((current) => !current)}
     >
      {revealSharedScript ? "Ẩn script của đoạn" : "Hiện script của đoạn"}
     </Button>
     {revealSharedScript ? (
      <ListeningTranscriptBlock
       transcript={props.sharedTranscript}
       displayMode={{ ...props.displayMode, showMeaning: revealSharedMeaning }}
       onSpeak={props.onSpeak}
       onSpeakSequence={props.onSpeakSequence}
      />
     ) : null}
    </div>
   ) : null}

   {props.exerciseType === "single_choice" || props.exerciseType === "stress_choice" ? (
    <ChoiceItems
     {...props}
     selections={selections}
     checked={checked}
     onSelect={updateSelection}
     onCheck={checkItem}
     revealedScripts={revealedScripts}
     onToggleScript={toggleItemScript}
     onEditItem={editItem}
    />
   ) : null}
   {props.exerciseType === "short_answer" || props.exerciseType === "oral_response" ? (
    <AnswerItems
     items={props.items}
     exerciseType={props.exerciseType}
     answers={answers}
     revealed={revealed}
     onAnswer={updateAnswer}
     onReveal={revealItem}
     showMeaning={props.showMeaning}
     transcriptText={props.sharedTranscript?.full.zh}
     displayMode={props.displayMode}
     onSpeak={props.onSpeak}
     onEditItem={editItem}
    />
   ) : null}
   {props.exerciseType === "true_false" || props.exerciseType === "same_different" ? (
    <BooleanItems
     items={props.items}
     exerciseType={props.exerciseType}
     selections={selections}
     checked={checked}
     revealed={revealed}
     onSelect={updateSelection}
     onCheck={checkItem}
     onReveal={revealItem}
     showMeaning={props.showMeaning}
     transcriptText={props.sharedTranscript?.full.zh}
     displayMode={props.displayMode}
     onSpeak={props.onSpeak}
     onEditItem={editItem}
    />
   ) : null}
   {props.exerciseType === "fill_blank" ? (
    <FillBlankItems
     items={props.items}
     answers={answers}
     checked={checked}
     onAnswer={updateAnswer}
     onCheck={checkItem}
     transcriptText={props.sharedTranscript?.full.zh}
     displayMode={props.displayMode}
     onSpeak={props.onSpeak}
     onEditItem={editItem}
    />
   ) : null}
   {props.exerciseType === "shadowing" ? (
    <ShadowingItems
     items={props.items}
     displayMode={props.displayMode}
     onSpeak={props.onSpeak}
     onEditItem={editItem}
    />
   ) : null}
   {props.exerciseType === "matching" && props.items[0] ? (
    <MatchingItem
     item={props.items[0]}
     transcriptText={props.sharedTranscript?.full.zh}
     displayMode={props.displayMode}
     onSpeak={props.onSpeak}
     onEditItem={editItem}
    />
   ) : null}
  </div>
 );
}
