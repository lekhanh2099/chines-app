"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronDown, Languages, LockKeyhole, Moon, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { type User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useSelector } from "@tanstack/react-store";
import { toast } from "sonner";
import { z } from "zod";

import { AppLogoMark } from "@/components/layout/AppLogoMark";
import { AppNotificationMenu } from "@/components/layout/AppNotificationMenu";
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
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import { appShellStore } from "@/stores/app-shell-store";
import { dictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { focusModeStore } from "@/stores/focus-mode-store";
import { globalSearchStore } from "@/stores/global-search-store";
import { headerToolbarStore } from "@/stores/header-toolbar-store";
import { sidebarStore } from "@/stores/sidebar-store";
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

type SimpleHeaderBreadcrumb = {
 label: string;
 parent?: {
  label: string;
  href: string;
 };
};

type Nullable<T> = z.infer<z.ZodNullable<z.ZodType<T>>>;

export function Header() {
 const isContentFullscreen = useSelector(appShellStore, (state) => state.isContentFullscreen);
 const isSidebarCollapsed = useSelector(sidebarStore, (state) => state.isCollapsed);
 const { theme, toggleTheme } = useTheme();
 const pathname = usePathname();
 useSelector(dictionaryLookupStore, (state) => state.overrides);
 const lookupEnabled = dictionaryLookupStore.actions.isEnabled(pathname);
 const { setEnabled: setLookupEnabled, hydrate: hydrateLookupSettings } =
  dictionaryLookupStore.actions;
 const focusModeEnabled = useSelector(focusModeStore, (state) => state.enabled);
 const { setEnabled: setFocusModeEnabled } = focusModeStore.actions;
 const headerToolbarContent = useSelector(headerToolbarStore, (state) => state.content);
 const supabase = useMemo(() => createClient(), []);
 const [user, setUser] = useState<Nullable<User>>(null);
 const simpleBreadcrumb = getSimpleHeaderBreadcrumb(pathname);

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
   <header className="nova-shell-header relative z-50 w-full shrink-0">
    <div className="flex min-h-14 w-full min-w-0 items-center sm:min-h-16">
     <Link
      href="/reader"
      prefetch={false}
      className={cn(
       "flex min-h-14 shrink-0 items-center gap-3 px-3 sm:min-h-16 sm:px-4 lg:w-16 lg:justify-center lg:border-r lg:border-border-default lg:px-0",
       !isSidebarCollapsed && "xl:w-[15rem] xl:justify-start xl:px-4",
      )}
      aria-label="Hanzi Studio"
     >
      <AppLogoMark />
      <Typography
       as="span"
       weight="black"
       clamp="one"
       className={cn("hidden", !isSidebarCollapsed && "xl:block")}
      >
       Hanzi Studio
      </Typography>
     </Link>

     <div className="flex min-w-0 flex-1 items-center gap-2 px-2 sm:gap-3 sm:px-3 lg:px-4">
      <div className="min-w-0 flex-1 overflow-hidden">
       <HeaderContextArea
        toolbarContent={headerToolbarContent}
        simpleBreadcrumb={simpleBreadcrumb}
       />
      </div>
      <HeaderUtilityArea
       focusModeEnabled={focusModeEnabled}
       user={user}
       theme={theme}
       lookupEnabled={lookupEnabled}
       onToggleTheme={toggleTheme}
       onLookupEnabledChange={(enabled) => setLookupEnabled(pathname, enabled)}
       onFocusModeEnabledChange={setFocusModeEnabled}
      />
     </div>
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
  return <div className="flex min-w-0 items-center overflow-hidden">{toolbarContent}</div>;
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
 if (pathname === "/reader") {
  return { parent: { label: "Học", href: "/reader" }, label: "Trang học" };
 }
 if (pathname === "/notebook") return { label: "Sổ tay" };
 if (pathname === "/dictionary" || pathname.startsWith("/dictionary/")) return { label: "Tra chữ" };
 if (pathname === "/settings") return { label: "Cài đặt" };
 if (pathname === "/radicals") return { label: "Bộ thủ" };
 if (pathname === "/hanzihome") return { label: "Bài học" };
 if (pathname === "/vocab/review") {
  return { parent: { label: "Từ vựng", href: "/vocab" }, label: "Ôn từ vựng" };
 }
 if (pathname === "/vocab") return { label: "Từ vựng" };
 if (pathname === "/grammar") return { label: "Ngữ pháp" };
 if (pathname === "/memory-tips") return { label: "Nhắc nhanh" };
 if (pathname === "/html-artifacts") return { label: "Tệp HTML" };
 if (pathname === "/api-docs") return { label: "API & tích hợp" };
 if (pathname.startsWith("/note/")) {
  return { parent: { label: "Ghi chú", href: "/notes" }, label: "Chia sẻ" };
 }

 return null;
}

function HeaderUtilityArea({
 focusModeEnabled,
 user,
 theme,
 lookupEnabled,
 onToggleTheme,
 onLookupEnabledChange,
 onFocusModeEnabledChange,
}: {
 focusModeEnabled: boolean;
 user?: Nullable<User>;
 theme: Theme;
 lookupEnabled: boolean;
 onToggleTheme: () => void;
 onLookupEnabledChange: (enabled: boolean) => void;
 onFocusModeEnabledChange: (enabled: boolean) => void;
}) {
 return (
  <div className="relative z-10 flex min-w-0 shrink-0 items-center justify-end gap-1 sm:gap-2">
   {focusModeEnabled ? <FocusModePill /> : null}
   <AppNotificationMenu />
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      variant="outline"
      size="toolbar"
      aria-label="Mở tuỳ chọn"
      title="Tuỳ chọn"
     >
      <Settings />
      <span className="hidden xl:inline">Tuỳ chọn</span>
      <ChevronDown data-icon="inline-end" />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="lg">
     <DropdownMenuLabel>Tuỳ chọn</DropdownMenuLabel>
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
         "Chế độ tập trung đã bật. Bạn sẽ ở lại bài hiện tại; chỉ đổi đề mục hoặc tab ghi chú đang mở.",
         { duration: 5200 },
        );
       }

       onFocusModeEnabledChange(enabled);
      }}
     >
      <LockKeyhole />
      Chế độ tập trung
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
  <Badge
   variant="warning"
   size="md"
   className="hidden sm:inline-flex"
   title="Chế độ tập trung đang bật"
  >
   <LockKeyhole />
   Tập trung
  </Badge>
 );
}
