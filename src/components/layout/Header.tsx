"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Languages, LockKeyhole, Moon, Search, Settings, Sun } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { appShellStore } from "@/stores/app-shell-store";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { focusModeStore } from "@/stores/focus-mode-store";
import { globalSearchStore } from "@/stores/global-search-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";
import { createClient } from "@/lib/supabase/client";
import { getClientSessionUser } from "@/lib/supabase/client-session";
import {
 AppHeaderBreadcrumb,
 AppHeaderBreadcrumbItem,
 AppHeaderBreadcrumbLink,
 AppHeaderBreadcrumbPage,
 AppHeaderBreadcrumbSeparator,
} from "./app-header-breadcrumb";
import { FocusModeRouteGuard } from "./FocusModeRouteGuard";
import { ProfileSettingsMenu } from "./ProfileSettingsMenu";
import { type Theme, useTheme } from "./ThemeProvider";

type BreadcrumbMessageKey =
 | "breadcrumbs.study"
 | "breadcrumbs.reader"
 | "breadcrumbs.notebook"
 | "breadcrumbs.dictionary"
 | "breadcrumbs.settings"
 | "breadcrumbs.radicals"
 | "breadcrumbs.hanzihome"
 | "breadcrumbs.vocab"
 | "breadcrumbs.vocabReview"
 | "breadcrumbs.grammar"
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

export function Header() {
 const t = useTranslations("Shell");
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const { theme, toggleTheme } = useTheme();
 const pathname = usePathname();
 const searchValue = useSelector(globalSearchStore, (state) => state.query);
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const lookupEnabled = dictionaryLookupStore.actions.isEnabled(pathname);
 const { setEnabled: setLookupEnabled, hydrate: hydrateLookupSettings } =
  dictionaryLookupStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setEnabled: setFocusModeEnabled } = focusModeStore.actions;
 const headerToolbarContent = useSelector(headerToolbarStore, (state) => state.content);
 const supabase = useMemo(() => createClient(), []);
 const [user, setUser] = useState<User | null>(null);
 const simpleBreadcrumb = getSimpleHeaderBreadcrumb(pathname);
 const hasRouteToolbar = Boolean(headerToolbarContent || simpleBreadcrumb);

 useEffect(() => {
  hydrateLookupSettings();
 }, [hydrateLookupSettings]);

 useEffect(() => {
  void getClientSessionUser(supabase).then(setUser);
 }, [supabase]);

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
    <div
     className={cn(
      "grid h-12 w-full min-w-0 items-center gap-1.5 sm:h-14 sm:gap-3",
      hasRouteToolbar
       ? "grid-cols-[minmax(0,1fr)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)_auto]"
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
 if (pathname === "/dictionary" || pathname.startsWith("/dictionary/")) {
  return { labelKey: "breadcrumbs.dictionary" };
 }
 if (pathname === "/settings") return { labelKey: "breadcrumbs.settings" };
 if (pathname === "/radicals") return { labelKey: "breadcrumbs.radicals" };
 if (pathname === "/hanzihome") return { labelKey: "breadcrumbs.hanzihome" };
 if (pathname === "/vocab/review") {
  return {
   parent: { labelKey: "breadcrumbs.vocab", href: "/vocab" },
   labelKey: "breadcrumbs.vocabReview",
  };
 }
 if (pathname === "/vocab") return { labelKey: "breadcrumbs.vocab" };
 if (pathname === "/grammar") return { labelKey: "breadcrumbs.grammar" };
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
    className={cn("w-full", routeToolbarActive && "xl:w-[min(34rem,34vw)]")}
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
}) {
 const t = useTranslations("Shell");

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

   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("header.quickSettings")}
      title={t("header.quickSettings")}
      className="hidden sm:inline-flex"
     >
      <Settings />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="lg">
     <DropdownMenuLabel>{t("header.quickSettings")}</DropdownMenuLabel>
     <DropdownMenuCheckboxItem
      checked={theme === "dark"}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={onToggleTheme}
     >
      {theme === "dark" ? <Sun /> : <Moon />}
      {t("header.darkTheme")}
     </DropdownMenuCheckboxItem>
     <DropdownMenuCheckboxItem
      checked={lookupEnabled}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={onLookupEnabledChange}
     >
      <Languages />
      {t("header.pageLookup")}
     </DropdownMenuCheckboxItem>
     <DropdownMenuCheckboxItem
      checked={focusModeEnabled}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={(enabled) => {
       if (enabled && !focusModeEnabled) {
        toast.warning(t("header.focusModeWarning"), { duration: 5200 });
       }
       onFocusModeEnabledChange(enabled);
      }}
     >
      <LockKeyhole />
      {t("header.focusMode")}
     </DropdownMenuCheckboxItem>
     <DropdownMenuSeparator />
     <DropdownMenuItem asChild>
      <Link href="/settings?section=app">
       <Settings />
       {t("header.openAllSettings")}
      </Link>
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>
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
