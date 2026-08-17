"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSelector } from "@tanstack/react-store";
import { ChevronRight, Menu } from "lucide-react";
import { AppLogoMark } from "@/components/layout/AppLogoMark";
import {
 mobileNavigationItemIds,
 mobileUtilityItemIds,
 navigationGroups,
 navigationItems,
 type NavigationItemId,
} from "@/components/layout/navigation-config";
import { PanelToggleButton } from "@/components/layout/panel-toggle-button";
import { Link, usePathname } from "@/i18n/navigation";
import { sidebarStore } from "@/stores/sidebar-store";
import { appShellStore } from "@/stores/app-shell-store";
import { cn } from "@/lib/utils";

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
 itemId,
 active,
 collapsed,
 onNavigate,
}: {
 itemId: NavigationItemId;
 active: boolean;
 collapsed: boolean;
 onNavigate?: () => void;
}) {
 const t = useTranslations("Shell");
 const item = navigationItems[itemId];
 const Icon = item.icon;
 const label = t(item.messageKey);

 return (
  <Button
   variant={active ? "active" : "navigation"}
   size="menu"
   align={collapsed ? "center" : "start"}
   asChild
   aria-current={active ? "page" : undefined}
   aria-label={collapsed ? label : undefined}
   title={collapsed ? label : undefined}
   className={collapsed ? "w-10" : "w-full min-w-0 overflow-hidden"}
  >
   <Link href={item.href} prefetch={false} onClick={onNavigate}>
    <Icon data-icon="inline-start" />
    {!collapsed ? (
     <Typography as="span" clamp="one" className="min-w-0 flex-1">
      {label}
     </Typography>
    ) : null}
   </Link>
  </Button>
 );
}

export function Sidebar() {
 const t = useTranslations("Shell");
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const isCollapsed = useSelector(sidebarStore, (state) => state.isCollapsed);
 const { toggle: toggleSidebar, hydrate: hydrateSidebar } = sidebarStore.actions;
 const activeGroupId = navigationGroups.find((group) =>
  group.itemIds.some((itemId) => isActive(pathname, searchParams, navigationItems[itemId].href)),
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
     label={t("navigation.sidebarLabel")}
     size="md"
    />
   </div>

   <nav
    aria-label={t("navigation.aria.main")}
    className={cn(
     "min-h-0 flex-1 overflow-y-auto py-3 scrollbar-soft",
     isCollapsed ? "grid content-start gap-2 px-3" : "px-3",
    )}
   >
    {isCollapsed ? (
     navigationGroups.map((group, index) => (
      <div
       key={group.id}
       className={cn("grid gap-1", index > 0 && "border-t border-border-default pt-2")}
      >
       {group.itemIds.map((itemId) => (
        <NavRow
         key={itemId}
         itemId={itemId}
         active={isActive(pathname, searchParams, navigationItems[itemId].href)}
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
       const groupLabel = t(group.messageKey);

       return (
        <section key={group.id} className="grid gap-1" aria-label={groupLabel}>
         <Button
          type="button"
          variant="navigation"
          size="menu"
          align="between"
          className="w-full min-w-0"
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
          <span className="flex min-w-0 flex-1 items-center gap-3">
           <GroupIcon data-icon="inline-start" />
           <Typography as="span" clamp="one" className="min-w-0 flex-1 text-start">
            {groupLabel}
           </Typography>
          </span>
          <ChevronRight className={cn("shrink-0 transition-transform", groupOpen && "rotate-90")} />
         </Button>

         <div
          id={`sidebar-group-${group.id}`}
          hidden={!groupOpen}
          className="grid gap-1 border-l border-border-default pb-1 pl-2"
         >
          {group.itemIds.map((itemId) => (
           <NavRow
            key={itemId}
            itemId={itemId}
            active={isActive(pathname, searchParams, navigationItems[itemId].href)}
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
 const t = useTranslations("Shell");
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [moreOpen, setMoreOpen] = useState(false);
 const primaryRouteActive = mobileNavigationItemIds.some((itemId) =>
  isActive(pathname, searchParams, navigationItems[itemId].href),
 );
 const moreActive = !primaryRouteActive;

 if (isContentFullscreen) return null;

 return (
  <>
   <nav
    aria-label={t("navigation.aria.quick")}
    className="nova-shell-header z-40 shrink-0 border-t border-border-default px-2 pb-[calc(0.25rem+env(safe-area-inset-bottom))] pt-1 lg:hidden"
   >
    <div className="mx-auto grid w-full max-w-md grid-cols-5 gap-0.5">
     {mobileNavigationItemIds.map((itemId) => {
      const item = navigationItems[itemId];
      const Icon = item.icon;
      const active = isActive(pathname, searchParams, item.href);
      const label = t(item.messageKey);

      return (
       <Button
        key={itemId}
        variant={active ? "active" : "navigation"}
        size="icon"
        asChild
        aria-current={active ? "page" : undefined}
        aria-label={label}
        title={label}
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
      aria-label={t("navigation.openAll")}
      title={t("navigation.more")}
      className="justify-self-center"
      onClick={() => setMoreOpen(true)}
     >
      <Menu />
     </Button>
    </div>
   </nav>

   <Sheet open={moreOpen} onOpenChange={setMoreOpen} side="bottom">
    <SheetHeader title={t("navigation.sheetTitle")} onClose={() => setMoreOpen(false)} />
    <SheetBody className="pb-[calc(1rem+env(safe-area-inset-bottom))]">
     <nav aria-label={t("navigation.aria.all")}>
      <div className="grid gap-5 sm:grid-cols-2">
       {navigationGroups.map((group) => (
        <section
         key={group.id}
         className="grid content-start gap-1.5"
         aria-label={t(group.messageKey)}
        >
         <Typography variant="overline" tone="muted" weight="black" className="px-2.5">
          {t(group.messageKey)}
         </Typography>
         {group.itemIds.map((itemId) => (
          <NavRow
           key={itemId}
           itemId={itemId}
           active={isActive(pathname, searchParams, navigationItems[itemId].href)}
           collapsed={false}
           onNavigate={() => setMoreOpen(false)}
          />
         ))}
        </section>
       ))}
       <section className="grid content-start gap-1.5" aria-label={t("navigation.groups.system")}>
        <Typography variant="overline" tone="muted" weight="black" className="px-2.5">
         {t("navigation.groups.system")}
        </Typography>
        {mobileUtilityItemIds.map((itemId) => (
         <NavRow
          key={itemId}
          itemId={itemId}
          active={isActive(pathname, searchParams, navigationItems[itemId].href)}
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
