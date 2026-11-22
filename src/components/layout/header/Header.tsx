"use client";

import { type FormEvent, type ReactNode, useEffect, useState, useSyncExternalStore } from "react";
import { Languages, LockKeyhole, Moon, Search, Settings, Sun, WifiOff } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";

import { useClientSession } from "@/components/providers/QueryProvider";
import { Badge } from "@/components/ui/display/badge";
import { Button } from "@/components/ui/actions/button";
import {
 BasePopover,
 BasePopoverPopup,
 BasePopoverPositioner,
} from "@/components/ui/overlays/base-popover";
import { Tabs, TabsContent } from "@/components/ui/navigation/tabs";
import { Switch } from "@/components/ui/forms/switch";
import { Typography } from "@/components/ui/display/typography";
import { Separator } from "@/components/ui/layout/separator";
import { Input } from "@/components/ui/forms/input";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { appShellStore } from "@/stores/shell/app-shell-store";
import { dictionaryLookupStore } from "@/stores/dictionary/dictionary-lookup-store";
import { focusModeStore } from "@/stores/shell/focus-mode-store";
import { globalSearchStore } from "@/stores/search/global-search-store";
import { headerToolbarStore } from "@/stores/shell/header-toolbar-store";
import { navigationPendingStore } from "@/stores/shell/navigation-pending-store";
import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "./app-header-breadcrumb";
import { FocusModeRouteGuard } from "../navigation/FocusModeRouteGuard";
import { ProfileSettingsMenu } from "./ProfileSettingsMenu";
import { type Theme, useTheme } from "../theme/ThemeProvider";

type BreadcrumbMessageKey =
 | "breadcrumbs.study"
 | "breadcrumbs.reader"
 | "breadcrumbs.notebook"
 | "breadcrumbs.settings"
 | "breadcrumbs.radicals"
 | "breadcrumbs.hanzihome"
 | "breadcrumbs.memoryTips"
 | "breadcrumbs.htmlArtifacts"
 | "breadcrumbs.apiDocs"
 | "breadcrumbs.notes"
 | "breadcrumbs.sharedNote";

type SimpleHeaderBreadcrumb = {
 labelKey: BreadcrumbMessageKey;
 parent?: {
  labelKey: BreadcrumbMessageKey;
  href: string;
 };
};

type HeaderProps = {
 actions?: ReactNode;
 quickSettingsExtras?: ReactNode;
 quickListeningExtras?: ReactNode;
};

