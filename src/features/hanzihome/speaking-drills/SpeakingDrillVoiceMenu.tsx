"use client";

import { Fragment } from "react";
import { UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuLabel,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { useDialogueVoicePreference } from "@/features/hanzihome/speech/useDialogueVoicePreference";
import { STANDARD_MANDARIN_VOICES } from "@/features/speech/mandarin-voices";

/** Quick access to the saved A/B dialogue voices, shared with every textbook dialogue. */
export function SpeakingDrillVoiceMenu() {
 const t = useTranslations("SpeakingDrills");
 const { voiceA, voiceB, setVoiceA, setVoiceB } = useDialogueVoicePreference();
 const speakers = [
  { role: "A", value: voiceA, onChange: setVoiceA },
  { role: "B", value: voiceB, onChange: setVoiceB },
 ];

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="outline"
     size="toolbar"
     aria-label={t("voicesAria")}
     title={t("voicesAria")}
    >
     <UsersRound data-icon="inline-start" />
     {t("voices")}
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent align="end" width="lg">
    {speakers.map((speaker, index) => (
     <Fragment key={speaker.role}>
      {index > 0 ? <DropdownMenuSeparator /> : null}
      <DropdownMenuLabel>{t("voiceFor", { role: speaker.role })}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={speaker.value} onValueChange={speaker.onChange}>
       {STANDARD_MANDARIN_VOICES.map((voice) => (
        <DropdownMenuRadioItem key={voice.shortName} value={voice.shortName}>
         {voice.label}
        </DropdownMenuRadioItem>
       ))}
      </DropdownMenuRadioGroup>
     </Fragment>
    ))}
   </DropdownMenuContent>
  </DropdownMenu>
 );
}
