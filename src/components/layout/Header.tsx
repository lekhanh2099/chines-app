"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { BookOpenCheck, Moon, Search, Sun } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useVocabInspector } from "@/components/vocabulary/VocabInspectorProvider";
import { containsChinese } from "@/lib/chinese-utils";
import { useDictionaryLookupStore } from "@/stores/dictionary-lookup-store";
import { Button } from "@/components/ui/button";

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
  <header className="z-10 flex h-16 w-full max-w-full min-w-0 shrink-0 items-center justify-between gap-2 overflow-x-hidden scrollbar-soft border-b border-border-default bg-bg-card px-3 sm:gap-4 sm:px-5 md:h-[76px] lg:px-8">
   <form onSubmit={handleSearch} className="relative min-w-0 max-w-md flex-1">
    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-muted" />
    <input
     ref={inputRef}
     value={searchValue}
     onChange={(event) => setSearchValue(event.target.value)}
     placeholder="Từ điển"
     className="h-11 w-full rounded-xl border border-border-default bg-bg-input pl-11 pr-3 text-sm font-bold text-text-primary outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20 sm:h-12 sm:pl-12 sm:pr-4 sm:text-base"
    />
   </form>

   <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
    <Button
     type="button"
     onClick={() => toggleLookup(pathname)}
     variant={lookupEnabled ? "default" : "outline"}
     title="Bật/Tắt tra từ tự động"
    >
     <BookOpenCheck className="h-5 w-5" />
     {lookupEnabled ? "Tra từ bật" : "Tra từ tắt"}
    </Button>

    <Button type="button" onClick={toggleTheme} aria-label="Toggle theme">
     {theme === "light" ? (
      <Moon className="h-5 w-5" />
     ) : (
      <Sun className="h-5 w-5" />
     )}
    </Button>

    <div className="hidden h-11 items-center gap-2 rounded-xl px-3 text-sm font-black text-text-secondary lg:flex">
     <span className="text-lg">🇻🇳</span>
     Tiếng Việt
    </div>

    <div className="hidden min-w-0 items-center gap-2 pl-1 xl:flex">
     <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-subtle text-sm font-black text-accent-text">
      {(user?.user_metadata?.display_name || user?.email || "B")
       .slice(0, 1)
       .toUpperCase()}
     </div>
    </div>
   </div>
  </header>
 );
}
