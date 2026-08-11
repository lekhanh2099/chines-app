"use client";

import { PageHeader } from "@/components/ui/page-header";
import { PageContainer } from "@/components/layout/page-container";
import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { HomeQuickActions } from "@/features/home/components/HomeQuickActions";
import { HomeResourceLinks } from "@/features/home/components/HomeResourceLinks";
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
     description="Tiếp tục bài đang học, mở khu vực cần dùng và giữ các ghi chú gần đây trong tầm mắt."
    />
    <div className="grid gap-5">
     <ContinueLearningPanel lesson={dashboard.lesson} />
     <HomeResourceLinks />
     <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
      <RecentNotesPanel notes={dashboard.recentNotes} />
      <HomeQuickActions />
     </div>
    </div>
   </div>
  </PageContainer>
 );
}