export function Header({ actions, quickSettingsExtras, quickListeningExtras }: HeaderProps = {}) {
 const t = useTranslations("Shell");
 const { user } = useClientSession();
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const { theme, toggleTheme } = useTheme();
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const isNavPending = useSelector(navigationPendingStore, (state) => state.isPending);
 const searchValue = useSelector(globalSearchStore, (state) => state.query);
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const lookupEnabled = dictionaryLookupStore.actions.isEnabled(pathname);
 const { setEnabled: setLookupEnabled, hydrate: hydrateLookupSettings } =
  dictionaryLookupStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setEnabled: setFocusModeEnabled } = focusModeStore.actions;
 const headerToolbarContent = useSelector(headerToolbarStore, (state) => state.content);
 const simpleBreadcrumb = getSimpleHeaderBreadcrumb(pathname);
 const hasRouteToolbar = Boolean(headerToolbarContent || simpleBreadcrumb);

 useEffect(() => {
  navigationPendingStore.actions.finishNavigation();
 }, [pathname, searchParams]);

 useEffect(() => {
  hydrateLookupSettings();
 }, [hydrateLookupSettings]);

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    globalSearchStore.actions.openSearch();
   }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
 }, []);

 if (isContentFullscreen) return <FocusModeRouteGuard />;

 return (
  <>
   <FocusModeRouteGuard />
   <header className="nova-shell-header sticky top-0 z-50 flex h-12 w-full max-w-full min-w-0 shrink-0 items-center overflow-hidden border-b border-border-default px-2 sm:h-14 sm:px-5 lg:px-7">
    {isNavPending ? (
     <div
      role="progressbar"
      aria-label="Navigation in progress"
      aria-busy="true"
      className="nav-progress-line"
     />
    ) : null}
    <div
     className={cn(
      "grid h-12 w-full min-w-0 items-center gap-1.5 sm:h-14 sm:gap-3",
      hasRouteToolbar
       ? "grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(14rem,20rem)_auto]"
       : "grid-cols-[minmax(0,1fr)_auto]",
     )}
    >
     {hasRouteToolbar ? (
      <HeaderContextArea
       toolbarContent={headerToolbarContent}
       simpleBreadcrumb={simpleBreadcrumb}
      />
     ) : null}

     <HeaderSearchForm
      value={searchValue}
      routeToolbarActive={hasRouteToolbar}
      hidden={pathname === "/reader"}
      searchLabel={t("header.search")}
      onSubmit={(event) => {
       event.preventDefault();
       globalSearchStore.actions.openSearch();
      }}
      onOpen={globalSearchStore.actions.openSearch}
      onChange={(value) => {
       globalSearchStore.actions.setQuery(value);
       globalSearchStore.actions.openSearch();
      }}
     />

     <HeaderUtilityArea
      routeToolbarActive={hasRouteToolbar}
      focusModeEnabled={focusModeEnabled}
      user={user}
      theme={theme}
      lookupEnabled={lookupEnabled}
      onOpenSearch={globalSearchStore.actions.openSearch}
      onToggleTheme={toggleTheme}
      onLookupEnabledChange={(enabled) => setLookupEnabled(pathname, enabled)}
      onFocusModeEnabledChange={setFocusModeEnabled}
      actions={actions}
      quickSettingsExtras={quickSettingsExtras}
      quickListeningExtras={quickListeningExtras}
     />
    </div>
   </header>
  </>
 );
}

function HeaderContextArea({
 toolbarContent,
 simpleBreadcrumb,
}: {
 toolbarContent: ReactNode;
 simpleBreadcrumb: SimpleHeaderBreadcrumb | null;
}) {
 if (toolbarContent) {
  return (
   <div className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-2">
    {toolbarContent}
   </div>
  );
 }

 if (simpleBreadcrumb) return <SimpleRouteBreadcrumb breadcrumb={simpleBreadcrumb} />;
 return <div className="min-w-0" />;
}

function SimpleRouteBreadcrumb({ breadcrumb }: { breadcrumb: SimpleHeaderBreadcrumb }) {
 const t = useTranslations("Shell");
 const label = t(breadcrumb.labelKey);

 return (
  <AppHeaderBreadcrumb className="hidden min-w-0 md:inline-flex">
   {breadcrumb.parent ? (
    <>
     <AppHeaderBreadcrumbItem>
      <AppHeaderBreadcrumbLink href={breadcrumb.parent.href} title={t(breadcrumb.parent.labelKey)}>
       {t(breadcrumb.parent.labelKey)}
      </AppHeaderBreadcrumbLink>
     </AppHeaderBreadcrumbItem>
     <AppHeaderBreadcrumbSeparator />
    </>
   ) : null}
   <AppHeaderBreadcrumbItem className="min-w-0">
    <AppHeaderBreadcrumbPage title={label}>{label}</AppHeaderBreadcrumbPage>
   </AppHeaderBreadcrumbItem>
  </AppHeaderBreadcrumb>
 );
}

