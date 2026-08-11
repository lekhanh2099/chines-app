import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export function HanziHomeWorkspaceMessage({
 eyebrow,
 title,
 description,
 showLibraryLink = false,
 onRetry,
}: {
 eyebrow: string;
 title: string;
 description: string;
 showLibraryLink?: boolean;
 onRetry?: () => void;
}) {
 return (
  <main className="hanzihome-static-page">
   <div className="flex w-full max-w-full flex-col gap-2.5">
    <Card variant="section" padding="lg">
     <PageHeader
      eyebrow={eyebrow}
      title={title}
      description={description}
      actions={
       showLibraryLink || onRetry ? (
        <>
         {onRetry ? (
          <Button type="button" variant="outline" onClick={onRetry}>
           Thử tải lại
          </Button>
         ) : null}
         {showLibraryLink ? (
          <Button asChild>
           <Link href="/" prefetch={false}>
            Về thư viện học liệu
           </Link>
          </Button>
         ) : null}
        </>
       ) : undefined
      }
     />
    </Card>
   </div>
  </main>
 );
}
