"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { GlobalMemoryTipCard } from "@/features/hanzihome/memory-tips/GlobalMemoryTipCard";
import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { HomeLearningPulse } from "@/features/home/components/HomeLearningPulse";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import { useHomeDashboard } from "@/features/home/hooks/useHomeDashboard";

export function HomeDashboard() {
 const dashboard = useHomeDashboard();

 if (dashboard.isLoading) return <HomeDashboardSkeleton />;

 return (
  <PageContainer>
   <div className="grid w-full gap-5">
    <PageHeader
     title="Trang học"
     description="Tiếp tục bài đang học, xem phần cần ôn và quay lại những ghi chú vừa dùng."
    />

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.65fr)] xl:items-start">
     <div className="grid min-w-0 gap-5">
      <ContinueLearningPanel lesson={dashboard.lesson} />
      <RecentNotesPanel notes={dashboard.recentNotes} />
     </div>

     <aside className="grid min-w-0 gap-5" aria-label="Tổng quan học tập">
      <HomeLearningPulse pulse={dashboard.learningPulse} />
      <GlobalMemoryTipCard contentOnly showEmptyState className="w-full" />
     </aside>
    </div>
   </div>
  </PageContainer>
 );
}
