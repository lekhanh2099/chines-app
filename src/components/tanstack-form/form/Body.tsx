import { cn } from "@/lib/utils";

type Props = {
 className?: string;
 children?: React.ReactNode;
} & React.ComponentProps<"div">;

export function Body({ className, children, ...props }: Props) {
 return (
  <div
   data-slot="form-body"
   className={cn("flex min-h-0 flex-1 flex-col gap-6 p-6 sm:px-8", className)}
   {...props}
  >
   {children}
  </div>
 );
}
