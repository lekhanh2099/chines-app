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
  <div className="app-shell flex min-h-dvh w-full min-w-0 items-start bg-background text-foreground">
   <Sidebar />
   <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
    <Header user={user} />
    <main className="page-shell nova-page relative flex-1 pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
     {children}
    </main>
   </div>
  </div>
 );
}
