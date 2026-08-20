import { AppScrollViewport } from "@/components/layout/AppScrollViewport";
import { Header } from "@/components/layout/Header";
import { MobileBottomNavigation, Sidebar } from "@/components/layout/Sidebar";
import { DailyReadingSchedulerAgent } from "@/features/hanzihome/reader/daily-reading/DailyReadingSchedulerAgent";
import { HanziHomeGlobalSearchBridge } from "@/features/hanzihome/search/HanziHomeGlobalSearchBridge";
import { HanziTypographyPreferenceBridge } from "@/features/hanzihome/typography/HanziTypographyPreferenceBridge";
import { LearningStateSyncAgent } from "@/features/hanzihome/hooks/useLearningState";
import { hasHanziHomeContentCapability } from "@/features/hanzihome/server/content-capability";
import { requireAuthenticatedRoute } from "@/lib/api/authenticated-route";
import { connection } from "next/server";

export default async function AppLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 await connection();
 const auth = await requireAuthenticatedRoute();
 const canManageContent =
  auth.authenticated &&
  (await hasHanziHomeContentCapability(auth.context.supabase, auth.context.user.id));

 return (
  <div className="app-shell flex h-dvh w-full min-w-0 items-stretch overflow-hidden bg-background text-foreground">
   <LearningStateSyncAgent />
   <HanziTypographyPreferenceBridge />
   <DailyReadingSchedulerAgent />
   <Sidebar canManageContent={canManageContent} />
   <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <Header />
    <HanziHomeGlobalSearchBridge />
    <AppScrollViewport className="page-shell nova-page scrollbar-soft">
     {children}
    </AppScrollViewport>
    <MobileBottomNavigation canManageContent={canManageContent} />
   </div>
  </div>
 );
}
