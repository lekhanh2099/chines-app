import { AppScrollViewport } from "@/components/layout/AppScrollViewport";
import { Header } from "@/components/layout/Header";
import { MobileBottomNavigation, Sidebar } from "@/components/layout/Sidebar";
import { DailyReadingSchedulerAgent } from "@/features/hanzihome/reader/daily-reading/DailyReadingSchedulerAgent";
import { HanziHomeGlobalSearchBridge } from "@/features/hanzihome/search/HanziHomeGlobalSearchBridge";
import { HanziTypographyPreferenceBridge } from "@/features/hanzihome/typography/HanziTypographyPreferenceBridge";
import { LearningStateSyncAgent } from "@/features/hanzihome/hooks/useLearningState";
import { connection } from "next/server";

export default async function AppLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 await connection();

 return (
  <div className="app-shell flex h-dvh w-full min-w-0 items-stretch overflow-hidden bg-background text-foreground">
   <LearningStateSyncAgent />
   <HanziTypographyPreferenceBridge />
   <DailyReadingSchedulerAgent />
   <Sidebar />
   <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <Header />
    <HanziHomeGlobalSearchBridge />
    <AppScrollViewport className="page-shell nova-page scrollbar-soft">
     {children}
    </AppScrollViewport>
    <MobileBottomNavigation />
   </div>
  </div>
 );
}
