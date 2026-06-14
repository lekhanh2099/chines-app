type ComparisonRow = { key: string; title: string; body?: string; example?: string };

export function ComparisonGroup({ title, rows }: { title: string; rows: ComparisonRow[] }) {
 return (
  <div className="grid gap-2">
   <h4 className="font-black uppercase tracking-wide text-text-muted">{title}</h4>
   <div className="grid gap-2">
    {rows.map((row) => (
     <div key={row.key} className="rounded-xl border border-border-default bg-bg-primary p-3">
      <p className="font-black text-text-primary">{row.title}</p>
      {row.body && <p>{row.body}</p>}
      {row.example && <p className="text-text-muted">{row.example}</p>}
     </div>
    ))}
   </div>
  </div>
 );
}
