"use client";

import { Fragment, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSelector } from "@tanstack/react-store";
import { ChevronRight, Menu } from "lucide-react";

import { AppLogoMark } from "@/components/layout/AppLogoMark";
import {
 filterNavigationGroupsForContentCapability,
 mobileNavigationItemIds,
 mobileUtilityItemIds,
 navigationItems,
 type NavigationGroupConfig,
 type NavigationItemConfig,
 type NavigationItemId,
} from "@/components/layout/navigation-config";
import { PanelToggleButton } from "@/components/layout/panel-toggle-button";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { appShellStore } from "@/stores/app-shell-store";
import { sidebarStore } from "@/stores/sidebar-store";

type NavigationGroup = NavigationGroupConfig;

function matchesHref(
 pathname: string,
 searchParams: URLSearchParams,
 href: string,
 match: NavigationItemConfig["match"],
) {
 const [base, rawQuery] = href.split("?");
 if (base === undefined) return false;

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

 if (base === "/hsk") {
  return pathname === "/hsk" || (pathname.startsWith("/hsk/") && pathname !== "/hsk/grammar");
 }

 if (base === "/reader") {
  return (
   pathname === "/reader" ||
   pathname === "/reader/course" ||
   pathname.startsWith("/reader/course/") ||
   pathname === "/reader/practice" ||
   pathname.startsWith("/reader/practice/") ||
   pathname === "/reader/mock" ||
   pathname.startsWith("/reader/mock/")
  );
 }

 return match === "prefix"
  ? pathname === base || pathname.startsWith(`${base}/`)
  : pathname === base;
}

function isActive(pathname: string, searchParams: URLSearchParams, itemId: NavigationItemId) {
 const item: NavigationItemConfig = navigationItems[itemId];
 return [item.href, ...(item.aliases ?? [])].some((href) =>
  matchesHref(pathname, searchParams, href, item.match ?? "exact"),
 );
}

function groupHasActiveRoute(
 group: NavigationGroup,
 pathname: string,
 searchParams: URLSearchParams,
) {
 return group.sections.some((section) =>
  section.itemIds.some((itemId) => isActive(pathname, searchParams, itemId)),
 );
}

function activeSectionId(
 group: NavigationGroup | undefined,
 pathname: string,
 searchParams: URLSearchParams,
) {
 return (
  group?.sections.find((section) =>
   section.itemIds.some((itemId) => isActive(pathname, searchParams, itemId)),
  )?.id ?? ""
 );
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

function CollapsedGroupMenu({
 group,
 pathname,
 searchParams,
}: {
 group: NavigationGroup;
 pathname: string;
 searchParams: URLSearchParams;
}) {
 const t = useTranslations("Shell");
 const GroupIcon = group.icon;
 const groupLabel = t(group.messageKey);
 const active = groupHasActiveRoute(group, pathname, searchParams);

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant={active ? "active" : "navigation"}
     size="menu"
     align="center"
     className="w-10"
     aria-label={groupLabel}
     title={groupLabel}
    >
     <GroupIcon data-icon="inline-start" />
    </Button>
   </DropdownMenuTrigger>
   <DropdownMenuContent side="right" align="start" width="md">
    <DropdownMenuLabel>{groupLabel}</DropdownMenuLabel>
    {group.sections.map((section, sectionIndex) => (
     <Fragment key={section.id}>
      {sectionIndex > 0 ? <DropdownMenuSeparator /> : null}
      {section.collapsible ? <DropdownMenuLabel>{t(section.messageKey)}</DropdownMenuLabel> : null}
      {section.itemIds.map((itemId) => {
       const item = navigationItems[itemId];
       const Icon = item.icon;
       const itemActive = isActive(pathname, searchParams, itemId);
       return (
        <DropdownMenuItem key={itemId} tone={itemActive ? "accent" : "default"} asChild>
         <Link href={item.href} prefetch={false} aria-current={itemActive ? "page" : undefined}>
          <Icon aria-hidden="true" />
          <Typography as="span" clamp="one" className="min-w-0 flex-1">
           {t(item.messageKey)}
          </Typography>
         </Link>
        </DropdownMenuItem>
       );
      })}
     </Fragment>
    ))}
   </DropdownMenuContent>
  </DropdownMenu>
 );
}

