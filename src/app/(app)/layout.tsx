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
  <div className="flex h-screen w-full bg-bg-primary text-text-primary overflow-hidden">
   <Sidebar />
   <div className="flex flex-col flex-1 w-full min-w-0">
    <Header user={user} />
    <main className="flex-1 overflow-y-auto relative">{children}</main>
   </div>
  </div>
 );
}
