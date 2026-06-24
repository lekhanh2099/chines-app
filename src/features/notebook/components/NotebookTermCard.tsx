import { CircleAlert, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NotebookDeepDive } from "@/features/notebook/components/NotebookDeepDive";
import { getNotebookDeepDive } from "@/features/notebook/data/notebookDeepDiveData";
import type { NotebookItem } from "@/features/notebook/types";

export function NotebookTermCard({ item }: { item: NotebookItem }) {
 const deepDive = getNotebookDeepDive(item);

 return (
  <Card variant="glass" padding="none" className="overflow-hidden">
   <div className="grid gap-4 p-5">
    <div className="flex items-start justify-between gap-4">
     <div>
      <div className="flex flex-wrap items-baseline gap-3">
       <h2 lang="zh-CN" className="font-hanzi text-4xl font-black text-text-primary">
        {item.term}
       </h2>
       <span className="font-bold text-accent-text">{item.p}</span>
      </div>
      <p className="mt-1 text-base font-bold text-text-secondary">{item.vi}</p>
     </div>
     <div className="flex flex-wrap justify-end gap-1">
      {item.tags.slice(0, 2).map((tag) => (
       <Badge key={tag} variant="purple" size="sm">
        {tag}
       </Badge>
      ))}
     </div>
    </div>

    <div className="rounded-xl border border-primary/15 bg-accent-subtle/75 p-4">
     <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-accent-text">
      <Sparkles className="h-4 w-4" />
      Bản chất
     </div>
     <p className="mt-2 font-semibold leading-6 text-text-primary">{item.essence}</p>
    </div>

    <div>
     <p className="text-xs font-black uppercase tracking-[0.16em] text-text-muted">Công thức</p>
     <p
      lang="zh-CN"
      className="mt-2 rounded-xl border border-border-default bg-bg-card/80 px-4 py-3 font-mono text-sm font-bold text-accent-text"
     >
      {item.pattern}
     </p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
     <div className="rounded-xl bg-bg-subtle p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-text-muted">Dùng khi</p>
      <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">{item.use}</p>
     </div>
     <div className="rounded-xl bg-bg-subtle p-4">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-danger">
       <CircleAlert className="h-4 w-4" />
       Tránh
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-text-secondary">{item.avoid}</p>
     </div>
    </div>

    <NotebookDeepDive deepDive={deepDive} />

    <div className="border-t border-border-default pt-4">
     <p lang="zh-CN" className="font-hanzi text-2xl leading-relaxed text-text-primary">
      {item.ex[0]}
     </p>
     <p className="mt-1 text-sm font-semibold italic text-accent-text">{item.ex[1]}</p>
     <p className="mt-1 text-sm font-medium text-text-muted">{item.ex[2]}</p>
    </div>
   </div>
  </Card>
 );
}
