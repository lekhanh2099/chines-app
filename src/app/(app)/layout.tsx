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
  <div className="app-shell flex h-dvh w-full min-w-0 overflow-hidden bg-white text-text-primary">
   <Sidebar />
   <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
    <Header user={user} />
    <main className="page-shell relative flex-1 overflow-y-auto bg-white pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0">
     {children}
    </main>
   </div>
  </div>
 );
}