function getSimpleHeaderBreadcrumb(pathname: string): SimpleHeaderBreadcrumb | null {
 if (pathname === "/reader") {
  return {
   parent: { labelKey: "breadcrumbs.study", href: "/hanzihome" },
   labelKey: "breadcrumbs.reader",
  };
 }
 if (pathname === "/notebook") return { labelKey: "breadcrumbs.notebook" };
 if (pathname === "/settings") return { labelKey: "breadcrumbs.settings" };
 if (pathname === "/radicals") return { labelKey: "breadcrumbs.radicals" };
 if (pathname === "/hanzihome") return { labelKey: "breadcrumbs.hanzihome" };
 if (pathname === "/memory-tips") return { labelKey: "breadcrumbs.memoryTips" };
 if (pathname === "/html-artifacts") return { labelKey: "breadcrumbs.htmlArtifacts" };
 if (pathname === "/api-docs") return { labelKey: "breadcrumbs.apiDocs" };
 if (pathname.startsWith("/note/")) {
  return {
   parent: { labelKey: "breadcrumbs.notes", href: "/notes" },
   labelKey: "breadcrumbs.sharedNote",
  };
 }
 return null;
}

function HeaderSearchForm({
 value,
 routeToolbarActive,
 hidden,
 searchLabel,
 onSubmit,
 onOpen,
 onChange,
}: {
 value: string;
 routeToolbarActive: boolean;
 hidden: boolean;
 searchLabel: string;
 onSubmit: (event: FormEvent<HTMLFormElement>) => void;
 onOpen: () => void;
 onChange: (value: string) => void;
}) {
 return (
  <form
   onSubmit={onSubmit}
   className={cn(
    "relative min-w-0",
    hidden
     ? "hidden"
     : routeToolbarActive
       ? "hidden xl:col-start-2 xl:row-start-1 xl:block"
       : "block",
    routeToolbarActive && "xl:justify-self-center",
   )}
  >
   <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
   <Input
    value={value}
    onFocus={onOpen}
    onClick={onOpen}
    onChange={(event) => onChange(event.target.value)}
    placeholder={searchLabel}
    aria-label={searchLabel}
    density="search"
    surface="card"
    adornment="start"
    className={cn("w-full", routeToolbarActive && "xl:w-[min(20rem,20vw)]")}
   />
  </form>
 );
}

