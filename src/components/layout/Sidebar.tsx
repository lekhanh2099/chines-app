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
 BookmarkCheck,
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
  name: "SRS từ",
  icon: BookmarkCheck,
  href: "/dictionary",
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

function isActive(pathname: string, searchParams: URLSearchParams, href: string) {
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
   prefetch={false}
   title={collapsed ? item.name : undefined}
   className={cn(
    "group flex h-10 items-center gap-3 rounded-lg border  font-semibold transition-colors",
    collapsed ? "w-10 justify-center px-0" : "px-3",
    active
     ? "border-primary/20 bg-accent-subtle/80 text-accent-text"
     : "border-transparent text-text-muted hover:bg-bg-subtle hover:text-text-primary",
   )}
  >
   <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent-text")} />
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
 const isHanziHome = pathname === "/hanzihome";
 const effectiveCollapsed = isHanziHome || isCollapsed;

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
     "hidden h-full shrink-0 flex-col border-r border-border-default bg-bg-card/95 transition-all duration-200 md:flex",
     effectiveCollapsed ? "w-16" : "w-64",
    )}
   >
    <div
     className={cn(
      "flex h-14 items-center border-b border-border-default",
      effectiveCollapsed ? "justify-center px-3" : "px-4",
     )}
    >
     <Link href="/" prefetch={false} className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-accent-subtle text-accent-text">
       <span className="text-2xl leading-none">汉</span>
      </div>
      {!effectiveCollapsed && (
       <span className="truncate font-black text-text-primary">HanziHome</span>
      )}
     </Link>
    </div>

    <nav
     className={cn("flex flex-col gap-1.5 py-3", effectiveCollapsed ? "items-center px-3" : "px-3")}
    >
     {mainItems.map((item) => (
      <NavRow
       key={item.name}
       item={item}
       active={isActive(pathname, searchParams, item.href)}
       collapsed={effectiveCollapsed}
      />
     ))}
    </nav>

    {secondaryItems.length > 0 && (
     <>
      <div className="border-t border-border-default" />

      <nav
       className={cn("flex flex-col gap-2 py-4", effectiveCollapsed ? "items-center px-3" : "px-4")}
      >
       {secondaryItems.map((item) => (
        <NavRow
         key={item.name}
         item={item}
         active={isActive(pathname, searchParams, item.href) && item.href !== "/"}
         collapsed={effectiveCollapsed}
        />
       ))}
      </nav>
     </>
    )}

    <div className="flex-1" />

    <div
     className={cn(
      "grid gap-2 border-t border-border-default py-3",
      effectiveCollapsed ? "px-3" : "px-4",
     )}
    >
     {!effectiveCollapsed && !isHanziHome && (
      <div className="rounded-lg border border-border-default bg-bg-subtle/70 p-3">
       <div className="flex items-center gap-2  font-bold text-text-primary">
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
       "flex h-10 items-center gap-3 rounded-lg px-3  font-semibold text-danger transition-colors hover:bg-danger-subtle",
       effectiveCollapsed ? "w-10 justify-center px-0" : "w-full",
      )}
      title={effectiveCollapsed ? "Đăng xuất" : undefined}
     >
      <LogOut className="h-5 w-5" />
      {!effectiveCollapsed && "Đăng xuất"}
     </button>

     {!isHanziHome && (
      <button
       type="button"
       onClick={toggleSidebar}
       className={cn(
        "flex h-9 items-center justify-center gap-2 rounded-lg  font-medium text-text-muted transition-colors hover:bg-bg-subtle",
        effectiveCollapsed ? "w-10" : "w-full",
       )}
      >
       {effectiveCollapsed ? (
        <ChevronRight className="h-4 w-4" />
       ) : (
        <ChevronLeft className="h-4 w-4" />
       )}
       {!effectiveCollapsed && "Thu gọn"}
      </button>
     )}
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
        prefetch={false}
        className={cn(
         "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-black transition",
         active ? "bg-accent-subtle text-accent-text" : "text-text-muted hover:bg-bg-subtle",
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
