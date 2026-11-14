"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";

/** Recent-source card, resume-in-progress status and resume-unavailable alert. */
export function StudioDictationResumeNotices({
 showRecentSource,
 recentTitle,
 manualSelectionOpen,
 resumePending,
 resumeUnavailable,
 onResumeRecent,
 onToggleManualSelection,
 onCancelResume,
}: {
 showRecentSource: boolean;
 recentTitle: string;
 manualSelectionOpen: boolean;
 resumePending: boolean;
 resumeUnavailable: boolean;
 onResumeRecent: () => void;
 onToggleManualSelection: () => void;
 onCancelResume: () => void;
}) {
 const t = useTranslations("Dictation");
 return (
  <>
   {showRecentSource ? (
    <Card variant="elevated" padding="md" className="grid gap-3">
     <div className="grid gap-1">
      <Typography variant="overline" tone="accent" weight="black">
       {t("recentSource")}
      </Typography>
      <Typography as="h2" variant="cardTitle" weight="black">
       {recentTitle}
      </Typography>
     </div>
     <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={onResumeRecent}>
       {t("resumeRecent")}
      </Button>
      <Button type="button" variant="outline" onClick={onToggleManualSelection}>
       {manualSelectionOpen ? t("hideSourcePicker") : t("chooseDifferentSource")}
      </Button>
     </div>
    </Card>
   ) : null}

   {resumePending ? (
    <Card variant="subtle" padding="md" className="flex flex-wrap items-center gap-3">
     <Typography as="p" variant="bodySmall" tone="muted" role="status">
      {t("resumingRecent")}
     </Typography>
     <Button type="button" variant="outline" onClick={onCancelResume}>
      {t("chooseDifferentSource")}
     </Button>
    </Card>
   ) : null}

   {resumeUnavailable ? (
    <Card variant="subtle" padding="md" role="alert">
     <Typography as="p" variant="bodySmall" tone="warning">
      {t("resumeUnavailable")}
     </Typography>
    </Card>
   ) : null}
  </>
 );
}
