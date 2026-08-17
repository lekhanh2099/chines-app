import { ReaderCollectionWorkspace } from "@/features/hanzihome/reader/ReaderCollectionWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import Link from "next/link";
import {
 getReaderDocument,
 listReaderDocuments,
} from "@/features/hanzihome/reader/reader-content-repository";

export default async function HumanitiesPage({
 searchParams,
}: {
 searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
 const params = await searchParams;
 const documentId = typeof params.document === "string" ? params.document : "";
 const initialDocuments = await listReaderDocuments("humanities");
 const initialResource = documentId.length > 0 ? await getReaderDocument(documentId) : null;

 return (
  <div className="hanzihome-static-page min-w-0 grid gap-5 p-3 sm:p-5 lg:p-6">
   <Card variant="section" padding="md" className="grid gap-3">
    <div className="grid gap-1">
     <Typography as="span" variant="overline" tone="accent" weight="black">
      Humanities · chương trình
     </Typography>
     <Typography as="h1" variant="pageTitle" weight="black">
      Văn sử &amp; Dịch thuật
     </Typography>
     <Typography as="p" variant="bodySmall" tone="muted">
      Chọn track để đọc sâu, luyện lập luận hoặc chuyển ngữ trong cùng một workspace HanziHome.
     </Typography>
    </div>
    <nav
     className="grid grid-cols-2 gap-2 sm:grid-cols-5"
     aria-label="Điều hướng Văn sử & Dịch thuật"
    >
     <Button asChild variant="active" wrap="normal">
      <Link href="/humanities">Chương trình</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/humanities/poetry">Thơ văn</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/humanities/history">Lịch sử–tư tưởng</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/translation">Biên dịch</Link>
     </Button>
     <Button asChild variant="navigation" wrap="normal">
      <Link href="/translation?track=interpreting">Phiên dịch</Link>
     </Button>
    </nav>
    <div className="flex flex-wrap items-center gap-2">
     <Badge casing="natural">45 bài Humanities</Badge>
     <Typography as="span" variant="caption" tone="muted">
      10 thơ · 5 lịch sử · 20 biên dịch · 10 phiên dịch
     </Typography>
    </div>
   </Card>
   <ReaderCollectionWorkspace
    kind="humanities"
    title="Humanities"
    description="Literature, history, translation và interpreting trong Reader HanziHome."
    initialDocuments={initialDocuments}
    initialResource={initialResource}
   />
  </div>
 );
}
