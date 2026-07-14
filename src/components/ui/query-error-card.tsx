"use client";

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
    <h2 className="text-base font-black text-text-primary">{title}</h2>
    <p className="text-sm font-medium text-text-secondary">{description}</p>
   </div>
   <Button type="button" variant="surfaceCard" className="w-fit" onClick={onRetry}>
    Thử tải lại
   </Button>
  </Card>
 );
}
