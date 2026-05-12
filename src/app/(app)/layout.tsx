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
  <div className="flex h-screen w-full overflow-hidden bg-white text-text-primary">
   <Sidebar />
   <div className="flex flex-col flex-1 w-full min-w-0">
    <Header user={user} />
    <main className="relative flex-1 overflow-y-auto bg-white">{children}</main>
   </div>
  </div>
 );
}
