import { cn } from "@/lib/utils";

type Props = {
 children: React.ReactNode;
 className?: string;
};

export function Wrapper({ children, className }: Props) {
 return <div className={cn("space-y-6", className)}>{children}</div>;
}
