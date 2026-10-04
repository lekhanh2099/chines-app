"use client";
import { resolveReadingDocumentHref } from "../navigation/reading-route-registry";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/display/badge";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { ReaderCatalogCard } from "@/features/reading/components/ReaderCatalogCard";
import { usePathname } from "@/i18n/navigation";

import { PdfReaderWorkspace } from "@/features/reading/pdf/PdfReaderWorkspace";
import { ReaderDocumentStudy } from "@/features/reading/workspaces/ReaderDocumentStudy";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import type { ReaderPdfAsset } from "@/features/reading/model/reading-assets.schemas";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";

import {
 groupReaderCollectionDocuments,
 metadataText,
 metadataNumber,
 reinforcementPdfAssetId,
} from "./reader-collection-utils";

type ReaderCollectionKind = Exclude<ReaderDocumentRow["kind"], "hsk">;

export function ReaderCollectionWorkspace({
 kind,
 title,
 description,
 initialDocumentSlug = "",
 initialDocuments,
 initialUnitReferenceDocuments = [],
 initialResource,
 initialPdfAssets = [],
}: {
 kind: ReaderCollectionKind;
 title?: string;
 description?: string;
 initialDocumentSlug?: string;
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialUnitReferenceDocuments?: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
 initialPdfAssets?: ReadonlyArray<ReaderPdfAsset>;
}) {
 const t = useTranslations("Reader.collection");
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const collectionCopy: Record<ReaderCollectionKind, { title: string; description: string }> = {
  core: { title: t("kinds.core.title"), description: t("kinds.core.description") },
  reinforcement: {
   title: t("kinds.reinforcement.title"),
   description: t("kinds.reinforcement.description"),
  },
  mock: { title: t("kinds.mock.title"), description: t("kinds.mock.description") },
  daily: { title: t("kinds.daily.title"), description: t("kinds.daily.description") },
  personal: { title: t("kinds.personal.title"), description: t("kinds.personal.description") },
  humanities: {
   title: t("kinds.humanities.title"),
   description: t("kinds.humanities.description"),
  },
 };
 const resolvedTitle = title ?? collectionCopy[kind].title;
 const resolvedDescription = description ?? collectionCopy[kind].description;
 const documents = initialDocuments;
 const unitReferenceDocuments = initialUnitReferenceDocuments;
 const requestedDocumentId = searchParams.get("document") ?? "";
 const slugDocumentId =
  documents.find((document) => document.slug === initialDocumentSlug)?.id ?? "";
 const showDocumentCatalog = requestedDocumentId.length === 0 && initialDocumentSlug.length === 0;
 const invalidInitialSlug = initialDocumentSlug.length > 0 && slugDocumentId.length === 0;
 const selectedDocumentId = requestedDocumentId || slugDocumentId;
 const collectionPath =
  initialDocumentSlug.length > 0 ? pathname.replace(/\/[^/]+$/u, "") : pathname;
 const unitGroups = useMemo(
  () =>
   groupReaderCollectionDocuments(
    kind,
    documents,
    unitReferenceDocuments,
    t("otherDocuments"),
    (id, title) => t("unitTitle", { id, title }),
   ),
  [documents, kind, t, unitReferenceDocuments],
 );
 const resource = selectedDocumentId.length > 0 ? initialResource : null;
 const reinforcementUnitReference =
  kind === "reinforcement" && resource !== null
   ? unitReferenceDocuments.find((document) => document.unit_id === resource.document.unit_id)
   : undefined;

 return (
  <div className="grid min-w-0 gap-4">
   {showDocumentCatalog ? (
    <div className="flex min-w-0 items-start gap-3">
     <IconTile tone="info" size="md">
      <BookOpen aria-hidden="true" />
     </IconTile>
     <div className="grid min-w-0 gap-1">
      <Typography as="h1" variant="pageTitle" weight="black">
       {resolvedTitle}
      </Typography>
      {resolvedDescription ? (
       <Typography as="p" variant="body" tone="muted">
        {resolvedDescription}
       </Typography>
      ) : null}
     </div>
    </div>
   ) : null}

   {showDocumentCatalog ? (
    <Card variant="section" padding="md" className="grid gap-3">
     {documents.length === 0 ? (
      <Typography variant="bodySmall" tone="muted">
       {t("empty")}
      </Typography>
     ) : (
      <>
       {unitGroups.map((group) => (
        <div key={group.id} className="grid gap-3">
         <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2">
          <Typography as="h2" variant="cardTitle" weight="black">
           {group.title}
          </Typography>
          {group.id !== "other" ? (
           <Badge variant="accent" casing="natural">
            {group.id}
           </Badge>
          ) : null}
         </div>
         {group.subtitle || group.description ? (
          <Typography as="p" variant="bodySmall" tone="muted">
           {group.subtitle ? <strong>{group.subtitle}. </strong> : null}
           {group.description}
          </Typography>
         ) : null}
         <div className="grid gap-3 sm:grid-cols-2">
          {group.documents.map((document) => (
           <ReaderCatalogCard
            key={document.id}
            document={document}
            href={resolveReadingDocumentHref(document)}
            label={
             kind === "reinforcement"
              ? t("reinforcementLabel")
              : (metadataText(document, "reading_label_vi") ??
                t("readingNumber", { number: document.reading_number ?? "" }))
            }
            metadata={
             kind === "reinforcement"
              ? [
                 metadataText(document, "difficulty_vi") ?? "",
                 t("minutes", { count: metadataNumber(document, "estimated_minutes") ?? 0 }),
                 t("page", { page: metadataNumber(document, "printed_page") ?? "" }),
                ]
              : [
                 t("paragraphs", { count: metadataNumber(document, "paragraphs") ?? 0 }),
                 t("vocabulary", { count: metadataNumber(document, "vocabulary") ?? 0 }),
                 t("exercises", { count: metadataNumber(document, "exercises") ?? 0 }),
                ]
            }
           />
          ))}
         </div>
        </div>
       ))}
      </>
     )}
    </Card>
   ) : null}

   {!showDocumentCatalog && resource === null && !invalidInitialSlug ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="danger">
      {t("notFoundLibrary")}
     </Typography>
    </Card>
   ) : null}
   {invalidInitialSlug ? (
    <Card variant="subtle" padding="lg">
     <Typography variant="bodySmall" tone="danger">
      {t("notFoundCatalog")}
     </Typography>
    </Card>
   ) : null}
   {resource && kind === "reinforcement" ? (
    <PdfReaderWorkspace
     key={resource.document.id}
     initialAssetId={reinforcementPdfAssetId(resource.document, initialPdfAssets) ?? undefined}
     initialAssets={initialPdfAssets}
     heading={resource.document.title_zh}
     badgeLabel={t("reinforcementLabel")}
     backHref={collectionPath}
     backLabel={t("reinforcementBack")}
     metadata={[
      metadataText(reinforcementUnitReference ?? resource.document, "unit_title_zh") ?? "",
      metadataText(reinforcementUnitReference ?? resource.document, "unit_title_vi") ?? "",
      resource.document.title_vi,
      t("printedPage", { page: metadataNumber(resource.document, "printed_page") ?? "" }),
     ]
      .filter(Boolean)
      .join(" · ")}
     badges={[
      t("unitBadge", { id: resource.document.unit_id?.replace(/^U/u, "") ?? "" }),
      t("reinforcementLabel"),
      t("minutes", { count: metadataNumber(resource.document, "estimated_minutes") ?? 0 }),
     ]}
     notice={metadataText(resource.document, "notice_vi") ?? undefined}
     showAssetPicker={false}
    />
   ) : null}
   {resource && kind !== "reinforcement" ? (
    <ReaderDocumentStudy
     key={resource.document.id}
     resource={resource}
     backHref={collectionPath}
     backLabel={kind === "core" ? t("coreBack") : t("backToList", { title: resolvedTitle })}
     navigationDocuments={documents}
     stateOwner={kind === "daily" ? "daily" : kind === "personal" ? "personal" : "reader"}
    />
   ) : null}
  </div>
 );
}
