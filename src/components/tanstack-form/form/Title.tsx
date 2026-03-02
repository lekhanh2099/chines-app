import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"h2">;

export function Title({ className, ...props }: Props) {
 return (
  <h2
   data-slot="form-title"
   className={cn("text-xl font-bold text-slate-800", className)}
   {...props}
  />
 );
}
