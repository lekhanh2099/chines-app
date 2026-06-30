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
  <span className="study-content-surface rounded-lg border px-3 py-2 font-bold">
   {label}
   {pinyin && ` · ${pinyin}`}
   {meaning && ` · ${meaning}`}
   {extra && ` · ${extra}`}
  </span>
 );
}
