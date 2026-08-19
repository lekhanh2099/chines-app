import type { JsonFieldValue } from "@/types/json";
export function RawDataDetails({
 value,
 label = "Dữ liệu gốc của mục này",
}: {
 value: JsonFieldValue;
 label?: string;
}) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3 grid gap-2">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
    {label}
   </summary>
   <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
 );
}
