"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlobalMemoryTipCard } from "@/features/hanzihome/memory-tips/GlobalMemoryTipCard";
import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { HomeLearningPulse } from "@/features/home/components/HomeLearningPulse";
import { RecentLearningActivityPanel } from "@/features/home/components/RecentLearningActivityPanel";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import { useHomeDashboard } from "@/features/home/hooks/useHomeDashboard";

export function HomeDashboard() {
 const dashboard = useHomeDashboard();

 if (dashboard.isLoading) return <HomeDashboardSkeleton />;

 return (
  <PageContainer>
   <div className="mx-auto grid w-full max-w-[90rem] gap-4 sm:gap-5">
    <PageHeader
     title="Trang học"
     description="Tiếp tục bài đang học, xem phần cần ôn và quay lại những nội dung vừa dùng."
    />

    <div className="grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.75fr)] xl:items-start">
     <div className="grid min-w-0 gap-4 sm:gap-5">
      <ContinueLearningPanel lesson={dashboard.lesson} />
      <RecentNotesPanel notes={dashboard.recentNotes} />
      <RecentLearningActivityPanel items={dashboard.recentActivity} />
     </div>

     <aside
      className="grid min-w-0 gap-4 sm:gap-5 xl:sticky xl:top-4"
      aria-label="Tổng quan học tập"
     >
      <HomeLearningPulse pulse={dashboard.learningPulse} />
      <GlobalMemoryTipCard contentOnly showEmptyState className="w-full" />
     </aside>
    </div>
   </div>
  </PageContainer>
 );
}
