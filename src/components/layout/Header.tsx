"use client";

import { useState, useRef, useEffect } from "react";
import {
 Bell,
 Moon,
 Sun,
 User as UserIcon,
 Search,
 BookOpenCheck,
} from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { containsChinese } from "@/lib/chinese-utils";
import { useDictionaryLookupStore } from "@/stores/dictionary-lookup-store";

export function Header({ user }: { user?: User | null }) {
 const { theme, toggleTheme } = useTheme();
 const { openInspector } = useVocabInspector();
 const [searchValue, setSearchValue] = useState("");
 const inputRef = useRef<HTMLInputElement>(null);
 const pathname = usePathname();
 const lookupEnabled = useDictionaryLookupStore((s) => s.isEnabled(pathname));
 const toggleLookup = useDictionaryLookupStore((s) => s.toggle);

 useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
   if ((e.metaKey || e.ctrlKey) && e.key === "k") {
    e.preventDefault();
    inputRef.current?.focus();
   }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
 }, []);

 const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();
  const trimmed = searchValue.trim();
  if (!trimmed) return;

  if (containsChinese(trimmed)) {
   openInspector(trimmed);
   setSearchValue("");
   inputRef.current?.blur();
  }
 };

 return (
  <header className="h-[72px] bg-bg-card/80 backdrop-blur-sm border-b border-border-default flex justify-between items-center px-8 shrink-0 z-10">
   <div>
    <h1 className="text-xl font-bold text-text-primary">
     Chào buổi sáng,{" "}
     {user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Bạn"}!
     👋
    </h1>
    <p className="text-sm text-text-muted">
     Bạn đã học liên tục 12 ngày. Cố gắng nhé!
    </p>
   </div>

   <form onSubmit={handleSearch} className="relative w-[400px] hidden lg:block">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
    <input
     ref={inputRef}
     type="text"
     value={searchValue}
     onChange={(e) => setSearchValue(e.target.value)}
     placeholder="Gõ chữ Hán hoặc Pinyin để tra nhanh..."
     className="w-full h-10 bg-bg-elevated border border-border-default rounded pl-10 pr-14 text-sm text-text-primary placeholder-text-muted outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
    />
    <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-bg-subtle text-text-muted text-[10px] font-bold px-2 py-0.5 rounded border border-border-default">
     ⌘K
    </kbd>
   </form>

   <div className="flex items-center gap-2">
    <button
     onClick={() => toggleLookup(pathname)}
     className={`h-10 rounded border flex items-center gap-2 px-3 transition-colors text-sm font-medium ${
      lookupEnabled
       ? "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20"
       : "bg-bg-elevated border-border-default text-text-muted hover:bg-bg-card-hover"
     }`}
     aria-label="Bật/Tắt tra từ tự động"
     title="Bật/Tắt tra từ tự động"
    >
     <BookOpenCheck className="w-[18px] h-[18px]" />
     <span className="hidden xl:inline">
      {lookupEnabled ? "Tra từ: Bật" : "Tra từ: Tắt"}
     </span>
    </button>

    <button
     onClick={toggleTheme}
     className="w-10 h-10 rounded bg-bg-elevated border border-border-default flex items-center justify-center hover:bg-bg-card-hover transition-colors"
     aria-label="Toggle theme"
    >
     {theme === "light" ? (
      <Moon className="w-[18px] h-[18px] text-text-secondary" />
     ) : (
      <Sun className="w-[18px] h-[18px] text-text-secondary" />
     )}
    </button>

    <button className="w-10 h-10 rounded bg-bg-elevated border border-border-default flex items-center justify-center hover:bg-bg-card-hover transition-colors relative">
     <Bell className="w-[18px] h-[18px] text-text-secondary" />
     <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-warning rounded-full border-2 border-bg-card" />
    </button>

    <button className="w-10 h-10 rounded overflow-hidden bg-accent flex items-center justify-center ml-1 hover:opacity-90 transition-opacity">
     <UserIcon className="w-5 h-5 text-text-inverse" />
    </button>
   </div>
  </header>
 );
}
