import { cn } from "@/lib/utils";

type Props = {
 className?: string;
 children?: React.ReactNode;
} & React.ComponentProps<"div">;

export function Header({ className, children, ...props }: Props) {
 return (
  <div
   data-slot="form-header"
   className={cn(
    "flex flex-col gap-2 p-6 sm:px-8 sm:pt-8 text-center sm:text-left",
    className,
   )}
   {...props}
  >
   {children}
  </div>
 );
}
