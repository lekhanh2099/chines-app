import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { PageHeader } from "@/components/ui/layout/page-header";

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
 const t = useTranslations("Shell.workspace");
 return (
  <div className="hanzihome-static-page">
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
           {t("retry")}
          </Button>
         ) : null}
         {showLibraryLink ? (
          <Button asChild>
           <Link href="/" prefetch={false}>
            {t("backToLibrary")}
           </Link>
          </Button>
         ) : null}
        </>
       ) : undefined
      }
     />
    </Card>
   </div>
  </div>
 );
}
