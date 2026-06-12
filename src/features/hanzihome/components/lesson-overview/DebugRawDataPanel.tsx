export function DebugRawDataPanel({
 title = "Raw data",
 value,
}: {
 title?: string;
 value: unknown;
}) {
 return (
  <details className="rounded-xl border border-border-default bg-bg-primary">
   <summary className="cursor-pointer list-none px-4 py-3 font-black text-text-primary marker:hidden">
    {title}
   </summary>
   <pre className="max-h-[28rem] overflow-auto border-t border-border-default bg-bg-subtle p-4 text-xs font-semibold leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
 );
}
