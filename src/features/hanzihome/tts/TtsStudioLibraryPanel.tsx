"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import { QueryErrorCard } from "@/components/ui/feedback/query-error-card";
import type { useSharedMandarinTts } from "@/features/speech/MandarinTtsProvider";
import type { useTtsLibrary } from "./useTtsLibrary";
import type { useTtsStudioPlayback } from "./useTtsStudioPlayback";

type TtsLibraryQuery = ReturnType<typeof useTtsLibrary>;

/** Library tab: saved clips with play, open-in-composer and dictation actions. */
export function TtsStudioLibraryPanel({
 libraryQuery,
 clips,
 speakSequence,
 openClip,
}: {
 libraryQuery: TtsLibraryQuery;
 clips: NonNullable<TtsLibraryQuery["data"]>["clips"];
 speakSequence: ReturnType<typeof useSharedMandarinTts>["speakSequence"];
 openClip: ReturnType<typeof useTtsStudioPlayback>["openClip"];
}) {
 const t = useTranslations("TtsStudio");

 return (
  <Card variant="section" padding="md" className="grid gap-2">
   <Typography as="h3" variant="cardTitle" weight="black">
    {t("libraryTitle")}
   </Typography>
   {libraryQuery.isPending ? (
    <Typography variant="bodySmall" tone="muted">
     {t("loading")}
    </Typography>
   ) : null}
   {libraryQuery.isError ? (
    <QueryErrorCard
     title={t("loadError")}
     description={t("loadErrorHelp")}
     retryLabel={t("retry")}
     onRetry={() => {
      void libraryQuery.refetch();
     }}
    />
   ) : null}
   {!libraryQuery.isPending && !libraryQuery.isError && clips.length === 0 ? (
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("emptyLibrary")}
    </Typography>
   ) : null}
   {clips.map((clip) => (
    <Card
     key={clip.id}
     variant="default"
     padding="sm"
     className="flex min-w-0 flex-wrap items-center justify-between gap-2"
    >
     <div className="grid min-w-0 gap-0.5">
      <Typography as="p" variant="bodySmall" weight="black" clamp="one">
       {clip.title || t("untitled")}
      </Typography>
      <Typography as="p" variant="caption" tone="muted" clamp="two">
       {clip.text}
      </Typography>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant="outline" onClick={() => speakSequence([clip.text])}>
       {t("play")}
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={() => openClip(clip)}>
       {t("open")}
      </Button>
      <Button type="button" size="sm" variant="outline" asChild>
       <Link href={`/dictation?clipId=${encodeURIComponent(clip.id)}`} prefetch={false}>
        {t("dictation")}
       </Link>
      </Button>
     </div>
    </Card>
   ))}
  </Card>
 );
}
