export function FilterSelect({
 label,
 value,
 options,
 onChange,
}: {
 label: string;
 value: string;
 options: Array<{ value: string; label: string }>;
 onChange: (value: string) => void;
}) {
 return (
  <label className="grid gap-1.5">
   <span className="text-xs font-black uppercase tracking-wide text-text-muted">{label}</span>
   <select
    aria-label={label}
    value={value}
    onChange={(event) => onChange(event.target.value)}
    className="h-11 min-w-0 rounded-xl border border-border-default bg-bg-input px-3  font-bold text-text-primary outline-none"
   >
    <option value="">Tất cả</option>
    {options.map((option) => (
     <option key={option.value} value={option.value}>
      {option.label}
     </option>
    ))}
   </select>
  </label>
 );
}
