import { cn } from "@/lib/utils";

type Props = React.ComponentProps<"p">;

export function Description({ className, ...props }: Props) {
 return (
  <p
   data-slot="form-description"
   className={cn("text-sm text-slate-500", className)}
   {...props}
  />
 );
}
