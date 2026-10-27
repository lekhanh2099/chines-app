"use client";

import { Fragment, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSelector } from "@tanstack/react-store";
import { ChevronRight, Menu } from "lucide-react";

import { AppLogoMark } from "@/components/layout/navigation/AppLogoMark";
import { BrandWordmark } from "@/components/layout/navigation/BrandWordmark";
import {
 filterNavigationGroupsForContentCapability,
 mobileNavigationItemIds,
 mobileUtilityItemIds,
 navigationItems,
 type NavigationGroupConfig,
 type NavigationItemConfig,
 type NavigationItemId,
} from "@/components/layout/navigation/navigation-config";
import { PanelToggleButton } from "@/components/layout/workspace/panel-toggle-button";
import { Button } from "@/components/ui/actions/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Sheet, SheetBody, SheetHeader } from "@/components/ui/overlays/sheet";
import { Typography } from "@/components/ui/display/typography";
import { focusRingClassName } from "@/components/ui/focus-ring";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { appShellStore } from "@/stores/shell/app-shell-store";
import { navigationPendingStore } from "@/stores/shell/navigation-pending-store";
import { sidebarStore } from "@/stores/shell/sidebar-store";

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
  return (
   pathname === "/hsk" ||
   (pathname.startsWith("/hsk/") &&
    pathname !== "/hsk/grammar" &&
    pathname !== "/hsk/han-thuong-mai" &&
    pathname !== "/hsk/nhip-cau-han-ngu" &&
    pathname !== "/hsk/doc-hieu" &&
    pathname !== "/hsk/khau-ngu-tc1")
  );
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
 if (
  itemId === "lessons" &&
  [
   navigationItems.businessChinese.href,
   navigationItems.chineseBridge.href,
   navigationItems.spokenChinese.href,
  ].includes(pathname)
 ) {
  return false;
 }
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
 nested = false,
 onNavigate,
}: {
 itemId: NavigationItemId;
 active: boolean;
 collapsed: boolean;
 nested?: boolean;
 onNavigate?: () => void;
}) {
 const t = useTranslations("Shell");
 const item = navigationItems[itemId];
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const Icon = item.icon;
 const label = t(item.messageKey);
 const pendingHref = useSelector(navigationPendingStore, (state) => state.pendingHref);
 const isPendingThisItem = pendingHref === item.href;

 return (
  <Link
   href={item.href}
   aria-current={active ? "page" : undefined}
   aria-busy={isPendingThisItem ? "true" : undefined}
   aria-label={collapsed ? label : undefined}
   title={collapsed ? label : undefined}
   className={cn(
    "flex items-center justify-between transition-colors select-none",
    focusRingClassName,
    collapsed
     ? "w-10 h-10 justify-center rounded-lg"
     : onNavigate
       ? "w-full min-w-0 min-h-12 px-3 py-2 rounded-lg text-sm font-medium"
       : nested
         ? "w-full min-w-0 h-8 px-2.5 rounded-md text-xs font-medium"
         : "w-full min-w-0 h-9 min-h-9 px-2.5 rounded-lg text-sm font-medium",
    active
     ? "bg-surface border border-border-default/80 text-primary font-semibold shadow-xs"
     : "text-foreground-muted hover:bg-surface-hover hover:text-foreground",
    isPendingThisItem && "pointer-events-none opacity-80",
   )}
   onClick={(event) => {
    if (
     (active && (itemId !== "lessons" || (pathname === item.href && searchParams.size === 0))) ||
     isPendingThisItem
    ) {
     event.preventDefault();
     return;
    }
    navigationPendingStore.actions.startNavigation(item.href);
    onNavigate?.();
   }}
  >
   <div className="flex items-center gap-2.5 min-w-0">
    <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-foreground-muted")} />
    {!collapsed ? <span className="truncate">{label}</span> : null}
   </div>
   {active && !collapsed ? (
    <span aria-hidden="true" className="size-1.5 rounded-full bg-primary shrink-0" />
   ) : null}
  </Link>
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
 const pendingHref = useSelector(navigationPendingStore, (state) => state.pendingHref);
 const GroupIcon = group.icon;
 const groupLabel = t(group.messageKey);
 const active = groupHasActiveRoute(group, pathname, searchParams);

 return (
  <DropdownMenu>
   <DropdownMenuTrigger asChild>
    <Button
     type="button"
     variant="navigation"
     size="menu"
     align="center"
     className="w-10"
     aria-label={groupLabel}
     title={groupLabel}
    >
     <GroupIcon data-icon="inline-start" className={active ? "text-primary" : undefined} />
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
       const isPendingThisItem = pendingHref === item.href;
       return (
        <DropdownMenuItem key={itemId} tone={itemActive ? "accent" : "default"} asChild>
         <Link
          href={item.href}
          aria-current={itemActive ? "page" : undefined}
          aria-busy={isPendingThisItem ? "true" : undefined}
          className={cn(isPendingThisItem && "pointer-events-none opacity-80")}
          onClick={(event) => {
           if (
            (itemActive &&
             (itemId !== "lessons" || (pathname === item.href && searchParams.size === 0))) ||
            isPendingThisItem
           ) {
            event.preventDefault();
            return;
           }
           navigationPendingStore.actions.startNavigation(item.href);
          }}
         >
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
 const pendingHref = useSelector(navigationPendingStore, (state) => state.pendingHref);
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
     "flex items-center border-b border-border-default shrink-0",
     isCollapsed ? "flex-col gap-2 px-2 py-2" : "h-14 justify-between gap-2 px-4",
    )}
   >
    {isCollapsed ? (
     <Link
      href="/"
      aria-label="HanziHome"
      className={cn(
       "group/brand flex size-11 min-h-11 shrink-0 items-center justify-center rounded-lg text-text-primary",
       focusRingClassName,
       pendingHref === "/" && "pointer-events-none opacity-80",
      )}
      onClick={(event) => {
       if (pathname === "/" || pendingHref === "/") {
        event.preventDefault();
        return;
       }
       navigationPendingStore.actions.startNavigation("/");
      }}
     >
      <AppLogoMark />
     </Link>
    ) : (
     <BrandWordmark
      className={cn("min-h-11 min-w-0", pendingHref === "/" && "pointer-events-none opacity-80")}
      onClick={(event) => {
       if (pathname === "/" || pendingHref === "/") {
        event.preventDefault();
        return;
       }
       navigationPendingStore.actions.startNavigation("/");
      }}
     />
    )}
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
     isCollapsed ? "grid content-start gap-2 px-1" : "px-3",
    )}
   >
    {isCollapsed ? (
     <div className="grid content-start justify-items-center gap-1.5">
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
     <div className="grid content-start gap-2">
      {visibleNavigationGroups.map((group) => {
       const groupOpen = group.id === currentNavigationState.expandedGroupId;
       const GroupIcon = group.icon;
       const groupLabel = t(group.messageKey);

       if (groupOpen) {
        return (
         <section key={group.id} aria-label={groupLabel}>
          <div className="grid gap-1 rounded-xl border border-border-default/70 bg-surface-subtle/40 p-2">
           <Button
            type="button"
            variant="navigation"
            size="compact"
            align="between"
            className="w-full min-w-0 h-8"
            aria-expanded={true}
            aria-controls={`sidebar-group-${group.id}`}
            onClick={() => {
             setNavigationState({
              ...currentNavigationState,
              routeKey,
              expandedGroupId: "",
             });
            }}
           >
            <span className="flex min-w-0 flex-1 items-center gap-2.5 text-foreground">
             <GroupIcon className="size-4 shrink-0 text-primary" />
             <Typography
              as="span"
              variant="caption"
              weight="bold"
              clamp="one"
              className="min-w-0 flex-1 text-start"
             >
              {groupLabel}
             </Typography>
            </span>
            <ChevronRight
             data-icon="inline-end"
             className="size-3.5 shrink-0 transition-transform rotate-90"
            />
           </Button>

           <div id={`sidebar-group-${group.id}`} className="grid gap-0.5 pt-0.5">
            {group.sections.map((section) => {
             const sectionActive = section.itemIds.some((itemId) =>
              isActive(pathname, searchParams, itemId),
             );
             const sectionOpen = section.id === currentNavigationState.expandedSectionId;
             const SectionIcon =
              section.id === "textbooks" ? navigationItems.lessons.icon : GroupIcon;

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
              <div key={section.id} className="grid gap-0.5">
               <Button
                type="button"
                variant="navigation"
                size="compact"
                align="between"
                className="w-full min-w-0 h-8"
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
                <span className="flex min-w-0 flex-1 items-center gap-2">
                 {section.id === "hsk-reading" ? (
                  <span
                   aria-hidden="true"
                   className="grid size-4 shrink-0 place-items-center rounded-sm border border-current text-primary text-[0.625rem] font-bold"
                  >
                   H
                  </span>
                 ) : (
                  <SectionIcon
                   data-icon="inline-start"
                   className={sectionActive ? "text-primary" : undefined}
                  />
                 )}
                 <Typography
                  as="span"
                  variant="bodySmall"
                  tone="inherit"
                  weight="medium"
                  clamp="one"
                  className="min-w-0 flex-1 text-start"
                 >
                  {t(section.messageKey)}
                 </Typography>
                </span>
                <ChevronRight
                 data-icon="inline-end"
                 className={cn(
                  "size-3.5 shrink-0 transition-transform",
                  sectionOpen && "rotate-90",
                 )}
                />
               </Button>
               <div
                id={`sidebar-section-${section.id}`}
                hidden={!sectionOpen}
                className="pt-0.5 pl-5"
               >
                <div className="grid gap-0.5 border-l border-border-default/80 pl-2.5">
                 {section.itemIds.map((itemId) => (
                  <NavRow
                   key={itemId}
                   itemId={itemId}
                   active={isActive(pathname, searchParams, itemId)}
                   collapsed={false}
                   nested
                  />
                 ))}
                </div>
               </div>
              </div>
             );
            })}
           </div>
          </div>
         </section>
        );
       }

       return (
        <section key={group.id} aria-label={groupLabel}>
         <Button
          type="button"
          variant="navigation"
          size="toolbar"
          align="between"
          className="w-full min-w-0"
          aria-expanded={false}
          onClick={() => {
           setNavigationState({
            ...currentNavigationState,
            routeKey,
            expandedGroupId: group.id,
           });
          }}
         >
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
           <GroupIcon className="size-4 shrink-0" />
           <Typography
            as="span"
            variant="bodySmall"
            tone="inherit"
            weight="medium"
            clamp="one"
            className="min-w-0 flex-1 text-start"
           >
            {groupLabel}
           </Typography>
          </span>
          <ChevronRight data-icon="inline-end" className="size-3.5 shrink-0 transition-transform" />
         </Button>
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
 const pendingHref = useSelector(navigationPendingStore, (state) => state.pendingHref);
 const visibleNavigationGroups = filterNavigationGroupsForContentCapability(canManageContent);
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const [moreOpen, setMoreOpen] = useState(false);
 const lessonsActive =
  isActive(pathname, searchParams, "lessons") || navigationItems.lessons.aliases.includes(pathname);
 const primaryRouteActive = mobileNavigationItemIds.some((itemId) =>
  itemId === "lessons" ? lessonsActive : isActive(pathname, searchParams, itemId),
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
      const active =
       itemId === "lessons" ? lessonsActive : isActive(pathname, searchParams, itemId);
      const label = t(item.messageKey);
      const isPendingThisItem = pendingHref === item.href;

      return (
       <Button
        key={itemId}
        variant={active ? "active" : "navigation"}
        size="icon"
        asChild
        aria-current={active ? "page" : undefined}
        aria-busy={isPendingThisItem ? "true" : undefined}
        aria-label={label}
        title={label}
        className={cn("justify-self-center", isPendingThisItem && "pointer-events-none opacity-80")}
       >
        <Link
         href={item.href}
         onClick={(event) => {
          if (
           (active &&
            (itemId !== "lessons" || (pathname === item.href && searchParams.size === 0))) ||
           isPendingThisItem
          ) {
           event.preventDefault();
           return;
          }
          navigationPendingStore.actions.startNavigation(item.href);
         }}
        >
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
