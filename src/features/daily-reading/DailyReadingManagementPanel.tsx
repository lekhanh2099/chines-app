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

import { useDailyReadingLibrary } from "@/features/daily-reading/daily-reading.client";
import {
 removeAllDailyReadingArticles,
 removeDailyReadingArticle,
} from "@/features/daily-reading/daily-reading-storage.client";
import type { DailyReading } from "@/features/daily-reading/daily-reading.schemas";
import { getDailyReadingLearningSummary } from "@/features/daily-reading/daily-reading-view-model";

type DeleteTarget = { kind: "article"; article: DailyReading } | { kind: "all" } | null;

export function DailyReadingManagementPanel() {
 const t = useTranslations("DailyReading");
 const locale = useLocale();
 const library = useDailyReadingLibrary();
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
    const removed = removeDailyReadingArticle(deleteTarget.article.id);
    if (removed) toast.success(t("management.toast.articleDeleted"));
   } else if (deleteTarget?.kind === "all") {
    const removed = removeAllDailyReadingArticles();
    toast.success(t("management.toast.allDeleted", { count: removed }));
   }
   setDeleteTarget(null);
  } catch (error) {
   toast.error(error instanceof Error ? error.message : t("management.toast.deleteFailed"));
  }
 }

 const deleteTitle =
  deleteTarget?.kind === "all"
   ? t("management.confirmAllTitle")
   : t("management.confirmArticleTitle");
 const deleteDescription =
  deleteTarget?.kind === "all"
   ? t("management.confirmAllDescription", { count: library.items.length })
   : deleteTarget?.kind === "article"
     ? t("management.confirmArticleDescription", {
        title: deleteTarget.article.article.titleZh,
       })
     : "";

 return (
  <Card variant="section" padding="lg" className="grid min-w-0 gap-4">
   <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle" weight="bold">
      {t("management.title")}
     </Typography>
     <Typography variant="bodySmall" tone="muted">
      {t("management.description", { count: library.items.length })}
     </Typography>
    </div>

    <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
     <DialogTrigger asChild>
      <Button type="button" variant="outline" size="toolbar">
       <LibraryBig data-icon="inline-start" />
       {t("management.open")}
      </Button>
     </DialogTrigger>
     <DialogContent size="lg">
      <DialogHeader>
       <DialogTitle>{t("management.dialogTitle")}</DialogTitle>
       <DialogDescription>{t("management.dialogDescription")}</DialogDescription>
      </DialogHeader>
      <DialogBody>
       {library.items.length === 0 ? (
        <div className="grid gap-1 py-4">
         <Typography weight="bold">{t("management.emptyTitle")}</Typography>
         <Typography variant="bodySmall" tone="muted">
          {t("management.emptyDescription")}
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
               {t("management.learningState", {
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
              {t("management.deleteArticle")}
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
         {t("management.deleteAll")}
        </Button>
       ) : null}
       <Button type="button" variant="outline" size="toolbar" onClick={() => setManagerOpen(false)}>
        {t("management.close")}
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
       {t("management.historyPreserved")}
      </Typography>
     </DialogBody>
     <DialogFooter>
      <Button type="button" variant="outline" size="toolbar" onClick={() => setDeleteTarget(null)}>
       {t("management.cancel")}
      </Button>
      <Button type="button" variant="destructive" size="toolbar" onClick={confirmDelete}>
       {t("management.confirmDelete")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </Card>
 );
}
