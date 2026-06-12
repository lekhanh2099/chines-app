export function DiffValue({ title, value }: { title: string; value: unknown }) {
 return (
  <div className="min-w-0">
   <p className="mb-1 text-xs font-black uppercase tracking-wide text-text-muted">{title}</p>
   <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </div>
 );
}
