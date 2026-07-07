import Link from "next/link";
import { BookOpenText, Layers3, Lightbulb, Repeat2 } from "lucide-react";

import { HomeIconTile } from "@/features/home/components/HomePrimitives";

const actions = [
 { href: "/dictionary", label: "Ôn SRS", icon: Repeat2 },
 { href: "/hanzihome/grammar", label: "Ngữ pháp", icon: BookOpenText },
 { href: "/hanzihome/memory-tips", label: "Nhắc nhanh", icon: Lightbulb },
 { href: "/hanzihome?module=radicals", label: "Bộ thủ", icon: Layers3 },
] as const;

export function HomeQuickActions() {
 return (
  <section aria-labelledby="quick-actions-title">
   <h2 id="quick-actions-title" className="text-lg font-black text-text-primary">
    Truy cập nhanh
   </h2>
   <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
    {actions.map((action) => {
     const Icon = action.icon;
     return (
      <Link
       key={action.href}
       href={action.href}
       prefetch={false}
       className="flex min-h-20 items-center gap-3 rounded-xl border border-border-default bg-bg-card px-4 py-3 font-bold text-text-primary shadow-theme-sm transition hover:border-primary/25 hover:text-accent-text"
      >
       <HomeIconTile className="size-10">
        <Icon className="size-5" />
       </HomeIconTile>
       <span>{action.label}</span>
      </Link>
     );
    })}
   </div>
  </section>
 );
}
