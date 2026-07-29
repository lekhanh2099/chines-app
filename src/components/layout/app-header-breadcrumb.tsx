"use client";

import { Typography } from "@/components/ui/typography";
import type { ReactNode } from "react";
import Link from "next/link";

import {
 Breadcrumb,
 BreadcrumbItem,
 BreadcrumbLink,
 BreadcrumbList,
 BreadcrumbPage,
 BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { cn } from "@/lib/utils";

const headerBreadcrumbItemClassName =
 "inline-flex h-8 min-h-8 max-w-[min(14rem,32vw)] items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary";

export const appHeaderBreadcrumbSelectTriggerClassName =
 "h-8 min-h-8 min-w-0 rounded-lg border-transparent bg-transparent px-2 text-sm font-bold text-text-primary shadow-none hover:bg-bg-subtle focus-visible:border-ring focus-visible:bg-bg-subtle data-[state=open]:bg-bg-subtle *:data-[slot=select-value]:truncate [&_svg]:text-text-muted";

export function AppHeaderBreadcrumb({
 children,
 className,
 "aria-label": ariaLabel = "Điều hướng trang",
}: {
 children: ReactNode;
 className?: string;
 "aria-label"?: string;
}) {
 return (
  <Breadcrumb
   aria-label={ariaLabel}
   className={cn(
    "inline-flex h-10 w-fit max-w-full min-w-0 justify-self-start overflow-hidden rounded-xl border border-border-default bg-bg-card px-1 shadow-theme-sm",
    className,
   )}
  >
   <BreadcrumbList className="min-w-0 max-w-full flex-nowrap gap-0.5 overflow-hidden text-sm font-semibold text-text-muted">
    {children}
   </BreadcrumbList>
  </Breadcrumb>
 );
}

export function AppHeaderBreadcrumbItem({
 children,
 className,
}: {
 children: ReactNode;
 className?: string;
}) {
 return <BreadcrumbItem className={cn("min-w-0", className)}>{children}</BreadcrumbItem>;
}

export function AppHeaderBreadcrumbLink({
 href,
 children,
 icon,
 disabled = false,
 className,
 title,
}: {
 href: string;
 children: ReactNode;
 icon?: ReactNode;
 disabled?: boolean;
 className?: string;
 title?: string;
}) {
 const content = (
  <>
   {icon}
   <Typography as="span" clamp="one" className="min-w-0">
    {children}
   </Typography>
  </>
 );

 if (disabled) {
  return (
   <span
    aria-disabled="true"
    title={title}
    className={cn(headerBreadcrumbItemClassName, "opacity-60", className)}
   >
    {content}
   </span>
  );
 }

 return (
  <BreadcrumbLink asChild>
   <Link
    href={href}
    prefetch={false}
    title={title}
    className={cn(headerBreadcrumbItemClassName, className)}
   >
    {content}
   </Link>
  </BreadcrumbLink>
 );
}

export function AppHeaderBreadcrumbPage({
 children,
 className,
 title,
}: {
 children: ReactNode;
 className?: string;
 title?: string;
}) {
 return (
  <BreadcrumbPage
   title={title}
   className={cn(
    headerBreadcrumbItemClassName,
    "max-w-[min(18rem,42vw)] text-text-primary hover:bg-transparent",
    className,
   )}
  >
   <Typography as="span" clamp="one" className="min-w-0">
    {children}
   </Typography>
  </BreadcrumbPage>
 );
}

export function AppHeaderBreadcrumbSeparator({ className }: { className?: string }) {
 return <BreadcrumbSeparator className={cn("shrink-0 px-0.5 text-text-muted/60", className)} />;
}
