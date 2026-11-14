"use client";

import type { ComponentProps } from "react";
import { BookOpen, Check, ChevronRight, FileText, Play, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { IconTile } from "@/components/ui/display/icon-tile";
import { Typography } from "@/components/ui/display/typography";
import { HanziAwareText } from "@/features/hanzihome/components/lesson-overview/hanzi-typography";
import { Link } from "@/i18n/navigation";

import type { ReaderDocumentRow } from "@/features/reading/model/reading-resource.schemas";

export type ReaderCollectionOption = {
 kind: ReaderDocumentRow["kind"];
 badge: string;
 badgeVariant: ComponentProps<typeof Badge>["variant"];
 description: string;
 href: string;
 icon: LucideIcon;
 label: string;
 title: string;
};

function ReaderSourceRow({ option }: { option: ReaderCollectionOption }) {
 const Icon = option.icon;

 return (
  <Button
   variant="navigation"
   size="touch"
   align="start"
   wrap="normal"
   layout="grid"
   asChild
   className="w-full"
  >
   <Link
    href={option.href}
    prefetch={false}
    className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
   >
    <IconTile tone="neutral" size="sm">
     <Icon aria-hidden="true" />
    </IconTile>
    <span className="grid min-w-0 gap-0.5">
     <Typography as="span" variant="bodySmall" weight="bold">
      {option.title}
     </Typography>
     <Typography as="span" variant="caption" tone="muted" clamp="two">
      {option.description}
     </Typography>
    </span>
    <span className="col-start-2 flex min-w-0 items-center gap-2 sm:col-start-auto">
     <Badge variant={option.badgeVariant} size="sm" casing="natural">
      {option.badge}
     </Badge>
     <ChevronRight aria-hidden="true" />
    </span>
   </Link>
  </Button>
 );
}

export function ReaderResumePanel({
 document,
 href,
 unavailable,
}: {
 document: ReaderDocumentRow | null;
 href: string;
 unavailable: boolean;
}) {
 const t = useTranslations("Reader.home.resume");

 if (unavailable) {
  return (
   <Card variant="subtle" padding="md" role="alert">
    <Typography variant="bodySmall" tone="warning">
     {t("error")}
    </Typography>
   </Card>
  );
 }
 if (document === null || href.length === 0) return null;

 return (
  <Card
   variant="subtle"
   padding="lg"
   className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
  >
   <div className="grid min-w-0 gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant="warning" casing="natural">
      {t("badge")}
     </Badge>
    </div>
    <div className="grid min-w-0 gap-1">
     <HanziAwareText as="h2" text={document.title_zh} variant="sectionTitle" weight="black" />
     <Typography as="p" variant="bodySmall" tone="secondary" clamp="one">
      {[document.title_vi, t("readingKind")].filter(Boolean).join(" · ")}
     </Typography>
    </div>
   </div>
   <Button type="button" variant="default" asChild>
    <Link href={href} prefetch={false}>
     <Play data-icon="inline-start" />
     {t("continue")}
    </Link>
   </Button>
  </Card>
 );
}

/** The Reader home collection entries, in display order. */
export function useReaderCollectionOptions(): ReadonlyArray<ReaderCollectionOption> {
 const t = useTranslations("Reader.home");
 return [
  {
   kind: "daily",
   badge: t("options.daily.badge"),
   badgeVariant: "warning",
   description: t("options.daily.description"),
   href: "/daily-reading",
   icon: FileText,
   label: t("options.daily.title"),
   title: t("options.daily.title"),
  },
  {
   kind: "core",
   badge: t("options.core.badge"),
   badgeVariant: "success",
   description: t("options.core.description"),
   href: "/reader/course",
   icon: BookOpen,
   label: t("options.core.title"),
   title: t("options.core.title"),
  },
  {
   kind: "hsk",
   badge: t("options.hsk.badge"),
   badgeVariant: "success",
   description: t("options.hsk.description"),
   href: "/hsk",
   icon: BookOpen,
   label: t("options.hsk.title"),
   title: t("options.hsk.title"),
  },
  {
   kind: "reinforcement",
   badge: t("options.reinforcement.badge"),
   badgeVariant: "warning",
   description: t("options.reinforcement.description"),
   href: "/reader/practice",
   icon: FileText,
   label: t("options.reinforcement.title"),
   title: t("options.reinforcement.title"),
  },
  {
   kind: "mock",
   badge: t("options.mock.badge"),
   badgeVariant: "success",
   description: t("options.mock.description"),
   href: "/reader/mock",
   icon: Check,
   label: t("options.mock.title"),
   title: t("options.mock.title"),
  },
 ];
}

/** Primary course entry on the Reader home. */
export function ReaderCoreCollectionCard({ option }: { option: ReaderCollectionOption }) {
 const t = useTranslations("Reader.home");

 return (
  <Card
   variant="section"
   padding="lg"
   className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
  >
   <div className="grid min-w-0 gap-2">
    <div className="flex flex-wrap items-center gap-2">
     <Badge variant={option.badgeVariant} casing="natural">
      {option.badge}
     </Badge>
     <Typography variant="caption" tone="muted">
      {t("primary.startPoint")}
     </Typography>
    </div>
    <div className="grid min-w-0 gap-1">
     <Typography as="h2" variant="sectionTitle" weight="black">
      {option.title}
     </Typography>
     <Typography as="p" variant="bodySmall" tone="secondary">
      {option.description}
     </Typography>
    </div>
   </div>
   <Button type="button" variant="default" asChild>
    <Link href={option.href} prefetch={false}>
     <BookOpen data-icon="inline-start" />
     {t("primary.openCourse")}
    </Link>
   </Button>
  </Card>
 );
}

/** Secondary Reader collections listed below the course entry. */
export function ReaderOtherCollectionsCard({
 options,
}: {
 options: ReadonlyArray<ReaderCollectionOption>;
}) {
 const t = useTranslations("Reader.home");

 return (
  <Card variant="section" padding="md" className="grid gap-2">
   <div className="grid gap-1">
    <Typography as="h2" variant="cardTitle" weight="black">
     {t("otherCollections.title")}
    </Typography>
    <Typography as="p" variant="bodySmall" tone="muted">
     {t("otherCollections.description")}
    </Typography>
   </div>
   <div className="grid gap-1">
    {options.map((option) => (
     <ReaderSourceRow key={option.href} option={option} />
    ))}
   </div>
  </Card>
 );
}
