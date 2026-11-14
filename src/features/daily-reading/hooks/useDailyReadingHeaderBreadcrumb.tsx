"use client";

import { useEffect } from "react";

import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "@/components/layout/header/app-header-breadcrumb";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import type { findDailyReading } from "@/features/daily-reading/components/daily-reading-library-utils";

/** Publishes the Daily Reading article breadcrumb into the app header toolbar. */
export function useDailyReadingHeaderBreadcrumb(reading: ReturnType<typeof findDailyReading>) {
 useEffect(() => {
  if (reading === null) return;
  const content = (
   <AppHeaderBreadcrumb
    aria-label="Daily Reading navigation"
    className="min-w-0 max-w-[min(44rem,78vw)]"
   >
    <AppHeaderBreadcrumbItem className="hidden md:flex">
     <AppHeaderBreadcrumbLink href="/daily-reading" title="Daily Reading">
      Daily Reading
     </AppHeaderBreadcrumbLink>
    </AppHeaderBreadcrumbItem>
    <AppHeaderBreadcrumbSeparator className="hidden md:flex" />
    <AppHeaderBreadcrumbItem className="min-w-0 flex-1 truncate">
     <AppHeaderBreadcrumbPage title={reading.article.titleZh}>
      {reading.article.titleZh}
     </AppHeaderBreadcrumbPage>
    </AppHeaderBreadcrumbItem>
   </AppHeaderBreadcrumb>
  );
  headerToolbarStore.actions.setOwnedContent("daily-reading-view", content);
  return () => {
   headerToolbarStore.actions.clearOwnedContent("daily-reading-view");
  };
 }, [reading]);
}
