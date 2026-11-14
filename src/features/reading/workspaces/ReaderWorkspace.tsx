"use client";

import { useMemo } from "react";
import { BookOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { PageHeader } from "@/components/ui/layout/page-header";
import { Typography } from "@/components/ui/display/typography";
import { usePathname, useRouter } from "@/i18n/navigation";

import type { ReaderDocumentResource } from "@/features/reading/model/reading-document.schemas";
import { PdfReaderWorkspace } from "@/features/reading/pdf/PdfReaderWorkspace";
import { ReaderDocumentStudy } from "@/features/reading/workspaces/ReaderDocumentStudy";
import { type ReaderPdfAsset } from "@/features/reading/model/reading-assets.schemas";
import {
 readerKindSchema,
 type ReaderDocumentRow,
} from "@/features/reading/model/reading-resource.schemas";
import { ReaderCollectionCatalog } from "@/features/reading/workspaces/ReaderCollectionCatalog";
import {
 ReaderCoreCollectionCard,
 ReaderOtherCollectionsCard,
 ReaderResumePanel,
 useReaderCollectionOptions,
} from "@/features/reading/workspaces/ReaderWorkspaceSources";
import { groupReaderDocumentsByUnit } from "@/features/reading/workspaces/reader-workspace-utils";

type ReaderSurface = "text" | "pdf";

export function ReaderWorkspace({
 initialDocuments,
 initialResource,
 initialPdfAssets,
 initialResumeDocument,
 initialResumeHref,
 initialResumeUnavailable,
}: {
 initialDocuments: ReadonlyArray<ReaderDocumentRow>;
 initialResource: ReaderDocumentResource | null;
 initialPdfAssets: ReadonlyArray<ReaderPdfAsset>;
 initialResumeDocument: ReaderDocumentRow | null;
 initialResumeHref: string;
 initialResumeUnavailable: boolean;
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
 const readerCollectionOptions = useReaderCollectionOptions();
 const coreReaderOption = readerCollectionOptions.find((option) => option.kind === "core");
 const secondaryReaderOptions = readerCollectionOptions.filter((option) => option.kind !== "core");
 const groupedDocuments = useMemo(() => groupReaderDocumentsByUnit(documents), [documents]);
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
     <ReaderResumePanel
      document={initialResumeDocument}
      href={initialResumeHref}
      unavailable={initialResumeUnavailable}
     />
    </>
   ) : null}

   {surface === "text" ? (
    <div className="grid min-w-0 gap-3">
     {!showCollectionCatalog ? (
      <>
       {coreReaderOption ? <ReaderCoreCollectionCard option={coreReaderOption} /> : null}

       <ReaderOtherCollectionsCard options={secondaryReaderOptions} />
      </>
     ) : null}

     {showCollectionCatalog ? (
      <ReaderCollectionCatalog
       router={router}
       pathname={pathname}
       searchParams={searchParams}
       readerKind={readerKind}
       readerCollectionOptions={readerCollectionOptions}
       requestedDocumentId={requestedDocumentId}
       selectedDocumentId={selectedDocumentId}
       documents={documents}
       groupedDocuments={groupedDocuments}
      />
     ) : null}

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
