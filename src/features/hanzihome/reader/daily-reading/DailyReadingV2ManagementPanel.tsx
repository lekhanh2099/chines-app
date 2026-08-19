"use client";

import { LibraryBig, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Typography } from "@/components/ui/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";

import { useDailyReadingV2Library } from "./daily-reading-v2-client";
import {
 removeAllDailyReadingV2Articles,
 removeDailyReadingV2Article,
} from "./daily-reading-v2-storage.client";
import type { DailyReadingV2 } from "./daily-reading-v2.schemas";
import { getDailyReadingLearningSummary } from "./daily-reading-v2-view-model";

type DeleteTarget =
 | { kind: "article"; article: DailyReadingV2 }
 | { kind: "all" }
 | null;

export function DailyReadingV2ManagementPanel() {
 const t = useTranslations("DailyReading");
 const locale = useLocale();
 const library = useDailyReadingV2Library();
 const [managerOpen, setManagerOpen] = useState(false);
 const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
 const dateFormatter = useMemo(
  () =>
   new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
   }),
  [locale],
 );

 function confirmDelete() {
  try {
   if (deleteTarget?.kind === "article") {
    const removed = removeDailyReadingV2Article(deleteTarget.article.id);
    if (removed) toast.success(t("v2.management.toast.articleDeleted"));
   } else if (deleteTarget?.kind === "all") {
    const removed = removeAllDailyReadingV2Articles();
    toast.success(t("v2.management.toast.allDeleted", { count: removed }));
   }
   setDeleteTarget(null);
  } catch (error) {
   toast.error(
    error instanceof Error ? error.message : t("v2.management.toast.deleteFailed"),
   );
  }
 }

 const deleteTitle =
  deleteTarget?.kind === "all"
   ? t("v2.management.confirmAllTitle")
   : t("v2.management.confirmArticleTitle");
 const deleteDescription =
  deleteTarget?.kind === "all"
   ? t("v2.management.confirmAllDescription", { count: library.items.length })
   : deleteTarget?.kind === "article"
     ? t("v2.management.confirmArticleDescription", {
        title: deleteTarget.article.article.titleZh,
       })
     : "";

 return (
  <Card variant="section" padding="lg" className="grid min-w-0 gap-4">
   <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("v2.management.title")}
     </Typography>
     <Typography variant="bodySmall" tone="muted">
      {t("v2.management.description", { count: library.items.length })}
     </Typography>
    </div>

    <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
     <DialogTrigger asChild>
      <Button type="button" variant="outline" size="toolbar">
       <LibraryBig data-icon="inline-start" />
       {t("v2.management.open")}
      </Button>
     </DialogTrigger>
     <DialogContent size="lg">
      <DialogHeader>
       <DialogTitle>{t("v2.management.dialogTitle")}</DialogTitle>
       <DialogDescription>{t("v2.management.dialogDescription")}</DialogDescription>
      </DialogHeader>
      <DialogBody>
       {library.items.length === 0 ? (
        <div className="grid gap-1 py-4">
         <Typography weight="bold">{t("v2.management.emptyTitle")}</Typography>
         <Typography variant="bodySmall" tone="muted">
          {t("v2.management.emptyDescription")}
         </Typography>
        </div>
       ) : (
        <div className="grid min-w-0">
         {library.items.map((reading, index) => {
          const learning = getDailyReadingLearningSummary(reading);
          return (
           <div key={reading.id} className="grid min-w-0 gap-3 py-3">
            {index > 0 ? <Separator /> : null}
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
             <div className="grid min-w-0 gap-1">
              <HanziText as="p" size="medium" weight="bold" clamp="two">
               {reading.article.titleZh}
              </HanziText>
              <Typography variant="caption" tone="muted">
               {dateFormatter.format(new Date(reading.capturedAt))} · {reading.source.publisher}
              </Typography>
              <Typography variant="caption" tone="muted">
               {t("v2.management.learningState", {
                ready: learning.ready,
                total: learning.total,
               })}
              </Typography>
             </div>
             <Button
              type="button"
              variant="destructive"
              size="compact"
              onClick={() => setDeleteTarget({ kind: "article", article: reading })}
             >
              <Trash2 data-icon="inline-start" />
              {t("v2.management.deleteArticle")}
             </Button>
            </div>
           </div>
          );
         })}
        </div>
       )}
      </DialogBody>
      <DialogFooter>
       {library.items.length > 0 ? (
        <Button
         type="button"
         variant="destructive"
         size="toolbar"
         onClick={() => setDeleteTarget({ kind: "all" })}
        >
         <Trash2 data-icon="inline-start" />
         {t("v2.management.deleteAll")}
        </Button>
       ) : null}
       <Button type="button" variant="outline" size="toolbar" onClick={() => setManagerOpen(false)}>
        {t("v2.management.close")}
       </Button>
      </DialogFooter>
     </DialogContent>
    </Dialog>
   </div>

   <Dialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
    <DialogContent size="sm">
     <DialogHeader>
      <DialogTitle>{deleteTitle}</DialogTitle>
      <DialogDescription>{deleteDescription}</DialogDescription>
     </DialogHeader>
     <DialogBody>
      <Typography variant="bodySmall" tone="muted">
       {t("v2.management.historyPreserved")}
      </Typography>
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="outline" size="toolbar" onClick={() => setDeleteTarget(null)}>
       {t("v2.management.cancel")}
      </Button>
      <Button type="button" variant="destructive" size="toolbar" onClick={confirmDelete}>
       {t("v2.management.confirmDelete")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </Card>
 );
}
