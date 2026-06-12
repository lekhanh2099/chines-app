export function RawExerciseDataDetails({ value }: { value: unknown }) {
 return (
  <details className="rounded-lg border border-border-default bg-bg-subtle p-3">
   <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-text-muted">
    Dữ liệu gốc của exercise item
   </summary>
   <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-bg-primary p-3 text-xs leading-relaxed text-text-secondary">
    {JSON.stringify(value, null, 2)}
   </pre>
  </details>
 );
}
