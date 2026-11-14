"use client";

import { useTranslations } from "next-intl";
import type { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { Typography } from "@/components/ui/display/typography";
import type { usePathname, useRouter } from "@/i18n/navigation";

import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import { metadataNumber } from "@/features/reading/workspaces/reader-collection-utils";
import type { groupReaderDocumentsByUnit } from "@/features/reading/workspaces/reader-workspace-utils";
import type { ReaderCollectionOption } from "@/features/reading/workspaces/ReaderWorkspaceSources";

/** Collection switcher plus the unit-grouped document catalog of the Reader home. */
export function ReaderCollectionCatalog({
 router,
 pathname,
 searchParams,
 readerKind,
 readerCollectionOptions,
 requestedDocumentId,
 selectedDocumentId,
 documents,
 groupedDocuments,
}: {
 router: ReturnType<typeof useRouter>;
 pathname: ReturnType<typeof usePathname>;
 searchParams: ReturnType<typeof useSearchParams>;
 readerKind: ReaderDocumentRow["kind"];
 readerCollectionOptions: ReadonlyArray<ReaderCollectionOption>;
 requestedDocumentId: string;
 selectedDocumentId: string;
 documents: ReadonlyArray<ReaderDocumentRow>;
 groupedDocuments: ReturnType<typeof groupReaderDocumentsByUnit>;
}) {
 const t = useTranslations("Reader.home");

 return (
  <div className="grid min-w-0 gap-4" aria-label={t("catalog.aria")}>
   <div className="flex min-w-0 flex-wrap items-center gap-2">
    <Button
     type="button"
     size="sm"
     variant="ghost"
     onClick={() => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("collection");
      next.delete("document");
      router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, {
       scroll: false,
      });
     }}
    >
     {t("catalog.back")}
    </Button>
    <div className="flex min-w-0 flex-wrap gap-2" aria-label={t("catalog.collectionsAria")}>
     {readerCollectionOptions.map((option) => (
      <Button
       key={option.kind}
       type="button"
       size="sm"
       variant={readerKind === option.kind ? "active" : "outline"}
       onClick={() => {
        const next = new URLSearchParams(searchParams.toString());
        next.set("collection", option.kind);
        next.delete("document");
        router.push(`${pathname}${next.size > 0 ? `?${next.toString()}` : ""}`, {
         scroll: false,
        });
       }}
      >
       {option.label}
      </Button>
     ))}
    </div>
   </div>
   {requestedDocumentId.length === 0 ? (
    documents.length === 0 ? (
     <Typography variant="caption" tone="muted">
      {t("catalog.emptyStatic")}
     </Typography>
    ) : (
     groupedDocuments.map((group) => (
      <Card key={group.id} variant="subtle" padding="md" className="grid gap-3">
       <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-3">
        <div className="grid gap-1">
         <Typography as="h3" variant="cardTitle" weight="black">
          {group.id === "other" ? t("catalog.otherDocuments") : t("catalog.unit", { id: group.id })}
         </Typography>
         <Typography as="p" variant="caption" tone="muted">
          {t("catalog.chooseDocument")}
         </Typography>
        </div>
        <Typography variant="caption" tone="muted">
         {t("catalog.documentCount", { count: group.documents.length })}
        </Typography>
       </div>
       <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {group.documents.map((document) => (
         <Button
          key={document.id}
          type="button"
          size="lg"
          variant={selectedDocumentId === document.id ? "active" : "surfaceCard"}
          align="start"
          wrap="normal"
          layout="grid"
          onClick={() => {
           const next = new URLSearchParams(searchParams.toString());
           next.set("document", document.id);
           router.push(`${pathname}?${next.toString()}`, {
            scroll: false,
           });
          }}
         >
          <Typography as="span" variant="bodySmall" weight="bold" className="w-full text-left">
           {document.title_zh}
          </Typography>
          <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
           {document.title_vi || document.genre_vi || document.kind.toUpperCase()}
          </Typography>
          <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
           {t("catalog.metadata", {
            paragraphs: metadataNumber(document, "paragraphs") ?? 0,
            vocabulary: metadataNumber(document, "vocabulary") ?? 0,
            exercises: metadataNumber(document, "exercises") ?? 0,
           })}
          </Typography>
         </Button>
        ))}
       </div>
      </Card>
     ))
    )
   ) : null}
  </div>
 );
}
