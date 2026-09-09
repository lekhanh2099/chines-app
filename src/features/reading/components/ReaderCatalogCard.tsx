"use client";
import type { ComponentProps } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { HanziText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link } from "@/i18n/navigation";
import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";
function firstHanzi(title: string) {
 const match = /\p{Script=Han}/u.exec(title);
 return match?.[0] ?? "读";
}

export function ReaderCatalogCard({
 document,
 href,
 label,
 metadata,
 badgeVariant = "success",
 metadataBadgeVariant = "info",
}: {
 document: ReaderDocumentRow;
 href: string;
 label: string;
 metadata: ReadonlyArray<string>;
 badgeVariant?: ComponentProps<typeof Badge>["variant"];
 metadataBadgeVariant?: ComponentProps<typeof Badge>["variant"];
}) {
 return (
  <Card variant="interactive" padding="md" className="min-h-56 overflow-hidden">
   <Link
    href={href}
    prefetch={false}
    className="group relative grid min-h-48 content-between gap-3"
   >
    <span
     aria-hidden="true"
     className="pointer-events-none absolute -right-1 -bottom-7 font-hanzi text-[7rem] font-normal leading-none text-text-muted/10"
    >
     {firstHanzi(document.title_zh)}
    </span>
    <div className="relative flex items-start gap-3">
     <Badge variant={badgeVariant} size="sm" casing="natural">
      {label}
     </Badge>
    </div>
    <div className="relative grid min-w-0 gap-1">
     <HanziText as="h3" size="card" className="min-w-0" clamp="two">
      {document.title_zh}
     </HanziText>
     <Typography as="p" variant="bodySmall" tone="secondary" clamp="two">
      {document.title_vi || document.genre_vi || document.slug}
     </Typography>
    </div>
    <div className="relative flex flex-wrap gap-1.5">
     {metadata.map((item) => (
      <Badge key={item} variant={metadataBadgeVariant} size="sm" casing="natural">
       {item}
      </Badge>
     ))}
    </div>
    <div className="relative flex items-center">
     <ChevronRight
      className="text-primary transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
     />
    </div>
   </Link>
  </Card>
 );
}
