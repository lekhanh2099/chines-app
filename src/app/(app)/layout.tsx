import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 const supabase = await createClient();
 const { data, error } = await supabase.auth.getUser();

 if (error || !data?.user) {
  redirect("/login");
 }

 const user = data.user;

 return (
  <div className="app-shell flex h-dvh w-full min-w-0 overflow-hidden bg-background text-foreground">
   <Sidebar />
   <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden scrollbar-soft">
    <Header user={user} />
    <main className="page-shell nova-page relative min-h-0 flex-1 overflow-y-auto pb-[calc(88px+env(safe-area-inset-bottom))] scrollbar-soft md:pb-0">
     {children}
    </main>
   </div>
  </div>
 );
}
