"use client";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { PageHeader } from "@/components/ui/layout/page-header";
import { UnifiedVocabStudyHub } from "@/features/hanzihome/components/review/UnifiedVocabStudyHub";
import { GlobalMemoryTipCard } from "@/features/hanzihome/memory-tips/GlobalMemoryTipCard";
import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { RecentLearningActivityPanel } from "@/features/home/components/RecentLearningActivityPanel";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import { useHomeDashboard } from "@/features/home/hooks/useHomeDashboard";
import { useTranslations } from "next-intl";

import type { TextbookBookSummary } from "@/features/hanzihome/static-json/textbook-catalog";

/**
 * Home reads top-down as one hierarchy: what I am studying (most recent book,
 * then the other books in recency order) and recent work on the left; the PiP
 * study tool and memory tips on the right. Below `xl` everything stacks with the
 * current-study surfaces first.
 */
export function HomeDashboard({ textbooks }: { textbooks: TextbookBookSummary[] }) {
 const t = useTranslations("Home");
 const dashboard = useHomeDashboard(textbooks);

 if (dashboard.isLoading) return <HomeDashboardSkeleton />;

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-4">
    <PageHeader title={t("page.title")} description={t("page.description")} />

    {/*
      xl: two independent columns, so a long "Học tiếp" list never leaves a gap beside the
      study tools; the right column stays in view while scrolling. Below xl the same items
      stack as Học tiếp → PiP hub → activity → notes → tips (the side column dissolves into
      the flow via `contents`, and `order` keeps the hierarchy).
    */}
    <div className="flex min-w-0 flex-col gap-3 sm:gap-4 xl:grid xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,1fr)] xl:items-start">
     <div className="order-1 min-w-0 xl:col-start-1 xl:row-start-1">
      <ContinueLearningPanel
       books={dashboard.resumeBooks}
       unavailable={dashboard.catalogUnavailable}
      />
     </div>
     <div
      className="contents xl:sticky xl:top-4 xl:col-start-2 xl:row-span-3 xl:row-start-1 xl:flex xl:min-w-0 xl:flex-col xl:gap-4"
      aria-label={t("page.overviewAria")}
      role="complementary"
     >
      <div className="order-2 min-w-0">
       <UnifiedVocabStudyHub />
      </div>
      <div className="order-5 min-w-0">
       <GlobalMemoryTipCard contentOnly showEmptyState className="w-full" />
      </div>
     </div>
     <div className="order-3 min-w-0 xl:col-start-1 xl:row-start-2">
      <RecentLearningActivityPanel
       items={dashboard.recentActivity}
       loading={dashboard.recentActivityLoading}
       unavailable={dashboard.recentActivityUnavailable}
       onRetry={dashboard.retryRecentActivity}
      />
     </div>
     <div className="order-4 min-w-0 xl:col-start-1 xl:row-start-3">
      <RecentNotesPanel
       notes={dashboard.recentNotes}
       loading={dashboard.recentNotesLoading}
       unavailable={dashboard.recentNotesUnavailable}
       onRetry={dashboard.retryRecentNotes}
      />
     </div>
    </div>
   </div>
  </PageContainer>
 );
}
