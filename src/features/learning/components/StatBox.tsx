import { cn } from "@/lib/utils";

export function StatBox({
 value,
 label,
 tone,
}: {
 value: number;
 label: string;
 tone: "yellow" | "blue" | "green";
}) {
 const className = {
  yellow: "border-warning/30 bg-warning-subtle text-warning-text",
  blue: "border-info/30 bg-info-subtle text-info-text",
  green: "border-success/30 bg-success-subtle text-success-text",
 }[tone];
 return (
  <div
   className={cn("min-w-24 rounded-2xl border-2 px-4 py-3 text-center shadow-theme-sm", className)}
  >
   <p className="text-2xl font-black">{value}</p>
   <p className="text-xs font-black">{label}</p>
  </div>
 );
}
