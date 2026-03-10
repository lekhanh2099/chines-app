"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
 FileText,
 Star,
 FolderOpen,
 BookText,
 GraduationCap,
 Settings,
 LogOut,
 Plus,
 ChevronRight,
 Loader2,
 Clock,
 PanelLeftClose,
 PanelLeftOpen,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { useNotesList } from "@/features/notes/hooks/useNotesList";
import { useCreateNote } from "@/features/notes/hooks/useCreateNote";
import { useSidebarStore } from "@/stores/sidebar-store";
import { cn } from "@/lib/utils";

/* ── Types ── */
type SidebarItem = {
 name: string;
 icon: typeof FileText;
 href: string;
 trailing?: ReactNode;
};

/* ── Quick Access (Note-centric) ── */
const quickAccess: SidebarItem[] = [
 { name: "Tất cả ghi chú", icon: FileText, href: "/notes?view=all" },
 { name: "Yêu thích", icon: Star, href: "/notes?filter=favorites" },
 {
  name: "Thư mục",
  icon: FolderOpen,
  href: "/notes?filter=folders",
  trailing: (
   <ChevronRight className="w-3.5 h-3.5 ml-auto text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
  ),
 },
];

/* ── Learning Tools ── */
const learningTools: SidebarItem[] = [
 { name: "Kho từ vựng", icon: BookText, href: "/vocabulary" },
 { name: "Ngữ pháp", icon: GraduationCap, href: "/grammar" },
];

/* ── TreeItem — reusable sidebar row ── */
function TreeItem({
 href,
 icon: Icon,
 label,
 active,
 trailing,
 onClick,
 collapsed,
}: {
 href?: string;
 icon: typeof FileText;
 label: string;
 active?: boolean;
 trailing?: ReactNode;
 onClick?: () => void;
 collapsed?: boolean;
}) {
 const cls = cn(
  "group flex items-center gap-3 h-9 rounded text-[13px] font-medium transition-all",
  collapsed ? "justify-center px-0 mx-auto w-9" : "px-3",
  active
   ? "bg-bg-card shadow-theme-sm border border-border-default text-accent-text"
   : "text-text-secondary hover:bg-bg-card hover:text-text-primary",
 );

 const content = (
  <>
   <Icon className="w-4 h-4 shrink-0" />
   {!collapsed && <span className="truncate">{label}</span>}
   {!collapsed && trailing}
  </>
 );

 if (onClick) {
  return (
   <button
    onClick={onClick}
    className={cn(cls, !collapsed && "w-full text-left")}
    title={collapsed ? label : undefined}
   >
    {content}
   </button>
  );
 }

 return (
  <Link
   href={href ?? "#"}
   className={cls}
   title={collapsed ? label : undefined}
  >
   {content}
  </Link>
 );
}

