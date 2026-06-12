import { answerToString } from "../utils";

export function RetellOutline({ itemId, values }: { itemId: string; values: unknown[] }) {
 const outline = values.map(answerToString).filter(Boolean);

 if (outline.length === 0) return null;

 return (
  <div className="grid gap-2 rounded-xl border border-border-default bg-bg-subtle p-3">
   <p className="text-xs font-black uppercase tracking-wide text-text-muted">Dàn ý kể lại</p>
   <div className="grid gap-2">
    {outline.map((line, index) => (
     <p
      key={`${itemId}-retell-${index}`}
      className="rounded-lg bg-bg-primary px-3 py-2  font-bold text-text-primary"
      lang="zh-CN"
     >
      {index + 1}. {line}
     </p>
    ))}
   </div>
  </div>
 );
}
