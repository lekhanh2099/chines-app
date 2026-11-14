"use client";

import { useTranslations } from "next-intl";

import { useAppForm } from "@/components/form";
import { Button } from "@/components/ui/actions/button";
import { Typography } from "@/components/ui/display/typography";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";

import {
 aiConversationModeSchema,
 aiConversationSettingsUpdateSchema,
 type AiConversationSettingsUpdate,
} from "../model/ai-conversation-session.schemas";
import {
 aiConversationCorrectionStyleSchema,
 aiConversationLearnerLevelSchema,
 aiConversationReplyModeSchema,
} from "../model/ai-conversation.schemas";

export function ConversationSettingsDialog({
 initialSettings,
 isSaving,
 saveError,
 onOpenChange,
 onSave,
}: {
 initialSettings: AiConversationSettingsUpdate;
 isSaving: boolean;
 saveError: string | null;
 onOpenChange: (open: boolean) => void;
 onSave: (settings: AiConversationSettingsUpdate) => void;
}) {
 const t = useTranslations("AiConversation");
 const modeOptions = [
  { value: aiConversationModeSchema.enum.natural, label: t("modes.natural") },
  {
   value: aiConversationModeSchema.enum["speaking-practice"],
   label: t("modes.speakingPractice"),
  },
  {
   value: aiConversationModeSchema.enum["grammar-coach"],
   label: t("modes.grammarCoach"),
  },
  {
   value: aiConversationModeSchema.enum["hskk-practice"],
   label: t("modes.hskkPractice"),
  },
 ];
 const levelOptions = [
  { value: aiConversationLearnerLevelSchema.enum.beginner, label: t("levels.beginner") },
  { value: aiConversationLearnerLevelSchema.enum.intermediate, label: t("levels.intermediate") },
  { value: aiConversationLearnerLevelSchema.enum.advanced, label: t("levels.advanced") },
 ];
 const correctionOptions = [
  { value: aiConversationCorrectionStyleSchema.enum.light, label: t("corrections.light") },
  { value: aiConversationCorrectionStyleSchema.enum.balanced, label: t("corrections.balanced") },
  { value: aiConversationCorrectionStyleSchema.enum.strict, label: t("corrections.strict") },
 ];
 const replyModeOptions = [
  { value: aiConversationReplyModeSchema.enum.adaptive, label: t("replyModes.adaptive") },
  { value: aiConversationReplyModeSchema.enum.chinese, label: t("replyModes.chinese") },
  { value: aiConversationReplyModeSchema.enum.bilingual, label: t("replyModes.bilingual") },
 ];
 const form = useAppForm({
  defaultValues: initialSettings,
  validators: { onSubmit: aiConversationSettingsUpdateSchema },
  onSubmit: ({ value }) => {
   onSave(value);
  },
 });

 return (
  <Dialog open onOpenChange={onOpenChange}>
   <DialogContent size="lg">
    <DialogHeader>
     <DialogTitle>{t("setup.title")}</DialogTitle>
     <DialogDescription>{t("setup.description")}</DialogDescription>
    </DialogHeader>
    <form
     onSubmit={(event) => {
      event.preventDefault();
      void form.handleSubmit();
     }}
    >
     <DialogBody className="grid gap-5 md:grid-cols-2">
      <form.AppField name="mode">
       {(field) => <field.Select label={t("setup.mode")} options={modeOptions} required />}
      </form.AppField>
      <form.AppField name="learnerLevel">
       {(field) => <field.Select label={t("setup.learnerLevel")} options={levelOptions} required />}
      </form.AppField>
      <form.AppField name="correctionStyle">
       {(field) => (
        <field.Select label={t("setup.correctionStyle")} options={correctionOptions} required />
       )}
      </form.AppField>
      <form.AppField name="replyMode">
       {(field) => (
        <field.Select label={t("setup.replyMode")} options={replyModeOptions} required />
       )}
      </form.AppField>
      {saveError ? (
       <div className="md:col-span-2">
        <Typography variant="bodySmall" tone="danger">
         {saveError}
        </Typography>
       </div>
      ) : null}
     </DialogBody>
     <DialogFooter>
      <Button
       type="button"
       variant="outline"
       onClick={() => onOpenChange(false)}
       disabled={isSaving}
      >
       {t("actions.cancel")}
      </Button>
      <Button type="submit" disabled={isSaving}>
       {isSaving ? t("actions.saving") : t("actions.save")}
      </Button>
     </DialogFooter>
    </form>
   </DialogContent>
  </Dialog>
 );
}
