"use client";

import { type FormEvent, type ReactNode, useEffect } from "react";
import { Languages, LockKeyhole, Moon, Search, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { type User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { z } from "zod";

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
import { cn } from "@/lib/utils";
import { appShellStore } from "@/stores/app-shell-store";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { focusModeStore } from "@/stores/focus-mode-store";
import { globalSearchStore } from "@/stores/global-search-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";
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

type SimpleHeaderBreadcrumb = {
 label: string;
 parent?: {
  label: string;
  href: string;
 };
};

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export function Header({ user }: { user?: Nullable<User> }) {
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
 const simpleBreadcrumb = getSimpleHeaderBreadcrumb(pathname);
 const hasRouteToolbar = Boolean(headerToolbarContent || simpleBreadcrumb);

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
 simpleBreadcrumb: Nullable<SimpleHeaderBreadcrumb>;
}) {
 if (toolbarContent) {
  return <div className="flex min-w-0 items-center gap-1.5 overflow-hidden sm:gap-2">{toolbarContent}</div>;
 }

 if (simpleBreadcrumb) return <SimpleRouteBreadcrumb breadcrumb={simpleBreadcrumb} />;

 return <div className="min-w-0" />;
}

function SimpleRouteBreadcrumb({ breadcrumb }: { breadcrumb: SimpleHeaderBreadcrumb }) {
 return (
  <AppHeaderBreadcrumb className="hidden min-w-0 md:inline-flex">
   {breadcrumb.parent ? (
    <>
     <AppHeaderBreadcrumbItem>
      <AppHeaderBreadcrumbLink href={breadcrumb.parent.href} title={breadcrumb.parent.label}>
       {breadcrumb.parent.label}
      </AppHeaderBreadcrumbLink>
     </AppHeaderBreadcrumbItem>
     <AppHeaderBreadcrumbSeparator />
    </>
   ) : null}
   <AppHeaderBreadcrumbItem className="min-w-0">
    <AppHeaderBreadcrumbPage title={breadcrumb.label}>{breadcrumb.label}</AppHeaderBreadcrumbPage>
   </AppHeaderBreadcrumbItem>
  </AppHeaderBreadcrumb>
 );
}

function getSimpleHeaderBreadcrumb(pathname: string): Nullable<SimpleHeaderBreadcrumb> {
 if (pathname === "/notebook") return { label: "Sổ tay" };
 if (pathname === "/dictionary" || pathname.startsWith("/dictionary/")) return { label: "SRS từ" };
 if (pathname === "/settings") return { label: "Cài đặt" };
 if (pathname === "/radicals") return { label: "Bộ thủ" };
 if (pathname === "/hanzihome") return { label: "HanziHome" };
 if (pathname === "/vocab/review") {
  return { parent: { label: "Tổng hợp từ", href: "/vocab" }, label: "Ôn từ vựng" };
 }
 if (pathname === "/vocab") return { label: "Tổng hợp từ" };
 if (pathname === "/grammar") return { label: "Tổng hợp ngữ pháp" };
 if (pathname === "/memory-tips") return { label: "Nhắc nhanh" };
 if (pathname === "/html-artifacts") return { label: "Tệp HTML" };
 if (pathname === "/api-docs") return { label: "API & tích hợp" };
 if (pathname.startsWith("/note/")) {
  return { parent: { label: "Ghi chú", href: "/notes" }, label: "Chia sẻ" };
 }

 return null;
}

function HeaderSearchForm({
 value,
 routeToolbarActive,
 onSubmit,
 onOpen,
 onChange,
}: {
 value: string;
 routeToolbarActive: boolean;
 onSubmit: (event: FormEvent<HTMLFormElement>) => void;
 onOpen: () => void;
 onChange: (value: string) => void;
}) {
 return (
  <form
   onSubmit={onSubmit}
   className={cn(
    "relative min-w-0",
    routeToolbarActive ? "hidden xl:col-start-2 xl:row-start-1 xl:block" : "block",
    routeToolbarActive && "xl:justify-self-center",
   )}
  >
   <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
   <Input
    value={value}
    onFocus={onOpen}
    onClick={onOpen}
    onChange={(event) => onChange(event.target.value)}
    placeholder="Tìm toàn bộ HanziHome"
    aria-label="Tìm toàn bộ HanziHome"
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
 user?: Nullable<User>;
 theme: Theme;
 lookupEnabled: boolean;
 onOpenSearch: () => void;
 onToggleTheme: () => void;
 onLookupEnabledChange: (enabled: boolean) => void;
 onFocusModeEnabledChange: (enabled: boolean) => void;
}) {
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
     aria-label="Mở tìm kiếm HanziHome"
     title="Tìm toàn bộ HanziHome"
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
      aria-label="Mở cài đặt nhanh"
      title="Cài đặt nhanh"
      className="hidden sm:inline-flex"
     >
      <Settings />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="lg">
     <DropdownMenuLabel>Cài đặt nhanh</DropdownMenuLabel>
     <DropdownMenuCheckboxItem
      checked={theme === "dark"}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={onToggleTheme}
     >
      {theme === "dark" ? <Sun /> : <Moon />}
      Giao diện tối
     </DropdownMenuCheckboxItem>
     <DropdownMenuCheckboxItem
      checked={lookupEnabled}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={onLookupEnabledChange}
     >
      <Languages />
      Tra từ trên trang này
     </DropdownMenuCheckboxItem>
     <DropdownMenuCheckboxItem
      checked={focusModeEnabled}
      onSelect={(event) => event.preventDefault()}
      onCheckedChange={(enabled) => {
       if (enabled && !focusModeEnabled) {
        toast.warning(
         "Focus mode đã bật. Bạn sẽ ở lại bài hiện tại; chỉ đổi đề mục hoặc tab ghi chú đang mở.",
         { duration: 5200 },
        );
       }

       onFocusModeEnabledChange(enabled);
      }}
     >
      <LockKeyhole />
      Focus mode
     </DropdownMenuCheckboxItem>
     <DropdownMenuSeparator />
     <DropdownMenuItem asChild>
      <Link href="/settings?section=app">
       <Settings />
       Mở tất cả cài đặt
      </Link>
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>
   <ProfileSettingsMenu user={user} focusModeEnabled={focusModeEnabled} />
  </div>
 );
}

function FocusModePill() {
 return (
  <Badge variant="warning" size="md" className="hidden sm:inline-flex" title="Focus mode đang bật">
   <LockKeyhole />
   Focus
  </Badge>
 );
}
