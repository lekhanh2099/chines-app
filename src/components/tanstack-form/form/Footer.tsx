import { cn } from "@/lib/utils";

type Props = {
 className?: string;
 children?: React.ReactNode;
} & React.ComponentProps<"div">;

export function Footer({ className, children, ...props }: Props) {
 return (
  <div
   data-slot="form-footer"
   className={cn(
    "flex flex-col-reverse gap-4 p-6 sm:px-8 sm:pb-8 sm:flex-row sm:justify-end border-t border-slate-100",
    className,
   )}
   {...props}
  >
   {children}
  </div>
 );
}
