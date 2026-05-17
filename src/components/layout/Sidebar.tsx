"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
 BookOpen,
 Brain,
 ChevronLeft,
 ChevronRight,
 Flame,
 GraduationCap,
 Home,
 LogOut,
 NotebookPen,
 Trophy,
 WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";

type NavItem = {
 name: string;
 icon: typeof Home;
 href: string;
 badge?: string;
 tone?: "red" | "orange";
};

const mainItems: NavItem[] = [
 { name: "Trang chủ", icon: Home, href: "/" },
 { name: "Luyện tập", icon: BookOpen, href: "/vocabulary", badge: "Sớm" },
 { name: "Từ vựng", icon: WalletCards, href: "/vocabulary" },
 { name: "Ngữ pháp", icon: GraduationCap, href: "/grammar", badge: "Mới", tone: "orange" },
 { name: "Ôn tập", icon: Brain, href: "/vocabulary?filter=review", badge: "2", tone: "red" },
];

const secondaryItems: NavItem[] = [
 { name: "Bảng xếp hạng", icon: Trophy, href: "/" },
 { name: "Ghi chú của tôi", icon: NotebookPen, href: "/notes" },
 { name: "Từ vựng của tôi", icon: WalletCards, href: "/vocabulary" },
];

function isActive(pathname: string, href: string) {
 const base = href.split("?")[0];
 if (base === "/") return pathname === "/";
 return pathname.startsWith(base);
}

function NavRow({
 item,
 active,
 collapsed,
}: {
 item: NavItem;
 active: boolean;
 collapsed: boolean;
}) {
 const Icon = item.icon;

 return (
  <Link
   href={item.href}
   title={collapsed ? item.name : undefined}
   className={cn(
    "group flex h-12 items-center gap-3 rounded-2xl border-2 text-[15px] font-black transition-all",
    collapsed ? "w-12 justify-center px-0" : "px-4",
    active
     ? "border-orange-300 bg-orange-50 text-orange-700 shadow-theme-sm"
     : "border-transparent text-stone-600 hover:border-stone-200 hover:bg-stone-50 hover:text-stone-900",
   )}
  >
   <Icon className="h-5 w-5 shrink-0" />
   {!collapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
   {!collapsed && item.badge && (
    <span
     className={cn(
      "rounded-full px-2 py-0.5 text-[11px] font-black text-white",
      item.tone === "red" ? "bg-red-500" : "bg-orange-500",
     )}
    >
     {item.badge}
    </span>
   )}
  </Link>
 );
}

export function Sidebar() {
 const pathname = usePathname();
 const router = useRouter();
 const isCollapsed = useSidebarStore((s) => s.isCollapsed);
 const toggleSidebar = useSidebarStore((s) => s.toggle);
 const hydrateSidebar = useSidebarStore((s) => s.hydrate);

 useEffect(() => {
  hydrateSidebar();
 }, [hydrateSidebar]);

 const handleLogout = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
   toast.error("Đăng xuất thất bại!");
   return;
  }
  toast.success("Đã đăng xuất");
  router.push("/login");
 };

 return (
  <>
  <aside
   className={cn(
    "hidden h-full shrink-0 flex-col border-r-2 border-stone-200 bg-white transition-all duration-200 md:flex",
    isCollapsed ? "w-[84px]" : "w-[292px]",
   )}
  >
   <div className={cn("flex h-[76px] items-center border-b-2 border-stone-100", isCollapsed ? "justify-center px-3" : "px-5")}>
    <Link href="/" className="flex min-w-0 items-center gap-3">
     <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-yellow-300 bg-yellow-100 shadow-theme-sm">
      <span className="text-2xl">汉</span>
     </div>
     {!isCollapsed && (
      <div className="min-w-0">
       <p className="truncate text-2xl font-black tracking-normal text-red-500">
        HanziHome
       </p>
       <p className="truncate text-xs font-bold text-stone-500">
        Học tiếng Trung cá nhân
       </p>
      </div>
     )}
    </Link>
   </div>

   <nav className={cn("flex flex-col gap-2 py-4", isCollapsed ? "items-center px-3" : "px-4")}>
    {mainItems.map((item) => (
     <NavRow
      key={item.name}
      item={item}
      active={isActive(pathname, item.href)}
      collapsed={isCollapsed}
     />
    ))}
   </nav>

   <div className="mx-4 border-t-2 border-stone-100" />

   <nav className={cn("flex flex-col gap-2 py-4", isCollapsed ? "items-center px-3" : "px-4")}>
    {secondaryItems.map((item) => (
     <NavRow
      key={item.name}
      item={item}
      active={isActive(pathname, item.href) && item.href !== "/"}
      collapsed={isCollapsed}
     />
    ))}
   </nav>

   <div className="flex-1" />

   <div className={cn("border-t-2 border-stone-100 py-4", isCollapsed ? "px-3" : "px-4")}>
    {!isCollapsed && (
     <div className="mb-3 rounded-2xl border-2 border-red-100 bg-red-50 p-3">
      <div className="flex items-center gap-2 text-sm font-black text-red-600">
       <Flame className="h-4 w-4" />
       3 ngày streak
      </div>
      <p className="mt-1 text-xs font-bold text-stone-500">
       Giữ nhịp học mỗi ngày để mở khóa bài mới.
      </p>
     </div>
    )}

    <button
     type="button"
     onClick={handleLogout}
     className={cn(
      "mb-3 flex h-11 items-center gap-3 rounded-2xl px-4 text-[15px] font-black text-red-500 transition-colors hover:bg-red-50",
      isCollapsed ? "w-12 justify-center px-0" : "w-full",
     )}
     title={isCollapsed ? "Đăng xuất" : undefined}
    >
     <LogOut className="h-5 w-5" />
     {!isCollapsed && "Đăng xuất"}
    </button>

    <button
     type="button"
     onClick={toggleSidebar}
     className={cn(
      "flex h-10 items-center justify-center gap-2 rounded-2xl text-sm font-bold text-stone-500 transition-colors hover:bg-stone-100",
      isCollapsed ? "w-12" : "w-full",
     )}
    >
     {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
     {!isCollapsed && "Thu gọn"}
    </button>
   </div>
  </aside>
  <nav className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-stone-200 bg-white/95 px-2 py-2 shadow-[0_-3px_0_rgb(0_0_0/0.08)] backdrop-blur md:hidden">
   <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
    {mainItems.map((item) => {
     const Icon = item.icon;
     const active = isActive(pathname, item.href);
     return (
      <Link
       key={item.name}
       href={item.href}
       className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-black transition",
        active ? "bg-orange-50 text-orange-700" : "text-stone-500 hover:bg-stone-50",
       )}
      >
       <Icon className="h-5 w-5 shrink-0" />
       <span className="max-w-full truncate">{item.name.replace("Trang chủ", "Home")}</span>
      </Link>
     );
    })}
   </div>
  </nav>
  </>
 );
}
