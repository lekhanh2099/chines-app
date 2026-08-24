"use client";

import { useEffect, useMemo } from "react";
import { useSelector } from "@tanstack/react-store";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/app-header-breadcrumb";
import {
 Select,
 SelectContent,
 SelectGroup,
 SelectItem,
 SelectTrigger,
 SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import type { GrammarViewModel } from "@/features/hanzihome/types";
import { useRouter } from "@/i18n/navigation";
import { focusModeStore } from "@/stores/focus-mode-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";

const HEADER_OWNER_ID = "hsk-grammar";

function buildHskGrammarHref(level: string, pointId?: string) {
 const params = new URLSearchParams({ level });
 if (pointId) params.set("point", pointId);
 return `/hsk/grammar?${params.toString()}`;
}

export function HskGrammarHeaderContextBridge({
 selectedLevel,
 selectedPointId,
 points,
}: {
 selectedLevel: string;
 selectedPointId: string;
 points: ReadonlyArray<GrammarViewModel>;
}) {
 const router = useRouter();
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const selectedPointIndex = points.findIndex((point) => point.id === selectedPointId);
 const pointIndex = Math.max(1, selectedPointIndex + 1);
 const content = useMemo(
  () => (
   <AppHeaderBreadcrumb
    aria-label="Chuyển nhanh điểm ngữ pháp HSK"
    className="min-w-0 max-w-[min(12rem,48vw)] justify-self-start md:max-w-[min(42rem,70vw)]"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
     <AppHeaderBreadcrumbLink href="/hsk" disabled={focusModeEnabled} title="HSK">
      HSK
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="hidden lg:flex">
     <AppHeaderBreadcrumbLink
      href={buildHskGrammarHref(selectedLevel)}
      disabled={focusModeEnabled}
      title="Ngữ pháp HSK"
     >
      Ngữ pháp HSK
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden lg:flex" />
    <AppHeaderBreadcrumbItem className="hidden xl:flex">
     <AppHeaderBreadcrumbPage title={selectedLevel}>{selectedLevel}</AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden xl:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0 flex-1">
     <div className="flex min-w-0 items-center gap-2">
      <Select
       value={selectedPointId}
       disabled={focusModeEnabled}
       onValueChange={(pointId) => {
        if (focusModeEnabled) return;
        router.push(buildHskGrammarHref(selectedLevel, pointId), { scroll: false });
       }}
      >
       <SelectTrigger
        variant="breadcrumb"
        width="full"
        className="min-w-0 max-w-none"
        aria-label="Chọn điểm ngữ pháp HSK"
       >
        <SelectValue />
       </SelectTrigger>
       <SelectContent align="start" className="min-w-[min(28rem,calc(100vw-2rem))]">
        <SelectGroup>
         {points.map((point, index) => (
          <SelectItem key={point.id} value={point.id}>
           {`Mục ${index + 1}: ${point.cleanTitle}`}
          </SelectItem>
         ))}
        </SelectGroup>
       </SelectContent>
      </Select>
      <Typography as="span" variant="caption" tone="muted" weight="black" className="shrink-0">
       {pointIndex}/{points.length}
      </Typography>
     </div>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  ),
  [focusModeEnabled, pointIndex, points, router, selectedLevel, selectedPointId],
 );

 useEffect(() => {
  headerToolbarStore.actions.setOwnedContent(HEADER_OWNER_ID, content);
 }, [content]);

 useEffect(
  () => () => {
   headerToolbarStore.actions.clearOwnedContent(HEADER_OWNER_ID);
  },
  [],
 );

 return null;
}