export function Sidebar({ canManageContent }: { canManageContent: boolean }) {
 const t = useTranslations("Shell");
 const visibleNavigationGroups = filterNavigationGroupsForContentCapability(canManageContent);
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const isCollapsed = useSelector(sidebarStore, (state) => state.isCollapsed);
 const { toggle: toggleSidebar, hydrate: hydrateSidebar } = sidebarStore.actions;
 const activeGroupId = visibleNavigationGroups.find((group) =>
  groupHasActiveRoute(group, pathname, searchParams),
 )?.id;
 const activeGroup = visibleNavigationGroups.find((group) => group.id === activeGroupId);
 const routeSectionId = activeSectionId(activeGroup, pathname, searchParams);
 const routeKey = `${pathname}?${searchParams.toString()}`;
 const [navigationState, setNavigationState] = useState({
  routeKey,
  expandedGroupId: activeGroupId ?? "",
  expandedSectionId: routeSectionId,
 });
 const currentNavigationState =
  navigationState.routeKey === routeKey
   ? navigationState
   : {
      routeKey,
      expandedGroupId: activeGroupId ?? "",
      expandedSectionId: routeSectionId,
     };

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
     <div className="grid content-start gap-1.5">
      {visibleNavigationGroups.map((group) => (
       <CollapsedGroupMenu
        key={group.id}
        group={group}
        pathname={pathname}
        searchParams={searchParams}
       />
      ))}
     </div>
    ) : (
     <div className="grid content-start gap-1.5">
      {visibleNavigationGroups.map((group) => {
       const groupOpen = group.id === currentNavigationState.expandedGroupId;
       const GroupIcon = group.icon;
       const groupLabel = t(group.messageKey);

       return (
        <section key={group.id} className="grid gap-1" aria-label={groupLabel}>
         <Button
          type="button"
          variant={group.id === activeGroupId ? "active" : "navigation"}
          size="menu"
          align="between"
          className="w-full min-w-0"
          aria-expanded={groupOpen}
          aria-controls={`sidebar-group-${group.id}`}
          onClick={() => {
           if (group.id === activeGroupId) {
            setNavigationState({
             ...currentNavigationState,
             routeKey,
             expandedGroupId: group.id,
            });
            return;
           }
           setNavigationState({
            ...currentNavigationState,
            routeKey,
            expandedGroupId: currentNavigationState.expandedGroupId === group.id ? "" : group.id,
           });
          }}
         >
          <span className="flex min-w-0 flex-1 items-center gap-3">
           <GroupIcon data-icon="inline-start" />
           <Typography as="span" clamp="one" className="min-w-0 flex-1 text-start">
            {groupLabel}
           </Typography>
          </span>
          <ChevronRight
           data-icon="inline-end"
           className={cn("shrink-0 transition-transform", groupOpen && "rotate-90")}
          />
         </Button>

         <div
          id={`sidebar-group-${group.id}`}
          hidden={!groupOpen}
          className="grid gap-1 border-l border-border-default pb-1 pl-2"
         >
          {group.sections.map((section) => {
           const sectionActive = section.itemIds.some((itemId) =>
            isActive(pathname, searchParams, itemId),
           );
           const sectionOpen = section.id === currentNavigationState.expandedSectionId;
           if (!section.collapsible) {
            return section.itemIds.map((itemId) => (
             <NavRow
              key={itemId}
              itemId={itemId}
              active={isActive(pathname, searchParams, itemId)}
              collapsed={false}
             />
            ));
           }
           return (
            <div key={section.id} className="grid gap-1">
             <Button
              type="button"
              variant={sectionActive ? "active" : "navigation"}
              size="menu"
              align="between"
              className="w-full min-w-0"
              aria-expanded={sectionOpen}
              aria-controls={`sidebar-section-${section.id}`}
              onClick={() =>
               setNavigationState({
                ...currentNavigationState,
                routeKey,
                expandedSectionId:
                 currentNavigationState.expandedSectionId === section.id ? "" : section.id,
               })
              }
             >
              <Typography as="span" clamp="one" className="min-w-0 flex-1 text-start">
               {t(section.messageKey)}
              </Typography>
              <ChevronRight
               data-icon="inline-end"
               className={cn("shrink-0 transition-transform", sectionOpen && "rotate-90")}
              />
             </Button>
             <div
              id={`sidebar-section-${section.id}`}
              hidden={!sectionOpen}
              className="grid gap-1 border-l border-border-default pl-2"
             >
              {section.itemIds.map((itemId) => (
               <NavRow
                key={itemId}
                itemId={itemId}
                active={isActive(pathname, searchParams, itemId)}
                collapsed={false}
               />
              ))}
             </div>
            </div>
           );
          })}
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

export function MobileBottomNavigation({ canManageContent }: { canManageContent: boolean }) {
 const t = useTranslations("Shell");
 const visibleNavigationGroups = filterNavigationGroupsForContentCapability(canManageContent);
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [moreOpen, setMoreOpen] = useState(false);
 const primaryRouteActive = mobileNavigationItemIds.some((itemId) =>
  isActive(pathname, searchParams, itemId),
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
      const active = isActive(pathname, searchParams, itemId);
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
       {visibleNavigationGroups.map((group) => (
        <section
         key={group.id}
         className="grid content-start gap-2"
         aria-label={t(group.messageKey)}
        >
         <Typography variant="overline" tone="muted" weight="black" className="px-2.5">
          {t(group.messageKey)}
         </Typography>
         {group.sections.map((section) => (
          <div key={section.id} className="grid gap-1">
           {section.collapsible ? (
            <Typography variant="caption" tone="muted" weight="bold" className="px-2.5 pt-1">
             {t(section.messageKey)}
            </Typography>
           ) : null}
           {section.itemIds.map((itemId) => (
            <NavRow
             key={itemId}
             itemId={itemId}
             active={isActive(pathname, searchParams, itemId)}
             collapsed={false}
             onNavigate={() => setMoreOpen(false)}
            />
           ))}
          </div>
         ))}
        </section>
       ))}
       <section
        className="grid content-start gap-1.5"
        aria-label={t(navigationItems.settings.messageKey)}
       >
        <Typography variant="overline" tone="muted" weight="black" className="px-2.5">
         {t(navigationItems.settings.messageKey)}
        </Typography>
        {mobileUtilityItemIds.map((itemId) => (
         <NavRow
          key={itemId}
          itemId={itemId}
          active={isActive(pathname, searchParams, itemId)}
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