export function Sidebar() {
 const pathname = usePathname();
 const router = useRouter();
 const [isCreating, setIsCreating] = useState(false);
 const { data: notes } = useNotesList();
 const createNoteMutation = useCreateNote();
 const isCollapsed = useSidebarStore((s) => s.isCollapsed);
 const toggleSidebar = useSidebarStore((s) => s.toggle);

 const recentNotes = (notes ?? []).slice(0, 5);

 function isActive(href: string) {
  const base = href.split("?")[0];
  if (base === "/notes") {
   return (
    pathname === "/notes" || pathname === "/" || pathname.startsWith("/notes")
   );
  }
  if (href.includes("?")) return false;
  return pathname.startsWith(href);
 }

 function isNoteActive(noteId: string) {
  return pathname === `/notes/${noteId}`;
 }

 const handleLogout = async () => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
   toast.error("Đăng xuất thất bại!");
  } else {
   toast.success("Đã đăng xuất");
   router.push("/login");
  }
 };

 const handleNewNote = () => {
  if (isCreating) return;
  setIsCreating(true);

  const now = new Date();
  const title = `Ghi chú nhanh — ${now.toLocaleTimeString("vi-VN", {
   hour: "2-digit",
   minute: "2-digit",
  })} ${now.toLocaleDateString("vi-VN", {
   day: "2-digit",
   month: "2-digit",
   year: "numeric",
  })}`;

  createNoteMutation.mutate(
   { title, tags: ["quick-note"] },
   {
    onSuccess: (note) => {
     router.push(`/notes/${note.id}`);
     setIsCreating(false);
    },
    onError: () => {
     toast.error("Không thể tạo ghi chú");
     setIsCreating(false);
    },
   },
  );
 };

 return (
  <aside
   className={cn(
    "bg-bg-primary border-r border-border-default flex flex-col h-full shrink-0 transition-all duration-200",
    isCollapsed ? "w-16" : "w-65",
   )}
  >
   {/* Brand */}
   <div
    className={cn(
     "flex items-center gap-3 py-4",
     isCollapsed ? "justify-center px-2" : "px-5",
    )}
   >
    <div className="w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0">
     <span className="text-text-inverse font-bold text-sm">H</span>
    </div>
    {!isCollapsed && (
     <div>
      <h1 className="font-bold text-sm text-text-primary leading-tight">
       Học Tiếng Trung
      </h1>
      <p className="text-[11px] text-text-muted">Phiên bản Cá nhân</p>
     </div>
    )}
   </div>

   {/* Collapse toggle */}
   <div
    className={cn(
     "mb-1",
     isCollapsed ? "px-2 flex justify-center" : "px-3 flex justify-end",
    )}
   >
    <button
     onClick={toggleSidebar}
     className="w-8 h-8 rounded flex items-center justify-center text-text-muted hover:bg-bg-card hover:text-text-primary transition-colors"
     title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
    >
     {isCollapsed ? (
      <PanelLeftOpen className="w-4 h-4" />
     ) : (
      <PanelLeftClose className="w-4 h-4" />
     )}
    </button>
   </div>

   {/* New Note Button */}
   <div className={cn(isCollapsed ? "px-2" : "px-3", "mt-1 mb-3")}>
    <button
     onClick={handleNewNote}
     disabled={isCreating}
     className={cn(
      "flex items-center justify-center gap-2 h-9 rounded bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-70",
      isCollapsed ? "w-9 mx-auto px-0" : "w-full px-3",
     )}
     title={isCollapsed ? "Ghi chú mới" : undefined}
    >
     {isCreating ? (
      <Loader2 className="w-4 h-4 animate-spin" />
     ) : (
      <Plus className="w-4 h-4" />
     )}
     {!isCollapsed && <span>{isCreating ? "Đang tạo..." : "Ghi chú mới"}</span>}
    </button>
   </div>

   {/* Quick Access */}
   <nav className={cn("flex flex-col gap-0.5", isCollapsed ? "px-2" : "px-3")}>
    {!isCollapsed && (
     <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
      Truy cập nhanh
     </span>
    )}
    {quickAccess.map((item) => (
     <TreeItem
      key={item.href}
      href={item.href}
      icon={item.icon}
      label={item.name}
      active={isActive(item.href)}
      trailing={item.trailing}
      collapsed={isCollapsed}
     />
    ))}
   </nav>

   {/* Latest Opened */}
   {recentNotes.length > 0 && !isCollapsed && (
    <nav className="flex flex-col gap-0.5 px-3 mt-5">
     <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
      Mở gần đây
     </span>
     {recentNotes.map((note) => (
      <Link
       key={note.id}
       href={`/notes/${note.id}`}
       className={`group flex items-center gap-3 px-3 h-8 rounded text-[13px] transition-all ${
        isNoteActive(note.id)
         ? "bg-bg-card shadow-theme-sm border border-border-default text-accent-text font-medium"
         : "text-text-muted hover:bg-bg-card hover:text-text-primary"
       }`}
      >
       <Clock className="w-3.5 h-3.5 shrink-0 opacity-50" />
       <span className="truncate">{note.title}</span>
      </Link>
     ))}
    </nav>
   )}

   {/* Recent notes - collapsed: just show icon */}
   {recentNotes.length > 0 && isCollapsed && (
    <nav className="flex flex-col gap-0.5 px-2 mt-5">
     <TreeItem
      href="/notes?view=all"
      icon={Clock}
      label="Mở gần đây"
      collapsed={isCollapsed}
     />
    </nav>
   )}

   {/* Learning Tools */}
   <nav
    className={cn("flex flex-col gap-0.5 mt-5", isCollapsed ? "px-2" : "px-3")}
   >
    {!isCollapsed && (
     <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-text-muted">
      Công cụ học
     </span>
    )}
    {learningTools.map((item) => (
     <TreeItem
      key={item.href}
      href={item.href}
      icon={item.icon}
      label={item.name}
      active={isActive(item.href)}
      collapsed={isCollapsed}
     />
    ))}
   </nav>

   {/* Spacer */}
   <div className="flex-1" />

   {/* Bottom Section */}
   <div
    className={cn("pb-4 flex flex-col gap-0.5", isCollapsed ? "px-2" : "px-3")}
   >
    <TreeItem
     href="/settings"
     icon={Settings}
     label="Cài đặt"
     active={isActive("/settings")}
     collapsed={isCollapsed}
    />
    <TreeItem
     icon={LogOut}
     label="Đăng xuất"
     onClick={handleLogout}
     collapsed={isCollapsed}
    />
   </div>
  </aside>
 );
}
