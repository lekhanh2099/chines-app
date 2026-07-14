import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
    <Card padding="lg" className="rounded-xl">
     <div className="grid gap-2.5">
      <div>
       <p className="text-xs font-black uppercase tracking-wide text-text-muted">{eyebrow}</p>
       <h1 className="text-2xl font-black text-text-primary">{title}</h1>
       <p className=" font-semibold text-text-muted">{description}</p>
      </div>
      {showLibraryLink || onRetry ? (
       <div className="flex flex-wrap gap-2">
        {onRetry ? (
         <Button type="button" variant="surfaceCard" onClick={onRetry}>
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
       </div>
      ) : null}
     </div>
    </Card>
   </div>
  </main>
 );
}
