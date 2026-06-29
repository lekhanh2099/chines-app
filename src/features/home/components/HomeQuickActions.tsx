import Link from "next/link";
import { BookOpenText, Layers3, Lightbulb, Repeat2 } from "lucide-react";

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
       className="nova-glass-panel flex min-h-20 items-center gap-3 rounded-xl px-4 py-3 font-bold text-text-primary transition hover:border-primary/25 hover:text-accent-text"
      >
       <Icon className="h-5 w-5 shrink-0" />
       <span>{action.label}</span>
      </Link>
     );
    })}
   </div>
  </section>
 );
}
