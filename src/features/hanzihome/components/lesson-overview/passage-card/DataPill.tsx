export function DataPill({
 label,
 pinyin,
 meaning,
 extra,
}: {
 label: string;
 pinyin?: string;
 meaning?: string;
 extra?: string;
}) {
 if (!label) return null;

 return (
  <span className="rounded-lg border border-border-default bg-bg-primary px-3 py-2  font-bold text-text-primary">
   {label}
   {pinyin && ` · ${pinyin}`}
   {meaning && ` · ${meaning}`}
   {extra && ` · ${extra}`}
  </span>
 );
}
