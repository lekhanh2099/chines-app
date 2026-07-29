"use client";

import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function QueryErrorCard({
 title,
 description,
 onRetry,
}: {
 title: string;
 description: string;
 onRetry: () => void;
}) {
 return (
  <Card role="alert" variant="subtle" padding="lg" className="grid gap-3">
   <div className="grid gap-1">
    <Typography as="h2" variant="sectionTitle" tone="default" weight="black">
     {title}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="secondary" weight="medium">
     {description}
    </Typography>
   </div>
   <Button type="button" variant="surfaceCard" className="w-fit" onClick={onRetry}>
    Thử tải lại
   </Button>
  </Card>
 );
}
