"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
 LayoutDashboard,
 BookOpen,
 BookText,
 Dumbbell,
 StickyNote,
 Settings,
 LogOut,
} from "lucide-react";
import { appConfig, type FeatureKey } from "@/config/app-config";

const allMenuItems: {
 name: string;
 icon: typeof LayoutDashboard;
 href: string;
 feature: FeatureKey;
}[] = [
 {
  name: "Bảng điều khiển",
  icon: LayoutDashboard,
  href: "/",
  feature: "dashboard",
 },
 { name: "Khóa học", icon: BookOpen, href: "/courses", feature: "courses" },
 {
  name: "Kho từ vựng",
  icon: BookText,
  href: "/vocabulary",
  feature: "vocabulary",
 },
 { name: "Luyện tập", icon: Dumbbell, href: "/practice", feature: "practice" },
 { name: "Ghi chú", icon: StickyNote, href: "/notes", feature: "notes" },
];

const mainMenuItems = allMenuItems.filter(
 (item) => appConfig.features[item.feature],
);

export function Sidebar() {
 const pathname = usePathname();
 const router = useRouter();

 function isActive(href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
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

 return (
  <aside className="w-[280px] bg-bg-card border-r border-border-default flex flex-col h-full shrink-0">
   {/* Brand */}
   <div className="flex items-center gap-3 px-6 py-5">
    <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center shadow-theme-sm">
     <span className="text-text-inverse font-bold text-xl">H</span>
    </div>
    <div>
     <h1 className="font-bold text-sm text-text-primary leading-tight">
      Học Tiếng Trung
     </h1>
     <p className="text-xs text-text-muted">Phiên bản Cá nhân</p>
    </div>
   </div>

   {/* Main Navigation */}
   <nav className="flex flex-col gap-1 px-4 mt-2 flex-1">
    {mainMenuItems.map((item) => {
     const active = isActive(item.href);
     return (
      <Link
       key={item.href}
       href={item.href}
       className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        active
         ? "bg-accent-subtle text-accent-text"
         : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
       }`}
      >
       <item.icon className="w-[18px] h-[18px]" />
       <span>{item.name}</span>
      </Link>
     );
    })}
   </nav>

   {/* Bottom Section */}
   <div className="px-4 pb-4 flex flex-col gap-3">
    {/* Pro Plan Card */}
    <div className="bg-bg-elevated rounded-2xl p-4 border border-border-default">
     <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-bold text-text-primary">Gói Pro</span>
      <span className="text-[10px] font-bold uppercase tracking-wider bg-success-subtle text-success-text px-2 py-0.5 rounded-full">
       Active
      </span>
     </div>
     <div className="w-full bg-bg-subtle rounded-full h-1.5 overflow-hidden mb-2">
      <div
       className="bg-accent rounded-full h-1.5 transition-all"
       style={{ width: "75%" }}
      />
     </div>
     <p className="text-[11px] text-text-muted">
      Đã dùng 75% giới hạn AI tháng này.
     </p>
    </div>

    {/* Settings */}
    <Link
     href="/settings"
     className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive("/settings")
       ? "bg-accent-subtle text-accent-text"
       : "text-text-secondary hover:bg-bg-card-hover hover:text-text-primary"
     }`}
    >
     <Settings className="w-[18px] h-[18px]" />
     <span>Cài đặt</span>
    </Link>

    {/* Logout */}
    <button
     onClick={handleLogout}
     className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-danger-subtle hover:text-danger-text transition-colors w-full text-left"
    >
     <LogOut className="w-[18px] h-[18px]" />
     <span>Đăng xuất</span>
    </button>
   </div>
  </aside>
 );
}
