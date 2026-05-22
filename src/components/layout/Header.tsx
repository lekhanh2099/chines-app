"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Bell, BookOpenCheck, Flame, Moon, Search, Sun, Target, Trophy } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { containsChinese } from "@/lib/chinese-utils";
import { useDictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { cn } from "@/lib/utils";

export function Header({ user }: { user?: User | null }) {
 const { theme, toggleTheme } = useTheme();
 const { openInspector } = useVocabInspector();
 const [searchValue, setSearchValue] = useState("");
 const inputRef = useRef<HTMLInputElement>(null);
 const pathname = usePathname();
 const lookupEnabled = useDictionaryLookupStore((s) => s.isEnabled(pathname));
 const toggleLookup = useDictionaryLookupStore((s) => s.toggle);

 useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
   if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    event.preventDefault();
    inputRef.current?.focus();
   }
  };
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
 }, []);

 const handleSearch = (event: FormEvent) => {
  event.preventDefault();
  const trimmed = searchValue.trim();
  if (!trimmed) return;
  if (containsChinese(trimmed)) {
   openInspector(trimmed);
   setSearchValue("");
   inputRef.current?.blur();
  }
 };

 return (
  <header className="z-10 flex h-16 w-full max-w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-x-hidden border-b-2 border-stone-200 bg-white px-3 sm:gap-4 sm:px-5 md:h-[76px] lg:px-8">
   <form onSubmit={handleSearch} className="relative min-w-0 max-w-md flex-1">
    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
    <input
     ref={inputRef}
     value={searchValue}
     onChange={(event) => setSearchValue(event.target.value)}
     placeholder="Từ điển"
     className="h-11 w-full rounded-2xl border-2 border-stone-200 bg-white pl-11 pr-3 text-sm font-bold text-stone-800 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100 sm:h-12 sm:pl-12 sm:pr-4 sm:text-base"
    />
   </form>

   <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
    <button
     type="button"
     onClick={() => toggleLookup(pathname)}
     className={cn(
      "hidden h-11 items-center gap-2 rounded-2xl border-2 px-3 text-sm font-black transition-colors md:flex",
      lookupEnabled
       ? "border-blue-200 bg-blue-50 text-blue-600"
       : "border-stone-200 bg-white text-stone-500 hover:bg-stone-50",
     )}
     title="Bật/Tắt tra từ tự động"
    >
     <BookOpenCheck className="h-5 w-5" />
     {lookupEnabled ? "Tra từ bật" : "Tra từ tắt"}
    </button>

    <button
     type="button"
     onClick={toggleTheme}
     className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-stone-200 bg-white text-stone-700 shadow-theme-sm transition-colors hover:bg-stone-50 sm:h-11 sm:w-11"
     aria-label="Toggle theme"
    >
     {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>

    <div className="hidden h-11 items-center gap-2 rounded-2xl px-3 text-sm font-black text-stone-700 lg:flex">
     <span className="text-lg">🇻🇳</span>
     Tiếng Việt
    </div>

    <button className="relative hidden h-11 w-11 items-center justify-center rounded-2xl text-stone-700 transition-colors hover:bg-stone-50 sm:flex">
     <Bell className="h-5 w-5" />
     <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-yellow-400" />
    </button>

    <HeaderPill icon={Trophy} value="324" tone="green" />
    <HeaderPill icon={Target} value="0/3" tone="orange" />
    <HeaderPill icon={Flame} value="3" tone="red" />

    <div className="hidden min-w-0 items-center gap-2 pl-1 xl:flex">
     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-black text-red-600">
      {(user?.user_metadata?.display_name || user?.email || "B").slice(0, 1).toUpperCase()}
     </div>
    </div>
   </div>
  </header>
 );
}

function HeaderPill({
 icon: Icon,
 value,
 tone,
}: {
 icon: typeof Trophy;
 value: string;
 tone: "green" | "orange" | "red";
}) {
 const toneClass = {
  green: "border-stone-200 bg-white text-lime-700",
  orange: "border-yellow-300 bg-yellow-50 text-orange-700",
  red: "border-red-200 bg-red-50 text-red-600",
 }[tone];

 return (
  <div className={cn("hidden h-11 items-center gap-2 rounded-2xl border-2 px-3 text-sm font-black shadow-theme-sm sm:flex", toneClass)}>
   <Icon className="h-5 w-5" />
   {value}
  </div>
 );
}
