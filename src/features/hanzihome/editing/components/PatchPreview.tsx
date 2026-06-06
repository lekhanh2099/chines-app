import type { DraftPatch } from "../store/types";

export function PatchPreview({ patch }: { patch: DraftPatch }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer text-sm font-black text-text-primary">
    Preview diff
   </summary>
   <div className="mt-3 grid gap-3 md:grid-cols-2">
    <DiffValue title="Trước" value={patch.before} />
    <DiffValue title="Sau" value={patch.after} />
   </div>
  </details>
 );
}

function DiffValue({ title, value }: { title: string; value: unknown }) {
 return (
  <div className="min-w-0">
   <p className="mb-1 text-xs font-black uppercase tracking-wide text-text-muted">
    {title}
   </p>
   <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </div>
 );
}
