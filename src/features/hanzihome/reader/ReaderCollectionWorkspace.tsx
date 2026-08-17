"use client";

import { useMemo, type ComponentProps } from "react";
import { BookOpen, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { Typography } from "@/components/ui/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link, usePathname } from "@/i18n/navigation";
import { JsonObjectSchema } from "@/types/json";

import { PdfReaderWorkspace, pdfAssetIdForDocument } from "./PdfReaderWorkspace";
import { ReaderDocumentStudy } from "./ReaderDocumentStudy";
import type { ReaderDocumentResource } from "./reader-content-api";
import type { ReaderDocumentRow, ReaderPdfAsset } from "./reader.schemas";

type ReaderCollectionKind = ReaderDocumentRow["kind"];

type ReaderDocumentGroup = {
 id: string;
 title: string;
 subtitle: string;
 description: string;
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

function sourceOrder(document: ReaderDocumentRow) {
 const sourceId = metadataText(document, "source_id");
 if (sourceId === null) return Number.MAX_SAFE_INTEGER;
 const match = /(?:mock|reinforcement)-0*(\d+)$/u.exec(sourceId);
 return match === null ? Number.MAX_SAFE_INTEGER : Number(match[1]);
}

function reinforcementPdfAssetId(
 document: ReaderDocumentRow,
 assets: ReadonlyArray<ReaderPdfAsset>,
) {
 const resourceFile = metadataText(document, "resource_file");
 const pdfPage = metadataNumber(document, "pdf_page");
 return resourceFile !== null && pdfPage !== null
  ? pdfAssetIdForDocument(resourceFile, pdfPage, assets)
  : null;
}

function firstHanzi(title: string) {
 const match = /\p{Script=Han}/u.exec(title);
 return match?.[0] ?? "读";
}

function ReaderCatalogCard({
 document,
 href,
 label,
 metadata,
 badgeVariant = "success",
 metadataBadgeVariant = "info",
}: {
 document: ReaderDocumentRow;
 href: string;
 label: string;
 metadata: ReadonlyArray<string>;
 badgeVariant?: ComponentProps<typeof Badge>["variant"];
 metadataBadgeVariant?: ComponentProps<typeof Badge>["variant"];
}) {
 return (
  <Card variant="interactive" padding="md" className="min-h-56 overflow-hidden">
   <Link
    href={href}
    prefetch={false}
    className="group relative grid min-h-48 content-between gap-3"
   >
    <span
     aria-hidden="true"
     className="pointer-events-none absolute -right-1 -bottom-7 font-hanzi text-[7rem] font-normal leading-none text-text-muted/10"
    >
     {firstHanzi(document.title_zh)}
    </span>
    <div className="relative flex items-start gap-3">
     <Badge variant={badgeVariant} size="sm" casing="natural">
      {label}
     </Badge>
    </div>
    <div className="relative grid min-w-0 gap-1">
     <HanziText as="h3" size="card" className="min-w-0" clamp="two">
      {document.title_zh}
     </HanziText>
     <Typography as="p" variant="bodySmall" tone="secondary" clamp="two">
      {document.title_vi || document.genre_vi || document.slug}
     </Typography>
    </div>
    <div className="relative flex flex-wrap gap-1.5">
     {metadata.map((item) => (
      <Badge key={item} variant={metadataBadgeVariant} size="sm" casing="natural">
       {item}
      </Badge>
     ))}
    </div>
    <div className="relative flex items-center">
     <ChevronRight
      className="text-primary transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
     />
    </div>
   </Link>
  </Card>
 );
}

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
  hsk: { title: t("kinds.hsk.title"), description: t("kinds.hsk.description") },
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
  documents.find(
   (document) =>
    document.slug === initialDocumentSlug || readerRouteSlug(document) === initialDocumentSlug,
  )?.id ?? "";
 const showDocumentCatalog = requestedDocumentId.length === 0 && initialDocumentSlug.length === 0;
 const invalidInitialSlug = initialDocumentSlug.length > 0 && slugDocumentId.length === 0;
 const selectedDocumentId = requestedDocumentId || slugDocumentId;
 const collectionPath =
  initialDocumentSlug.length > 0 ? pathname.replace(/\/[^/]+$/u, "") : pathname;
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
    subtitle: "",
    description: "",
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
 const unitGroups = useMemo<ReaderDocumentGroup[]>(() => {
  const groups = new Map<string, ReaderDocumentGroup>();
  for (const document of documents) {
   const id = document.unit_id ?? "other";
   const firstDocument = (kind === "reinforcement" ? unitReferenceDocuments : documents)?.find(
    (candidate) =>
     candidate.unit_id === id && (kind !== "reinforcement" || candidate.kind === "core"),
   );
   const groupTitle =
    id === "other"
     ? t("otherDocuments")
     : t("unitTitle", {
        id: id.replace(/^U/u, ""),
        title: metadataText(firstDocument ?? document, "unit_title_zh") ?? "Reader",
       });
   const subtitle = metadataText(firstDocument ?? document, "unit_title_vi") ?? "";
   const groupDescription = metadataText(firstDocument ?? document, "unit_focus_vi") ?? "";
   const group = groups.get(id) ?? {
    id,
    title: groupTitle,
    subtitle,
    description: groupDescription,
    documents: [],
   };
   group.documents.push(document);
   groups.set(id, group);
  }
  return [...groups.values()]
   .sort((left, right) => {
    if (left.id === "other") return 1;
    if (right.id === "other") return -1;
    return left.id.localeCompare(right.id, undefined, { numeric: true });
   })
   .map((group) => ({
    ...group,
    documents:
     kind === "reinforcement"
      ? group.documents.toSorted((left, right) => sourceOrder(left) - sourceOrder(right))
      : group.documents.toSorted(
         (left, right) =>
          (left.reading_number ?? Number.MAX_SAFE_INTEGER) -
          (right.reading_number ?? Number.MAX_SAFE_INTEGER),
        ),
   }));
 }, [documents, kind, t, unitReferenceDocuments]);
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
     {kind === "hsk" ? (
      <Typography variant="caption" tone="muted">
       {t("readingCount", { count: documents.length })}
      </Typography>
     ) : null}
     {documents.length === 0 ? (
      <Typography variant="bodySmall" tone="muted">
       {t("empty")}
      </Typography>
     ) : (
      <>
       {kind === "hsk"
        ? hskGroups.map((group) => (
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
               href={`${collectionPath}/${readerRouteSlug(document)}`}
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
          ))
        : null}
       {kind !== "hsk"
        ? unitGroups.map((group) => (
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
               href={`${collectionPath}/${readerRouteSlug(document)}`}
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
          ))
        : null}
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
