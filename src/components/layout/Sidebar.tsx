"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSelector } from "@tanstack/react-store";
import {
 BookOpenCheck,
 BookOpenText,
 ChevronRight,
 FileCode2,
 Home,
 Languages,
 Layers3,
 Lightbulb,
 Menu,
 NotebookPen,
 NotebookTabs,
 PlugZap,
 Repeat2,
 Settings,
} from "lucide-react";
import { AppLogoMark } from "@/components/layout/AppLogoMark";
import { PanelToggleButton } from "@/components/layout/panel-toggle-button";
import { sidebarStore } from "@/stores/sidebar-store";
import { appShellStore } from "@/stores/app-shell-store";
import { cn } from "@/lib/utils";

type NavItem = {
 name: string;
 icon: typeof Home;
 href: string;
 badge?: string;
};

type NavigationGroup = {
 id: string;
 name: string;
 icon: typeof Home;
 items: NavItem[];
};

const learningItems: NavItem[] = [
 { name: "Trang chủ", icon: Home, href: "/" },
 { name: "HanziHome", icon: BookOpenCheck, href: "/hanzihome" },
 { name: "Sổ tay", icon: NotebookTabs, href: "/notebook" },
];

const practiceItems: NavItem[] = [
 { name: "SRS từ", icon: Repeat2, href: "/dictionary" },
 { name: "Nhắc nhanh", icon: Lightbulb, href: "/memory-tips" },
];

const competencyItems: NavItem[] = [
 { name: "Tổng hợp từ", icon: Languages, href: "/vocab" },
 { name: "Tổng hợp ngữ pháp", icon: BookOpenText, href: "/grammar" },
 { name: "Bộ thủ", icon: Layers3, href: "/radicals" },
];

const personalItems: NavItem[] = [
 { name: "Ghi chú", icon: NotebookPen, href: "/notes" },
 { name: "Tệp HTML", icon: FileCode2, href: "/html-artifacts" },
 { name: "API & tích hợp", icon: PlugZap, href: "/api-docs" },
];

const navigationGroups: NavigationGroup[] = [
 { id: "learning", name: "Học", icon: BookOpenCheck, items: learningItems },
 { id: "practice", name: "Luyện", icon: Repeat2, items: practiceItems },
 { id: "competency", name: "Năng lực", icon: Languages, items: competencyItems },
 { id: "personal", name: "Cá nhân", icon: NotebookPen, items: personalItems },
];

const mobileItems = [learningItems[0], learningItems[1], practiceItems[0], personalItems[0]];
const mobileUtilityItems: NavItem[] = [
 { name: "Cài đặt", icon: Settings, href: "/settings?section=app" },
];

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
 onNavigate,
}: {
 item: NavItem;
 active: boolean;
 collapsed: boolean;
 onNavigate?: () => void;
}) {
 const Icon = item.icon;

 return (
  <Button
   variant={active ? "active" : "navigation"}
   size="menu"
   align={collapsed ? "center" : "start"}
   asChild
   aria-current={active ? "page" : undefined}
   aria-label={collapsed ? item.name : undefined}
   title={collapsed ? item.name : undefined}
   className={collapsed ? "w-10" : "w-full"}
  >
   <Link href={item.href} prefetch={false} onClick={onNavigate}>
    <Icon data-icon="inline-start" />
    {!collapsed ? (
     <Typography as="span" clamp="one" className="min-w-0 flex-1">
      {item.name}
     </Typography>
    ) : null}
    {!collapsed && item.badge ? (
     <Badge variant="accent" size="sm" className="ml-auto">
      {item.badge}
     </Badge>
    ) : null}
   </Link>
  </Button>
 );
}

