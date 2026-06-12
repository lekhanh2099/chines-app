import type { DraftPatch } from "../store/types";
import { DiffValue } from "./DiffValue";

export function PatchPreview({ patch }: { patch: DraftPatch }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer font-black text-text-primary">Preview diff</summary>
   <div className="mt-3 grid gap-3 md:grid-cols-2">
    <DiffValue title="Trước" value={patch.before} />
    <DiffValue title="Sau" value={patch.after} />
   </div>
  </details>
 );
}
