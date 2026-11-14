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

import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";

/**
 * Home reads top-down as one hierarchy: what I am studying (most recent book,
 * then the other books in recency order) beside the PiP study tool, followed by
 * recent work (activity, notes) beside memory tips. Below `xl` the same order
 * stacks into one column, so the current-study surfaces always lead.
 */
export function HomeDashboard({ textbooks }: { textbooks: TextbookBookSummary[] }) {
 const t = useTranslations("Home");
 const dashboard = useHomeDashboard(textbooks);

 if (dashboard.isLoading) return <HomeDashboardSkeleton />;

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5 sm:gap-6">
    <PageHeader title={t("page.title")} description={t("page.description")} />

    <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,1fr)] xl:items-start">
     <ContinueLearningPanel
      books={dashboard.resumeBooks}
      unavailable={dashboard.catalogUnavailable}
     />
     {/* Wrapped so the hub keeps its own height instead of stretching to the row. */}
     <div className="min-w-0">
      <UnifiedVocabStudyHub />
     </div>
    </div>

    <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,1fr)] xl:items-start">
     <div className="grid min-w-0 gap-4 sm:gap-5">
      <RecentLearningActivityPanel
       items={dashboard.recentActivity}
       loading={dashboard.recentActivityLoading}
       unavailable={dashboard.recentActivityUnavailable}
       onRetry={dashboard.retryRecentActivity}
      />
      <RecentNotesPanel
       notes={dashboard.recentNotes}
       loading={dashboard.recentNotesLoading}
       unavailable={dashboard.recentNotesUnavailable}
       onRetry={dashboard.retryRecentNotes}
      />
     </div>

     <aside
      className="grid min-w-0 gap-4 sm:gap-5 xl:sticky xl:top-4"
      aria-label={t("page.overviewAria")}
     >
      <GlobalMemoryTipCard contentOnly showEmptyState className="w-full" />
     </aside>
    </div>
   </div>
  </PageContainer>
 );
}
