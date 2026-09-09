"use client";
import { resolveReadingDocumentHref } from "@/features/reading/navigation/reading-route-registry";
import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import { usePathname } from "@/i18n/navigation";
import { JsonObjectSchema } from "@/types/json";
import { ReaderCatalogCard } from "@/features/reading/components/ReaderCatalogCard";
import { ReaderDocumentStudy } from "@/features/reading/workspaces/ReaderDocumentStudy";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
type ReaderDocumentGroup = {
 id: string;
 title: string;
 documents: ReaderDocumentRow[];
};

const readerHskVolumeOrder = ["hsk3-independent-passages", "hsk4-upper", "hsk4-lower"];

function readerRouteSlug(document: ReaderDocumentRow) {
 return document.kind === "hsk" ? document.slug.replace(/^hsk-/u, "") : document.slug;
}

function metadataText(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 return typeof value === "string" ? value : null;
}

function metadataNumber(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 if (typeof value === "number") return value;
 const counts = JsonObjectSchema.safeParse(document.source_metadata.counts);
 const nestedValue = counts.success ? counts.data[key] : undefined;
 return typeof nestedValue === "number" ? nestedValue : null;
}

export function HskWorkspace({
 initialDocumentSlug = "",
 initialDocuments,
 initialResource,
}: {
 initialDocumentSlug?: string;
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
}) {
 const t = useTranslations("Reader.collection");
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const documents = initialDocuments;
 const requestedDocumentId = searchParams.get("document") ?? "";
 const slugDocumentId =
  documents.find(
   (document) =>
    document.slug === initialDocumentSlug || readerRouteSlug(document) === initialDocumentSlug,
  )?.id ?? "";
 const showDocumentCatalog = requestedDocumentId.length === 0 && initialDocumentSlug.length === 0;
 const invalidInitialSlug = initialDocumentSlug.length > 0 && slugDocumentId.length === 0;
 const selectedDocumentId = requestedDocumentId || slugDocumentId;
 const collectionPath =
  initialDocumentSlug.length > 0 ? pathname.replace(/\/[^/]+$/u, "") : pathname;
 const resource = selectedDocumentId.length > 0 ? initialResource : null;
 const hskGroups = useMemo<ReaderDocumentGroup[]>(() => {
  const groups = new Map<string, ReaderDocumentGroup>();
  for (const document of documents) {
   const id = metadataText(document, "volume_id") ?? "other";
   const translatedTitle =
    id === "hsk3-independent-passages"
     ? t("hskVolumes.hsk3")
     : id === "hsk4-upper"
       ? t("hskVolumes.hsk4Upper")
       : id === "hsk4-lower"
         ? t("hskVolumes.hsk4Lower")
         : null;
   const groupTitle =
    translatedTitle ??
    metadataText(document, "volume_label_vi") ??
    metadataText(document, "volume_label_zh") ??
    t("hskVolumes.default");
   const group = groups.get(id) ?? {
    id,
    title: groupTitle,
    documents: [],
   };
   group.documents.push(document);
   groups.set(id, group);
  }
  return [...groups.values()]
   .sort((left, right) => {
    const leftOrder = readerHskVolumeOrder.findIndex((volumeId) => volumeId === left.id);
    const rightOrder = readerHskVolumeOrder.findIndex((volumeId) => volumeId === right.id);
    if (leftOrder !== -1 && rightOrder !== -1) return leftOrder - rightOrder;
    if (leftOrder !== -1) return -1;
    if (rightOrder !== -1) return 1;
    return left.id.localeCompare(right.id, undefined, { numeric: true });
   })
   .map((group) => ({
    ...group,
    documents: group.documents.toSorted((left, right) => {
     const lessonOrder =
      (metadataNumber(left, "lesson_number") ?? Number.MAX_SAFE_INTEGER) -
      (metadataNumber(right, "lesson_number") ?? Number.MAX_SAFE_INTEGER);
     if (lessonOrder !== 0) return lessonOrder;
     return (
      (left.reading_number ?? Number.MAX_SAFE_INTEGER) -
      (right.reading_number ?? Number.MAX_SAFE_INTEGER)
     );
    }),
   }));
 }, [documents, t]);

 return (
  <div className="grid min-w-0 gap-4">
   {showDocumentCatalog ? (
    <>
     <div className="flex min-w-0 items-start gap-3">
      <IconTile tone="info" size="md">
       <BookOpen aria-hidden="true" />
      </IconTile>
      <div className="grid min-w-0 gap-1">
       <Typography as="h1" variant="pageTitle" weight="black">
        {t("kinds.hsk.title")}
       </Typography>
       <Typography as="p" variant="body" tone="muted">
        {t("kinds.hsk.description")}
       </Typography>
      </div>
     </div>
     <Card variant="section" padding="md" className="grid gap-3">
      <Typography variant="caption" tone="muted">
       {t("readingCount", { count: documents.length })}
      </Typography>
      {documents.length === 0 ? (
       <Typography variant="bodySmall" tone="muted">
        {t("empty")}
       </Typography>
      ) : (
       <>
        {hskGroups.map((group) => (
         <div key={group.id} className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default pb-2">
           <Typography as="h2" variant="cardTitle" weight="black">
            {group.title}
           </Typography>
           <Typography variant="caption" tone="muted">
            {t("readingCount", { count: group.documents.length })}
           </Typography>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
           {group.documents.map((document) => (
            <ReaderCatalogCard
             key={document.id}
             document={document}
             href={resolveReadingDocumentHref(document)}
             label={
              metadataNumber(document, "lesson_number") !== null
               ? t("hskLessonReading", {
                  lesson: metadataNumber(document, "lesson_number") ?? "",
                  reading: document.reading_number ?? "",
                 })
               : document.genre_vi || document.slug
             }
             metadata={[
              t("hskLevel", { level: metadataNumber(document, "level") ?? "" }),
              t("paragraphs", { count: metadataNumber(document, "paragraphs") ?? 0 }),
             ]}
             badgeVariant="warning"
             metadataBadgeVariant="success"
            />
           ))}
          </div>
         </div>
        ))}
       </>
      )}
     </Card>
    </>
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
   {resource ? (
    <ReaderDocumentStudy
     key={resource.document.id}
     resource={resource}
     backHref={collectionPath}
     backLabel={t("backToList", { title: t("kinds.hsk.title") })}
     navigationDocuments={documents}
     stateOwner="reader"
    />
   ) : null}
  </div>
 );
}
