"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import type { DictationPlaybackMode } from "./studio-dictation-source-utils";

/** Step 2: choose sentence, paragraph or whole-passage playback before starting practice. */
export function StudioDictationModePicker({
 playbackMode,
 playbackModeLabel,
 titleZh,
 entryCount,
 onPlaybackModeChange,
 onChangeSource,
 onStart,
}: {
 playbackMode: DictationPlaybackMode;
 playbackModeLabel: string;
 titleZh: string;
 entryCount: number;
 onPlaybackModeChange: (mode: DictationPlaybackMode) => void;
 onChangeSource: () => void;
 onStart: () => void;
}) {
 const t = useTranslations("Dictation");
 return (
  <Card variant="section" padding="md" className="grid gap-4">
   <div className="grid gap-1">
    <Typography as="h2" variant="sectionTitle" weight="black">
     {t("chooseMode")}
    </Typography>
    <Typography variant="bodySmall" tone="muted">
     {t("modeHelp")}
    </Typography>
   </div>
   <div className="grid gap-2 sm:grid-cols-3">
    <Button
     type="button"
     size="lg"
     align="start"
     wrap="normal"
     layout="grid"
     variant={playbackMode === "sentence" ? "active" : "surfaceCard"}
     onClick={() => onPlaybackModeChange("sentence")}
    >
     <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
      {t("sentenceMode")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
      {t("sentenceHelp")}
     </Typography>
    </Button>
    <Button
     type="button"
     size="lg"
     align="start"
     wrap="normal"
     layout="grid"
     variant={playbackMode === "paragraph" ? "active" : "surfaceCard"}
     onClick={() => onPlaybackModeChange("paragraph")}
    >
     <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
      {t("paragraphMode")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
      {t("paragraphHelp")}
     </Typography>
    </Button>
    <Button
     type="button"
     size="lg"
     align="start"
     wrap="normal"
     layout="grid"
     variant={playbackMode === "passage" ? "active" : "surfaceCard"}
     onClick={() => onPlaybackModeChange("passage")}
    >
     <Typography as="span" variant="bodySmall" weight="black" className="w-full text-left">
      {t("passageMode")}
     </Typography>
     <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
      {t("passageHelp")}
     </Typography>
    </Button>
   </div>
   <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
    <Typography variant="caption" tone="muted">
     {t("selected")} {playbackModeLabel} · {titleZh} · {t("sentences", { count: entryCount })}
    </Typography>
    <div className="flex flex-wrap gap-2">
     <Button type="button" variant="outline" onClick={onChangeSource}>
      {t("changeSource")}
     </Button>
     <Button type="button" variant="default" onClick={onStart}>
      {t("start")}
     </Button>
    </div>
   </div>
  </Card>
 );
}
