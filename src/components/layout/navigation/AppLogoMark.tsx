import Image from "next/image";

import { cn } from "@/lib/utils";

export function AppLogoMark({ className }: { className?: string }) {
 return (
  <Image
   src="/favicon.svg?v=f09443a0"
   alt=""
   width={40}
   height={40}
   unoptimized
   aria-hidden="true"
   className={cn("size-10 shrink-0", className)}
  />
 );
}