export function Sidebar() {
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const isCollapsed = useSelector(sidebarStore, (state) => state.isCollapsed);
 const { toggle: toggleSidebar, hydrate: hydrateSidebar } = sidebarStore.actions;
 const activeGroupId = navigationGroups.find((group) =>
  group.items.some((item) => isActive(pathname, searchParams, item.href)),
 )?.id;
 const [manuallyExpandedGroupIds, setManuallyExpandedGroupIds] = useState<string[]>([]);

 useEffect(() => {
  hydrateSidebar();
 }, [hydrateSidebar]);

 if (isContentFullscreen) return null;

 return (
  <aside
   className={cn(
    "nova-shell-sidebar sticky top-0 hidden h-dvh min-h-0 shrink-0 flex-col overflow-hidden border-r border-border-default transition-all duration-200 lg:flex",
    isCollapsed ? "w-16" : "w-64",
   )}
  >
   <div
    className={cn(
     "flex h-14 items-center border-b border-border-default",
     isCollapsed ? "justify-center px-3" : "justify-between gap-2 px-4",
    )}
   >
    {!isCollapsed ? (
     <Link href="/" prefetch={false} className="flex min-w-0 items-center gap-3">
      <AppLogoMark />
      <Typography tone="default" weight="black" clamp="one">
       HanziHome
      </Typography>
     </Link>
    ) : null}
    <PanelToggleButton
     open={!isCollapsed}
     onOpenChange={toggleSidebar}
     label="thanh điều hướng"
     size="md"
    />
   </div>

   <nav
    aria-label="Điều hướng chính"
    className={cn(
     "min-h-0 flex-1 overflow-y-auto py-3 scrollbar-soft",
     isCollapsed ? "grid content-start gap-2 px-3" : "px-3",
    )}
   >
    {isCollapsed ? (
     navigationGroups.map((group, index) => (
      <div
       key={group.name}
       className={cn("grid gap-1", index > 0 && "border-t border-border-default pt-2")}
      >
       {group.items.map((item) => (
        <NavRow
         key={item.name}
         item={item}
         active={isActive(pathname, searchParams, item.href)}
         collapsed
        />
       ))}
      </div>
     ))
    ) : (
     <div className="grid content-start gap-1.5">
      {navigationGroups.map((group) => {
       const groupOpen = group.id === activeGroupId || manuallyExpandedGroupIds.includes(group.id);
       const GroupIcon = group.icon;

       return (
        <section key={group.name} className="grid gap-1" aria-label={group.name}>
         <Button
          type="button"
          variant="navigation"
          size="menu"
          align="between"
          className="w-full"
          aria-expanded={groupOpen}
          aria-controls={`sidebar-group-${group.id}`}
          onClick={() => {
           if (group.id === activeGroupId) return;

           setManuallyExpandedGroupIds((current) =>
            current.includes(group.id)
             ? current.filter((groupId) => groupId !== group.id)
             : [...current, group.id],
           );
          }}
         >
          <span className="flex min-w-0 items-center gap-3">
           <GroupIcon data-icon="inline-start" />
           <Typography as="span" clamp="one" className="min-w-0 flex-1">
            {group.name}
           </Typography>
          </span>
          <ChevronRight className={cn("shrink-0 transition-transform", groupOpen && "rotate-90")} />
         </Button>

         <div id={`sidebar-group-${group.id}`} hidden={!groupOpen} className="grid gap-1 pb-1 pl-2">
          {group.items.map((item) => (
           <NavRow
            key={item.name}
            item={item}
            active={isActive(pathname, searchParams, item.href)}
            collapsed={false}
           />
          ))}
         </div>
        </section>
       );
      })}
     </div>
    )}
   </nav>
  </aside>
 );
}

export function MobileBottomNavigation() {
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [moreOpen, setMoreOpen] = useState(false);
 const primaryRouteActive = mobileItems.some((item) => isActive(pathname, searchParams, item.href));
 const moreActive = !primaryRouteActive;

 if (isContentFullscreen) return null;

 return (
  <>
   <nav
    aria-label="Điều hướng nhanh"
    className="nova-shell-header z-40 shrink-0 border-t border-border-default px-2 pb-[calc(0.25rem+env(safe-area-inset-bottom))] pt-1 lg:hidden"
   >
    <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-0.5">
     {mobileItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(pathname, searchParams, item.href);

      return (
       <Button
        key={item.name}
        variant={active ? "active" : "navigation"}
        size="icon"
        asChild
        aria-current={active ? "page" : undefined}
        aria-label={item.name}
        title={item.name}
        className="justify-self-center"
       >
        <Link href={item.href} prefetch={false}>
         <Icon />
        </Link>
       </Button>
      );
     })}

     <Button
      type="button"
      variant={moreActive ? "active" : "navigation"}
      size="icon"
      aria-expanded={moreOpen}
      aria-haspopup="dialog"
      aria-label="Mở toàn bộ điều hướng"
      title="Thêm"
      className="justify-self-center"
      onClick={() => setMoreOpen(true)}
     >
      <Menu />
     </Button>
    </div>
   </nav>

   <Sheet open={moreOpen} onOpenChange={setMoreOpen} side="bottom">
    <SheetHeader title="Điều hướng" onClose={() => setMoreOpen(false)} />
    <SheetBody className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
     <nav aria-label="Toàn bộ khu vực">
      <div className="grid gap-5 sm:grid-cols-2">
       {navigationGroups.map((group) => (
        <section key={group.id} className="grid content-start gap-1.5" aria-label={group.name}>
         <Typography variant="overline" tone="muted" weight="black" className="px-2.5">
          {group.name}
         </Typography>
         {group.items.map((item) => (
          <NavRow
           key={item.name}
           item={item}
           active={isActive(pathname, searchParams, item.href)}
           collapsed={false}
           onNavigate={() => setMoreOpen(false)}
          />
         ))}
        </section>
       ))}
       <section className="grid content-start gap-1.5" aria-label="Hệ thống">
        <Typography variant="overline" tone="muted" weight="black" className="px-2.5">
         Hệ thống
        </Typography>
        {mobileUtilityItems.map((item) => (
         <NavRow
          key={item.name}
          item={item}
          active={isActive(pathname, searchParams, item.href)}
          collapsed={false}
          onNavigate={() => setMoreOpen(false)}
         />
        ))}
       </section>
      </div>
     </nav>
    </SheetBody>
   </Sheet>
  </>
 );
}
