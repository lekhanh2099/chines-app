import { cn } from "@/lib/utils";

export function AppLogoMark({ className }: { className?: string }) {
 return (
  <div
   className={cn(
    "size-10 rounded-xl flex items-center justify-center shrink-0 select-none shadow-sm",
    "bg-primary text-primary-foreground",
    className,
   )}
   aria-hidden="true"
  >
   <svg viewBox="-4 -18 44 58" className="size-6 overflow-visible" fill="none">
    <path
     d="M-0.5 -4.5 L18 -15.5 L36.5 -4.5"
     fill="none"
     stroke="currentColor"
     strokeWidth="5.5"
     strokeLinecap="round"
     strokeLinejoin="round"
     className="brand-roof"
    />
    <rect x="0" y="0" width="8.5" height="40" rx="2" fill="currentColor" />
    <rect x="27.5" y="0" width="8.5" height="40" rx="2" fill="currentColor" />
    <line
     x1="5"
     y1="20"
     x2="31"
     y2="20"
     stroke="var(--theme-accent, var(--accent))"
     strokeWidth="6.5"
     strokeLinecap="round"
     className="brand-bar"
    />
   </svg>
  </div>
 );
}
