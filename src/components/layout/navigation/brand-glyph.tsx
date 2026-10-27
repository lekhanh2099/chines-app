export function GlyphHPlain({ className }: { className?: string }) {
 return (
  <svg viewBox="-2 0 40 40" className={className} aria-hidden="true" fill="none">
   <rect x="0" y="0" width="8.5" height="40" rx="2" className="fill-current" />
   <rect x="27.5" y="0" width="8.5" height="40" rx="2" className="fill-current" />
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
 );
}

export function GlyphHRoof({ className }: { className?: string }) {
 return (
  <svg viewBox="-4 -18 44 58" className={className} aria-hidden="true" fill="none">
   <path
    d="M-0.5 -4.5 L18 -15.5 L36.5 -4.5"
    fill="none"
    stroke="var(--theme-primary, var(--primary))"
    strokeWidth="5.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="brand-roof"
   />
   <rect x="0" y="0" width="8.5" height="40" rx="2" className="fill-current" />
   <rect x="27.5" y="0" width="8.5" height="40" rx="2" className="fill-current" />
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
 );
}
