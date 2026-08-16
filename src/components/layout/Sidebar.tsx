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
 BarChart3,
 BookOpenCheck,
 BookOpenText,
 ChevronRight,
 CircleAlert,
 FileText,
 Gauge,
 Home,
 Keyboard,
 Languages,
 Layers3,
 Menu,
 MessageCircle,
 NotebookPen,
 NotebookTabs,
 Repeat2,
 Search,
 Settings,
 Sparkles,
 Volume2,
} from "lucide-react";
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
 { name: "Trang học", icon: BarChart3, href: "/reader" },
 { name: "Bài học", icon: BookOpenCheck, href: "/reader/course" },
 { name: "Bài đọc hôm nay", icon: FileText, href: "/daily-reading" },
 { name: "Đọc HSK", icon: BookOpenText, href: "/hsk" },
 { name: "Ngữ pháp", icon: Languages, href: "/grammar" },
 { name: "Tra chữ", icon: Search, href: "/inspector" },
 { name: "Bộ thủ", icon: Layers3, href: "/radicals" },
 { name: "Văn sử & Dịch", icon: BookOpenText, href: "/humanities" },
];

const practiceItems: NavItem[] = [
 { name: "Thi thử", icon: BookOpenCheck, href: "/reader/mock" },
 { name: "Học với PDF", icon: FileText, href: "/reader/practice" },
 { name: "Chép chính tả", icon: Keyboard, href: "/dictation" },
 { name: "Tạo giọng đọc", icon: Volume2, href: "/tts" },
 { name: "Luyện dịch", icon: Languages, href: "/translation" },
 { name: "Hội thoại", icon: MessageCircle, href: "/conversation" },
 { name: "Ôn tập", icon: Repeat2, href: "/learning-loop" },
];

const competencyItems: NavItem[] = [
 { name: "Hôm nay", icon: Sparkles, href: "/personal-learning/today" },
 { name: "Kho kiến thức", icon: BookOpenText, href: "/personal-learning/knowledge" },
 { name: "Lỗi cá nhân", icon: CircleAlert, href: "/personal-learning/errors" },
 { name: "Kiểm tra nhanh", icon: Gauge, href: "/personal-learning/calibration" },
 { name: "Tiến bộ", icon: BarChart3, href: "/personal-learning/progress" },
];

const personalItems: NavItem[] = [
 { name: "Ghi chú", icon: NotebookPen, href: "/notes" },
 { name: "Sổ tay", icon: NotebookTabs, href: "/notebook" },
 { name: "Rà soát nội dung", icon: CircleAlert, href: "/data-quality" },
 { name: "Cài đặt", icon: Settings, href: "/settings?section=app" },
];

const navigationGroups: NavigationGroup[] = [
 { id: "learning", name: "Học", icon: BookOpenCheck, items: learningItems },
 { id: "practice", name: "Luyện", icon: Repeat2, items: practiceItems },
 { id: "competency", name: "Năng lực", icon: BarChart3, items: competencyItems },
 { id: "personal", name: "Cá nhân", icon: NotebookPen, items: personalItems },
];

const mobileItems = [learningItems[0], learningItems[1], practiceItems[2], personalItems[0]];
const mobileUtilityItems: NavItem[] = [
 { name: "Cài đặt", icon: Settings, href: "/settings?section=app" },
];

function isActive(pathname: string, searchParams: URLSearchParams, href: string) {
 const [base, rawQuery] = href.split("?");

 if (base === "/") return pathname === "/";
 if (base === "/reader") return pathname === "/reader";

 if (rawQuery) {
  const targetParams = new URLSearchParams(rawQuery);

  if (pathname !== base) return false;

  return Array.from(targetParams.entries()).every(
   ([key, value]) => searchParams.get(key) === value,
  );
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
     <Badge variant="accent" size="sm" className="justify-self-end">
      {item.badge}
     </Badge>
    ) : null}
   </Link>
  </Button>
 );
}

function GroupRow({
 group,
 active,
 collapsed,
 expanded,
 onToggle,
}: {
 group: NavigationGroup;
 active: boolean;
 collapsed: boolean;
 expanded: boolean;
 onToggle: () => void;
}) {
 const GroupIcon = group.icon;

 return (
  <div className="flex min-w-0 items-center gap-1">
   <Button
    type="button"
    variant={active ? "active" : "navigation"}
    size="menu"
    align={collapsed ? "center" : "start"}
    className={collapsed ? "w-10" : "min-w-0 flex-1"}
    aria-label={collapsed ? group.name : undefined}
    title={collapsed ? group.name : undefined}
    onClick={onToggle}
   >
    <GroupIcon data-icon="inline-start" />
    {!collapsed ? (
     <Typography as="span" clamp="one" className="min-w-0 flex-1">
      {group.name}
     </Typography>
    ) : null}
   </Button>
   {!collapsed ? (
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label={`${expanded ? "Thu gọn" : "Mở"} nhóm ${group.name}`}
     aria-expanded={expanded}
     onClick={onToggle}
    >
     <ChevronRight className={cn("transition-transform", expanded && "rotate-90")} />
    </Button>
   ) : null}
  </div>
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
 const [manuallyExpandedGroupIds, setManuallyExpandedGroupIds] = useState<string[]>([
  "learning",
  "practice",
 ]);

 useEffect(() => {
  hydrateSidebar();
 }, [hydrateSidebar]);

 if (isContentFullscreen) return null;

 return (
  <aside
   className={cn(
    "nova-shell-sidebar relative hidden h-full min-h-0 w-16 shrink-0 flex-col overflow-hidden border-r border-border-default bg-bg-card transition-[width] duration-200 lg:flex",
    !isCollapsed && "xl:w-[15rem]",
   )}
   data-navigation-density="rail-to-sidebar"
  >
   <nav
    aria-label="Điều hướng chính"
    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 scrollbar-soft"
   >
    <div className="grid content-start gap-1.5">
     {navigationGroups.map((group) => {
      const groupActive = group.id === activeGroupId;
      const groupOpen = groupActive || manuallyExpandedGroupIds.includes(group.id);

      return (
       <section key={group.id} className="grid gap-1" aria-label={group.name}>
        <GroupRow
         group={group}
         active={groupActive}
         collapsed={isCollapsed}
         expanded={groupOpen}
         onToggle={() => {
          if (isCollapsed) return;
          setManuallyExpandedGroupIds((current) =>
           current.includes(group.id)
            ? current.filter((groupId) => groupId !== group.id)
            : [...current, group.id],
          );
         }}
        />

        {groupOpen ? (
         <div
          className={cn(
           "grid gap-1 pb-1",
           !groupActive && "hidden xl:grid",
           !isCollapsed && "xl:border-l xl:border-border-default xl:pl-2",
          )}
         >
          {group.items.map((item) => (
           <NavRow
            key={item.href}
            item={item}
            active={isActive(pathname, searchParams, item.href)}
            collapsed={isCollapsed}
           />
          ))}
         </div>
        ) : null}
       </section>
      );
     })}
    </div>
   </nav>

   <div
    className={cn(
     "hidden shrink-0 items-center border-t border-border-default py-2 xl:flex",
     isCollapsed ? "justify-center px-2" : "justify-end px-3",
    )}
   >
    <PanelToggleButton
     open={!isCollapsed}
     onOpenChange={toggleSidebar}
     label="thanh điều hướng"
     size="md"
    />
   </div>
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
           key={item.href}
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
          key={item.href}
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
