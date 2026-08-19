"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { useQuery } from "@tanstack/react-query";
import {
 BookOpen,
 Check,
 ChevronRight,
 FileText,
 Play,
 RotateCcw,
 type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { Typography } from "@/components/ui/typography";
import { HanziAwareText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { fetchLearningLoopItems } from "@/features/hanzihome/learning-loop/learning-loop-api";
import { hanzihomeQueryKeys } from "@/features/hanzihome/query-keys";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import { createClient } from "@/lib/supabase/client";
import { JsonObjectSchema } from "@/types/json";

import type { ReaderDocumentResource } from "./reader-content-api";
import { PdfReaderWorkspace } from "./PdfReaderWorkspace";
import { ReaderDocumentStudy } from "./ReaderDocumentStudy";
import { readerKindSchema, type ReaderDocumentRow, type ReaderPdfAsset } from "./reader.schemas";

type ReaderSurface = "text" | "pdf";

type ReaderCollectionOption = {
 kind: ReaderDocumentRow["kind"];
 badge: string;
 badgeVariant: ComponentProps<typeof Badge>["variant"];
 description: string;
 href: string;
 icon: LucideIcon;
 label: string;
 title: string;
};

function metadataCount(document: ReaderDocumentRow, key: string) {
 const value = document.source_metadata[key];
 if (typeof value === "number") return value;
 const counts = JsonObjectSchema.safeParse(document.source_metadata.counts);
 const nestedValue = counts.success ? counts.data[key] : undefined;
 return typeof nestedValue === "number" ? nestedValue : null;
}

function ReaderSourceRow({ option }: { option: ReaderCollectionOption }) {
 const Icon = option.icon;

 return (
  <Button
   variant="navigation"
   size="touch"
   align="start"
   wrap="normal"
   layout="grid"
   asChild
   className="w-full"
  >
   <Link
    href={option.href}
    prefetch={false}
    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
   >
    <IconTile tone="neutral" size="sm">
     <Icon aria-hidden="true" />
    </IconTile>
    <span className="grid min-w-0 gap-0.5">
     <Typography as="span" variant="bodySmall" weight="bold">
      {option.title}
     </Typography>
     <Typography as="span" variant="caption" tone="muted" clamp="two">
      {option.description}
     </Typography>
    </span>
    <span className="col-start-2 flex min-w-0 items-center gap-2 sm:col-start-auto">
     <Badge variant={option.badgeVariant} size="sm" casing="natural">
      {option.badge}
     </Badge>
     <ChevronRight aria-hidden="true" />
    </span>
   </Link>
  </Button>
 );
}

function ReaderResumePanel() {
 const t = useTranslations("Reader.home.resume");
 const supabase = useMemo(() => createClient(), []);
 const sessionQuery = useQuery({
  queryKey: hanzihomeQueryKeys.readerSessionUser,
  queryFn: () => getClientSessionUser(supabase),
  staleTime: 60_000,
 });
 const learningLoopQuery = useQuery({
  queryKey: hanzihomeQueryKeys.learningLoop,
  queryFn: fetchLearningLoopItems,
  enabled: sessionQuery.data !== null && sessionQuery.data !== undefined,
  staleTime: 30_000,
 });
 const [now] = useState(() => Date.now());

 if (sessionQuery.isPending || !sessionQuery.data) return null;
 if (learningLoopQuery.isPending) {
  return (
   <Card variant="subtle" padding="lg" aria-label={t("loadingAria")}>
    <div className="h-20 animate-pulse rounded-lg bg-bg-card" />
   </Card>
  );
 }
 if (learningLoopQuery.isError) {
  return (
   <Card variant="subtle" padding="md" role="alert">
    <Typography variant="bodySmall" tone="warning">
     {t("error")}
    </Typography>
   </Card>
  );
 }

 const items = learningLoopQuery.data;
 const dueCount = items.filter((item) => new Date(item.due_at).getTime() <= now).length;
 const resumeItem = items.find((item) => item.kind === "reading_bookmark") ?? items[0] ?? null;
 if (resumeItem === null && dueCount === 0) return null;

 return (
  <Card
   variant="subtle"
   padding="lg"
   className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
  >
   <div className="grid min-w-0 gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="warning" casing="natural">
      {t("badge")}
     </Badge>
     {dueCount > 0 ? (
      <Badge variant="warning" casing="natural">
       {t("dueCount", { count: dueCount })}
      </Badge>
     ) : null}
    </div>
    {resumeItem ? (
     <div className="grid min-w-0 gap-1">
      <HanziAwareText as="h2" text={resumeItem.title_zh} variant="sectionTitle" weight="black" />
      <Typography as="p" variant="bodySmall" tone="secondary" clamp="one">
       {[
        resumeItem.title_vi,
        resumeItem.kind === "reading_bookmark" ? t("readingKind") : t("reviewKind"),
       ]
        .filter(Boolean)
        .join(" · ")}
      </Typography>
     </div>
    ) : (
     <Typography as="h2" variant="sectionTitle" weight="black">
      {t("ready")}
     </Typography>
    )}
   </div>
   <div className="flex flex-wrap gap-2">
    {resumeItem ? (
     <Button type="button" variant="default" asChild>
      <Link href={resumeItem.source_href} prefetch={false}>
       <Play data-icon="inline-start" />
       {t("continue")}
      </Link>
     </Button>
    ) : null}
    {dueCount > 0 ? (
     <Button type="button" variant="outline" asChild>
      <Link href="/learning-loop" prefetch={false}>
       <RotateCcw data-icon="inline-start" />
       {t("reviewNow")}
      </Link>
     </Button>
    ) : null}
   </div>
  </Card>
 );
}

export function ReaderWorkspace({
 initialDocuments,
 initialResource,
 initialPdfAssets,
}: {
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
 initialPdfAssets: ReadonlyArray<ReaderPdfAsset>;
}) {
 const t = useTranslations("Reader.home");
 const router = useRouter();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const surface: ReaderSurface = searchParams.get("surface") === "pdf" ? "pdf" : "text";
 const parsedReaderKind = readerKindSchema.safeParse(searchParams.get("collection"));
 const readerKind: ReaderDocumentRow["kind"] = parsedReaderKind.success
  ? parsedReaderKind.data
  : "core";
 const requestedDocumentId = searchParams.get("document") ?? "";
 const showCollectionCatalog = parsedReaderKind.success || requestedDocumentId.length > 0;
 const documents = initialDocuments;
 const selectedDocumentId = requestedDocumentId;
 const readerCollectionOptions: ReadonlyArray<ReaderCollectionOption> = [
  {
   kind: "daily",
   badge: t("options.daily.badge"),
   badgeVariant: "warning",
   description: t("options.daily.description"),
   href: "/daily-reading",
   icon: FileText,
   label: t("options.daily.title"),
   title: t("options.daily.title"),
  },
  {
   kind: "core",
   badge: t("options.core.badge"),
   badgeVariant: "success",
   description: t("options.core.description"),
   href: "/reader/course",
   icon: BookOpen,
   label: t("options.core.title"),
   title: t("options.core.title"),
  },
  {
   kind: "hsk",
   badge: t("options.hsk.badge"),
   badgeVariant: "success",
   description: t("options.hsk.description"),
   href: "/reader/hsk",
   icon: BookOpen,
   label: t("options.hsk.title"),
   title: t("options.hsk.title"),
  },
  {
   kind: "reinforcement",
   badge: t("options.reinforcement.badge"),
   badgeVariant: "warning",
   description: t("options.reinforcement.description"),
   href: "/reader/practice",
   icon: FileText,
   label: t("options.reinforcement.title"),
   title: t("options.reinforcement.title"),
  },
  {
   kind: "mock",
   badge: t("options.mock.badge"),
   badgeVariant: "success",
   description: t("options.mock.description"),
   href: "/reader/mock",
   icon: Check,
   label: t("options.mock.title"),
   title: t("options.mock.title"),
  },
 ];
 const coreReaderOption = readerCollectionOptions.find((option) => option.kind === "core");
 const secondaryReaderOptions = readerCollectionOptions.filter((option) => option.kind !== "core");
 const groupedDocuments = useMemo(() => {
  const groups = new Map<string, ReaderDocumentRow[]>();
  for (const document of documents) {
   const groupId = document.unit_id ?? "other";
   const current = groups.get(groupId) ?? [];
   current.push(document);
   groups.set(groupId, current);
  }
  return [...groups.entries()]
   .sort(([left], [right]) => {
    if (left === "other") return 1;
    if (right === "other") return -1;
    return left.localeCompare(right, undefined, { numeric: true });
   })
   .map(([id, grouped]) => ({
    id,
    documents: grouped.sort(
     (left, right) =>
      (left.reading_number ?? Number.MAX_SAFE_INTEGER) -
      (right.reading_number ?? Number.MAX_SAFE_INTEGER),
    ),
   }));
 }, [documents]);
 const resource = selectedDocumentId.length > 0 ? initialResource : null;

 return (
  <div className="grid min-w-0 gap-5 sm:gap-7">
   {!showCollectionCatalog ? (
    <>
     <div className="flex min-w-0 items-start gap-3 border-b border-border-default pb-4">
      <IconTile tone="accent" size="md">
       <BookOpen aria-hidden="true" />
      </IconTile>
      <PageHeader
       title={t("header.title")}
       description={t("header.description")}
       className="min-w-0 flex-1"
      />
     </div>
     <ReaderResumePanel />
    </>
   ) : null}

   {surface === "text" ? (
    <div className="grid min-w-0 gap-3">
     <div className="grid min-w-0 gap-5">
      <div className="grid min-w-0 gap-3">
       {!showCollectionCatalog ? (
        <>
         {coreReaderOption ? (
          <Card
           variant="section"
           padding="lg"
           className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
           <div className="grid min-w-0 gap-2">
            <div className="flex flex-wrap items-center gap-2">
             <Badge variant={coreReaderOption.badgeVariant} casing="natural">
              {coreReaderOption.badge}
             </Badge>
             <Typography variant="caption" tone="muted">
              {t("primary.startPoint")}
             </Typography>
            </div>
            <div className="grid min-w-0 gap-1">
             <Typography as="h2" variant="sectionTitle" weight="black">
              {coreReaderOption.title}
             </Typography>
             <Typography as="p" variant="bodySmall" tone="secondary">
              {coreReaderOption.description}
             </Typography>
            </div>
           </div>
           <Button type="button" variant="default" asChild>
            <Link href={coreReaderOption.href} prefetch={false}>
             <BookOpen data-icon="inline-start" />
             {t("primary.openCourse")}
            </Link>
           </Button>
          </Card>
         ) : null}

         <Card variant="section" padding="md" className="grid gap-2">
          <div className="grid gap-1">
           <Typography as="h2" variant="cardTitle" weight="black">
            {t("otherCollections.title")}
           </Typography>
           <Typography as="p" variant="bodySmall" tone="muted">
            {t("otherCollections.description")}
           </Typography>
          </div>
          <div className="grid gap-1">
           {secondaryReaderOptions.map((option) => (
            <ReaderSourceRow key={option.href} option={option} />
           ))}
          </div>
         </Card>
        </>
       ) : null}

       {showCollectionCatalog ? (
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
                {group.id === "other"
                 ? t("catalog.otherDocuments")
                 : t("catalog.unit", { id: group.id })}
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
                 router.push(`${pathname}?${next.toString()}`, { scroll: false });
                }}
               >
                <Typography
                 as="span"
                 variant="bodySmall"
                 weight="bold"
                 className="w-full text-left"
                >
                 {document.title_zh}
                </Typography>
                <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
                 {document.title_vi || document.genre_vi || document.kind.toUpperCase()}
                </Typography>
                <Typography as="span" variant="caption" tone="muted" className="w-full text-left">
                 {t("catalog.metadata", {
                  paragraphs: metadataCount(document, "paragraphs") ?? 0,
                  vocabulary: metadataCount(document, "vocabulary") ?? 0,
                  exercises: metadataCount(document, "exercises") ?? 0,
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
       ) : null}
      </div>
     </div>

     {showCollectionCatalog && requestedDocumentId.length > 0 && resource === null ? (
      <Card variant="subtle" padding="lg">
       <Typography variant="bodySmall" tone="danger">
        {t("catalog.notFound")}
       </Typography>
      </Card>
     ) : null}
     {showCollectionCatalog && resource ? (
      <ReaderDocumentStudy
       key={resource.document.id}
       resource={resource}
       navigationDocuments={documents}
      />
     ) : null}
    </div>
   ) : (
    <PdfReaderWorkspace initialAssets={initialPdfAssets} />
   )}
  </div>
 );
}
