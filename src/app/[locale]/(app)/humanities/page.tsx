import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";
import { Link } from "@/i18n/navigation";

export default async function HumanitiesPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const t = await getTranslations("Humanities.shell");
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("humanities");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;

 return (
  <div className="hanzihome-static-page min-w-0 grid gap-5 p-3 sm:p-5 lg:p-6">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="span" variant="overline" tone="accent" weight="black">
      {t("eyebrow")}
     </Typography>
     <Typography as="h1" variant="pageTitle" weight="black">
      {t("title")}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      {t("description")}
     </Typography>
    </div>
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-5" aria-label={t("navAria")}>
     <Button asChild variant="active" wrap="normal">
      <Link href="/humanities">{t("nav.program")}</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/humanities/poetry">{t("nav.poetry")}</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/humanities/history">{t("nav.history")}</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/translation">{t("nav.translation")}</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/translation?track=interpreting">{t("nav.interpreting")}</Link>
     </Button>
    </nav>
    <div className="flex flex-wrap items-center gap-2">
     <Badge casing="natural">{t("summary", { count: 45 })}</Badge>
     <Typography as="span" variant="caption" tone="muted">
      {t("summaryDetail")}
     </Typography>
    </div>
   </Card>
   <ReaderCollectionWorkspace
    kind="humanities"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
   />
  </div>
 );
}
