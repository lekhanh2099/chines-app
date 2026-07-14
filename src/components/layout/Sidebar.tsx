"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
 BookOpenCheck,
 BookOpenText,
 Flame,
 FileCode2,
 Home,
 Languages,
 Layers3,
 Lightbulb,
 NotebookPen,
 NotebookTabs,
 Repeat2,
} from "lucide-react";
import { AppLogoMark } from "@/components/layout/AppLogoMark";
import { PanelToggleButton } from "@/components/layout/panel-toggle-button";
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
  icon: BookOpenCheck,
  href: "/hanzihome",
 },
 {
  name: "Sổ tay",
  icon: NotebookTabs,
  href: "/notebook",
 },
 {
  name: "SRS từ",
  icon: Repeat2,
  href: "/dictionary",
 },
 {
  name: "Tổng hợp từ",
  icon: Languages,
  href: "/vocab",
 },
 {
  name: "Tổng hợp ngữ pháp",
  icon: BookOpenText,
  href: "/grammar",
 },
 {
  name: "Nhắc nhanh",
  icon: Lightbulb,
  href: "/memory-tips",
 },
 {
  name: "Tệp HTML",
  icon: FileCode2,
  href: "/html-artifacts",
 },
 {
  name: "Bộ thủ",
  icon: Layers3,
  href: "/radicals",
 },
 { name: "Ghi chú", icon: NotebookPen, href: "/notes" },
];

const secondaryItems: NavItem[] = [];

const mobileItems = [mainItems[0], mainItems[1], mainItems[2], mainItems[3], mainItems[9]] as const;

const mobileLabels: Record<(typeof mobileItems)[number]["href"], string> = {
 "/": "Home",
 "/hanzihome": "Học",
 "/notebook": "Sổ tay",
 "/dictionary": "SRS",
 "/notes": "Ghi chú",
};

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
     ? "app-active-item"
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
 const isCollapsed = useSidebarStore((s) => s.isCollapsed);
 const toggleSidebar = useSidebarStore((s) => s.toggle);
 const hydrateSidebar = useSidebarStore((s) => s.hydrate);
 const isHanziHomeRoute = pathname === "/hanzihome";
 const effectiveCollapsed = isCollapsed;

 useEffect(() => {
  hydrateSidebar();
 }, [hydrateSidebar]);

 return (
  <aside
   className={cn(
    "nova-shell-sidebar sticky top-0 hidden h-dvh min-h-0 shrink-0 flex-col overflow-hidden border-r border-border-default transition-all duration-200 md:flex",
    effectiveCollapsed ? "w-16" : "w-64",
   )}
  >
   <div
    className={cn(
     "flex h-14 items-center border-b border-border-default",
     effectiveCollapsed ? "justify-center px-3" : "justify-between gap-2 px-4",
    )}
   >
    {!effectiveCollapsed ? (
     <Link href="/" prefetch={false} className="flex min-w-0 items-center gap-3">
      <AppLogoMark />
      <span className="truncate font-black text-text-primary">HanziHome</span>
     </Link>
    ) : null}
    <PanelToggleButton
     open={!effectiveCollapsed}
     onOpenChange={toggleSidebar}
     label="thanh điều hướng"
     size="md"
    />
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

   {!effectiveCollapsed && !isHanziHomeRoute ? (
    <div className="border-t border-border-default px-4 py-3">
     <div className="rounded-xl border border-border-default bg-bg-subtle/70 p-3">
      <div className="flex items-center gap-2  font-bold text-text-primary">
       <Flame className="h-4 w-4" />
       Học theo bài
      </div>
      <p className="text-xs font-bold text-text-muted">
       Chọn một bài HanziHome rồi học từ vựng, ngữ pháp và bộ thủ.
      </p>
     </div>
    </div>
   ) : null}
  </aside>
 );
}

export function MobileBottomNavigation() {
 const pathname = usePathname();
 const searchParams = useSearchParams();

 return (
  <nav className="nova-shell-header z-40 shrink-0 border-t border-border-default px-2 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-1.5 md:hidden">
   <div className="mx-auto grid w-full max-w-lg grid-cols-5 gap-1">
    {mobileItems.map((item) => {
     const Icon = item.icon;
     const active = isActive(pathname, searchParams, item.href);
     return (
      <Link
       key={item.name}
       href={item.href}
       prefetch={false}
       className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-black transition",
        active ? "app-active-item border" : "text-text-muted hover:bg-bg-subtle",
       )}
      >
       <Icon className="h-5 w-5 shrink-0" />
       <span className="max-w-full truncate">{mobileLabels[item.href]}</span>
      </Link>
     );
    })}
   </div>
  </nav>
 );
}
