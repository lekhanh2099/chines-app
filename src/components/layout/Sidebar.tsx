"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
 ChevronLeft,
 ChevronRight,
 Flame,
 Home,
 BookOpen,
 GraduationCap,
 Layers3,
 Lightbulb,
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
};

const mainItems: NavItem[] = [
 { name: "Trang chủ", icon: Home, href: "/" },
 {
  name: "HanziHome",
  icon: Sparkles,
  href: "/hanzihome",
 },
 {
  name: "Bộ mặc định",
  icon: BookOpen,
  href: "/hanzihome/seed",
 },
 {
  name: "Tổng hợp từ",
  icon: BookOpen,
  href: "/hanzihome/vocab",
 },
 {
  name: "Tổng hợp ngữ pháp",
  icon: GraduationCap,
  href: "/hanzihome/grammar",
 },
 {
  name: "Nhắc nhanh",
  icon: Lightbulb,
  href: "/hanzihome/memory-tips",
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

 if (base === "/hanzihome") {
  return pathname === "/hanzihome" && searchParams.get("module") !== "radicals";
 }

 return pathname === base || pathname.startsWith(`${base}/`);
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
    "group flex h-12 items-center gap-3 rounded-xl border-2 text-[15px] font-black transition-all",
    collapsed ? "w-12 justify-center px-0" : "px-4",
    active
     ? "border-primary/30 bg-accent-subtle text-accent-text shadow-theme-sm"
     : "border-transparent text-text-muted hover:border-border-hover hover:bg-bg-subtle hover:text-text-primary",
   )}
  >
   <Icon className="h-5 w-5 shrink-0" />
   {!collapsed && <span className="min-w-0 flex-1 truncate">{item.name}</span>}
   {!collapsed && item.badge && (
    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground">
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
     "hidden h-full shrink-0 flex-col border-r border-border-default bg-bg-card shadow-theme-sm transition-all duration-200 md:flex",
     isCollapsed ? "w-21" : "w-73",
    )}
   >
    <div
     className={cn(
      "flex h-19 items-center border-b border-border-default",
      isCollapsed ? "justify-center px-3" : "px-5",
     )}
    >
     <Link href="/" className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-primary/30 bg-accent-subtle text-accent-text shadow-theme-sm">
       <span className="text-2xl">汉</span>
      </div>
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
      <div className="border-t border-border-default" />

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
      "grid gap-3 border-t border-border-default py-4",
      isCollapsed ? "px-3" : "px-4",
     )}
    >
     {!isCollapsed && (
      <div className="rounded-xl border border-danger/20 bg-danger-subtle p-3 shadow-theme-sm">
       <div className="flex items-center gap-2 text-sm font-black text-danger-text">
        <Flame className="h-4 w-4" />
        Học theo bài
       </div>
       <p className="text-xs font-bold text-text-muted">
        Chọn một bài HanziHome rồi học từ vựng, ngữ pháp và bộ thủ.
       </p>
      </div>
     )}

     <button
      type="button"
      onClick={handleLogout}
      className={cn(
       "flex h-11 items-center gap-3 rounded-xl px-4 text-[15px] font-black text-danger transition-colors hover:bg-danger-subtle",
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
       "flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold text-text-muted transition-colors hover:bg-bg-subtle",
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
   <nav className="fixed inset-x-0 bottom-0 z-40 grid max-w-full place-items-center overflow-x-hidden scrollbar-soft border-t border-border-default bg-bg-card/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-theme-sm backdrop-blur md:hidden">
    <div
     className="grid w-full max-w-md min-w-0 gap-1"
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
         "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-black transition",
         active
          ? "bg-accent-subtle text-accent-text"
          : "text-text-muted hover:bg-bg-subtle",
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
