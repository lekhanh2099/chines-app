"use client";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { ContinueLearningPanel } from "@/features/home/components/ContinueLearningPanel";
import { HomeDashboardSkeleton } from "@/features/home/components/HomeDashboardSkeleton";
import { RecentNotesPanel } from "@/features/home/components/RecentNotesPanel";
import { useHomeDashboard } from "@/features/home/hooks/useHomeDashboard";

export function HomeDashboard() {
 const dashboard = useHomeDashboard();

 if (dashboard.isLoading) return <HomeDashboardSkeleton />;

 return (
  <PageContainer>
   <div className="grid w-full gap-6">
    <PageHeader
     title="Trang học"
     description="Quay lại đúng nội dung đang học và tiếp tục những ghi chú gần đây. Điều hướng toàn bộ khu vực học nằm ở thanh bên."
    />
    <div className="grid gap-6">
     <ContinueLearningPanel lesson={dashboard.lesson} />
     <RecentNotesPanel notes={dashboard.recentNotes} />
    </div>
   </div>
  </PageContainer>
 );
}
