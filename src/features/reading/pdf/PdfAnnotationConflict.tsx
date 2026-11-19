"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
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
import { pdfStrokePath } from "@/features/reading/pdf/pdf-annotations";
import type { usePdfAnnotations } from "@/features/reading/pdf/usePdfAnnotations";

type PdfAnnotations = ReturnType<typeof usePdfAnnotations>;

/** Conflict alert plus the local-vs-server comparison dialog for a PDF page. */
export function PdfAnnotationConflict({
 pageBackground,
 strokes,
 conflict,
 open,
 onOpenChange,
 resolving,
 onChoose,
}: {
 /** The page image both stroke versions are drawn over. */
 pageBackground: ReactNode;
 strokes: PdfAnnotations["strokes"];
 conflict: PdfAnnotations["conflict"];
 open: boolean;
 onOpenChange: (open: boolean) => void;
 resolving: boolean;
 onChoose: (useServer: boolean) => Promise<void>;
}) {
 const t = useTranslations("Reader.pdf");
 const common = useTranslations("Common");

 return (
  <>
   <div role="alert" className="flex flex-wrap items-center gap-2 px-3 pt-2 sm:px-4">
    <Typography variant="caption" tone="danger">
     {t("conflict.description")}
    </Typography>
    <Button variant="outline" size="sm" onClick={() => onOpenChange(true)}>
     {t("conflict.review")}
    </Button>
   </div>
   <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="xl" closeLabel={common("actions.cancel")}>
     <DialogHeader>
      <DialogTitle>{t("conflict.title")}</DialogTitle>
      <DialogDescription>{t("conflict.description")}</DialogDescription>
     </DialogHeader>
     <DialogBody className="grid gap-3 md:grid-cols-2">
      {[
       { label: t("conflict.local"), preview: strokes },
       { label: t("conflict.server"), preview: conflict.annotation?.payload.strokes ?? [] },
      ].map(({ label, preview }) => (
       <Card key={label} padding="md" className="min-w-0">
        <Typography as="h3" variant="sectionTitle">
         {label}
        </Typography>
        <Typography variant="caption" tone="muted">
         {t("conflict.strokeCount", { count: preview.length })}
        </Typography>
        <div className="relative">
         {pageBackground}
         <svg
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          role="img"
          aria-label={label}
          className="absolute inset-0 size-full"
          style={{ blockSize: "100%" }}
         >
          {preview.map((stroke) => (
           <path
            key={stroke.id}
            d={pdfStrokePath(stroke)}
            fill="none"
            stroke={stroke.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={stroke.width}
            opacity={stroke.tool === "highlighter" ? 0.42 : 1}
           />
          ))}
         </svg>
        </div>
       </Card>
      ))}
     </DialogBody>
     <DialogFooter>
      <Button
       variant="outline"
       disabled={resolving}
       onClick={() => {
        void onChoose(true);
       }}
      >
       {t("conflict.useServer")}
      </Button>
      <Button
       disabled={resolving}
       onClick={() => {
        void onChoose(false);
       }}
      >
       {t("conflict.keepLocal")}
      </Button>
     </DialogFooter>
    </DialogContent>
   </Dialog>
  </>
 );
}