function HeaderUtilityArea({
 routeToolbarActive,
 focusModeEnabled,
 user,
 theme,
 lookupEnabled,
 onOpenSearch,
 onToggleTheme,
 onLookupEnabledChange,
 onFocusModeEnabledChange,
 actions,
 quickSettingsExtras,
 quickListeningExtras,
}: {
 routeToolbarActive: boolean;
 focusModeEnabled: boolean;
 user?: User | null;
 theme: Theme;
 lookupEnabled: boolean;
 onOpenSearch: () => void;
 onToggleTheme: () => void;
 onLookupEnabledChange: (enabled: boolean) => void;
 onFocusModeEnabledChange: (enabled: boolean) => void;
 actions?: ReactNode;
 quickSettingsExtras?: ReactNode;
 quickListeningExtras?: ReactNode;
}) {
 const t = useTranslations("Shell");
 const [settingsTab, setSettingsTab] = useState("reading");
 const readingSettings = useSelector(headerToolbarStore, (state) => state.readingSettings);
 const listeningSettings = useSelector(headerToolbarStore, (state) => state.listeningSettings);

 return (
  <div
   className={cn(
    "relative z-10 flex min-w-0 shrink-0 items-center justify-end gap-0.5 sm:gap-1.5",
    routeToolbarActive && "col-start-2 row-start-1 xl:col-start-3",
   )}
  >
   {routeToolbarActive ? (
    <Button
     type="button"
     variant="ghost"
     onClick={onOpenSearch}
     aria-label={t("header.openSearch")}
     title={t("header.search")}
     size="icon"
     className="xl:hidden"
    >
     <Search />
    </Button>
   ) : null}

   {focusModeEnabled ? <FocusModePill /> : null}
   <OfflinePill />

   {actions}

   <BasePopover.Root>
    <BasePopover.Trigger
     render={
      <Button
       type="button"
       variant="ghost"
       size="icon"
       id="header-quick-settings-trigger"
       aria-label={t("header.quickSettings")}
       title={t("header.quickSettings")}
      />
     }
    >
     <Settings />
    </BasePopover.Trigger>
    <BasePopover.Portal>
     <BasePopoverPositioner side="bottom" align="end" sideOffset={6} collisionPadding={8}>
      <BasePopoverPopup variant="profile" aria-label={t("header.quickSettings")}>
       <Tabs
        value={settingsTab}
        onValueChange={setSettingsTab}
        underline
        items={[
         { key: "reading", label: t("header.displayTab") },
         { key: "listening", label: t("header.listeningTab") },
         { key: "general", label: t("header.generalTab") },
        ]}
        aria-label={t("header.quickSettings")}
        className="grid gap-2"
       >
        <TabsContent value="reading" className="grid gap-2">
         {readingSettings ?? quickSettingsExtras}
        </TabsContent>
        <TabsContent value="listening" className="grid gap-2">
         {listeningSettings}
         {listeningSettings ? null : quickListeningExtras}
        </TabsContent>
        <TabsContent value="general" className="grid divide-y divide-border-default">
         <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
          <Typography as="span" variant="bodySmall" className="flex items-center gap-2">
           {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
           {t("header.darkTheme")}
          </Typography>
          <Switch
           checked={theme === "dark"}
           onCheckedChange={onToggleTheme}
           aria-label={t("header.darkTheme")}
          />
         </label>
         <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
          <Typography as="span" variant="bodySmall" className="flex items-center gap-2">
           <Languages className="size-4" />
           {t("header.pageLookup")}
          </Typography>
          <Switch
           checked={lookupEnabled}
           onCheckedChange={onLookupEnabledChange}
           aria-label={t("header.pageLookup")}
          />
         </label>
         <label className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
          <Typography as="span" variant="bodySmall" className="flex items-center gap-2">
           <LockKeyhole className="size-4" />
           {t("header.focusMode")}
          </Typography>
          <Switch
           checked={focusModeEnabled}
           aria-label={t("header.focusMode")}
           onCheckedChange={(enabled) => {
            if (enabled && !focusModeEnabled)
             toast.warning(t("header.focusModeWarning"), { duration: 5200 });
            onFocusModeEnabledChange(enabled);
           }}
          />
         </label>
        </TabsContent>
       </Tabs>
       <Separator />
       <BasePopover.Close
        nativeButton={false}
        render={<Button asChild variant="menu" size="menu" align="start" className="w-full" />}
       >
        <Link href="/settings?section=app">
         <Settings />
         {t("header.openAllSettings")}
        </Link>
       </BasePopover.Close>
      </BasePopoverPopup>
     </BasePopoverPositioner>
    </BasePopover.Portal>
   </BasePopover.Root>
   <ProfileSettingsMenu user={user} focusModeEnabled={focusModeEnabled} />
  </div>
 );
}

function FocusModePill() {
 const t = useTranslations("Shell");
 return (
  <Badge
   variant="warning"
   size="md"
   className="hidden sm:inline-flex"
   title={t("header.focusModeActive")}
  >
   <LockKeyhole />
   {t("header.focusModeShort")}
  </Badge>
 );
}

function subscribeOnlineStatus(callback: () => void) {
 window.addEventListener("online", callback);
 window.addEventListener("offline", callback);
 return () => {
  window.removeEventListener("online", callback);
  window.removeEventListener("offline", callback);
 };
}

function getOnlineSnapshot() {
 return navigator.onLine;
}

function getServerOnlineSnapshot() {
 return true;
}

function OfflinePill() {
 const isOnline = useSyncExternalStore(
  subscribeOnlineStatus,
  getOnlineSnapshot,
  getServerOnlineSnapshot,
 );

 if (isOnline) return null;

 return (
  <Badge
   variant="warning"
   size="sm"
   className="gap-1 animate-in fade-in duration-300"
   title="Đang dùng dữ liệu ngoại tuyến"
  >
   <WifiOff />
   <span className="hidden md:inline">Ngoại tuyến</span>
  </Badge>
 );
}
