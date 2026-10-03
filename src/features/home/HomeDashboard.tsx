"use client";

import { PageContainer } from "@/components/layout/workspace/page-container";
import { PageHeader } from "@/components/ui/layout/page-header";
import { GlobalMemoryTipCard } from "@/features/hanzihome/memory-tips/GlobalMemoryTipCard";
import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { HomeLearningPulse } from "@/features/home/components/HomeLearningPulse";
import { RecentLearningActivityPanel } from "@/features/home/components/RecentLearningActivityPanel";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import { TodayFocusWidget } from "@/features/home/components/TodayFocusWidget";
import { useHomeDashboard } from "@/features/home/hooks/useHomeDashboard";
import { useTranslations } from "next-intl";

import type { TextbookBookSummary } from "@/features/hanzihome/static-json/business-chinese-static-content";

export function HomeDashboard({ textbooks }: { textbooks: TextbookBookSummary[] }) {
 const t = useTranslations("Home");
 const dashboard = useHomeDashboard(textbooks);

 if (dashboard.isLoading) return <HomeDashboardSkeleton />;

 return (
  <PageContainer>
   <div className="grid w-full min-w-0 gap-5 sm:gap-6">
    <PageHeader title={t("page.title")} description={t("page.description")} />

    <TodayFocusWidget courses={dashboard.courses} pulse={dashboard.learningPulse} />

    <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)] xl:items-start">
     <div className="grid min-w-0 gap-4 sm:gap-5">
      <ContinueLearningPanel
       courses={dashboard.courses}
       unavailable={dashboard.catalogUnavailable}
      />
      <RecentNotesPanel notes={dashboard.recentNotes} />
      <RecentLearningActivityPanel items={dashboard.recentActivity} />
     </div>

     <aside
      className="grid min-w-0 gap-4 sm:gap-5 xl:sticky xl:top-4"
      aria-label={t("page.overviewAria")}
     >
      <HomeLearningPulse pulse={dashboard.learningPulse} />
      <GlobalMemoryTipCard contentOnly showEmptyState className="w-full" />
     </aside>
    </div>
   </div>
  </PageContainer>
 );
}
