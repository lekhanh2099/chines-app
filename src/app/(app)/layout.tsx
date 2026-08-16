import { Header } from "@/components/layout/Header";
import { MobileBottomNavigation, Sidebar } from "@/components/layout/Sidebar";
import { HanziHomeGlobalSearchBridge } from "@/features/hanzihome/search/HanziHomeGlobalSearchBridge";
import { HanziTypographyPreferenceBridge } from "@/features/hanzihome/typography/HanziTypographyPreferenceBridge";
import { connection } from "next/server";

export default async function AppLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 await connection();

 return (
  <div className="app-shell flex h-dvh w-full min-w-0 flex-col overflow-hidden bg-background text-foreground">
   <HanziTypographyPreferenceBridge />
   <Header />
   <HanziHomeGlobalSearchBridge />
   <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
    <Sidebar />
    <main className="page-shell nova-page relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain scrollbar-soft">
     {children}
    </main>
   </div>
   <MobileBottomNavigation />
  </div>
 );
}
