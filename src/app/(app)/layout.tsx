import { Header } from "@/components/layout/Header";
import { MobileBottomNavigation, Sidebar } from "@/components/layout/Sidebar";
import { HanziHomeGlobalSearchBridge } from "@/features/hanzihome/search/HanziHomeGlobalSearchBridge";
import { HanziTypographyPreferenceBridge } from "@/features/hanzihome/typography/HanziTypographyPreferenceBridge";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 const supabase = await createClient();
 const { data, error } = await supabase.auth.getUser();
 const user = error ? undefined : (data.user ?? undefined);

 return (
  <div className="app-shell flex h-dvh w-full min-w-0 items-stretch overflow-hidden bg-background text-foreground">
   <HanziTypographyPreferenceBridge />
   <Sidebar />
   <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <Header user={user} />
    <HanziHomeGlobalSearchBridge />
    <main className="page-shell nova-page relative min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-soft">
     {children}
    </main>
    <MobileBottomNavigation />
   </div>
  </div>
 );
}
