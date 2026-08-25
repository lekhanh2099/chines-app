import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
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
   <ReaderCollectionWorkspace
    kind="humanities"
    initialDocuments={initialDocuments}
    initialResource={initialResource}
   />
  </div>
 );
}
