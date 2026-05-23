"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
 ChevronLeft,
 ChevronRight,
 Flame,
 Home,
 Layers3,
 LogOut,
 NotebookPen,
 Sparkles,
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
 {
  name: "HanziHome",
  icon: Sparkles,
  href: "/hanzihome",
  badge: "JSON",
  tone: "orange",
 },
 {
  name: "Bộ thủ",
  icon: Layers3,
  href: "/hanzihome?module=radicals",
 },
 { name: "Ghi chú", icon: NotebookPen, href: "/notes" },
];

const secondaryItems: NavItem[] = [];

function isActive(
 pathname: string,
 searchParams: URLSearchParams,
 href: string,
) {
 const [base, rawQuery] = href.split("?");

 if (base === "/") return pathname === "/";

 if (rawQuery) {
  const targetParams = new URLSearchParams(rawQuery);

  if (pathname !== base) return false;

  return Array.from(targetParams.entries()).every(
   ([key, value]) => searchParams.get(key) === value,
  );
 }

 if (base === "/hanzihome" && searchParams.get("module") === "radicals") {
  return false;
 }

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
      "rounded-2xl -full px-2 py-0.5 text-[11px] font-black text-white",
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
 const searchParams = useSearchParams();
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
    <div
     className={cn(
      "flex h-[76px] items-center border-b-2 border-stone-100",
      isCollapsed ? "justify-center px-3" : "px-5",
     )}
    >
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

    <nav
     className={cn(
      "flex flex-col gap-2 py-4",
      isCollapsed ? "items-center px-3" : "px-4",
     )}
    >
     {mainItems.map((item) => (
      <NavRow
       key={item.name}
       item={item}
       active={isActive(pathname, searchParams, item.href)}
       collapsed={isCollapsed}
      />
     ))}
    </nav>

    {secondaryItems.length > 0 && (
     <>
      <div className="mx-4 border-t-2 border-stone-100" />

      <nav
       className={cn(
        "flex flex-col gap-2 py-4",
        isCollapsed ? "items-center px-3" : "px-4",
       )}
      >
       {secondaryItems.map((item) => (
        <NavRow
         key={item.name}
         item={item}
         active={
          isActive(pathname, searchParams, item.href) && item.href !== "/"
         }
         collapsed={isCollapsed}
        />
       ))}
      </nav>
     </>
    )}

    <div className="flex-1" />

    <div
     className={cn(
      "border-t-2 border-stone-100 py-4",
      isCollapsed ? "px-3" : "px-4",
     )}
    >
     {!isCollapsed && (
      <div className="mb-3 rounded-2xl border-2 border-red-100 bg-red-50 p-3">
       <div className="flex items-center gap-2 text-sm font-black text-red-600">
        <Flame className="h-4 w-4" />
        Học theo bài
       </div>
       <p className="mt-1 text-xs font-bold text-stone-500">
        Chọn một bài HanziHome rồi học từ vựng, ngữ pháp và bộ thủ.
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
       "flex h-10 items-center justify-center gap-2 rounded-2xltext-sm font-bold text-stone-500 transition-colors hover:bg-stone-100",
       isCollapsed ? "w-12" : "w-full",
      )}
     >
      {isCollapsed ? (
       <ChevronRight className="h-4 w-4" />
      ) : (
       <ChevronLeft className="h-4 w-4" />
      )}
      {!isCollapsed && "Thu gọn"}
     </button>
    </div>
   </aside>
   <nav className="fixed inset-x-0 bottom-0 z-40 max-w-full overflow-x-hidden scrollbar-soft  border-t-2 border-stone-200 bg-white/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-3px_0_rgb(0_0_0/0.08)] backdrop-blur md:hidden">
    <div
     className="mx-auto grid w-full max-w-md min-w-0 gap-1"
     style={{
      gridTemplateColumns: `repeat(${mainItems.length}, minmax(0, 1fr))`,
     }}
    >
     {mainItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(pathname, searchParams, item.href);
      return (
       <Link
        key={item.name}
        href={item.href}
        className={cn(
         "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xlpx-1 py-2 text-[10px] font-black transition",
         active
          ? "bg-orange-50 text-orange-700"
          : "text-stone-500 hover:bg-stone-50",
        )}
       >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="max-w-full truncate">
         {item.name.replace("Trang chủ", "Home")}
        </span>
       </Link>
      );
     })}
    </div>
   </nav>
  </>
 );
}
