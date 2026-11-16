"use client";

import { UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/layout/card";
import { Label } from "@/components/ui/forms/label";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/forms/select";
import { Typography } from "@/components/ui/display/typography";
import { STANDARD_MANDARIN_VOICES } from "@/features/speech/mandarin-voices";

import { useDialogueVoicePreference } from "./useDialogueVoicePreference";

/** Saved A/B voices that every textbook dialogue alternates between. */
export function DialogueVoiceSettings() {
 const t = useTranslations("TtsStudio");
 const { voiceA, voiceB, setVoiceA, setVoiceB } = useDialogueVoicePreference();
 const speakers = [
  { role: "A", value: voiceA, onChange: setVoiceA },
  { role: "B", value: voiceB, onChange: setVoiceB },
 ];

 return (
  <Card variant="subtle" padding="md" className="grid gap-3">
   <div className="grid gap-1">
    <div className="flex items-center gap-1.5">
     <UsersRound className="size-4 text-primary" />
     <Typography variant="body" weight="bold">
      {t("dialogueVoicesTitle")}
     </Typography>
    </div>
    <Typography variant="caption" tone="muted">
     {t("dialogueVoicesHelp")}
    </Typography>
   </div>
   <div className="grid gap-3">
    {speakers.map((speaker) => (
     <div key={speaker.role} className="grid min-w-0 gap-1.5">
      <Label variant="label">{t("dialogueVoiceFor", { role: speaker.role })}</Label>
      <Select value={speaker.value} onValueChange={speaker.onChange}>
       <SelectTrigger width="full" aria-label={t("dialogueVoiceFor", { role: speaker.role })}>
        <SelectValue />
       </SelectTrigger>
       <SelectContent>
        <SelectGroup>
         {STANDARD_MANDARIN_VOICES.map((voice) => (
          <SelectItem key={voice.shortName} value={voice.shortName}>
           {voice.label}
          </SelectItem>
         ))}
        </SelectGroup>
       </SelectContent>
      </Select>
     </div>
    ))}
   </div>
  </Card>
 );
}
