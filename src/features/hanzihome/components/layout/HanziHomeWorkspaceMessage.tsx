import { StudyInstructionText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Typography } from "@/components/ui/typography";
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
       <StudyInstructionText
        variant="overline"
        tone="muted"
        weight="black"
        tracking="wide"
        transform="uppercase"
       >
        {eyebrow}
       </StudyInstructionText>
       <Typography as="h1" variant="pageTitle" tone="default" weight="black">
        {title}
       </Typography>
       <StudyInstructionText tone="muted" weight="semibold">
        {description}
       </StudyInstructionText>
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
