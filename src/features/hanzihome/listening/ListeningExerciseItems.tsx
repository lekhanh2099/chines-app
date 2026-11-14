"use client";

import { useTranslations } from "next-intl";

import { useState } from "react";

import { Button } from "@/components/ui/actions/button";
import { useHanziHomeFeatureActions } from "@/features/hanzihome/context/actions";
import { useHanziHomeEditMode } from "@/features/hanzihome/context/selectors";

import { ListeningTranscriptBlock } from "./ListeningTranscriptBlock";
import { AnswerItems } from "./ListeningAnswerItems";
import { BooleanItems } from "./ListeningBooleanItems";
import { ChoiceItems } from "./ListeningChoiceItems";
import type {
 ListeningExerciseItemsProps,
 ListeningItemEditHandler,
} from "./ListeningExerciseItemParts";
import { FillBlankItems } from "./ListeningFillBlankItems";
import { MatchingItem } from "./ListeningMatchingItem";
import { ShadowingItems } from "./ListeningShadowingItems";

export function ListeningExerciseItems(props: ListeningExerciseItemsProps) {
 const t = useTranslations("Listening");
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
 const updateAnswer = (itemId: string, value: string) => {
  setAnswers((current) => ({ ...current, [itemId]: value }));
  setChecked((current) => ({ ...current, [itemId]: false }));
 };
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
      label: t("editLabel", { text: item.promptZh ?? item.id }),
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
      {revealSharedScript ? t("hideSharedScript") : t("showSharedScript")}
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
